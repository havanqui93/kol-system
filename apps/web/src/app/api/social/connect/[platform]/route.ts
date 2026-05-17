import { NextResponse } from "next/server";
import { getPublisher } from "@/lib/publishers";

const VALID_PLATFORMS = new Set(["tiktok", "facebook", "youtube_shorts"]);

// GET /api/social/connect/:platform
// Redirects the user to the platform's OAuth consent screen.
export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  if (!VALID_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const userId = request.headers.get("x-user-id") ?? "demo-user";

  // state encodes userId so we can look it up in the callback
  const state = Buffer.from(JSON.stringify({ userId, platform, ts: Date.now() })).toString("base64url");

  const publisher = getPublisher(platform) as any; // all publishers have buildAuthUrl
  const { authUrl } = publisher.buildAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
