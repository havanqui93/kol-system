import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/voices — list available TTS voices for the configured providers
export async function GET() {
  const voices = [
    // ElevenLabs Vietnamese voices
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sara", provider: "elevenlabs", gender: "female", style: "energetic", language: "vi" },
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", provider: "elevenlabs", gender: "female", style: "professional", language: "vi" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", provider: "elevenlabs", gender: "male", style: "professional", language: "vi" },
    { id: "VR6AewLTigWG4xSOukaG", name: "Sam", provider: "elevenlabs", gender: "male", style: "energetic", language: "vi" },
  ];

  const available = voices.filter(
    (v) => v.provider !== "elevenlabs" || !!process.env.ELEVENLABS_API_KEY
  );

  return NextResponse.json({ voices: available });
}
