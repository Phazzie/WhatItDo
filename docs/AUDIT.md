# WhatItDo — Code Audit (2026-07-05)

Baseline verification: `tsc --noEmit` passes, `next lint` passes, `next build` succeeds.
All findings below are runtime/logic/security issues, not compile errors.

## Critical

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| C1 | **Lost votes under concurrency** | `src/app/api/vote/route.ts:25-42` | Vote submission does read → mutate → `SET` of the entire poll JSON. Two voters submitting at the same time: the second `SET` overwrites the first response. Fix: store responses in a separate Redis list (`RPUSH poll:{id}:responses`) and merge on read, so writes are append-only and atomic. |
| C2 | **HTML injection into notification email** | `src/app/api/vote/route.ts:58-101` | `voterName`, `poll.title`, `comment`, and `counterProposal` are attacker-controlled strings interpolated directly into the email HTML with no escaping. A voter can inject arbitrary markup/links into the creator's inbox. Fix: HTML-escape every interpolated value. |
| C3 | **No server-side input validation** | both API routes | `POST /api/poll`: `suggestions` is not checked to be an array of strings; no length caps (client caps of 100/200 chars and 3 suggestions are trivially bypassed) → storage abuse. `POST /api/vote`: `votes` shape is never validated — a non-string `vote` makes `v.vote.toUpperCase()` throw (500), arbitrary payloads are persisted and later rendered; `voterName` length is unbounded. Malformed JSON bodies return 500 instead of 400. |
| C4 | **Hardcoded personal email committed to the repo** | `src/app/api/poll/route.ts:21` | `creatorEmail` is hardcoded to a personal email address (PII in git history) instead of reading `POLL_CREATOR_EMAIL` — which the README documents but `.env.example` omits. |
| C5 | **Email spam vector / no rate limiting** | `src/app/api/vote/route.ts` | Every vote sends an email; anyone with the vote link can flood the creator's inbox in a tight loop. Poll creation is similarly unmetered. Fix: `@upstash/ratelimit` on both POST routes. |

## High

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| H1 | **`resultsUrl` can be `"undefined/results/…"`** | `vote/route.ts:69` | `NEXT_PUBLIC_BASE_URL \|\| request.headers.get('origin')` — if the env is unset and the `origin` header is absent (server-to-server / some clients), the link in the email is broken. Fix: fall back to `request.nextUrl.origin`, which is always available on a `NextRequest`. |
| H2 | **No TTL on Redis keys** | `poll/route.ts:27` | Polls persist forever; a free Upstash instance eventually fills. Add an expiry (e.g. 30 days, refreshed on vote) — applied to both the poll key and the responses key introduced by the C1 fix, so neither leaks. |
| H3 | **Votes not cross-checked against the poll** | `vote/route.ts` | The submitted `votes[].text` is trusted; a forged payload can record votes for suggestions that don't exist in the poll, and `yolo` votes are accepted for `normal`-mode polls. |
| H4 | **Zero tests / zero CI** | repo-wide | No test framework, no test files, no GitHub Actions. Nothing guards regressions. |
| H5 | **37 known dependency vulnerabilities** | `package-lock.json` | GitHub Dependabot reports 14 high, 19 moderate, 4 low on the default branch. Needs `npm audit` triage and dependency bumps (Next.js 14.2.x patch releases likely cover most of the high ones). |

## Medium

| # | Issue | Location |
|---|-------|----------|
| M1 | `from: 'What It Do <notifications@resend.dev>'` hardcoded — resend.dev only delivers to the account owner's address; should be `EMAIL_FROM` env. | `vote/route.ts:76` |
| M2 | `getVoteEmoji` / `getVoteColor` duplicated in 3 files — extract to `src/lib/voteDisplay.ts`. | `vote/[id]/page.tsx`, `results/[id]/page.tsx`, `api/vote/route.ts` |
| M3 | Voter-name input has no `maxLength` while every other input is capped. | `vote/[id]/page.tsx:228` |
| M4 | Results auto-refresh keeps polling every 30s while the tab is hidden — gate on `document.visibilityState`. | `results/[id]/page.tsx:28-32` |
| M5 | README drift: API response shapes (`POST /api/poll` returns `{id, poll}` not `{id}`), `submittedAt`/`createdAt` documented as `string` but are `number`, `POLL_CREATOR_EMAIL` documented but unused, `Response` vs actual `PollResponse` type name. | `README.md` |
| M6 | Missing `POLL_CREATOR_EMAIL` and `EMAIL_FROM`. | `.env.example` |

## Low

- `document.execCommand('copy')` fallback is deprecated (`page.tsx:85`).
- `alert()` used for validation errors on create/vote pages — inline error state is friendlier.
- `redis.ts` uses non-null assertions on env vars; missing config surfaces as noisy runtime warnings (visible in the build log) instead of a clear error.
- Duplicate-voting is unlimited by design — acceptable for the product, but worth a note in the README.
