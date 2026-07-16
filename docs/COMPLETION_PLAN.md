# WhatItDo — Completion Checklist (parallel sub-agent execution)

> **Historical record (completed July 2026).** This checklist describes the former Next.js 14
> implementation and deleted test scaffolding. Do not use it as current operating guidance. See
> [`FINISH_EXEC_PLAN.md`](./FINISH_EXEC_PLAN.md) and the repository-root [`AGENTS.md`](../AGENTS.md).

Companion to `docs/AUDIT.md` (finding IDs C1–C5, H1–H5, M1–M6 referenced below).
Each unchecked box is one dispatchable sub-agent task. Items in the same wave with disjoint
**Files** lists may run in parallel; items sharing a file must run in the listed order.

## Standard briefing (prepended to every sub-agent prompt)

Every sub-agent receives this block verbatim, plus its task-specific info:

- **Repo**: Next.js 14 (App Router) + TypeScript polling app; work from the repository root, already on the correct branch. (The orchestrator substitutes the absolute path for the current environment when dispatching.)
- **Context**: read `docs/AUDIT.md` and this file before editing anything.
- **File ownership**: touch ONLY the files listed in your task. If the fix seems to require another file, stop and report instead of editing it.
- **No git**: never run `git commit`/`push`/`checkout`. The orchestrator reviews your diff and commits.
- **Red-green protocol** (any task with a `Red:` line): write the failing test first, run it, confirm it fails *for the expected reason*, then implement the minimal fix, confirm green.
- **Verification before reporting done**: `npx tsc --noEmit`, `npm run lint`, `npm test` (once the harness exists), `npm run build`. Build-time warnings about missing Upstash url/token are pre-existing and expected.
- **Report format**: (1) list of changed files, (2) red output + green output for each red-green item, (3) verification results, (4) anything you noticed but did not touch because it was outside your ownership.

---

## Wave 1 — Foundation

- [x] **1.1 Env template (M6)** — done, commit `e69e4e4`
  **Files**: `.env.example`
  **Special info**: add `POLL_CREATOR_EMAIL`, `EMAIL_FROM` with comments matching existing style.
