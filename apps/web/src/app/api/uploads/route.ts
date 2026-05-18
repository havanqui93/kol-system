import { NextResponse } from "next/server";
import { R2StorageProvider } from "@kol/providers";
import { ensureUser, getRequestUserId } from "@/lib/user";

const MAX_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_UPLOAD_BYTES = 30 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"]);

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "audio/wav" || contentType === "audio/x-wav") return "wav";
  if (contentType === "audio/mp4") return "m4a";
  if (contentType === "audio/aac") return "aac";
  if (contentType === "audio/mpeg" || contentType === "audio/mp3") return "mp3";
  return "jpg";
}

export async function POST(request: Request) {
  const userId = getRequestUserId(request);
  await ensureUser(userId);

  const formData = await request.formData();
  const file = formData.get("file");
  const purpose = String(formData.get("purpose") ?? "asset");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const isMusicUpload = purpose === "music";
  const allowedTypes = isMusicUpload ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes = isMusicUpload ? MAX_AUDIO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;

  if (!allowedTypes.has(file.type)) {
    const message = isMusicUpload
      ? "Only MP3, WAV, M4A, and AAC music files are supported"
      : "Only JPG, PNG, and WebP images are supported";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (file.size > maxBytes) {
    const message = isMusicUpload ? "Music file is too large. Max size is 30MB." : "Image is too large. Max size is 12MB.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const storage = new R2StorageProvider();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safePurpose = purpose.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const key = `users/${userId}/uploads/${safePurpose}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const url = await storage.upload(key, buffer, { contentType: file.type, isPublic: true });

  return NextResponse.json({ url, key, contentType: file.type, sizeBytes: file.size }, { status: 201 });
}
