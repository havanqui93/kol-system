import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@kol/database";

const client = new Anthropic();

// POST /api/products/:id/describe — generate product description from product images using Claude Vision
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (product.imageUrls.length === 0) {
    return NextResponse.json({ error: "Product has no images to analyze" }, { status: 400 });
  }

  // Use the first image URL for vision analysis. The pinned SDK expects
  // base64 image data, so fetch the image and inline it.
  const imageUrl = product.imageUrls[0];
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Could not fetch product image" }, { status: 400 });
  }
  const imageBase64 = Buffer.from(await imageRes.arrayBuffer()).toString("base64");
  const contentType = imageRes.headers.get("content-type") ?? "";
  const mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" =
    contentType.includes("png")
      ? "image/png"
      : contentType.includes("gif")
        ? "image/gif"
        : contentType.includes("webp")
          ? "image/webp"
          : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Bạn là chuyên gia marketing. Hãy mô tả sản phẩm trong ảnh này bằng tiếng Việt một cách hấp dẫn cho video TikTok/Reels. Bao gồm: loại sản phẩm, đặc điểm nổi bật, lợi ích chính. Viết 2-3 câu ngắn gọn, sinh động.`,
          },
        ],
      },
    ],
  });

  const description =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  // Update product description
  await prisma.product.update({
    where: { id: params.id },
    data: { description },
  });

  return NextResponse.json({ description });
}
