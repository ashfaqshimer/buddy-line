# ADR 0001: Authentication & Session Management

- **Status:** Accepted
- **Date:** 2026-06-04
- **Deciders:** Shimer
- **Related:** SPEC.md §2.1, §3.2, §10, §16, §17, §28

> This is the first ADR in the repository and establishes the convention:
> records live in `docs/adr/` named `NNNN-short-title.md`, numbered sequentially,
> and follow the structure below (Context → Decision → Consequences → Alternatives).

---

## Context

BuddyLine is a realtime chat application built as a modular monolith with planned
extraction into independent services later (SPEC §28 names an `auth-service` as a
future candidate). Authentication is Phase 1 of the MVP (SPEC §29) and sits in front
of every other feature, so its design constrains the API, the websocket layer, and
the web client.

The security goals are set by SPEC §3.2 and §16: OWASP-aligned practices, JWT
expiration handling, refresh-token rotation, CSRF protection, rate limiting, secure
password hashing, and secure cookies.

Some mechanics are already fixed by the SPEC and by existing scaffolding, and are
treated here as established context rather than open questions:

- **Access token:** JWT, short-lived (`JWT_ACCESS_EXPIRES_IN=15m`), stored in memory
  on the client (SPEC §10.2).
- **Refresh token:** long-lived (`JWT_REFRESH_EXPIRES_IN=7d`), delivered as an
  HttpOnly cookie, stored **hashed** server-side. The `refresh_tokens` table already
  exists in `apps/api/prisma/schema.prisma` with `tokenHash`, `expiresAt`, `createdAt`,
  and `revokedAt` columns and a `userId` index.
- **Passwords:** bcrypt hashing (cost factor 12) with minimum-complexity validation
  (SPEC §16.2). `User.passwordHash` already exists in the schema.
- **Brute-force protection:** login limited to 5 requests/min, IP-based, Redis-backed
  (SPEC §17).
- **Transport hardening:** Helmet, CORS restricted to `CLIENT_ORIGIN`, secure cookies
  (SPEC §16.1).
- **Signing secrets:** separate `JWT_SECRET` and `JWT_REFRESH_SECRET` already defined
  in `.env.example`.

This ADR records the decisions the SPEC left open: the rotation/replay strategy, the
session (multi-device) model, the CSRF approach, and the signing algorithm.

---

## Decision

### 1. Refresh-token rotation with reuse detection

Every successful use of a refresh token issues a **new** refresh token and marks the
presented one as revoked (`revokedAt` set). Each rotation is linked into a **family**
representing a single device-login.

If a refresh token that has **already been revoked** is presented again, we treat it as
a stolen/replayed token: we revoke **every non-revoked token in that family**, forcing
that device to re-authenticate. This is the OWASP-recommended automatic-reuse-detection
pattern and contains the blast radius of a leaked token to one device.

### 2. Multi-device sessions

A user may hold multiple concurrent refresh tokens — one family per device/login. This
fits a chat app used on phone and laptop simultaneously. Logout revokes only the current
device's token (and its family); other devices stay signed in. Reuse detection (above)
is scoped to a single family, so theft on one device does not log out the others.

### 3. CSRF: SameSite cookie + bearer access token

The refresh token cookie is `HttpOnly`, `Secure`, and `SameSite=Strict`, and is consumed
**only** by the `/api/v1/auth/refresh` and `/api/v1/auth/logout` endpoints. Every other
authenticated request carries the **in-memory access token** in the `Authorization:
Bearer <token>` header — never a cookie — so CSRF (which rides ambient cookies) cannot
forge those calls. Because the only cookie-bearing endpoints are protected by
`SameSite=Strict`, no separate CSRF token is required.

### 4. HS256 symmetric signing

Tokens are signed and verified with HMAC-SHA256 using the existing symmetric secrets
(`JWT_SECRET` for access tokens, `JWT_REFRESH_SECRET` for refresh tokens). In a monolith
the same service issues and verifies tokens, so symmetric signing is sufficient and
simplest. Using a distinct secret per token type means a leaked access secret cannot be
used to mint refresh tokens.

