import { NextResponse } from "next/server";

// Curated background music presets for Vietnamese KOL videos
// In production these would be licensed tracks stored in R2
const MUSIC_PRESETS = [
  {
    id: "upbeat-vi-1",
    name: "Năng động - Viral TikTok",
    mood: "energetic",
    bpm: 128,
    durationSeconds: 60,
    tags: ["viral", "tiktok", "trending"],
    genre: "pop",
    url: null, // placeholder — replace with actual R2 URL
    preview: null,
  },
  {
    id: "chill-vi-1",
    name: "Nhẹ nhàng - Review sản phẩm",
    mood: "calm",
    bpm: 90,
    durationSeconds: 60,
    tags: ["review", "calm", "professional"],
    genre: "acoustic",
    url: null,
    preview: null,
  },
  {
    id: "hype-vi-1",
    name: "Hype - Giảm giá / Khuyến mãi",
    mood: "exciting",
    bpm: 140,
    durationSeconds: 45,
    tags: ["sale", "promotion", "hype"],
    genre: "edm",
    url: null,
    preview: null,
  },
  {
    id: "emotional-vi-1",
    name: "Cảm xúc - Câu chuyện thương hiệu",
    mood: "emotional",
    bpm: 75,
    durationSeconds: 90,
    tags: ["story", "brand", "emotional"],
    genre: "cinematic",
    url: null,
    preview: null,
  },
  {
    id: "lofi-vi-1",
    name: "Lo-fi - Lifestyle / Vlog",
    mood: "relaxed",
    bpm: 85,
    durationSeconds: 120,
    tags: ["lofi", "lifestyle", "vlog"],
    genre: "lofi",
    url: null,
    preview: null,
  },
  {
    id: "tet-vi-1",
    name: "Tết / Lễ hội",
    mood: "festive",
    bpm: 110,
    durationSeconds: 60,
    tags: ["tet", "holiday", "festive", "vietnam"],
    genre: "traditional",
    url: null,
    preview: null,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get("mood");
  const genre = searchParams.get("genre");

  let presets = MUSIC_PRESETS;
  if (mood) presets = presets.filter((p) => p.mood === mood);
  if (genre) presets = presets.filter((p) => p.genre === genre);

  return NextResponse.json({
    presets,
    moods: [...new Set(MUSIC_PRESETS.map((p) => p.mood))],
    genres: [...new Set(MUSIC_PRESETS.map((p) => p.genre))],
  });
}
