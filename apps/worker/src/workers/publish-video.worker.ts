import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@kol/database";
import { TikTokPublisher, FacebookPublisher, YouTubePublisher } from "@kol/publisher";
import type { PlatformPublisher, OAuthTokens } from "@kol/publisher";
import type { PublishVideoJobPayload } from "@kol/queue";
import { QUEUE_NAMES } from "@kol/queue";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getPublisher(platform: string): PlatformPublisher {
  if (platform === "tiktok") {
    return new TikTokPublisher({
      clientId:     process.env.TIKTOK_CLIENT_KEY ?? "",
      clientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      redirectUri:  `${APP_URL}/api/social/callback/tiktok`,
    });
  }
  if (platform === "facebook") {
    return new FacebookPublisher({
      clientId:     process.env.FACEBOOK_APP_ID ?? "",
      clientSecret: process.env.FACEBOOK_APP_SECRET ?? "",
      redirectUri:  `${APP_URL}/api/social/callback/facebook`,
    });
  }
  if (platform === "youtube_shorts") {
    return new YouTubePublisher({
      clientId:     process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirectUri:  `${APP_URL}/api/social/callback/youtube_shorts`,
    });
  }
  throw new Error(`Unknown platform: ${platform}`);
}

async function ensureFreshToken(
  account: { id: string; accessToken: string; refreshToken: string | null; tokenExpiresAt: Date | null },
  publisher: PlatformPublisher
): Promise<OAuthTokens> {
  const isExpired = account.tokenExpiresAt && account.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpired && account.refreshToken) {
    const fresh = await publisher.refreshAccessToken(account.refreshToken);
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken:    fresh.accessToken,
        refreshToken:   fresh.refreshToken ?? account.refreshToken,
        tokenExpiresAt: fresh.expiresAt ?? null,
      },
    });
    return fresh;
  }

  return { accessToken: account.accessToken, refreshToken: account.refreshToken ?? undefined };
}

export function createPublishVideoWorker(connection: Redis) {
  return new Worker<PublishVideoJobPayload>(
    QUEUE_NAMES.PUBLISH_VIDEO,
    async (job) => {
      const { projectId, publishJobId, platform, socialAccountId, finalVideoUrl, title, description, hashtags, scheduledAt } =
        job.data;

      await prisma.publishJob.update({ where: { id: publishJobId }, data: { status: "publishing" } });
      await prisma.videoProject.update({ where: { id: projectId }, data: { status: "publishing" } });

      await job.updateProgress(10);

      // Load connected account
      const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
      if (!account || !account.isActive) throw new Error("Social account not found or disconnected");

      const publisher = getPublisher(platform);
      const tokens = await ensureFreshToken(account, publisher);

      await job.updateProgress(20);

      const result = await publisher.publish(tokens, {
        videoUrl:    finalVideoUrl,
        title,
        description,
        hashtags,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });

      await job.updateProgress(80);

      // Poll for processing completion (YouTube/TikTok process async)
      let finalStatus = result.status;
      if (finalStatus === "processing") {
        const maxWait = 10 * 60 * 1000; // 10 minutes
        const pollInterval = 15_000;
        const start = Date.now();

        while (Date.now() - start < maxWait) {
          await new Promise((r) => setTimeout(r, pollInterval));
          const polledStatus = await publisher.getPostStatus(tokens, result.platformPostId);
          if (polledStatus === "published") { finalStatus = "published"; break; }
          if (polledStatus === "failed") throw new Error(`${platform} rejected the video after upload`);
        }
      }

      await prisma.$transaction([
        prisma.publishJob.update({
          where: { id: publishJobId },
          data: {
            status:         finalStatus === "published" ? "published" : "scheduled",
            publishedAt:    finalStatus === "published" ? new Date() : null,
            platformPostId: result.platformPostId,
          },
        }),
        prisma.videoProject.update({
          where: { id: projectId },
          data: { status: finalStatus === "published" ? "published" : "ready_to_publish" },
        }),
      ]);

      await job.updateProgress(100);
      return { platformPostId: result.platformPostId, postUrl: result.postUrl, status: finalStatus };
    },
    {
      connection,
      concurrency: 3,
      limiter: { max: 10, duration: 60000 },
    }
  );
}
