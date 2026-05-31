import { z } from "zod";

// Common reusable Zod schemas

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(50),
});

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).optional(),
  sort: z.enum(["newest", "oldest", "status"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  tab: z.enum(["", "processing", "done", "failed"]).default(""),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  videoType: z.enum(["product_review", "affiliate", "used_car", "virtual_kol", "b_roll"]).optional(),
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).optional(),
  language: z.string().min(2).max(10).default("vi"),
  durationSeconds: z.number().int().min(10).max(180).default(30),
  qualityPreset: z.enum(["cheap", "balanced", "premium"]).default("balanced"),
  brandTone: z.string().max(500).optional(),
  productId: z.string().max(50).optional(),
  kolProfileId: z.string().max(50).optional(),
  budgetLimitUsd: z.number().min(0).max(100).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  brandTone: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).optional(),
  durationSeconds: z.number().int().min(10).max(180).optional(),
  language: z.string().min(2).max(10).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.string().max(20).optional(),
  currency: z.string().max(10).default("VND"),
  promotion: z.string().max(500).optional(),
  targetCustomer: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  imageUrls: z.array(z.string().url()).max(10).default([]),
});

export const createKolProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  avatarImageUrl: z.string().url(),
  voiceGender: z.enum(["male", "female"]).default("female"),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).default("energetic"),
  language: z.string().min(2).max(10).default("vi"),
  stylePrompt: z.string().max(500).optional(),
  voiceId: z.string().max(100).optional(),
});

export const generateAudioSchema = z.object({
  voiceGender: z.enum(["male", "female"]).default("female"),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).default("energetic"),
  voiceSpeed: z.number().min(0.5).max(2.0).default(1.0),
});

export const publishSchema = z.object({
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]),
  socialAccountId: z.string().min(1).max(50),
  scheduledAt: z.string().datetime().optional(),
  hashtags: z.array(z.string().max(50)).max(30).default([]),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1).max(50)).min(1).max(50),
});

export const budgetUpdateSchema = z.object({
  budgetLimitUsd: z.number().min(0).max(1000).nullable(),
});
