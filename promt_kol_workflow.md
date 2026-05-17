# Claude Prompt: Design KOL Agentic AI Video Generation Workflow

## Role

You are a senior AI product architect, agentic AI engineer, and full-stack system designer.

I am building an **AI Agent / Agentic AI system focused on KOL-style video generation**.

The system should generate short-form videos for:
     
- TikTok
- Facebook Reels
- YouTube Shorts
- Affiliate product videos
- Used-car selling videos
- Product review videos
- Virtual KOL / AI influencer content

The main goal is:

> Generate high-quality KOL-style videos from only text, product information, or uploaded images, while keeping the system fast, scalable, and cost-efficient.

---

## Main Requirement

Design a complete workflow/system where the user can input:

1. Text only
2. Product information
3. Product image
4. KOL avatar image
5. Optional brand tone
6. Optional target platform
7. Optional video duration
8. Optional language, especially Vietnamese first

Then the system should automatically generate:

1. Viral video idea
2. Hook
3. Transcript/script
4. Voice/audio
5. KOL/avatar video or product video
6. Captions/subtitles
7. Background music
8. Product overlays
9. CTA
10. Final MP4 video
11. Optional post/schedule to social platforms

---

## Target Output From Claude

Please generate a **production-ready technical workflow and system design**.

Include the following sections:

---

# 1. Product Vision

Explain what this KOL AI video generation system does.

The system should help sellers, affiliates, and small businesses create short-form social videos quickly without hiring actors, editors, or content creators.

Focus on:

- Fast video generation
- Low cost
- Good quality
- Reusable KOL profiles
- Automation
- Vietnamese market first
- TikTok/Facebook/YouTube Shorts support

---

# 2. Core User Flow

Design the full user journey.

Example:

1. User creates a video project
2. User chooses video type
3. User uploads image or enters product text
4. User selects KOL style
5. AI generates script
6. User approves or regenerates script
7. AI generates voice
8. AI generates Kling video clips
9. AI renders final video
10. User previews video
11. User downloads or publishes video

Please provide a detailed flow.

---

# 3. Agentic AI Workflow

Design the system using multiple AI agents.

Required agents:

## 3.1 Intake Agent

Responsible for understanding the user input.

Input examples:

- Product name
- Product description
- Product price
- Promotion
- Target customer
- Image
- Text idea
- KOL style
- Platform

Output:

- Normalized project context
- Missing data warning
- Recommended video type

---

## 3.2 Research Agent

Responsible for finding the best content angle.

Tasks:

- Identify customer pain points
- Suggest viral hooks
- Suggest trending short-form video structure
- Suggest emotional angle
- Suggest platform-specific angle

Output:

- 3–5 hooks
- Best hook recommendation
- Content angle
- CTA suggestion

---

## 3.3 Script Agent

Responsible for generating transcript/script.

Must support:

- 15-second video
- 30-second video
- 45-second video
- 60-second video

Script format:

- Hook
- Problem
- Product introduction
- Benefits
- Proof/trust
- Offer
- CTA

Need to support Vietnamese scripts first.

---

## 3.4 Voice Agent

Responsible for audio generation.

Tasks:

- Generate voiceover text
- Choose voice style
- Generate TTS audio
- Support Vietnamese voice
- Support male/female/energetic/professional/funny voice style

Possible integrations:

- ElevenLabs
- OpenAI TTS
- Google TTS
- FPT.AI voice
- Zalo AI voice

Output:

- Audio file URL
- Voice metadata
- Duration
- Word timing if available

---

## 3.5 Visual Planning Agent

Responsible for deciding what visual scenes should be generated.

Output should include a scene plan like:

| Scene | Duration | Visual Type | Tool | Prompt | Audio Segment |
|---|---:|---|---|---|---|

Visual types:

- KOL talking head
- Product image motion
- Product B-roll
- Text overlay
- Before/after comparison
- Price highlight
- CTA screen

---

## 3.6 Kling Video Agent

Responsible for generating video clips using Kling.

Use Kling for:

- Image-to-video
- Text-to-video
- Product demo clip
- KOL avatar clip
- Short B-roll
- Hook clip

Important cost rule:

Do not generate the full 60-second video using Kling unless necessary.

Recommended approach:

- Generate 5–15 seconds using Kling
- Use Remotion/FFmpeg for the rest
- Reuse product image and motion effects
- Add captions and CTA in renderer

