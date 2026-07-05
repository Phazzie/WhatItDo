# WhatItDo — Completion Plan (parallel sub-agent execution)

Companion to `docs/AUDIT.md` (finding IDs C1–C5, H1–H5, M1–M6 referenced below).

## Orchestration model

- **Orchestrator**: Opus (or the coordinating session). Spawns agents, merges waves, resolves conflicts, runs the final self-review and verification gate.
- **Sonnet 5**: anything touching API logic, the Redis data model, or test design.
- **Haiku**: docs, env files, mechanical frontend cleanups.
- Agents within a wave own **disjoint files** so they can run in parallel with no merge conflicts. A wave merges only when every agent in it is green.

## Exploration still needed (non-blocking)

The codebase (13 source files) has been fully read and the build verified — no further code exploration is required. Two small look-ups happen inside the waves that own them:

1. Agent A confirms current Vitest + `next` route-handler testing setup (mocking `@upstash/redis`).
2. Agent D confirms `@upstash/ratelimit` API before wiring rate limiting.

## Red-green discipline (applies to every code agent)

1. **Red**: write the failing test that reproduces the finding first; run it; confirm it fails for the expected reason.
2. **Green**: implement the minimal fix; confirm the test passes.
3. **Regression**: run the full suite + `tsc --noEmit` + `next lint` before reporting done.
4. Each agent's report must include the red output and the green output.

---

## Wave 1 — Foundation (3 agents, parallel)

### Agent A (Sonnet) — Test harness + CI

**Files owned**: `vitest.config.ts`, `package.json` + `package-lock.json` (devDependencies/scripts), `src/test/**`, `.github/workflows/ci.yml`
- Add Vitest (+ `@testing-library/react` + `jsdom` for component tests later).
- Create a reusable in-memory mock of `@upstash/redis` (`src/test/mockRedis.ts`) supporting `get/set/rpush/lrange/expire`.
- Add scripts: `test`, `test:watch`, `typecheck`.
- GitHub Actions workflow: install → lint → typecheck → test → build.
- Smoke test proving the harness runs (one trivial passing test + one route-handler test invoking `GET /api/poll` with the mock).

### Agent B (Haiku) — Env, docs, hygiene

**Files owned**: `.env.example`, `README.md`
- Add `POLL_CREATOR_EMAIL`, `EMAIL_FROM` to `.env.example` (fixes M6).
- Fix README drift: response shapes, timestamp types, type names, duplicate-voting note (M5). Document the new env vars and the Redis key layout that Wave 2 introduces (coordinate wording with orchestrator).

### Agent C (Sonnet) — Dependency vulnerability triage (H5)

**Files owned**: `package.json` + `package-lock.json` (runtime dependency versions only)

> Manifest contention: Agents A and C both edit `package.json`/`package-lock.json`. The orchestrator serializes the merge — C lands first, then A rebases and re-runs `npm install` so the lockfile is regenerated once, consistently.
- Run `npm audit`, review the Dependabot list (14 high / 19 moderate / 4 low).
- Bump within-semver first (`npm audit fix`, Next 14.2.x latest patch); take any remaining high-severity majors case by case.
- Verify `next build` + the app's three pages still work after bumps; report anything that would need a breaking upgrade (e.g. Next 15) as a follow-up rather than doing it here.

**Gate**: CI runs green on the branch.

---

## Wave 2 — Fixes (2 agents, parallel, disjoint files)

### Agent D (Sonnet) — Backend hardening

**Files owned**: `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`, `src/lib/redis.ts`, `src/lib/validation.ts` (new), `src/lib/escapeHtml.ts` (new), their test files, plus `package.json`/`package-lock.json` for the `@upstash/ratelimit` dependency (no contention — Agent E does not touch the manifests, and Wave 1 has already merged)
Red-green per finding:
- **C1**: move responses to `RPUSH poll:{id}:responses`; `GET /api/poll` merges list into the poll object. Red test: two concurrent POSTs to `/api/vote`, assert both responses survive.
- **C2**: `escapeHtml()` applied to every user string interpolated into the email. Red test: voterName `<img src=x onerror=…>` must appear escaped in the sent payload (mock Resend).
- **C3**: `src/lib/validation.ts` — validate poll creation (suggestions: array of 1–3 non-empty strings ≤200 chars; title ≤100) and vote submission (votes match the poll's suggestions exactly; vote ∈ allowed options for the poll's mode — fixes H3; voterName ≤50; comment ≤200; counterProposal ≤500). Malformed JSON → 400.
- **C4**: `creatorEmail` from `process.env.POLL_CREATOR_EMAIL`; skip email (with a server log) when unset. Remove the hardcoded address.
- **C5**: `@upstash/ratelimit` sliding window on both POST routes (e.g. 10 polls/hr, 20 votes/hr per IP), env-gated so dev/test skip it.
- **H1**: build `resultsUrl` from `NEXT_PUBLIC_BASE_URL` with `request.nextUrl.origin` as fallback (always available on a `NextRequest`, unlike the `origin` header).
- **H2**: `EX` 30 days on **both** `poll:{id}` and `poll:{id}:responses` keys (expiring only the poll would leak orphaned response lists), refreshed on each vote.
- **M1**: `from:` address from `EMAIL_FROM` env with the current value as fallback.
- **Test-only Redis switch**: extend `src/lib/redis.ts` with an env-gated in-memory implementation (e.g. `USE_MOCK_REDIS=1`) reusing Agent A's `src/test/mockRedis.ts`, so the Wave 3 e2e run and credential-less dev/CI never hit real Upstash.
- **M2 (backend half)**: replace the local `getVoteEmoji` copy in `api/vote/route.ts` with an import from `src/lib/voteDisplay.ts` (created by Agent E — see cross-wave contract for merge order).