### Resulting flow (mirrors SPEC §10.1)

1. **Register / Login:** validate credentials; compare bcrypt hash.
2. **Issue:** generate an HS256 access token (15m) and a refresh token (7d). Store only
   the **hash** of the refresh token in `refresh_tokens`, tagged with a new family id.
3. **Respond:** access token returned in the JSON body (client holds it in memory);
   refresh token set as an HttpOnly/Secure/SameSite=Strict cookie.
4. **Authenticated requests:** access token sent via `Authorization` header; verified
   statelessly (no DB hit).
5. **Refresh:** client calls `/auth/refresh`; server hashes the cookie token, looks it
   up. If valid and not revoked → rotate (revoke old, issue new in same family). If found
   but already revoked → **reuse detected** → revoke the whole family, reject.
6. **Logout:** revoke the current refresh token (and its family); clear the cookie.

---

## Consequences

### Positive

- Access-token verification is **stateless** — no DB/Redis lookup on the hot path — which
  keeps the API horizontally scalable (SPEC §3.1).
- Storing only refresh-token **hashes** means a database leak does not expose usable
  tokens.
- Automatic reuse detection meaningfully limits the damage of a stolen refresh token, and
  family-scoped revocation keeps that response from logging a user out everywhere.
- Avoiding a separate CSRF token removes a class of moving parts while staying safe, given
  the bearer-token design.

### Costs / follow-up work (NOT done in this ADR)

- **Schema gap — token families.** Per-device reuse detection requires grouping a device's
  rotated tokens. The current `RefreshToken` model has no such field. A **`familyId`**
  (UUID, indexed) must be added to `apps/api/prisma/schema.prisma`, shared across all
  rotations of one device-login. Revocation logic: when a token whose row is already
  `revokedAt`-set is presented, revoke all rows with the same `familyId` and a null
  `revokedAt`.
- **Shared-types DTOs.** `packages/shared-types/src/index.ts` does not yet define the auth
  contract. Add `RegisterRequest`, `LoginRequest`, `AuthTokens` (access token + user), and
  `JwtPayload` so the API and web client share one source of truth.
- **Configurability (optional).** Consider adding `REFRESH_COOKIE_NAME` / cookie domain and
  `BCRYPT_COST` to the environment if these need to vary per deployment.
- Short access-token lifetime means clients must implement a refresh-on-401 flow; the web
  client's Axios/React Query layer needs an interceptor for this.
- HttpOnly refresh cookies require correct CORS `credentials` handling and a known
  `CLIENT_ORIGIN`; local dev across `localhost` ports must account for cookie attributes.

---

## Alternatives considered

- **No rotation / static long-lived refresh token.** Simplest, but a leaked token stays
  valid until expiry with no detection. Rejected — contradicts SPEC §10.2 ("Rotated on
  refresh") and the security goals.
- **Rotation without reuse detection.** Rotates tokens but ignores replays of old ones
  beyond rejecting them, so token theft goes unnoticed. Rejected as strictly weaker than
  reuse detection for little saved effort.
- **Single-session model.** One active refresh token per user; new logins evict the
  previous session. Simpler bookkeeping but logs users out of other devices — poor UX for a
  chat app. Rejected.
- **Double-submit CSRF token.** Standard when `SameSite` cannot be relied upon, but adds a
  token to issue, store, and validate. Unnecessary here because authenticated calls use a
  bearer header, not a cookie. Rejected for this design.
- **RS256 asymmetric signing.** Lets future extracted services verify tokens with a public
  key without holding the signing secret. Rejected **for now** (extra keypair management
  with no monolith benefit), but this is the **most likely point to revisit** when auth is
  pulled into its own service per SPEC §28 — at which point migrating access tokens to
  RS256 lets `realtime-service` and others verify independently.
