import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { ensureUser, getRequestUserId } from "@/lib/user";

const CreateKolProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  avatarImageUrl: z.string().url(),
  voiceGender: z.enum(["male", "female"]).default("female"),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).default("energetic"),
  language: z.string().default("vi"),
  stylePrompt: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = getRequestUserId(request);
  await ensureUser(userId);

  const body = await request.json();
  const validated = CreateKolProfileSchema.parse(body);

  const kolProfile = await prisma.kolProfile.create({
    data: { userId, ...validated },
  });

  return NextResponse.json(kolProfile, { status: 201 });
}

export async function GET(request: Request) {
  const userId = getRequestUserId(request);
  const kolProfiles = await prisma.kolProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { videoProjects: true } } },
  });

  return NextResponse.json({ kolProfiles });
}