- [x] **1.2 README accuracy (M5)** — done, commit `e69e4e4`
  **Files**: `README.md`
  **Special info**: verify every claim against `src/` before writing; fix `{id, poll}` response shape, `number` timestamps, `PollResponse` name; add duplicate-voting note, env vars, Redis layout note (planned layout in future tense — TTL/split don't exist until Wave 2).
- [x] **1.3 Dependency triage (H5)** — done: 14 vulns (7 high) → 5; all remaining require a Next 15/16 major upgrade (see Follow-ups)
  **Files**: `package.json`, `package-lock.json` (runtime dependency versions only — no scripts, no new packages)
  **Special info**: `npm audit` before/after; `npm audit fix` without `--force`; bump `next`/`eslint-config-next` to latest 14.2.x; NO breaking majors (report Next 15-only fixes as follow-ups); verify tsc + lint + build.
- [x] **1.4 Test harness** — done: Vitest 4, mockRedis with TTL inspection, 3-test smoke incl. route-handler pattern
  **Files**: `package.json` + `package-lock.json` (devDependencies + scripts only), `vitest.config.ts` (new), `src/test/mockRedis.ts` (new), `src/test/smoke.test.ts` (new)
  **Special info**: add `vitest`, `@testing-library/react`, `jsdom`; scripts `test`, `test:watch`, `typecheck`; mock must support `get/set/rpush/lrange/expire` and be importable by later waves; smoke test = one trivial assertion + one route-handler call to `GET /api/poll` with the mock proving route handlers are testable.
- [x] **1.5 CI workflow** — done: lint → typecheck → test → build on push/PR, Node 20
  **Files**: `.github/workflows/ci.yml` (new)
  **Special info**: install → lint → typecheck → test → build on push + PR; Node 20; can run in parallel with 1.4 but merges after it (CI needs the `test` script to exist to pass).

**Wave gate**: MET — CI run green on branch + PR #4 (2026-07-05).

## Wave 2 — Fixes *(COMPLETE)*

Backend items 2.1–2.6 share `src/app/api/*` and run sequentially inside one backend agent
(or as separate agents in the listed order). Frontend items 2.7–2.10 are parallel to the backend track.

- [x] **2.1 Input validation (C3 + H3)** — done
  **Files**: `src/lib/validation.ts` (new), `src/lib/validation.test.ts` (new), `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`
  **Special info**: poll: suggestions = 1–3 non-empty strings ≤200 chars, title ≤100; vote: votes must match the poll's suggestions exactly, vote value ∈ mode's allowed set (`yolo` only in `dubious`), voterName ≤50, comment ≤200, counterProposal ≤500; malformed JSON → 400 not 500.
  **Red**: POST a vote with a non-string `vote` value → currently 500 via `toUpperCase()`; POST 50 suggestions → currently accepted.
- [x] **2.2 Concurrency-safe responses (C1)** — done
  **Files**: `src/app/api/vote/route.ts`, `src/app/api/poll/route.ts`, their test files
  **Special info**: `RPUSH poll:{id}:responses`, `GET /api/poll` merges the list into the returned poll object; poll object no longer stores responses.
  **Red**: two interleaved vote submissions against the mock → one response lost under current read-modify-write.
- [x] **2.3 Email HTML escaping (C2)** — done
  **Files**: `src/lib/escapeHtml.ts` (new), `src/lib/escapeHtml.test.ts` (new), `src/app/api/vote/route.ts`
  **Special info**: escape voterName, poll.title, vote text, comments, counterProposal; mock Resend and assert on the html payload.
  **Red**: voterName `<img src=x onerror=alert(1)>` appears unescaped in the email html.
- [x] **2.4 Env-driven emails + URL fallback (C4, M1, H1)** — done
  **Files**: `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`, their test files
  **Special info**: `creatorEmail` from `POLL_CREATOR_EMAIL` (skip email + server log when unset; remove hardcoded address); `from:` from `EMAIL_FROM` with current value as fallback; `resultsUrl` = `NEXT_PUBLIC_BASE_URL` else `request.nextUrl.origin`.
  **Red**: with `NEXT_PUBLIC_BASE_URL` unset and no origin header, email contains `undefined/results/…`.
- [x] **2.5 TTL + rate limiting (H2, C5)** — done (hand-rolled sliding-window limiter; see decision table)
  **Files**: `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`, `package.json` + `package-lock.json` (add `@upstash/ratelimit`), their test files
  **Special info**: `EX` 30 days on BOTH `poll:{id}` and `poll:{id}:responses`, refreshed on vote; sliding window 10 polls/hr + 20 votes/hr per IP, env-gated off in dev/test.
  **Red**: keys created with no TTL (assert via mock `expire` tracking); 25 rapid votes all succeed.
- [x] **2.6 Test-only Redis switch + backend voteDisplay import (enables Wave 3; M2 backend half)** — done
  **Files**: `src/lib/redis.ts`, `src/app/api/vote/route.ts`
  **Special info**: `USE_MOCK_REDIS=1` → in-memory implementation reusing `src/test/mockRedis.ts`; also swap the route's local `getVoteEmoji` for the `src/lib/voteDisplay` import once 2.7 has landed (coordinate: 2.7 merges first, else keep local copy and flag).
- [x] **2.7 Shared vote-display lib (M2)** — done, commit `5b46957`
  **Files**: `src/lib/voteDisplay.ts` (new), `src/lib/voteDisplay.test.ts` (new), `src/app/vote/[id]/page.tsx`, `src/app/results/[id]/page.tsx`
  **Special info**: extract `getVoteEmoji`/`getVoteColor`/`getVoteBgColor` exactly as-is; unit-test the pure functions (red first: tests import the not-yet-existing module).
- [x] **2.8 Voter-name cap (M3)** — done, commit `5b46957`
  **Files**: `src/app/vote/[id]/page.tsx`
  **Special info**: `maxLength={50}` — MUST equal the server cap in 2.1 (contract: 50).
- [x] **2.9 Visibility-aware refresh (M4)** — done, commit `5b46957`
  **Files**: `src/app/results/[id]/page.tsx`
  **Special info**: pause the 30s interval when `document.visibilityState === 'hidden'`; refetch immediately on visible.
- [x] **2.10 Inline errors + clipboard cleanup (Low findings)** — done, commit `5b46957`
  **Files**: `src/app/page.tsx`, `src/app/vote/[id]/page.tsx`
  **Special info**: replace `alert()` with inline error banners; drop deprecated `execCommand` fallback in favor of `navigator.clipboard` + visible error on failure.

**Wave gate**: MET — 44 tests, tsc, lint, build all green (2026-07-05).
**Cross-wave contract**: voterName cap = 50; allowed votes = `yes`/`no`/`maybe` (+`yolo` in dubious); keys = `poll:{id}` + `poll:{id}:responses`.

## Wave 3 — Verification

- [x] **3.1 E2E smoke** — done: 2 Playwright specs (both modes, YOLO + counter proposal), CI e2e job; webServer uses `next build && next start` because dev-mode on-demand compilation resets the in-process mock-Redis singleton mid-run
  **Files**: `e2e/` (new), `playwright.config.ts` (new), `package.json` + `package-lock.json` (add `@playwright/test`, `e2e` script), `.github/workflows/ci.yml` (e2e job)
  **Special info**: run `next dev` with `USE_MOCK_REDIS=1`; one happy-path spec per mode: create → vote (incl. YOLO in dubious) → results show counts + counter proposal; CI installs via `npx playwright install --with-deps chromium`; the agent's own environment has Chromium pre-installed at `/opt/pw-browsers` — do not re-download.
- [x] **3.2 Orchestrator self-review** — done: `/code-review` (high) + `/security-review` run against the full branch diff.
  **`/code-review` (8 findings, all fixed)**:
  1. `GET /api/poll?id=<id>:responses` collided with the `poll:{id}:responses` list key → Redis WRONGTYPE → 500. Fixed with `isValidPollId` guard on both `poll` and `vote` routes.
  2. Notification email *subject* line wasn't escaped like the body (CR/LF header-injection risk). Fixed with `sanitizeHeaderValue` in `escapeHtml.ts`.
  3. Rate-limit sliding-window list grew unbounded under sustained traffic. Fixed with `LTRIM` capping in `checkRateLimit`.
  4. Clients without `x-forwarded-for` shared one rate-limit bucket, letting one pool innocent users into the same quota. `getClientIp` now returns `null` and callers skip limiting instead of pooling into `'unknown'`.
  5. UI unconditionally promises an email notification that silently no-ops (console.log only) if `POLL_CREATOR_EMAIL` is unset. **Waived** — covered operationally by the 4.2 owner checklist below.
  6. `maxLength={50}` hardcoded instead of importing `VOTER_NAME_MAX`; fixed, plus the two sibling `COMMENT_MAX`/`COUNTER_PROPOSAL_MAX` caps for consistency.
  7. `USE_MOCK_REDIS=1` had no production guardrail. Now throws if set alongside `VERCEL=1` (not `NODE_ENV`, so the e2e/CI `next build && next start` flow is unaffected).
  8. `RATE_LIMIT_ENABLED` wasn't documented in `.env.example`; added. **Waived**: the identical rate-limit gate in both routes (2 call sites, a few lines each) is left duplicated rather than extracted into shared middleware — for 2 sites, the abstraction is more debt than the duplication.
  8 regression tests added (`isValidPollId` collision on both routes, subject sanitization, rate-limit list capping, `getClientIp` null fallback).
  **`/security-review`**: one candidate (unescaped `resultsUrl` in the email `href`) was raised and filtered out at confidence 2/10 — it requires an untrusted Host header reaching the app, which the documented Vercel deploy target normalizes away; worst case is a swapped link, not attribute-breakout XSS. No findings met the report threshold.
  Full suite green after fixes: tsc, lint, 56 unit tests, `next build`, both e2e specs.

**Wave gate**: MET — lint + typecheck + test + e2e + build all green (2026-07-10).

## Wave 4 — Ship (orchestrator)

- [x] **4.1** Push branch, open PR with a per-finding fixed/waived table mapped to `docs/AUDIT.md` — done: PR #4 body updated (2026-07-10).
- [ ] **4.2** Owner manual checklist (humans only): set `POLL_CREATOR_EMAIL`, `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL` in Vercel; send a test vote to verify Resend delivery; note old-format polls will show zero responses after 2.2 (acceptable — or request a migration).

## Follow-ups (out of scope for this pass)

- Coordinated Next.js 15/16 migration: the 5 remaining `npm audit` findings (Next.js advisory batch, its vendored `postcss`, and `glob` via `eslint-config-next`) are only patched in Next 15/16. Breaking upgrade — needs its own plan.

## Owner decisions (defaults in effect unless overridden)

| Decision | Default |
|---|---|
| Poll TTL | 30 days |
| Rate limits | 10 polls/hr, 20 votes/hr per IP |
| Rate-limit dependency | hand-rolled sliding-window log in `src/lib/redis.ts` — `@upstash/ratelimit` is Lua-script (`eval`) based, untestable against the shared mock; swap in the package later if the mock grows `eval` support |
| Test framework | Vitest |
| Old-format polls | not migrated |
