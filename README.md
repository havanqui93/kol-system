# KOL System — AI Video Generation Platform

Agentic AI system for generating KOL-style short-form videos for TikTok, Facebook Reels, and YouTube Shorts. Optimized for the Vietnamese market.

## What it does

1. User inputs product info, image, or text idea
2. AI agents generate script → voice → Kling video clips → subtitles
3. FFmpeg renders the final 9:16 MP4
4. Optional: auto-publish to TikTok / Facebook / YouTube

## Architecture

```
kol-system/
├── apps/
│   ├── web/          # Next.js 14 — frontend + API routes
│   └── worker/       # BullMQ worker service
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── agents/       # 9 AI agent implementations
│   ├── providers/    # Swappable provider adapters (LLM, TTS, Video, Storage)
│   ├── queue/        # BullMQ job types + queue factory
│   ├── renderer/     # FFmpeg render pipeline
│   ├── storage/      # Storage abstraction
│   └── publisher/    # Social platform publishers (V2)
```

## Agent Pipeline

```
IntakeAgent → ResearchAgent → ScriptAgent → VoiceAgent
    → VisualPlanAgent → KlingAgent (parallel per scene)
    → SubtitleAgent → EditingAgent → QAAgent → PublisherAgent
```

## Cost Optimization

- Kling generates only 5–15s of AI video per project (~$0.28–$0.42)
- FFmpeg handles remaining composition (free)
- Script uses Haiku for intake/research ($0.001), Sonnet only for final script
- Voice cached by script hash — same script never re-synthesized
- Budget limit enforced per project

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env
cp .env.example .env
# Fill in your API keys

# Run database migration
pnpm db:push

# Start web + worker in dev
pnpm dev
```

## MVP Scope (Weeks 1–2)

- [x] Database schema
- [x] Provider abstraction layer
- [x] Agent pipeline (Intake → Script → Voice → Kling → Subtitle)
- [x] BullMQ job queue
- [x] API routes
- [x] Worker service
- [ ] Basic Next.js UI (project create, script approval, preview)
- [ ] FFmpeg render integration

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| DB | PostgreSQL + Prisma |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 |
| LLM | Claude (Anthropic) + OpenAI fallback |
| TTS | ElevenLabs (Vietnamese voice) |
| Video | Kling via fal.ai |
| Subtitles | OpenAI Whisper |
| Renderer | FFmpeg |

## API Reference

### Video Projects
- `POST /api/video-projects` — create project
- `GET /api/video-projects` — list projects
- `GET /api/video-projects/:id` — get project

### Generation Pipeline
- `POST /api/video-projects/:id/generate-script` — trigger script generation
- `POST /api/video-projects/:id/approve-script` — approve a script version
- `POST /api/video-projects/:id/generate-audio` — generate voiceover + subtitles
- `POST /api/video-projects/:id/generate-kling-clips` — generate Kling video clips
- `POST /api/video-projects/:id/render` — render final MP4
- `POST /api/video-projects/:id/publish` — publish to social platform

### Job Status
- `GET /api/render-jobs/:id`
- `GET /api/publish-jobs/:id`

## Video Status Flow

```
draft → script_generating → script_ready → script_approved
      → audio_generating → audio_ready
      → video_generating → clips_ready
      → rendering → rendered → qa_checking → ready_to_publish
      → publishing → published
      (any stage) → failed
```
