# What It Do?

What It Do is a small, privacy-minded group polling app for ordinary plans and delightfully
questionable decisions. Create a poll, share the public ballot, and keep a separate private owner
link for results. No account is required.

## What it does

- **Classic mode:** `yes`, `maybe`, or `no` for each possibility.
- **Dubious mode:** adds the sincere-but-reckless `yolo` choice.
- Creates one public voting link and one independent private results link.
- Accepts names, per-option notes, and an optional counterproposal.
- Shows exact counts, proportional percentages, ties, and individual ballots without fake rankings.
- Keeps up to ten recent private links in the creator's browser, with a clear-history control.
- Optionally sends an escaped, link-free ballot notification through Resend on a best-effort basis.

The interface is an original midnight-zine collage: tactile paper, loud ink, playful copy, visible
focus, reduced-motion support, mobile-safe controls, and no essential information in the artwork.

## Privacy and lifecycle

The voting response is deliberately minimal: it contains only `title`, `mode`, and `suggestions`.
Names, comments, counterproposals, timestamps, results credentials, and aggregate results are never
returned from the public endpoint.

Each new poll receives a random 24-character results token. The browser places the raw token after
the `#` in `/results/{pollId}#{token}`, so it is not sent in the page request, path, query string, or
referrer. Redis stores only its SHA-256 hash. The results client reads the fragment and POSTs the
token to a private, no-store endpoint. Anyone holding the full owner link can read the results, so
keep it private and save it when the poll is created.

Poll data has a 30-day idle TTL, refreshed by successful votes, and an absolute 90-day lifetime.
Each poll accepts at most 250 responses. Polls created before private tokens were introduced return
HTTP 410 and no longer accept votes; this avoids exposing old responses or collecting owner-inaccessible
new ones.

## Requirements

- Node.js `^20.19.0`, `^22.13.0`, or `>=24.0.0` (CI uses Node 22)
- npm
- An external Redis database for normal runtime use, configured through either `REDIS_URL` or the
  Upstash REST variables
- Optional: a Resend API key and notification address

## Local setup

```bash
git clone https://github.com/Phazzie/whatitdo.git
cd whatitdo
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Normal development requests use the configured external Redis
provider; the in-memory implementation is intentionally restricted to unit tests and explicit
loopback E2E runs.

### Environment variables

```dotenv
# Option A: standard Redis, including the official Vercel Redis integration
REDIS_URL=rediss://default:replace_me@redis.example.com:6379

# Option B: Upstash REST (used only when REDIS_URL is empty)
# UPSTASH_REDIS_REST_URL=https://example.upstash.io
# UPSTASH_REDIS_REST_TOKEN=replace_me

# Optional vote-email notification
RESEND_API_KEY=re_replace_me
POLL_CREATOR_EMAIL=notifications@example.com
EMAIL_FROM=What It Do <notifications@example.com>

