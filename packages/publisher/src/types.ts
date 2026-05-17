export type Platform = "tiktok" | "facebook" | "youtube_shorts";

export interface PublishInput {
  videoUrl: string;       // public URL of the final MP4
  title: string;
  description: string;
  hashtags: string[];
  scheduledAt?: Date;
}

export interface PublishResult {
  platformPostId: string;
  postUrl?: string;
  status: "published" | "scheduled" | "processing";
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  pageId?: string;        // Facebook page ID
  pageName?: string;
}

export interface PlatformPublisher {
  publish(tokens: OAuthTokens, input: PublishInput): Promise<PublishResult>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  getPostStatus(tokens: OAuthTokens, platformPostId: string): Promise<"published" | "processing" | "failed">;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthStartResult {
  authUrl: string;
  state: string;
}

export interface OAuthCallbackResult extends OAuthTokens {
  accountId: string;
  accountName: string;
}
