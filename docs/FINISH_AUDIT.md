# WhatItDo Finish Audit

Date: 2026-07-16

Baseline: PR #4 head `02f73ef` on `claude/repo-audit-completion-plan-uau7sr`. The branch is 16 commits
ahead of the repository default branch. Its GitHub unit/build and E2E checks pass; Vercel fails before
application build initialization with `sts_credentials_fetch_failed`.

The earlier `docs/AUDIT.md` drove a useful hardening pass, but it is not a complete production audit.
This document records the remaining finish scope.

## Release blockers

| ID | Finding | Evidence | Required outcome |
|---|---|---|---|
| F1 | Voting and results share one identifier, so any voter can fetch every name, comment, counterproposal, and timestamp. The vote page also downloads responses it never uses. | `src/app/page.tsx`, `src/app/api/poll/route.ts`, `src/app/vote/[id]/page.tsx` | Generate an independent 24-character results token. Public poll reads return exactly title, mode, and suggestions. The private token stays in a URL fragment, is stored only as a hash, and is submitted in a no-store POST body. |
| F2 | The locked Next.js 14 line has five audited vulnerable packages (four high, one moderate), including direct framework advisories. | `package-lock.json`; `npm audit --package-lock-only` on 2026-07-16 | Upgrade to current stable Next.js 16.2.x, React 19.2.x, ESLint 9, and matching types/config. High/critical audit count is zero. |
| F3 | Legacy polls have no results credential. Continuing to accept votes would create responses their owners can never retrieve, while public compatibility would restore the privacy flaw. | Existing poll records without `resultsTokenHash` | Return `410 legacy_poll_unavailable` from public reads and vote writes, append nothing, send no email, and explain the retirement state in the UI/docs. |
| F4 | Response append and three TTL updates are separate commands. Expiry or partial failure can create an orphaned or immortal list. | `src/app/api/vote/route.ts` | One Redis Lua operation verifies poll existence, deduplicates a submission, enforces the response cap, appends, and refreshes all TTLs. Run the script against Redis 7 in CI. |

## High-priority correctness and trust

| ID | Finding | Required outcome |
|---|---|---|
| F5 | A network timeout after persistence invites a retry that duplicates the response and email. | Client sends a stable UUID submission ID. The atomic operation checks duplicates before rate capacity; Resend receives the same idempotency key. Duplicate API responses use `notification: duplicate`, making no claim about the prior email outcome. |
| F6 | Notification promises are unconditional although configuration may be absent and delivery errors are swallowed. | Creation and submission UI state the recorded result first; mention email only when the API reports it sent. Resend result errors produce `notification: failed`, not a false promise. |
| F7 | Results refresh treats every transient failure as a permanent 404 and never clears the error. | Preserve stale results, distinguish not-found from refresh failure, provide retry/manual refresh, and clear recoverable errors after success. |
| F8 | Results choose an arbitrary winner on ties, exaggerate small values with a 15% minimum bar, and award medals by submission order. | Show ties honestly, draw proportional bars, and use neutral response markers. Unit-test counts and tie behavior. |
| F9 | Redis initializes at module scope and imports a test module into production. The in-memory guard protects only Vercel. | Lazy initialization, production-owned in-memory adapter, explicit E2E flag, and a fail-closed guard on every production host. Missing credentials produce a clear runtime configuration error. |
| F10 | Vote JSON `null` throws before validation; poll IDs have no exact length bound; accepted strings are not consistently normalized. | Stream-read at most 16 KiB, parse unknown input, validate the numeric matrix below, normalize canonical text server-side, and return stable 400/404/410/413 errors. |
| F11 | Rate limiting is opt-in, trusts a single forwarded header, skips clients without it, and has no per-poll abuse boundary. | Always on in production; trust Vercel-owned headers or an explicitly configured proxy; fail closed without identity; enforce 20 new votes/hour/IP, 100/hour/poll, and 250 lifetime responses in the atomic operation with `Retry-After`. |
| F12 | Raw bearer credentials in a path/query/email can leak through logs, referrers, crawlers, prefetch, or caches. | Keep the raw token in the URL fragment and creator local storage only; POST it to `/api/results`; store a SHA-256 hash; require dynamic private/no-store responses, no-referrer, noindex/nofollow, and no prefetch. Notification email contains no results URL. |