# Only for a self-hosted production deployment behind a trusted proxy.
# Vercel uses its own trusted request headers automatically.
TRUST_PROXY=1
```

`REDIS_URL` takes precedence when both provider configurations exist. The protocol connection is
opened lazily on the first storage command, reused within a warm server process, and bounded so a
dead provider fails the request instead of enabling process-local production storage. The official
Redis Cloud free plan has no disk persistence or high availability; choose a persistent provider
plan for Production so recorded votes and the documented 30/90-day retention contract survive a
provider restart. A non-persistent free database is suitable only for empty Preview verification.

`POLL_CREATOR_EMAIL` is one deployment-owned notification address; the app does not collect or store
creator email addresses per poll. Alerts include the normalized poll title, voter name, choices,
notes, and counterproposal, with every user-controlled HTML value escaped. They never include the
private results link, results credential, notification address, or internal poll, response, or
submission IDs. The provider wait is capped at five seconds. If the Resend key, destination address,
or verified sender is absent, voting still succeeds and the UI says email is not configured;
provider failures likewise never undo a recorded vote or claim that mail was sent.

Do not set `E2E_TEST`, `E2E_BASE_URL`, or `USE_IN_MEMORY_REDIS` in a deployed environment. In-memory
storage is available only when `NODE_ENV=test`, or when the dedicated E2E marker uses a loopback URL
and no recognized deployment marker exists.

## Commands

```bash
npm run lint              # ESLint flat config
npm run typecheck         # strict TypeScript check
npm test                  # Vitest unit and route tests
npm run test:coverage     # critical API/lib coverage gates
npm run test:integration  # Redis 7 Lua contract; skips without REDIS_URL
npm run build             # production Next.js build
npm run e2e               # build + Chromium Playwright flows and axe scans
npm run check             # lint, typecheck, unit tests, and build
npm audit --audit-level=high
```

Coverage gates for API routes and critical library code are 85% for lines, functions, and statements,
and 80% for branches. CI also runs the atomic Lua contract against Redis 7 and exercises desktop,
mobile, privacy, Classic, Dubious, duplicate-retry, and accessibility browser flows.

## API contract

### `POST /api/poll`

Request:

```json
{ "title": "Friday?", "suggestions": ["Dumplings", "Stargazing"], "mode": "normal" }
```

Response:

```json
{
  "id": "10-char-id",
  "resultsToken": "24-character-secret",
  "poll": { "title": "Friday?", "suggestions": ["Dumplings", "Stargazing"], "mode": "normal" }
}
```

### `GET /api/poll?id={pollId}`

Returns exactly:

```json
{ "poll": { "title": "Friday?", "suggestions": ["Dumplings", "Stargazing"], "mode": "normal" } }
```

### `POST /api/vote`

```json
{
  "pollId": "10-char-id",
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "voterName": "Erin",
  "votes": [
    { "text": "Dumplings", "vote": "yes", "comment": "Obviously" },
    { "text": "Stargazing", "vote": "maybe", "comment": "Cloud check first" }
  ],
  "counterProposal": "Both"
}
```

The UUIDv4 submission ID stays stable across a browser retry. Repeating that ID with the same
normalized ballot is a successful duplicate; reusing it with a changed ballot returns HTTP 409 and
does not mutate storage or send another email. The response is
`{ "success": true, "notification": "sent" | "not_configured" | "failed" | "duplicate" }`.
A duplicate means only that the vote was already recorded; it makes no claim about an earlier email.

### `POST /api/results`

```json
{ "pollId": "10-char-id", "resultsToken": "24-character-secret" }
```

An authorized response contains public poll fields, `createdAt`, `expiresAt`, and bounded responses.
It never contains a poll ID, response ID, token/hash, or email address. Responses set
`Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow`.
All pages also deny framing with both CSP `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

All mutation endpoints require `Content-Type: application/json`; JSON request bodies are capped at
16 KiB. Production applies poll-creation and vote rate limits
using trusted client identity; unique votes are limited to 20/hour/IP and 100/hour/poll.

## Storage model

```text
poll:{id}                    stored poll metadata and results-token hash
poll:{id}:responses          append-only, bounded response list
poll:{id}:submissions        submission UUID -> response ID + normalized-ballot digest receipt
ratelimit:poll:{ip}          poll-creation fixed window
ratelimit:vote:ip:{ip}       vote fixed window by client
ratelimit:vote:poll:{id}     vote fixed window by poll
```

A single Redis Lua operation checks poll existence and expiry, resolves matching digest receipts
before capacity or rate limits, rejects changed or legacy receipts before mutation, enforces both
vote buckets and the lifetime cap, appends the response, records the submission receipt, and
refreshes all poll-owned TTLs. Resend receives that same submission UUID as its provider idempotency
key. Missing durable Redis configuration fails clearly on a request rather than during a Next.js
build.

## Project map

```text
src/app/api/poll/route.ts       create and public read
src/app/api/vote/route.ts       validate, atomically append, optionally notify
src/app/api/results/route.ts    authorized private results read
src/app/page.tsx                create/share and recent private links
src/app/vote/[id]/page.tsx      public ballot
src/app/results/[id]/page.tsx   fragment-token owner results
src/lib/redis.ts                storage selection, Lua, limits, trusted IP
src/lib/validation.ts           normalized bounded request contracts
e2e/poll-flows.spec.ts          privacy, product, mobile, and axe flows
```

Repository-specific agent guardrails are in `AGENTS.md`; the active completion record is
`docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md`. Transitive dependency license notes are documented in
`docs/THIRD_PARTY_LICENSES.md`.
