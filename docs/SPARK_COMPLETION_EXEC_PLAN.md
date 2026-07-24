# WhatItDo Spark Completion and Main Cutover

This ExecPlan follows `.agent/PLANS.md`. It is a living record and must be updated at every stopping
point.

## Purpose / Big Picture

Complete the remaining mechanical repair tickets that were suitable for Spark, integrate them without
file collisions, prove the exact candidate locally and in GitHub, then establish `main` as the GitHub
default and Vercel Production branch. A user should be able to create a poll, vote in Classic or
Dubious mode, recover private results, pause results refresh, and use the application accessibly.

Literal Spark workers are unavailable in this session. GPT-5.6 Terra workers at medium reasoning are
used as substitutes under the same narrow ownership and exact-proof contract.

## Progress

- [x] (2026-07-24) Verified Production commit `675c3b0` and repaired its Redis environment scope.
- [x] (2026-07-24) Proved Production create, public read, Dubious vote, exact retry, and private results.
- [x] (2026-07-24) Created clean integration and worker worktrees from `origin/HEAD`.
- [x] (2026-07-24) Completed the results refresh/accessibility lane.
- [x] (2026-07-24) Completed the home success and shared browser-evidence lane.
- [x] (2026-07-24) Completed the CI and Playwright configuration lane.
- [x] (2026-07-24) Added focused coverage, per-file enforcement, static-asset regression, and
  documentation repairs.
- [ ] Integrate all lanes and pass focused and repository-wide gates. Local Node 23 coverage became
  stuck in uninterruptible filesystem I/O; supported-Node GitHub jobs remain authoritative.
- [ ] Push a review PR and pass independent review plus exact-SHA GitHub checks.
- [ ] Establish and merge into `main`; switch GitHub default and Vercel Production tracking.
- [ ] Verify the final Production deployment and close this plan.

## Surprises & Discoveries

- The repository has no local or remote `main`; its default remains
  `claude/voting-suggestions-app-01QZyxebMi27ePup8cniRCws`.
- The old `docs/SPARK_REPAIR_EXEC_PLAN.md` exists only as an untracked file in the historical PR #4
  checkout and its progress boxes are stale.
- The active free Redis resource is RAM-only and does not promise persistence. Durable storage is a
  Sol-owned follow-up, not part of the mechanical Spark train.
- A `node_modules` symlink outside a worktree is rejected by Turbopack. Local browser validation uses
  the original checkout's real dependency tree at the frozen integration SHA; CI uses `npm ci`.
- Two cross-review passes found a missing resume assertion, conflicting toggle semantics, and one
  stale README plan pointer. All were repaired before publication.
- The first PR build passed lint, typecheck, 167 unit tests, and per-file coverage, then failed the
  high-severity audit on newly published Next.js and sharp advisories. Next.js and its lint config
  were advanced from 16.2.10 to 16.2.11, with sharp 0.35.3 overridden until Next.js widens its
  optional dependency range; the regenerated lockfile reports zero vulnerabilities.
- The first teardown-abort browser probe used an asynchronous exposed page binding; navigation
  destroyed the binding before it recorded the cleanup and produced a false failure. The probe now
  uses a synchronous marker scoped to `/api/results`, while the other 22 browser cases were green.

## Decision Log

- Decision (2026-07-24): base every worker branch on deployed `origin/HEAD` at `675c3b0`; never edit
  the dirty historical checkout.
- Decision (2026-07-24): serialize ownership by collision group. Results owns the results page and
  its new spec; Home owns the home page and shared poll-flow spec; CI owns workflow and Playwright
  configuration. Root alone integrates.
- Decision (2026-07-24): configure push CI for `main` and pull-request CI for all PRs so a PR branch
  is not tested twice.
- Decision (2026-07-24): the final cutover uses a normal PR/merge and preserves published history.

## Outcomes & Retrospective

Open. Record the final merge commit, check results, Production deployment, smoke evidence, remaining
Sol-owned work, and any waived item here.

## Context and Orientation

The deployed source is the remote default branch at `675c3b0`. The integration and worker checkouts
are temporary sibling Git worktrees; their machine-specific locations are intentionally not part of
the repository contract.

