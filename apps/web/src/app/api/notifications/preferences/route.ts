import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const updateSchema = z.object({
  emailOnComplete: z.boolean().optional(),
  emailOnFailure: z.boolean().optional(),
  emailOnPublish: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  webhookUrl: z.string().url().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });

    if (!prefs) {
      // Return defaults without creating a record
      return NextResponse.json({
        emailOnComplete: true,
        emailOnFailure: true,
        emailOnPublish: false,
        browserNotifications: true,
        webhookUrl: null,
      });
    }

    return NextResponse.json({
      emailOnComplete: prefs.emailOnComplete,
      emailOnFailure: prefs.emailOnFailure,
      emailOnPublish: prefs.emailOnPublish,
      browserNotifications: prefs.browserNotifications,
      webhookUrl: prefs.webhookUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const body = await request.json();
    const data = updateSchema.parse(body);

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return NextResponse.json({
      emailOnComplete: prefs.emailOnComplete,
      emailOnFailure: prefs.emailOnFailure,
      emailOnPublish: prefs.emailOnPublish,
      browserNotifications: prefs.browserNotifications,
      webhookUrl: prefs.webhookUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