Kling API integration options:

- fal.ai Kling API
- Replicate, if available
- Official Kling API, if available

Please design the Kling request/response workflow.

---

## 3.7 Subtitle Agent

Responsible for generating captions.

Tasks:

- Generate subtitle from transcript or audio
- Word-level or sentence-level captions
- Vietnamese subtitle support
- Highlight keywords
- Export SRT/VTT/JSON

Possible tools:

- Whisper
- AssemblyAI
- Deepgram
- ElevenLabs timing if available

---

## 3.8 Editing Agent

Responsible for final video composition.

Use:

- Remotion
- FFmpeg
- MoviePy

Tasks:

- Combine clips
- Add captions
- Add product image
- Add CTA
- Add music
- Add logo/watermark
- Add platform layout
- Export 9:16 MP4

---

## 3.9 QA Agent

Responsible for quality checking.

Check:

- Video duration
- Subtitle sync
- Audio sync
- Script quality
- CTA exists
- No missing assets
- Product claim safety
- No copyrighted music issue
- Platform aspect ratio

---

## 3.10 Publisher Agent

Responsible for publishing or scheduling.

Platforms:

- TikTok
- Facebook Page
- Instagram Reels
- YouTube Shorts

Tasks:

- Upload video
- Generate title
- Generate hashtags
- Generate description
- Schedule post
- Save publish status

---

# 4. Recommended Technical Stack

Please design the stack using this preference:

## Frontend

- Next.js 14+
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js API Routes or NestJS
- Node.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Queue

- BullMQ
- Redis

## Storage

- S3
- Cloudflare R2
- MinIO for local development

## AI Providers

- OpenAI or Claude for script generation
- ElevenLabs/OpenAI TTS for voice
- Kling via fal.ai for video generation
- Whisper/Deepgram for subtitles

## Rendering

- Remotion
- FFmpeg

## Deployment

- Vercel for frontend
- Railway/Fly.io/DigitalOcean/AWS for worker
- Redis Cloud or Upstash Redis
- Cloudflare R2 for storage

---

# 5. System Architecture

Generate a high-level architecture diagram in Mermaid.

Must include:

- Web app
- API server
- Worker service
- Queue
- Database
- Storage
- AI providers
- Kling
- Renderer
- Publisher

Use Mermaid format.

---

# 6. Database Design

Design PostgreSQL tables.

Required tables:

- users
- kol_profiles
- products
- video_projects
- video_scripts
- video_scenes
- generated_assets
- render_jobs
- publish_jobs
- provider_usage
- cost_tracking

For each table include:

- Columns
- Data types
- Primary key
- Foreign keys
- Important indexes
- Purpose

---

# 7. API Design

Create API endpoint design.

Required APIs:

## Project APIs

- POST /api/video-projects
- GET /api/video-projects
- GET /api/video-projects/:id
- PATCH /api/video-projects/:id
- DELETE /api/video-projects/:id

## Script APIs

- POST /api/video-projects/:id/generate-script
- POST /api/video-projects/:id/regenerate-script
- POST /api/video-projects/:id/approve-script

## Audio APIs

- POST /api/video-projects/:id/generate-audio

## Kling APIs

- POST /api/video-projects/:id/generate-kling-clips
- GET /api/kling/jobs/:jobId

## Render APIs

- POST /api/video-projects/:id/render
- GET /api/render-jobs/:id

## Publish APIs

- POST /api/video-projects/:id/publish
- GET /api/publish-jobs/:id

For each endpoint include:

- Purpose
- Request body
- Response body
- Validation
- Error handling

---

# 8. Queue Job Design

Design BullMQ jobs.

Required jobs:

- generate-script-job
- generate-audio-job
- generate-kling-video-job
- generate-subtitle-job
- render-video-job
- qa-video-job
- publish-video-job

For each job include:

- Input payload
- Processing steps
- Output
- Retry strategy
- Timeout
- Failure handling

---

# 9. Cost Optimization Strategy

Very important.

The system must be fast, good quality, and cheap.

Explain how to reduce cost:

- Do not generate full video using Kling
- Generate only short AI clips
- Use Remotion/FFmpeg for final composition
- Reuse product images
- Cache generated voice
- Cache prompts
- Cache KOL avatar assets
- Use lower-cost models for draft script
- Use premium models only for final improvement
- Track cost per video
- Stop generation when budget limit is reached

