import type {
  PlatformPublisher,
  OAuthTokens,
  PublishInput,
  PublishResult,
  OAuthConfig,
  OAuthStartResult,
  OAuthCallbackResult,
} from "./types.js";

// TikTok Content Posting API v2
// Docs: https://developers.tiktok.com/doc/content-posting-api-get-started

const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const API_BASE  = "https://open.tiktokapis.com/v2";

export class TikTokPublisher implements PlatformPublisher {
  constructor(private config: OAuthConfig) {}

  // ─── OAuth ──────────────────────────────────────────────────────────────────

  buildAuthUrl(state: string): OAuthStartResult {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      scope: "user.info.basic,video.upload,video.publish",
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      state,
    });
    return { authUrl: `${AUTH_BASE}?${params}`, state };
  }

  async exchangeCode(code: string): Promise<OAuthCallbackResult> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.redirectUri,
      }),
    });
    const json = await res.json() as any;
    if (!res.ok || json.error) throw new Error(json.error_description ?? `TikTok token error: ${res.status}`);

    // Fetch user info
    const userRes = await fetch(`${API_BASE}/user/info/?fields=open_id,display_name`, {
      headers: { Authorization: `Bearer ${json.access_token}` },
    });
    const userJson = await userRes.json() as any;
    const user = userJson.data?.user ?? {};

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
      accountId: user.open_id ?? json.open_id,
      accountName: user.display_name ?? "TikTok User",
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const json = await res.json() as any;
    if (!res.ok) throw new Error(`TikTok refresh failed: ${res.status}`);
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
    };
  }

  // ─── Publish ────────────────────────────────────────────────────────────────

  async publish(tokens: OAuthTokens, input: PublishInput): Promise<PublishResult> {
    // Step 1: Get video file size from URL
    const headRes = await fetch(input.videoUrl, { method: "HEAD" });
    const videoSize = parseInt(headRes.headers.get("content-length") ?? "0", 10);
    if (!videoSize) throw new Error("Could not determine video file size");

    const chunkSize = 10 * 1024 * 1024; // 10 MB chunks
    const totalChunks = Math.ceil(videoSize / chunkSize);

    // Step 2: Init upload
    const initRes = await fetch(`${API_BASE}/post/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: `${input.title} ${input.hashtags.map((h) => `#${h}`).join(" ")}`.slice(0, 2200),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunks,
        },
      }),
    });

    const initJson = await initRes.json() as any;
    if (!initRes.ok || initJson.error?.code !== "ok") {
      throw new Error(`TikTok init failed: ${JSON.stringify(initJson.error)}`);
    }

    const { publish_id, upload_url } = initJson.data;

    // Step 3: Upload video in chunks
    const videoRes = await fetch(input.videoUrl);
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, videoSize) - 1;
      const chunk = videoBuffer.subarray(start, end + 1);

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Content-Length": String(chunk.length),
        },
        body: chunk,
      });

      if (!uploadRes.ok && uploadRes.status !== 206) {
        throw new Error(`TikTok chunk upload failed at chunk ${i}: ${uploadRes.status}`);
      }
    }

    return {
      platformPostId: publish_id,
      status: "processing", // TikTok processes async
    };
  }

  async getPostStatus(tokens: OAuthTokens, publishId: string): Promise<"published" | "processing" | "failed"> {
    const res = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const json = await res.json() as any;
    const status = json.data?.status;
    if (status === "PUBLISH_COMPLETE") return "published";
    if (status === "FAILED") return "failed";
    return "processing";
  }
}
