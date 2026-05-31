# Contributing to KOL System

## Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local infrastructure (PostgreSQL + Redis)
docker compose up -d

# 3. Push database schema
pnpm db:push

# 4. Copy environment variables
cp .env.example .env
# Fill in API keys

# 5. Start development server
pnpm dev
```

## Project Structure

```
apps/web/     — Next.js frontend + API routes
apps/worker/  — BullMQ background worker
packages/
  database/   — Prisma schema + client
  agents/     — 9 AI agent implementations
  providers/  — Provider adapters (LLM, TTS, Video, Storage)
  queue/      — BullMQ job types
  publisher/  — Social platform publishers
```

## Code Style

- TypeScript strict mode everywhere
- No `any` unless unavoidable
- Zod validation on all API inputs
- Structured JSON logging in workers
- Cost tracking on every provider call

## Running Tests

```bash
# Provider package (Node built-in test runner)
cd packages/providers && pnpm test

# Web app (Vitest)
cd apps/web && pnpm test

# All tests
pnpm test
```

## TypeScript Checks

```bash
pnpm typecheck
```

## Adding a New API Endpoint

1. Create `apps/web/src/app/api/[route]/route.ts`
2. Use `zod` to validate request body
3. Return `handleApiError(err)` in catch blocks
4. Add rate limiting with `checkRateLimit()` where appropriate
5. Update README API reference table

## Adding a New Agent

1. Create `packages/agents/src/agents/[name].agent.ts`
2. Create `packages/agents/src/prompts/[name].ts` with system prompt
3. Export from `packages/agents/src/index.ts`
4. Use Haiku for cheap/fast agents, Sonnet only for quality-critical ones

## Adding a New Provider

1. Implement the interface from `packages/providers/src/types.ts`
2. Wrap calls in `withRetry()` from `packages/providers/src/retry.ts`
3. Log costs via `packages/providers/src/cost-tracker.ts`

## Commit Messages

Use conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactor
- `test:` Add/update tests
- `docs:` Documentation
- `chore:` Build/config changes

## Pull Requests

1. Create a branch from `main`
2. Keep PRs focused and small
3. Include tests for new features
4. Update README if adding new API endpoints
5. Ensure `pnpm typecheck` passes
