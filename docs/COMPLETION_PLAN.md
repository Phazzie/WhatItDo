# WhatItDo — Completion Checklist (parallel sub-agent execution)

Companion to `docs/AUDIT.md` (finding IDs C1–C5, H1–H5, M1–M6 referenced below).
Each unchecked box is one dispatchable sub-agent task. Items in the same wave with disjoint
**Files** lists may run in parallel; items sharing a file must run in the listed order.

## Standard briefing (prepended to every sub-agent prompt)

Every sub-agent receives this block verbatim, plus its task-specific info:

- **Repo**: Next.js 14 (App Router) + TypeScript polling app at `/home/user/WhatItDo`, already on the correct branch.
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

## Wave 2 — Fixes *(IN PROGRESS: backend agent running 2.1–2.6, frontend agent running 2.7–2.10, launched 2026-07-05 ~16:10 UTC)*

Backend items 2.1–2.6 share `src/app/api/*` and run sequentially inside one backend agent
(or as separate agents in the listed order). Frontend items 2.7–2.10 are parallel to the backend track.

- [ ] **2.1 Input validation (C3 + H3)**
  **Files**: `src/lib/validation.ts` (new), `src/lib/validation.test.ts` (new), `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`
  **Special info**: poll: suggestions = 1–3 non-empty strings ≤200 chars, title ≤100; vote: votes must match the poll's suggestions exactly, vote value ∈ mode's allowed set (`yolo` only in `dubious`), voterName ≤50, comment ≤200, counterProposal ≤500; malformed JSON → 400 not 500.
  **Red**: POST a vote with a non-string `vote` value → currently 500 via `toUpperCase()`; POST 50 suggestions → currently accepted.
- [ ] **2.2 Concurrency-safe responses (C1)**
  **Files**: `src/app/api/vote/route.ts`, `src/app/api/poll/route.ts`, their test files
  **Special info**: `RPUSH poll:{id}:responses`, `GET /api/poll` merges the list into the returned poll object; poll object no longer stores responses.
  **Red**: two interleaved vote submissions against the mock → one response lost under current read-modify-write.
- [ ] **2.3 Email HTML escaping (C2)**
  **Files**: `src/lib/escapeHtml.ts` (new), `src/lib/escapeHtml.test.ts` (new), `src/app/api/vote/route.ts`
  **Special info**: escape voterName, poll.title, vote text, comments, counterProposal; mock Resend and assert on the html payload.
  **Red**: voterName `<img src=x onerror=alert(1)>` appears unescaped in the email html.
- [ ] **2.4 Env-driven emails + URL fallback (C4, M1, H1)**
  **Files**: `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`, their test files
  **Special info**: `creatorEmail` from `POLL_CREATOR_EMAIL` (skip email + server log when unset; remove hardcoded address); `from:` from `EMAIL_FROM` with current value as fallback; `resultsUrl` = `NEXT_PUBLIC_BASE_URL` else `request.nextUrl.origin`.
  **Red**: with `NEXT_PUBLIC_BASE_URL` unset and no origin header, email contains `undefined/results/…`.
- [ ] **2.5 TTL + rate limiting (H2, C5)**
  **Files**: `src/app/api/poll/route.ts`, `src/app/api/vote/route.ts`, `package.json` + `package-lock.json` (add `@upstash/ratelimit`), their test files
  **Special info**: `EX` 30 days on BOTH `poll:{id}` and `poll:{id}:responses`, refreshed on vote; sliding window 10 polls/hr + 20 votes/hr per IP, env-gated off in dev/test.
  **Red**: keys created with no TTL (assert via mock `expire` tracking); 25 rapid votes all succeed.
- [ ] **2.6 Test-only Redis switch + backend voteDisplay import (enables Wave 3; M2 backend half)**
  **Files**: `src/lib/redis.ts`, `src/app/api/vote/route.ts`
  **Special info**: `USE_MOCK_REDIS=1` → in-memory implementation reusing `src/test/mockRedis.ts`; also swap the route's local `getVoteEmoji` for the `src/lib/voteDisplay` import once 2.7 has landed (coordinate: 2.7 merges first, else keep local copy and flag).
- [ ] **2.7 Shared vote-display lib (M2)**
  **Files**: `src/lib/voteDisplay.ts` (new), `src/lib/voteDisplay.test.ts` (new), `src/app/vote/[id]/page.tsx`, `src/app/results/[id]/page.tsx`
  **Special info**: extract `getVoteEmoji`/`getVoteColor`/`getVoteBgColor` exactly as-is; unit-test the pure functions (red first: tests import the not-yet-existing module).
- [ ] **2.8 Voter-name cap (M3)**
  **Files**: `src/app/vote/[id]/page.tsx`
  **Special info**: `maxLength={50}` — MUST equal the server cap in 2.1 (contract: 50).
- [ ] **2.9 Visibility-aware refresh (M4)**
  **Files**: `src/app/results/[id]/page.tsx`
  **Special info**: pause the 30s interval when `document.visibilityState === 'hidden'`; refetch immediately on visible.
- [ ] **2.10 Inline errors + clipboard cleanup (Low findings)**
  **Files**: `src/app/page.tsx`, `src/app/vote/[id]/page.tsx`
  **Special info**: replace `alert()` with inline error banners; drop deprecated `execCommand` fallback in favor of `navigator.clipboard` + visible error on failure.

**Wave gate**: full suite + `next build` + CI green.
**Cross-wave contract**: voterName cap = 50; allowed votes = `yes`/`no`/`maybe` (+`yolo` in dubious); keys = `poll:{id}` + `poll:{id}:responses`.

## Wave 3 — Verification

- [ ] **3.1 E2E smoke**
  **Files**: `e2e/` (new), `playwright.config.ts` (new), `package.json` + `package-lock.json` (add `@playwright/test`, `e2e` script), `.github/workflows/ci.yml` (e2e job)
  **Special info**: run `next dev` with `USE_MOCK_REDIS=1`; one happy-path spec per mode: create → vote (incl. YOLO in dubious) → results show counts + counter proposal; CI installs via `npx playwright install --with-deps chromium`; the agent's own environment has Chromium pre-installed at `/opt/pw-browsers` — do not re-download.
- [ ] **3.2 Orchestrator self-review** (not a sub-agent task)
  Run `/code-review` (high) + `/security-review` on the full branch diff; fix or explicitly waive every finding; humans without those Claude Code commands substitute a manual diff review against the audit table.

**Wave gate**: lint + typecheck + test + e2e + build all green.

## Wave 4 — Ship (orchestrator)

- [ ] **4.1** Push branch, open PR with a per-finding fixed/waived table mapped to `docs/AUDIT.md`.
- [ ] **4.2** Owner manual checklist (humans only): set `POLL_CREATOR_EMAIL`, `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL` in Vercel; send a test vote to verify Resend delivery; note old-format polls will show zero responses after 2.2 (acceptable — or request a migration).

## Follow-ups (out of scope for this pass)

- Coordinated Next.js 15/16 migration: the 5 remaining `npm audit` findings (Next.js advisory batch, its vendored `postcss`, and `glob` via `eslint-config-next`) are only patched in Next 15/16. Breaking upgrade — needs its own plan.

## Owner decisions (defaults in effect unless overridden)

| Decision | Default |
|---|---|
| Poll TTL | 30 days |
| Rate limits | 10 polls/hr, 20 votes/hr per IP |
| Rate-limit dependency | `@upstash/ratelimit` |
| Test framework | Vitest |
| Old-format polls | not migrated |