### Agent E (Haiku) — Frontend cleanup

**Files owned**: `src/app/page.tsx`, `src/app/vote/[id]/page.tsx`, `src/app/results/[id]/page.tsx`, `src/lib/voteDisplay.ts` (new), their test files
- **M2**: extract `getVoteEmoji`/`getVoteColor`/`getVoteBgColor` to `src/lib/voteDisplay.ts`; unit-test the pure functions (red-green); update all three pages to import them. (The fourth copy, in `api/vote/route.ts`, is swapped to the shared import by Agent D, who owns that file.)
- **M3**: `maxLength={50}` on the voter-name input (must match Agent D's server cap — orchestrator pins the value at 50 for both).
- **M4**: pause the 30s results refresh when `document.visibilityState === 'hidden'`, refresh immediately on return.
- Low items: replace `alert()` with inline error banners on create/vote pages; drop the deprecated `execCommand` fallback path or leave with a comment (agent's judgment, prefer `navigator.clipboard` only + visible error).

**Cross-wave contract** (orchestrator enforces): voterName cap = 50; vote options per mode = `yes|no|maybe` (normal) / `+yolo` (dubious); Redis keys = `poll:{id}` (poll sans responses) + `poll:{id}:responses` (list); `src/lib/voteDisplay.ts` exports `getVoteEmoji`/`getVoteColor`/`getVoteBgColor` — Agent E's branch merges before Agent D's `api/vote/route.ts` import lands (or D keeps the local copy and the orchestrator dedupes at wave merge).

**Gate**: full suite green, `next build` clean, CI green.

---

## Wave 3 — Verification & self-review (orchestrator + 1 agent)

### Agent F (Sonnet) — End-to-end smoke

**Files owned**: `e2e/**` (new), `playwright.config.ts`, plus `package.json`/`package-lock.json` (add `@playwright/test` and an `e2e` script) and the e2e job in `.github/workflows/ci.yml` (no contention — Agent F runs alone in Wave 3)
- Playwright against `next dev` with `USE_MOCK_REDIS=1` (the switch Agent D added to `src/lib/redis.ts` in Wave 2): create poll → open vote link → vote (both modes, incl. YOLO) → results page shows counts and counter proposal.
- Reproducible browser setup: CI and contributor machines run `npx playwright install --with-deps chromium`; the agent's own environment has Chromium pre-installed at `/opt/pw-browsers` and must not re-download it.
- Kept minimal (one happy-path spec per mode) so it stays fast in CI.

### Orchestrator self-review

1. Run `/code-review` (high effort) on the full branch diff; fix or explicitly waive every finding. (`/code-review` and `/security-review` are Claude Code slash commands; a human reviewer without that tooling substitutes a manual pass over the diff against the audit table plus a security-focused read of the email/validation/rate-limit changes.)
2. Run `/security-review` on the branch (email escaping, validation, rate limiting are security-sensitive).
3. Final gate: `lint` + `typecheck` + `test` + `e2e` + `build` all green.
4. Re-read `docs/AUDIT.md` and tick every finding as fixed/waived in the PR description.

---

## Wave 4 — Ship

- Squash-tidy commits if needed, push branch, open PR referencing the audit table with per-finding status.
- Post-merge manual checklist (needs the human — cannot be done by agents): set `POLL_CREATOR_EMAIL`, `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL` in Vercel; verify a real email delivers via Resend; note that existing polls stored under the old single-JSON layout will show zero responses after the C1 data-model change (acceptable — polls are ephemeral — or run a one-off migration if any live poll matters).

## Decisions needed from the owner (defaults chosen; override any)

| Decision | Default in this plan |
|---|---|
| Poll TTL | 30 days |
| Rate limits | 10 polls/hr, 20 votes/hr per IP |
| Rate-limit dependency | `@upstash/ratelimit` (same vendor, no new account) |
| Test framework | Vitest |
| Old-format polls | not migrated |
