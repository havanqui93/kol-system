import type {
  PlatformPublisher,
  OAuthTokens,
  PublishInput,
  PublishResult,
  OAuthConfig,
  OAuthStartResult,
  OAuthCallbackResult,
} from "./types.js";

// Meta Graph API — Facebook Reels
// Docs: https://developers.facebook.com/docs/video-api/guides/reels-publishing

const AUTH_BASE  = "https://www.facebook.com/v19.0/dialog/oauth";
const TOKEN_URL  = "https://graph.facebook.com/v19.0/oauth/access_token";
const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export class FacebookPublisher implements PlatformPublisher {
  constructor(private config: OAuthConfig) {}

  // ─── OAuth ──────────────────────────────────────────────────────────────────

  buildAuthUrl(state: string): OAuthStartResult {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "pages_show_list,pages_read_engagement,pages_manage_posts,publish_video",
      response_type: "code",
      state,
    });
    return { authUrl: `${AUTH_BASE}?${params}`, state };
  }

  async exchangeCode(code: string): Promise<OAuthCallbackResult> {
    // 1. Get user access token
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code,
    });
    const tokenRes = await fetch(`${TOKEN_URL}?${params}`);
    const tokenJson = await tokenRes.json() as any;
    if (!tokenRes.ok) throw new Error(`Facebook token error: ${tokenJson.error?.message}`);

    const userToken: string = tokenJson.access_token;

    // 2. Get user info
    const meRes = await fetch(`${GRAPH_BASE}/me?fields=id,name&access_token=${userToken}`);
    const me = await meRes.json() as any;

    // 3. Get managed pages and their long-lived page tokens
    const pagesRes = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${userToken}`);
    const pagesJson = await pagesRes.json() as any;
    const firstPage = pagesJson.data?.[0];

    // Use first page token if available (needed for Reels publishing)
    const pageToken = firstPage?.access_token ?? userToken;
    const pageId    = firstPage?.id;
    const pageName  = firstPage?.name;

    // 4. Exchange for long-lived token
    const llParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      fb_exchange_token: pageToken,
    });
    const llRes = await fetch(`${GRAPH_BASE}/oauth/access_token?${llParams}`);
    const llJson = await llRes.json() as any;
    const longToken: string = llJson.access_token ?? pageToken;

    return {
      accessToken: longToken,
      expiresAt: llJson.expires_in ? new Date(Date.now() + llJson.expires_in * 1000) : undefined,
      accountId: me.id,
      accountName: me.name,
      pageId,
      pageName,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    // Facebook long-lived tokens last 60 days — just extend via exchange
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      fb_exchange_token: refreshToken,
    });
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
    const json = await res.json() as any;
    if (!res.ok) throw new Error(`Facebook token refresh failed: ${json.error?.message}`);
    return {
      accessToken: json.access_token,
      expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined,
    };
  }

  // ─── Publish ────────────────────────────────────────────────────────────────

  async publish(tokens: OAuthTokens, input: PublishInput): Promise<PublishResult> {
    const targetId = tokens.pageId ?? tokens.accessToken; // page ID required for Reels
    if (!tokens.pageId) throw new Error("Facebook publishing requires a connected Page. No page found on this account.");

    const description = [
      input.description,
      input.hashtags.map((h) => `#${h}`).join(" "),
    ].filter(Boolean).join("\n\n");

    // Step 1: Init Reels upload
    const initRes = await fetch(`${GRAPH_BASE}/${targetId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "start",
        access_token: tokens.accessToken,
      }),
    });
    const initJson = await initRes.json() as any;
    if (!initRes.ok) throw new Error(`Facebook Reels init failed: ${initJson.error?.message}`);

    const videoId: string = initJson.video_id;
    const uploadUrl: string = initJson.upload_url;

    // Step 2: Upload video binary
    const videoRes = await fetch(input.videoUrl);
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoSize   = videoBuffer.length;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${tokens.accessToken}`,
        offset: "0",
        file_size: String(videoSize),
        "Content-Type": "application/octet-stream",
      },
      body: videoBuffer,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Facebook upload failed: ${err}`);
    }

    // Step 3: Publish Reels
    const publishRes = await fetch(`${GRAPH_BASE}/${targetId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: tokens.accessToken,
        video_id: videoId,
        upload_phase: "finish",
        video_state: "PUBLISHED",
        description,
        title: input.title,
        ...(input.scheduledAt
          ? { video_state: "SCHEDULED", scheduled_publish_time: Math.floor(input.scheduledAt.getTime() / 1000) }
          : {}),
      }),
    });
    const publishJson = await publishRes.json() as any;
    if (!publishRes.ok) throw new Error(`Facebook publish failed: ${publishJson.error?.message}`);

    return {
      platformPostId: videoId,
      postUrl: `https://www.facebook.com/${targetId}/videos/${videoId}`,
      status: input.scheduledAt ? "scheduled" : "published",
    };
  }

  async getPostStatus(tokens: OAuthTokens, videoId: string): Promise<"published" | "processing" | "failed"> {
    const res = await fetch(
      `${GRAPH_BASE}/${videoId}?fields=status&access_token=${tokens.accessToken}`
    );
    const json = await res.json() as any;
    const s = json.status?.video_status;
    if (s === "ready") return "published";
    if (s === "error") return "failed";
    return "processing";
  }
}
