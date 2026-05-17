import { TikTokPublisher } from "@kol/publisher";
import { FacebookPublisher } from "@kol/publisher";
import { YouTubePublisher } from "@kol/publisher";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function getTikTokPublisher() {
  return new TikTokPublisher({
    clientId:     process.env.TIKTOK_CLIENT_KEY ?? "",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
    redirectUri:  `${appUrl}/api/social/callback/tiktok`,
  });
}

export function getFacebookPublisher() {
  return new FacebookPublisher({
    clientId:     process.env.FACEBOOK_APP_ID ?? "",
    clientSecret: process.env.FACEBOOK_APP_SECRET ?? "",
    redirectUri:  `${appUrl}/api/social/callback/facebook`,
  });
}

export function getYouTubePublisher() {
  return new YouTubePublisher({
    clientId:     process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:  `${appUrl}/api/social/callback/youtube_shorts`,
  });
}

export function getPublisher(platform: string) {
  if (platform === "tiktok")        return getTikTokPublisher();
  if (platform === "facebook")      return getFacebookPublisher();
  if (platform === "youtube_shorts") return getYouTubePublisher();
  throw new Error(`Unknown platform: ${platform}`);
}
