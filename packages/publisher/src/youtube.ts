import type {
  PlatformPublisher,
  OAuthTokens,
  PublishInput,
  PublishResult,
  OAuthConfig,
  OAuthStartResult,
  OAuthCallbackResult,
} from "./types.js";

// YouTube Data API v3 — Shorts upload
// Docs: https://developers.google.com/youtube/v3/guides/uploading_a_video

const AUTH_BASE  = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL  = "https://oauth2.googleapis.com/token";
const API_BASE   = "https://www.googleapis.com";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export class YouTubePublisher implements PlatformPublisher {
  constructor(private config: OAuthConfig) {}

  // ─── OAuth ──────────────────────────────────────────────────────────────────

  buildAuthUrl(state: string): OAuthStartResult {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return { authUrl: `${AUTH_BASE}?${params}`, state };
  }

  async exchangeCode(code: string): Promise<OAuthCallbackResult> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const json = await res.json() as any;
    if (!res.ok) throw new Error(`YouTube token error: ${json.error_description}`);

    // Get channel info
    const channelRes = await fetch(
      `${API_BASE}/youtube/v3/channels?part=snippet&mine=true`,
      { headers: { Authorization: `Bearer ${json.access_token}` } }
    );
    const channelJson = await channelRes.json() as any;
    const channel = channelJson.items?.[0];

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
      accountId: channel?.id ?? "unknown",
      accountName: channel?.snippet?.title ?? "YouTube Channel",
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const json = await res.json() as any;
    if (!res.ok) throw new Error(`YouTube token refresh failed: ${json.error_description}`);
    return {
      accessToken: json.access_token,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
      refreshToken, // Google doesn't rotate refresh tokens
    };
  }

  // ─── Publish ────────────────────────────────────────────────────────────────

  async publish(tokens: OAuthTokens, input: PublishInput): Promise<PublishResult> {
    const description = [
      input.description,
      "",
      input.hashtags.map((h) => `#${h}`).join(" "),
    ].join("\n");

    const metadata = {
      snippet: {
        title: input.title.slice(0, 100),
        description: description.slice(0, 5000),
        tags: input.hashtags.slice(0, 500),
        categoryId: "22", // People & Blogs
        defaultLanguage: "vi",
      },
      status: {
        privacyStatus: input.scheduledAt ? "private" : "public",
        selfDeclaredMadeForKids: false,
        ...(input.scheduledAt
          ? { publishAt: input.scheduledAt.toISOString(), privacyStatus: "private" }
          : {}),
      },
    };

    // Step 1: Start resumable upload session
    const initRes = await fetch(
      `${API_BASE}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      throw new Error(`YouTube upload init failed: ${err}`);
    }

    const uploadUri = initRes.headers.get("location");
    if (!uploadUri) throw new Error("YouTube did not return upload URI");

    // Step 2: Upload video
    const videoRes  = await fetch(input.videoUrl);
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(videoBuffer.length),
      },
      body: videoBuffer,
    });

    const uploadJson = await uploadRes.json() as any;
    if (!uploadRes.ok) throw new Error(`YouTube upload failed: ${uploadJson.error?.message}`);

    const videoId: string = uploadJson.id;

    return {
      platformPostId: videoId,
      postUrl: `https://www.youtube.com/shorts/${videoId}`,
      status: input.scheduledAt ? "scheduled" : "processing", // YouTube processes async
    };
  }

  async getPostStatus(tokens: OAuthTokens, videoId: string): Promise<"published" | "processing" | "failed"> {
    const res = await fetch(
      `${API_BASE}/youtube/v3/videos?part=status&id=${videoId}`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
    );
    const json = await res.json() as any;
    const uploadStatus = json.items?.[0]?.status?.uploadStatus;
    if (uploadStatus === "processed") return "published";
    if (uploadStatus === "failed" || uploadStatus === "rejected") return "failed";
    return "processing";
  }
}
