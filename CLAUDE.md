# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Buddy Line is a community web arcade: users upload HTML/CSS/JS games that are played in a sandboxed iframe, with accounts, admin moderation, friends, and private chat. Next.js 16 (App Router) + React 19 + Tailwind v4, managed with **pnpm**.

## Commands

```bash
pnpm dev        # dev server at http://localhost:3000
pnpm build      # production build (also the main type check — there is no test suite)
pnpm lint       # eslint (flat config, eslint-config-next)

node scripts/migrate-auth.mjs                                  # run Better Auth schema migrations
node scripts/manage-admin.mjs set-role <email-or-username> <role>
node scripts/manage-admin.mjs set-email <username-or-email> <new-email>
node scripts/test-neon-e2e.mjs                                 # smoke-test Neon pooled/unpooled connections
```

Scripts read `.env` themselves. They rely on Node built-ins `node:sqlite` and TS type-stripping (`migrate-auth.mjs` imports `lib/auth.ts` directly), so a recent Node (22.6+) is required. Env vars are documented in `.env.example`.

## Architecture

**Single-page app shell.** `app/page.tsx` is a force-dynamic server component that resolves the Better Auth session and root status, then renders the client component `components/buddy-line-app.tsx`. Everything else (catalog/arcade view, modals, chat widget, mobile bottom nav) is client-side state inside that shell — there are no other page routes. The only API routes are `app/api/auth/[...all]` (Better Auth) and `app/api/uploadthing` (thumbnail + avatar uploads).

**Server Actions are the data API.** Client components call `'use server'` functions in `app/*-actions.ts` (`game-actions`, `chat-actions`, `user-actions`, `admin-actions`). Actions check the session via `auth.api.getSession({ headers: await headers() })` and delegate to `lib/*-db.ts`. Server action body limit is raised to 10mb in `next.config.ts` because game source is sent inline.

**Dual database backend.** `lib/auth.ts` exports `dbInstance`: a `pg` `Pool` when `DATABASE_URL` is set (Neon Postgres), otherwise a `node:sqlite` `DatabaseSync` on `buddy_line.sqlite` (or `:memory:` on Vercel). `migrationDbInstance` uses `DATABASE_URL_UNPOOLED` for DDL. Every query in `lib/games-db.ts` and `lib/chat-db.ts` branches on `dbInstance instanceof Pool` vs `DatabaseSync` with separate SQL for each (`$1` vs `?` placeholders, different DDL) — **any schema or query change must be made in both branches.**

**Lazy self-migration, no migration files.** Tables are created on first use: `ensureGamesTable()` / `ensureChatTables()` run `CREATE TABLE IF NOT EXISTS` plus ad-hoc `ALTER TABLE` column additions and are awaited at the top of each db function; `ensureGamesTable` also seeds `DEMO_GAMES` into an empty table. Better Auth tables are migrated via `ensureAuthMigrations()` (called from the auth route and admin actions). Add new columns the same way (check-then-ALTER, per backend).

**Auth & roles.** Better Auth with email/password plus the `username` and `admin` plugins. Roles: `user`, `admin`, and the root superuser. `isRootUser()` (in `lib/auth.ts`) decides root status from `role === 'root'`, the `ROOT_USER` / `ROOT_ADMIN_EMAILS` env vars, or hardcoded root identifiers; only root may promote/demote admins. Client-side auth uses `lib/auth-client.ts` and `components/auth-provider.tsx`.

**Game playback pipeline.** Games are stored as separate `html_content` / `css_content` / `js_content` columns. `lib/game-bundler.ts` `bundleGameSource()` merges them into one document, wraps fragments, injects a mobile viewport, and injects a postMessage bridge that turns messages from the parent into synthetic keyboard events. `components/game-player-modal.tsx` renders it in an iframe with `sandbox="allow-scripts allow-modals allow-pointer-lock"` (no `allow-same-origin`) and `components/virtual-gamepad.tsx` sends touch input through that bridge. The uploader modal previews games with the same sandbox.

**Chat is polling-based.** Friends/requests/private messages live in `lib/chat-db.ts`. `buddy-line-app.tsx` polls `getChatNotificationSummaryAction` every 10s for badge counts, and `components/chat/bottom-chat-widget.tsx` polls the open conversation every 3s; there is no websocket/realtime layer.

**Avatars** are either a preset emoji/text or an UploadThing image URL; validation helpers are in `lib/avatars.ts`, rendering in `components/user-avatar.tsx`.

## Styling

"Gallery" dark theme: neutral surfaces, hairline borders, typographic game covers, teal `#2dd4bf` for primary actions only. Read `docs/STYLING.md` before UI work. Tokens live in `app/globals.css` (Tailwind v4 `@theme`) and `lib/tokens.ts`; game covers come from `components/game-cover.tsx`; shadcn-style primitives are in `components/ui`. Use `cn()` from `lib/utils.ts` for class merging. The app is mobile-responsive (100dvh layout, bottom nav, bottom-sheet chat, 16px+ input font sizes to avoid iOS zoom) — keep new UI working at phone widths.

## Neon

The DB is Neon Postgres; `neon.ts` sets branch policy (non-default branches auto-expire after 7 days). Neon agent skills are vendored in `.agents/skills/`.
