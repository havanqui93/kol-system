import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getPublisher } from "@/lib/publishers";

// GET /api/social/callback/:platform
// Platform redirects here after user grants permission.
export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const url = new URL(request.url);
  const code  = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`
    );
  }

  let userId = "demo-user";
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId ?? userId;
  } catch {
    // state decode failed — proceed with demo user
  }

  try {
    const publisher = getPublisher(platform) as any;
    const tokens = await publisher.exchangeCode(code);

    // Upsert social account — one row per user+platform+accountId
    await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId,
          platform: platform as any,
          accountId: tokens.accountId,
        },
      },
      update: {
        accountName:    tokens.accountName,
        accessToken:    tokens.accessToken,
        refreshToken:   tokens.refreshToken ?? null,
        tokenExpiresAt: tokens.expiresAt ?? null,
        pageId:         tokens.pageId ?? null,
        pageName:       tokens.pageName ?? null,
        isActive:       true,
        updatedAt:      new Date(),
      },
      create: {
        userId,
        platform:       platform as any,
        accountId:      tokens.accountId,
        accountName:    tokens.accountName,
        accessToken:    tokens.accessToken,
        refreshToken:   tokens.refreshToken ?? null,
        tokenExpiresAt: tokens.expiresAt ?? null,
        pageId:         tokens.pageId ?? null,
        pageName:       tokens.pageName ?? null,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=${platform}`
    );
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(String(err))}`
    );
  }
}