Include cost tracking design.

---

# 10. Video Templates

Design reusable video templates.

Required templates:

## Template 1: Product Review KOL

Structure:

- 0–3s hook
- 3–10s pain point
- 10–25s product benefit
- 25–35s proof/price
- 35–45s CTA

## Template 2: Affiliate Product Video

Structure:

- Hook
- Problem
- Product demo
- Benefit
- Offer
- CTA

## Template 3: Used Car Sales Video

Structure:

- Hook
- Car overview
- Exterior highlights
- Interior highlights
- Price/payment
- Location/contact CTA

## Template 4: Virtual KOL Talking Head

Structure:

- KOL introduction
- Main message
- Product mention
- CTA

For each template include:

- Scene structure
- Prompt format
- Asset requirements
- Recommended duration

---

# 11. Prompt Library

Create reusable prompts for each agent.

Need prompts for:

1. Intake Agent
2. Research Agent
3. Script Agent
4. Vietnamese viral hook generator
5. KOL style generator
6. Kling prompt generator
7. Subtitle style generator
8. Caption/hashtag generator
9. QA Agent
10. Publisher Agent

Each prompt should include:

- System prompt
- User prompt template
- Expected JSON output

---

# 12. Kling Prompt Templates

Create specific Kling prompts for:

## Product image-to-video

Input:

- Product image
- Product category
- Selling point
- Mood
- Platform

Output:

- Kling prompt
- Negative prompt
- Duration
- Aspect ratio
- Camera movement

## KOL avatar talking video

Input:

- KOL image
- Audio URL
- Script
- Voice mood

Output:

- Kling avatar request design

## Text-to-video B-roll

Input:

- Scene description
- Product type
- Location
- Mood

Output:

- Kling text-to-video prompt

Need examples in Vietnamese market context.

---

# 13. File/Folder Structure

Design a production-ready folder structure.

Example stack:

- Next.js app
- Prisma
- BullMQ workers
- Shared packages
- Remotion renderer
- AI provider adapters
- Storage service
- Social publishing service

Please generate a clear monorepo structure.

---

# 14. Provider Abstraction Layer

Design provider interfaces so I can swap AI providers.

Required interfaces:

- LLMProvider
- TTSProvider
- VideoProvider
- SubtitleProvider
- StorageProvider
- RendererProvider
- PublisherProvider

Use TypeScript interface examples.

---

# 15. Status Flow / State Machine

Design status lifecycle for video project.

Example statuses:

- draft
- script_generating
- script_ready
- script_approved
- audio_generating
- audio_ready
- video_generating
- clips_ready
- rendering
- rendered
- qa_checking
- ready_to_publish
- publishing
- published
- failed

Provide Mermaid state diagram.

---

# 16. Error Handling

Design error handling for:

- AI provider timeout
- Kling job failure
- TTS failure
- Render failure
- Missing image
- Subtitle sync failure
- Social upload failure
- Budget exceeded

Include retry and fallback strategy.

---

# 17. MVP Scope

Define what to build first in 2–4 weeks.

MVP should include:

- Create project
- Upload product image
- Generate Vietnamese script
- Generate voice
- Generate 1–3 Kling clips
- Render final video with captions
- Download MP4

Do not overbuild publishing in MVP.

---

# 18. V2 Scope

Include:

- KOL profile management
- More video templates
- Batch generation
- Social scheduler
- Cost dashboard
- A/B testing hooks
- Auto hashtag generation
- Multi-language support

---

# 19. V3 Scope

Include:

- Fully automated content calendar
- Trend monitoring
- Auto-posting
- Performance analytics
- AI learning from best-performing videos
- Multi-agent optimization loop

---

# 20. Final Deliverables

At the end, please provide:

1. System summary
2. Architecture diagram
3. Agent workflow
4. Database schema
5. API design
6. Queue jobs
7. Prompt library
8. Kling integration design
9. Cost optimization strategy
10. MVP implementation plan
11. Folder structure
12. TypeScript provider interface examples

Make the answer practical, detailed, and ready for developers to start building.

---

## Extra Constraint

Use clear, production-ready language.

Avoid generic AI hype.

Prioritize:

- Fast generation
- Good quality output
- Cheap cost
- Vietnamese market support
- Social video platforms
- Modular architecture
- Easy future provider replacement