## Product, accessibility, and visual finish

| ID | Finding | Required outcome |
|---|---|---|
| F13 | The results URL is transient and easy for the creator to lose. | Display it as a saveable owner link with a dedicated copy action and clear "keep private" language. Persist at most ten unexpired creator links locally, provide a clear-history control, and recover them after reload. |
| F14 | Mode controls lack pressed/group semantics; the first option alone appears required; a primary error is not live-announced. | Correct ARIA state/grouping, label the collection requirement accurately, and make all blocking errors live regions. |
| F15 | Infinite animation has no reduced-motion path; long strings and narrow vote grids have no mobile stress coverage. | Add reduced-motion CSS, wrapping/min-width rules, touch-safe 375 px layouts, mobile E2E, and automated accessibility checks. |
| F16 | The current interface is a generic glass/neon treatment and references a missing `/bg.png`. The two Erin repositories contain no raster background in current or historical Git objects. | Create an original project-owned background and a bold midnight-scrapbook redesign using hot pink, cyan, acid lime, paper texture, off-kilter layers, and playful copy without sacrificing contrast or focus. |
| F17 | Global error and 404 experiences are framework defaults. | Add designed `error.tsx` and `not-found.tsx` pages consistent with the new visual system. |

## Repository and release hygiene

| ID | Finding | Required outcome |
|---|---|---|
| F18 | README still claims Node 18, calls live response-list storage future work, says `EMAIL_FROM` is not wired, and mixes Adventurous/BOLD with Dubious/YOLO. | Rewrite setup, architecture, terminology, storage, notification, privacy, scripts, and environment documentation against the final code. |
| F19 | PR #4 has 28 unresolved review threads: 19 already-fixed/obsolete, three evidence-backed false positives, four license-identification items, and current docs/config findings. | Fix remaining code/docs, record dependency license metadata, reply with evidence, and resolve all 28 threads. |
| F20 | GitHub Actions use mutable `@v4` tags despite a review requesting immutable pins. | Pin every third-party action to a full commit SHA with a version comment. Add Redis integration and accessibility/mobile gates. |
| F21 | Vercel cannot reach build initialization because of platform STS credentials. | Retry after the new head is pushed; inspect/repair project integration with Vercel tooling. If credentials remain account-owned, record exact evidence and leave no app failure disguised as a platform failure. |

## Explicit deferrals

- User accounts, editable polls, custom creator email collection, and cryptographic authentication are
  outside this MVP. The independent results token is the authorization capability.
- Results pagination is deferred because the atomic 250-response lifetime cap and numeric field limits
  bound payload size.
- Guaranteed email delivery, queues, and an outbox are deferred. Email remains observable best-effort;
  the private results link is the reliable channel.
- Existing tokenless polls return 410 for both reads and new votes. Their data is not mutated and is
  not made public for compatibility. Privacy wins over preserving derivable legacy results links.

## Validation matrix

| Input | Limit / rule |
|---|---|
| Request body | 16,384 UTF-8 bytes maximum, including chunked bodies |
| Poll ID | exactly 10 Nano ID alphabet characters |
| Results token | exactly 24 Nano ID alphabet characters; only its SHA-256 hash is stored |
| Submission ID | canonical UUID v4 string, 36 characters |
| Title | optional string, trim then default, 100 raw characters maximum |
| Suggestions | array of 1-3 strings, each 200 raw characters maximum and non-empty after trim |
| Mode | exactly `normal` or `dubious` |
| Voter name | optional string, 50 raw characters maximum, trim then `Anonymous` |
| Votes | exactly one positional vote per stored suggestion; text must equal the normalized suggestion |
| Vote choice | `yes`, `no`, `maybe`; `yolo` only for Dubious mode |
| Comment | optional string, 200 raw characters maximum, trimmed before persistence |
| Counterproposal | optional string, 500 raw characters maximum, trimmed before persistence |
| Email rendering | strip CR/LF from headers and HTML-escape every user-controlled body insertion |
