# Changelog

All notable changes to KOL System are documented here.

## [Unreleased]

### Added (100 Improvements — Round 2)

#### Utilities & Libraries
- `format.ts` — VND/USD currency formatters, bytes, duration, relative time, percent, truncate
- `pagination.ts` — Offset and cursor-based pagination helpers with metadata
- `validation.ts` — Centralized Zod schemas for all API inputs
- `cache.ts` — Redis caching wrapper with TTL, pattern deletion, cache-or-fetch helper
- `circuit-breaker.ts` — Circuit breaker pattern for provider resilience with global registry
- `audit-log.ts` — Structured audit logging for security-sensitive operations
- `platform-limits.ts` — Per-platform content limits and optimization tips
- `url.ts` — Safe URL construction, validation, and redirect sanitization
- `colors.ts` — Brand color utilities, hex validation, contrast calculation, preset palette

#### React Hooks
- `use-debounce.ts` — Generic debounce hook for search inputs
- `use-local-storage.ts` — localStorage hook with cross-tab synchronization
- `use-async.ts` — Async state machine hook (idle/loading/success/error)
- `use-clipboard.ts` — Clipboard copy with reset-after feedback
- `use-intersection-observer.ts` — Intersection Observer hook for lazy loading

#### UI Components
- `video-player.tsx` — In-browser video player with custom controls, seek bar, mute
- `copy-button.tsx` — One-click copy to clipboard with visual feedback
- `time-ago.tsx` — Self-updating relative time display (Vietnamese)
- `platform-badge.tsx` — Colored platform icon badges for TikTok/Facebook/Instagram/YouTube
- `progress-ring.tsx` — Animated circular progress indicator (SVG-based)
- `kbd.tsx` — Keyboard shortcut display component
- `tooltip.tsx` — Hover tooltip with auto-positioning
- `avatar.tsx` — User avatar with image fallback and auto-generated initials
- `confirm-dialog.tsx` — Accessible modal confirmation dialog (keyboard, focus trap)
- `color-picker.tsx` — Brand color picker with presets and hex input

#### Project Components
- `duration-warning.tsx` — Platform-aware video duration validation alert
- `music-picker.tsx` — Background music library browser with filter
- `voice-speed-slider.tsx` — Voice speed slider (0.75×–1.5×) with labels
- `caption-style-picker.tsx` — 5 caption style presets with live preview (minimal/bold/pop/outline/neon)
- `script-stats.tsx` — Script word count, estimated duration, reading speed display

#### API Endpoints (New)
- `GET /api/video-projects/stats` — Aggregate project stats with 30s Redis cache
- `GET /api/system/info` — System version, Node.js version, memory, uptime
- `POST /api/video-projects/:id/favorite` — Toggle project favorite (via notes metadata)
- `POST /api/video-projects/:id/restore` — Restore failed project to draft status
- `PATCH /api/video-projects/:id/budget` — Update/get project budget limit
- `GET /api/video-projects/recent` — Last 10 recently updated projects
- `GET /api/music/presets` — Background music preset library (6 presets, filterable)
- `GET /api/admin/circuit-breakers` — Circuit breaker stats for all providers
- `GET /api/admin/cost-alerts` — Projects approaching/exceeding budget (configurable threshold)
- `GET /api/analytics/pipeline` — Pipeline conversion funnel with dropout rates
- `GET /api/analytics/providers` — Provider reliability and cost analytics
- `GET /api/notifications/preferences` — Get notification preferences
- `PATCH /api/notifications/preferences` — Update notification preferences
- `GET /api/kol-profiles/:id/stats` — KOL profile usage statistics
- `GET /api/products/:id/stats` — Product usage and cost statistics

#### Database Schema
- `CaptionStyle` enum: minimal, bold, pop, outline, neon
- `VideoProject.brandColor` — Hex color for video overlays
- `VideoProject.captionStyle` — Caption rendering style
- `VideoProject.voiceSpeed` — TTS speed multiplier (default: 1.0)
- `VideoProject.isFavorite` — User favorite flag
- `VideoProject.viewCount` — Internal view counter
- `VideoProject.shareToken` — Public share link token (unique)
- `BackgroundMusicPreset` model — Curated music library
- `UserApiKey` model — API key management with bcrypt hashing
- `NotificationPreference` model — Per-user notification settings
- Composite indexes on `[userId, isFavorite]` and `[userId, archivedAt, createdAt]`

#### Security
- Content Security Policy headers in middleware
- HSTS headers (`max-age=63072000`)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Permissions-Policy header
- CORS configuration for API routes (same-origin only)
- Referrer-Policy: strict-origin-when-cross-origin

#### Admin & Monitoring
- `/admin/cost-alerts` page — Budget alert dashboard
- `/admin/analytics/pipeline` page — Conversion funnel visualization

#### Pages
- `/music` — Background music library browser
- `/platform-guide` — Platform limits and optimization tips for each social network

#### Developer Experience
- `.prettierrc` — Consistent code formatting configuration
- `.prettierignore` — Files excluded from Prettier
- `CONTRIBUTING.md` — Developer onboarding guide
- `SECURITY.md` — Security policy and checklist
- `CHANGELOG.md` — This file
- `vitest.config.ts` — Vitest test runner for web app
- vitest added to web app devDependencies

#### Tests (New)
- `format.test.ts` — 20+ test cases for all format utilities
- `format-currency.test.ts` — Extended currency/byte/time formatting tests
- `sanitize.test.ts` — XSS escape, control char removal, Unicode preservation
- `hashtags.test.ts` — Hashtag suggestion, uniqueness, seasonal tags
- `pagination.test.ts` — Offset and cursor pagination edge cases
- `platform-limits.test.ts` — Duration/hashtag validation, all platforms
- `circuit-breaker.test.ts` — Open/close/half-open state transitions
- `colors.test.ts` — Hex validation, RGB conversion, contrast calculation
- `api-error.test.ts` — HTTP status codes for all error types
- `i18n.test.ts` — All pipeline statuses have Vietnamese translations

#### PWA & SEO
- `public/manifest.json` — PWA manifest with app shortcuts
- Enhanced root layout metadata (OpenGraph, Twitter Card, keywords)
- `metadataBase` configuration in layout

## [0.1.0] — Previous Release

### Added
- 9-agent AI video generation pipeline
- 21 batches of improvements (210+ individual features)
- Full PostgreSQL + Prisma schema
- BullMQ worker system with 7 queues
- TikTok, Facebook, Instagram, YouTube Shorts publishing
- Cost tracking and budget enforcement
- Admin dashboards (queues, workers, costs, analytics)
- Real-time SSE status streaming
- Script versioning with A/B comparison
- Dark mode support
