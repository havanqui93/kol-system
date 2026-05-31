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
- Budget limit enforced per project (configurable `budgetLimitUsd`)
- Anthropic prompt caching reduces repeat token costs

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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `REDIS_URL` | ✓ | Redis connection string |
| `ANTHROPIC_API_KEY` | ✓ | Claude API key |
| `OPENAI_API_KEY` | – | OpenAI fallback (optional) |
| `ELEVENLABS_API_KEY` | ✓ | TTS voice synthesis |
| `FAL_KEY` | ✓ | fal.ai key for Kling video generation |
| `R2_ACCOUNT_ID` | ✓ | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | ✓ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✓ | R2 secret key |
| `R2_BUCKET_NAME` | ✓ | R2 bucket name |
| `R2_PUBLIC_URL` | ✓ | Public CDN URL for R2 |
| `NEXT_PUBLIC_APP_URL` | ✓ | App base URL |
| `WORKER_CONCURRENCY_SCRIPT` | – | Script worker concurrency (default: 2) |
| `WORKER_CONCURRENCY_AUDIO` | – | Audio worker concurrency (default: 3) |
| `WORKER_CONCURRENCY_KLING` | – | Kling worker concurrency (default: 2) |
| `WORKER_CONCURRENCY_RENDER` | – | Render worker concurrency (default: 2) |
| `WORKER_CONCURRENCY_PUBLISH` | – | Publish worker concurrency (default: 5) |

## API Reference

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — DB + Redis connectivity, returns 200/503 |
| `GET` | `/api/metrics` | Queue depth per queue (waiting/active/completed/failed) |
| `GET` | `/api/workers/health` | Worker health with Redis ping + queue stats |
| `GET` | `/api/analytics/costs` | Cost breakdown by provider over N days |
| `GET` | `/api/voices` | List available TTS voices |

### Video Projects

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/video-projects` | Create project |
| `GET` | `/api/video-projects` | List projects (supports `?q`, `?status`, `?platform`) |
| `GET` | `/api/video-projects/:id` | Get project with full details |
| `PATCH` | `/api/video-projects/:id` | Update title, brandTone, notes, platform, duration |
| `DELETE` | `/api/video-projects/:id` | Hard delete project |
| `POST` | `/api/video-projects/:id/duplicate` | Clone project settings to new draft |
| `GET` | `/api/video-projects/:id/export` | Download full project as JSON attachment |
| `POST` | `/api/video-projects/:id/archive` | Soft-archive (hide from dashboard) |
| `DELETE` | `/api/video-projects/:id/archive` | Unarchive project |
| `POST` | `/api/video-projects/bulk-delete` | Delete up to 50 projects at once `{ ids: string[] }` |

### Generation Pipeline

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/video-projects/:id/generate-script` | Queue script generation (rate-limited 5/min) |
| `POST` | `/api/video-projects/:id/regenerate-script` | Queue script regeneration with optional `{ feedback }` |
| `POST` | `/api/video-projects/:id/approve-script` | Approve a script version `{ scriptId }` |
| `POST` | `/api/video-projects/:id/generate-audio` | Queue voiceover + subtitles |
| `POST` | `/api/video-projects/:id/generate-kling-clips` | Queue Kling video clips per scene |
| `POST` | `/api/video-projects/:id/render` | Queue FFmpeg render `{ backgroundMusicUrl? }` |
| `POST` | `/api/video-projects/:id/cancel` | Cancel waiting jobs + mark as failed |

### Publishing

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/video-projects/:id/publish` | List publish jobs for project |
| `POST` | `/api/video-projects/:id/publish` | Schedule publish `{ platform, socialAccountId, scheduledAt?, hashtags? }` |
| `POST` | `/api/video-projects/:id/publish/:jobId/retry` | Retry a failed publish job |

### Real-time

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/video-projects/:id/stream` | SSE stream — pushes status updates every 2s, closes on terminal status |
| `GET` | `/api/video-projects/:id/progress` | Active BullMQ job progress (0–100) |

### Social Accounts

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/social/accounts` | List connected social accounts |
| `POST` | `/api/social/accounts` | Connect a social account |
| `DELETE` | `/api/social/accounts/:id` | Soft-disable a social account |

### Products & KOL Profiles

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/kol-profiles` | List KOL profiles |
| `POST` | `/api/kol-profiles` | Create KOL profile |

## Admin

| Path | Description |
|---|---|
| `/admin/costs` | Cost dashboard — daily breakdown by provider, top projects by spend |

## Video Status Flow

```
draft → script_generating → script_ready → script_approved
      → audio_generating → audio_ready
      → video_generating → clips_ready
      → rendering → rendered → qa_checking → ready_to_publish
      → publishing → published
      (any stage) → failed
```

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

## Features

- **Real-time status**: SSE stream (`/stream`) + React hook (`useProjectStatus`) for live updates
- **Script A/B comparison**: Side-by-side view of two script versions with change highlights
- **Budget guard**: Per-project `budgetLimitUsd` enforced at API + worker level
- **Rate limiting**: Redis sliding-window (5 req/min for script generation)
- **Prompt caching**: Anthropic `cache_control: ephemeral` on system messages
- **Retry with backoff**: All provider calls wrapped in `withRetry()` (exponential backoff)
- **Structured logging**: JSON logger in worker with child context per worker type
- **Graceful shutdown**: Workers drain active jobs (up to 120s) before exiting
- **Hashtag suggestions**: Per-platform + per-category presets for Vietnamese market
- **Dark mode**: CSS variables with `prefers-color-scheme` media query
- **Archive**: Soft-archive projects instead of hard delete
- **CI**: GitHub Actions typecheck + test + lint on every push