`src/app/results/[id]/page.tsx` owns owner-only results refresh. `src/app/page.tsx` owns poll creation
and its success state. `e2e/poll-flows.spec.ts` is the shared end-to-end suite. `playwright.config.ts`
controls server isolation. `.github/workflows/ci.yml` controls remote gates. `vitest.config.ts` owns
coverage thresholds.

## Plan of Work

The results lane removes routine timestamp announcements and adds a pause/resume control whose state
also governs visibility-based polling; manual refresh remains available.

The home lane focuses the success heading once after creation, announces that both links are ready,
and adds created-state, receipt-state, and reduced-motion browser assertions without weakening
existing Classic, Dubious, privacy, mobile, or axe coverage.

The CI lane prevents duplicate branch/PR runs, removes local server reuse and the skip-build escape,
adds exact supported-Node checks, and pins the Redis service after root supplies an official digest.

Root then discovers actual per-file coverage deficits, adds only missing focused tests, enforces
per-file thresholds, adds a dependency-free backdrop asset test, reconciles documentation, and
integrates worker commits.

## Concrete Steps

1. Each worker checks its clean status, edits only its allowlist, runs its focused proof, commits once,
   and returns its commit plus evidence within ten minutes.
2. Root cherry-picks one worker at a time and reruns that lane's proof.
3. Root runs coverage discovery before changing tests or thresholds. Tests must cover real branches;
   thresholds may not be lowered and files may not be excluded to gain green.
4. Root resolves the immutable Redis 7 Alpine manifest-list digest from the official registry before
   the CI workflow uses it.
5. Root runs every command in Validation and Acceptance. Any failure returns to the owning lane.
6. Root creates `main` at the verified current default without rewriting history, makes it the GitHub
   default, pushes `agent/spark-integration`, opens a PR into `main`, requests independent review, and
   resolves actionable findings with new focused commits.
7. After the exact PR SHA is green, merge normally, set Vercel Production Branch to `main`, and retain
   the old default until Production proof passes.

## Validation and Acceptance

Run from the integration worktree:

    npm run lint
    npm run typecheck
    npm test
    npm run test:coverage
    npm run test:integration
    npm run e2e
    npm run build
    npm audit --audit-level=high

Integration tests must execute against Redis 7 with zero skips in GitHub. Browser proof must include
Classic, Dubious/YOLO, unauthorized results, exact retry, notification truth, 375 px layout, created
state, receipt state, paused refresh, reduced motion, and axe. GitHub checks must be green on the
exact merge candidate. Production must be `READY` for that merge commit, return the exact missing-poll
404 sentinel, and pass one token-safe synthetic create/vote/results flow without new error logs.

## Idempotence and Recovery

Worker branches and worktrees are disposable; never force-push or rewrite the deployed default.
Cherry-picks are applied only after checking ancestry and clean status. If a cherry-pick conflicts,
abort it and repair in the owning worker rather than resolving across ownership boundaries.

Before GitHub/Vercel cutover, record the old default branch, Production Branch, and verified deployment.
If final Production verification fails, restore the prior Production Branch/deployment while leaving
Git history intact, then open a normal fix or revert PR. Do not delete the old default branch during
this plan.

## Artifacts and Notes

Integrated worker commits cover results polling (`578122e`, `5f9793a`), home success evidence
(`6b54b96`), deterministic CI (`0dbfe82`), poll/results/validation/timeout coverage (`96006d9`,
`b72d48c`, `67066f0`, `10dee30`), the backdrop regression (`5943bb9`), per-file enforcement
(`839d714`), and docs (`ac4fd25`). Focused route suites reported 12/12 poll, 11/11 results, and 31/31
validation tests passing in their clean worker checkouts. Record the final coverage summary, PR URL,
GitHub check URLs, merge ID, Vercel deployment ID, and aggregate smoke result before closing. Never
record owner tokens, Redis values, notification addresses, raw IPs, or synthetic ballot contents.

## Interfaces and Dependencies

Preserve the public DTO `{ title, mode, suggestions }`, 10-character poll IDs, 24-character results
tokens returned once in URL fragments, SHA-256 token storage, 30-day idle/90-day absolute expiry,
250-response cap, and Classic versus Dubious vote choices. Keep Redis and Resend lazy at build time.
Do not add dependencies for these mechanical tickets. Node support remains `20.19.0`, `22.13.0`, and
`24.0.0` minima as declared by `package.json`.
