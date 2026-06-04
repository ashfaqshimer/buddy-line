# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BuddyLine is a realtime chat application built as a **pnpm + Turborepo monorepo**, architected as a **modular monolith** (designed for later microservice extraction). `SPEC.md` at the repo root is the authoritative design document — consult it for intended features, the database schema, socket events, auth flow, and the phased MVP milestones (§29). When code and `SPEC.md` disagree, the spec reflects intent but is not yet fully implemented.

**Project status: early scaffolding.** Config, folder structure, and the Prisma schema exist, but most module directories under `apps/api/src/` are empty (`.gitkeep` only). Notably, `apps/api` has **no `src/server.ts` entry file yet**, so `turbo run dev` / `pnpm --filter api dev` will fail until it is created. The `apps/web` app is a stock Next.js scaffold.

## Commands

Run from the repo root; `--filter <name>` targets a workspace without `cd`.

```bash
pnpm install                      # install all workspaces (single root lockfile)
pnpm dev                          # turbo: run all apps' dev servers in parallel
pnpm build / lint / typecheck     # turbo pipelines across the workspace
pnpm test                         # turbo: run all test suites
pnpm format                       # prettier --write across the repo

# Target one workspace
pnpm --filter web dev             # Next.js dev server (works today)
pnpm --filter api dev             # tsx watch src/server.ts (needs server.ts first)
pnpm --filter api build           # tsc -> dist/

# Backend tests (Jest). Run a single file / test:
pnpm --filter api test -- path/to/file.test.ts
pnpm --filter api test -- -t "test name substring"

# Prisma (schema lives at apps/api/prisma/schema.prisma)
pnpm --filter api prisma:generate   # regenerate client after schema edits
pnpm --filter api prisma:migrate    # create + apply a dev migration
pnpm --filter api prisma:studio

# Local infra (Postgres + Redis) for development
docker compose up -d
```

Workspace package names for `--filter`: `web`, `api`, `@buddy-line/shared-types`, `@buddy-line/eslint-config`, `@buddy-line/tsconfig`.

## Architecture

**Layout** — `apps/{web,api}` are the deployables; `packages/*` are shared internal libraries consumed via `workspace:*`:
- `packages/shared-types` — the **API/socket contract** shared by both apps. It exports the `ApiResponse<T>` envelope, domain DTOs, and the `ClientToServerEvents`/`ServerToClientEvents` Socket.IO maps. It is consumed as raw `.ts` (its `exports` point at `src/index.ts`, no build step), which works because both apps transpile on the fly. Changing an event or DTO here is the single source of truth for both sides.
- `packages/tsconfig` — shared TS configs. `base.json` extends the root `tsconfig.base.json` (the one place strictness is defined); `node.json` (NodeNext, for the API) and `nextjs.json` (Bundler, for web) layer on top.
- `packages/eslint-config` — shared ESLint **flat config** (ESLint 9, `typescript-eslint` unified package), ESM.

**Backend (`apps/api`) is layered per feature.** Request flow is `Controller → Service → Repository → Database` (SPEC §5.2). Code is organized as vertical slices under `src/modules/<feature>/` (auth, users, chat, messages, presence, uploads), not by technical layer. Cross-cutting infrastructure (Prisma client, Redis/ioredis, BullMQ queues, Socket.IO setup + redis-adapter) lives under `src/infrastructure/`. Two enforced boundaries from SPEC §31: **keep business logic out of controllers**, and **never couple sockets directly to DB queries** — sockets call services, same as controllers.

**Realtime** uses Socket.IO with conversation-based rooms (`conversation:<id>`) plus a per-user room (`user:<id>`); helpers `conversationRoom()` / `userRoom()` are in shared-types. Redis is the socket adapter (for horizontal scaling), presence cache, rate-limit store, and BullMQ backend.

**Database** is PostgreSQL via Prisma. The schema uses **camelCase model fields mapped to snake_case columns** (`@map` / `@@map`) to match the spec's raw SQL design — preserve this convention when editing `schema.prisma`. UUID primary keys; `MessageType`/`ConversationType` are enums.

**Auth** (SPEC §10): short-lived JWT access token (in memory client-side) + long-lived refresh token stored hashed in the `refresh_tokens` table, rotated on refresh, delivered as an HttpOnly cookie.

## Critical conventions

- **`apps/web` runs Next.js 16 + React 19 — newer than common training data.** `apps/web/AGENTS.md` (loaded via `apps/web/CLAUDE.md`) mandates reading the bundled docs in `apps/web/node_modules/next/dist/docs/` before writing any Next.js code. Real gotchas there: request APIs (`cookies()`, `headers()`, `params`, `searchParams`) are **async**; there is a "Cache Components" model; and routes that should navigate instantly must export `unstable_instant` (Suspense/`loading.js` alone is not enough). Do not write Next code from memory.
- The web frontend is the **client-heavy** half of the stack: React Query + Axios + Zustand + Socket.IO client talking directly to `apps/api`. Most chat UI will be `"use client"`, largely bypassing Next's server data/caching layer.
- **Both apps are ESM** (`"type": "module"`). The API runs via `tsx` in dev and `tsc`-built `dist/` in prod; `node.json` overrides module resolution to `NodeNext` so the build emits correct ESM.
- **API responses** must use the `ApiResponse<T>` envelope from shared-types — `{ success, data, error }` (SPEC §14.2 / §15.1), never bare payloads.

## Known setup issue

`create-next-app` left a **nested `apps/web/pnpm-lock.yaml` and `apps/web/pnpm-workspace.yaml`** inside the web app. A monorepo should have a single lockfile at the root; the nested files can cause pnpm to treat `apps/web` as its own workspace and desync dependencies. The `pnpm-workspace.yaml` there only carries `ignoredBuiltDependencies` (sharp, unrs-resolver) — fold those into the root config and delete the nested lockfile/workspace files so the root workspace governs everything.
