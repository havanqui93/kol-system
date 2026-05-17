import type { LLMMessage } from "@kol/providers";

// ─── Product Image-to-Video Prompt Generator ────────────────────────────────

export interface KlingProductPromptInput {
  productName: string;
  productCategory: string;
  sellingPoint: string;
  mood: "energetic" | "elegant" | "warm" | "playful" | "professional";
  platform: string;
}

export interface KlingProductPromptOutput {
  prompt: string;
  negativePrompt: string;
  durationSeconds: 5 | 10;
  aspectRatio: "9:16" | "16:9";
  cameraMovement: string;
}

export function buildKlingProductPromptMessages(input: KlingProductPromptInput): LLMMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert Kling AI video prompt engineer specializing in Vietnamese e-commerce product videos.
Write cinematic, specific prompts that produce high-quality 9:16 product showcase videos.
Prompts must be in English (Kling works better with English prompts).
Focus on: lighting, camera movement, visual style, product hero shot.
Always return valid JSON.`,
    },
    {
      role: "user",
      content: `Generate a Kling image-to-video prompt for:

Product: ${input.productName}
Category: ${input.productCategory}
Key selling point: ${input.sellingPoint}
Mood: ${input.mood}
Platform: ${input.platform}

Return JSON:
{
  "prompt": string,         // 50-80 words, cinematic, specific camera/lighting instructions
  "negativePrompt": string, // what to avoid
  "durationSeconds": 5 | 10,
  "aspectRatio": "9:16",
  "cameraMovement": string  // e.g., "slow zoom in", "gentle pan left", "static hero shot"
}

Example prompt style: "Close-up product hero shot, [product] on clean white surface, soft warm studio lighting, shallow depth of field, slow gentle zoom in, cinematic color grade, professional e-commerce style, 4K quality"`,
    },
  ];
}

// ─── KOL Avatar Talking Head Prompt ─────────────────────────────────────────

export interface KlingKolPromptInput {
  kolDescription: string; // appearance description from avatar image
  mood: string;
  scriptExcerpt: string;
  platform: string;
}

export interface KlingKolPromptOutput {
  prompt: string;
  negativePrompt: string;
  durationSeconds: 5;
  aspectRatio: "9:16";
  notes: string;
}

export function buildKlingKolPromptMessages(input: KlingKolPromptInput): LLMMessage[] {
  return [
    {
      role: "system",
      content: `You are a Kling AI prompt engineer for KOL avatar talking head videos.
The goal: generate a natural, engaging talking head clip from a KOL photo.
Prompts must be in English. Focus on natural facial movement, lip sync readiness, lighting.
Always return valid JSON.`,
    },
    {
      role: "user",
      content: `Generate a Kling image-to-video prompt for a KOL talking head clip:

KOL description: ${input.kolDescription}
Mood/Energy: ${input.mood}
Script context: "${input.scriptExcerpt}"
Platform: ${input.platform}

Return JSON:
{
  "prompt": string,         // talking head prompt, natural movement, expressive
  "negativePrompt": string,
  "durationSeconds": 5,
  "aspectRatio": "9:16",
  "notes": string           // implementation notes for the video team
}`,
    },
  ];
}

// ─── B-roll Text-to-Video Prompt ─────────────────────────────────────────────

export interface KlingBrollPromptInput {
  sceneDescription: string;
  productType: string;
  location?: string;
  mood: string;
  viMarketContext?: boolean;
}

export function buildKlingBrollMessages(input: KlingBrollPromptInput): LLMMessage[] {
  return [
    {
      role: "system",
      content: `You are a Kling text-to-video prompt engineer for Vietnamese market short-form videos.
Create cinematic B-roll prompts that work as background/supplementary footage.
Prompts must be in English. Be specific about visual elements, location cues, lighting.
Always return valid JSON.`,
    },
    {
      role: "user",
      content: `Generate a Kling text-to-video B-roll prompt:

Scene: ${input.sceneDescription}
Product type: ${input.productType}
Location: ${input.location ?? "Vietnam, urban"}
Mood: ${input.mood}
Vietnamese market context: ${input.viMarketContext ?? true}

Return JSON:
{
  "prompt": string,
  "negativePrompt": string,
  "durationSeconds": 5,
  "aspectRatio": "9:16",
  "cameraMovement": string
}`,
    },
  ];
}
