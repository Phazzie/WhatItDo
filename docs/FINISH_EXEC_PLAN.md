# Finish WhatItDo and Ship PR #4

This ExecPlan follows `.agent/PLANS.md`. It is a living document and must remain usable without the
conversation that created it.

## Purpose / Big Picture

Finish WhatItDo as a secure, reliable, distinctive polling app. A creator can make a Classic or
Dubious poll, share a voting link that cannot expose responses, retain a separate private results
link, receive honest best-effort notification status, and view accurate results after concurrent or
retried votes. The repository will run on the current stable Next.js line, have meaningful unit,
Redis-integration, browser, mobile, and accessibility tests, and close every PR #4 review thread.

The visible finish is deliberately bold: a fun midnight-scrapbook interface with original background
art, tactile sticker-like controls, eclectic typography, playful microcopy, and responsive paper-like
layers. It takes color and tone cues from `Phazzie/ErinsEscapades` and
`Phazzie/EscapadesofErin` without copying code or relying on absent assets.

## Progress

- [x] (2026-07-16) Reconstructed branch, PR, review-thread, CI, dependency, product, and security state.
- [x] (2026-07-16) Selected PR #4 head branch as the implementation base.
- [x] (2026-07-16) Wrote `AGENTS.md`, `.agent/PLANS.md`, this plan, and `docs/FINISH_AUDIT.md`.
- [x] (2026-07-16) Submitted the scope to a hostile reviewer; accepted and incorporated all eight
  blocking/high revisions before product-code edits.
- [x] (2026-07-16) Upgraded to Next 16.2.10/React 19.2.7, compatible ESLint 9 flat config, Node 22
  CI, immutable Action SHAs, and an audit with no high/critical findings.
- [x] (2026-07-16) Implemented private hashed results capabilities, exact public DTOs, bounded
  validation, private cache headers, and explicit legacy-poll retirement.
- [x] (2026-07-16) Implemented lazy durable storage, atomic/idempotent bounded appends, 30/90-day
  lifecycle rules, mandatory trusted-identity limits, and Redis 7 integration coverage.
- [x] (2026-07-16) Made email state, retries, refresh failures, ties, percentages, and creator-link
  recovery truthful.
- [x] (2026-07-16) Generated original artwork and completed the bold responsive/accessibility redesign,
  including designed 404/error states.
- [x] (2026-07-16) Completed local lint, production TypeScript/build, 97-test coverage, 14-flow
  browser/mobile/accessibility, audit, screenshot, and diff gates. The nine real-Redis service cases
  skip without `REDIS_URL` locally and remain an explicit CI gate.
- [ ] Verify all nine Redis 7 service cases in GitHub Actions.
- [ ] Address, reply to, and resolve all PR #4 threads; push and verify GitHub/Vercel state.

## Surprises & Discoveries

- The repository default branch is named `claude/voting-suggestions-app-01QZyxebMi27ePup8cniRCws`;
  there is no `main`. PR #4 is exactly 16 commits ahead and is the only sensible finish base.
- PR #4 already implemented most of the July 5 audit and has passing application CI, but its 28
  review threads were never resolved and its docs describe several landed changes as future work.
- The initial `npm audit` reported four high and one moderate vulnerability. A major Next.js upgrade
  was a release requirement, not a follow-up; the final audit reports zero vulnerabilities.
- The referenced Erin repositories have neon glow and playful language but no background raster in
  their full Git histories. WhatItDo references `/bg.png`, which does not exist. New original art is
  required.
- The old legacy-response "fallback" preserves old votes only until the first new list response;
  after that it hides every embedded response.
- The first hostile reviewer process stalled and was interrupted under the new 10-minute ceiling. A
  replacement reviewer rejected the plan on eight concrete points; the scope was revised before code.
- A root-owned entry in the user npm cache blocked the first install; a temporary cache completed the
  lockfile upgrade without changing global permissions. The machine's Node 23 line is unsupported by
  current tooling, so local release gates run with an official temporary Node 22.17.0 binary.

## Decision Log

- Decision (2026-07-16): Continue directly on PR #4's published head branch. Rationale: it is mergeable,
  contains the tested hardening work, and avoids duplicating or cherry-picking a 3,800-line change.
- Decision (2026-07-16): Upgrade to stable `next@16.2.10` and matching current React/ESLint packages.
  Rationale: the Next 14 lock has live high-severity advisories.
- Decision (2026-07-16): Treat the results URL as a bearer capability using a 24-character Nano ID.
  The raw token stays in a URL fragment and local creator history, while Redis stores only SHA-256.
  The client POSTs it to a private results endpoint. Rationale: the MVP has no accounts; a separate
  high-entropy secret is the smallest honest boundary, and fragment transport avoids server paths,
  query logs, and referrers. Vote reads return exactly title, mode, and suggestions.
- Decision (2026-07-16): Store at most 250 responses, add a 100-votes/hour per-poll bucket, and retain
  the existing 20/hour per-IP bucket. Rationale: this bounds storage, reads, and email abuse without
  introducing pagination into a small social poll.
- Decision (2026-07-16): Add a 90-day absolute expiry around the 30-day idle TTL. Rationale: activity
  must not retain personal response data forever.
- Decision (2026-07-16): Use one Redis Lua append operation for existence, idempotency, capacity,
  IP/poll rate limits, append, and TTL refresh, with duplicate detection before capacity. Rationale:
  pipelines cannot make the conditional lifecycle and retry ordering atomic.
- Decision (2026-07-16): Email remains synchronous best-effort, not a queue. The API returns
  `sent`, `not_configured`, `failed`, or `duplicate`; only a newly appended response can send and
  Resend receives the stable submission ID as its idempotency key. Email has no results link because
  the server deliberately cannot recover the raw results token. Rationale: the locally saved private
  link is reliable; an outbox or reversible token storage is disproportionate for this MVP.
- Decision (2026-07-16): Deployment-wide email alerts contain no poll title, voter identity, votes,
  notes, counterproposal, or private link. Rationale: a fixed environment recipient is not provably
  the creator of every unauthenticated poll, so detailed ballots remain private to results-link holders.
- Decision (2026-07-16): Tokenless legacy polls return 410 for reads and writes. Rationale: accepting
  new votes would create owner-inaccessible data; preserving public results would recreate F1. Do not
  implement the earlier merge/dedup compatibility path.
- Decision (2026-07-16): `PublicPoll` is exactly `{ title, mode, suggestions }`. `PollResults` owns
  timestamps/expiry and responses. Rationale: API minimization is an enforceable privacy contract.
- Decision (2026-07-16): Use a wide original AI-generated background with no text or essential
  information, backed by CSS texture and decorations. Rationale: the referenced asset is absent and
  the user explicitly requested a brave redesign.

## Outcomes & Retrospective

The completed local candidate passes full ESLint, a Next 16 production build and TypeScript phase,
97 unit/route/storage tests with coverage (93.45% lines, 90.06% statements, 84.84% branches, 97.14%
functions), and 14 Playwright flows covering desktop, 375 px, axe accessibility, privacy, failure
recovery, notification truth, and retry races. `npm audit --audit-level=high` reports zero
vulnerabilities. Visual evidence is available locally under ignored `output/playwright/` for the home,
ballot, and private-results surfaces. The GitHub commit/check/thread/deployment outcomes are recorded
after the published branch finishes its remote gates.

## Context and Orientation

The baseline app had one client page for poll creation, one client voting page, and one client results
page. Before this plan was executed, `GET /api/poll?id=...` returned both poll metadata and private
responses to everyone. The completed implementation stores poll metadata at `poll:{id}`, appends
responses to `poll:{id}:responses`, and exposes only the exact `PublicPoll` DTO from public GET.
Upstash Redis provides durable data; Resend sends optional metadata-only notifications.

The target stored poll contains `id`, `title`, `suggestions`, `mode`, `createdAt`, `expiresAt`, and
`resultsTokenHash`. Legacy `responses` and `creatorEmail` fields are neither served nor mutated; a
record without `resultsTokenHash` is retired with HTTP 410. Public vote data contains exactly `title`,
`suggestions`, and `mode`. Authorized result data additionally contains poll timestamps/expiry and
responses. The creator receives `/results/{id}#{resultsToken}` once and keeps it in a bounded local
history, while voters receive `/vote/{id}`. The fragment never reaches the page request; the results
client submits it in the JSON body of `POST /api/results`.

Every vote request includes `submissionId`, stable across client retries. Redis keys are:

- `poll:{id}`: stored poll, 30-day TTL.
- `poll:{id}:responses`: append-only response list, 30-day sliding TTL.
- `poll:{id}:submissions`: submission ID to response ID hash, idle TTL capped by absolute expiry.
- `ratelimit:poll:{ip}`: poll-create IP window.
- `ratelimit:vote:ip:{ip}`: vote IP window.
- `ratelimit:vote:poll:{id}`: per-poll vote window.

## Plan of Work

### Milestone 1: Hostile scope review (complete)

The replacement hostile reviewer returned `REJECT`. Accepted revisions were: minimize `PublicPoll`;
retire tokenless polls instead of engineering unreachable legacy merge support; hash the token and
move it to a fragment/body flow; require private/no-store/no-referrer/noindex boundaries; add numeric
validation; represent duplicate notification honestly; resolve retries before atomic rate capacity;
define the in-memory predicate; and persist the PR-thread ledger in the repository. No critique was
rejected.

### Milestone 2: Current secure platform baseline

Upgrade Next.js, React, React DOM, ESLint config, types, and affected test dependencies. Replace
`next lint` with the supported ESLint 9 flat-config command. Update Node requirements. Pin GitHub
Actions to immutable SHAs. Run unit/type/lint/build and `npm audit --audit-level=high`; resolve upgrade
breakage before combining it with product refactors.

### Milestone 3: Privacy and storage contracts

Split stored/public/results TypeScript contracts. Generate a results token at creation, store only its
SHA-256 hash, return exact public DTOs, and add `POST /api/results` for private reads. The results page
at `src/app/results/[id]/page.tsx` reads the raw token from `location.hash`. Mark it noindex/nofollow,
set no-referrer, disable owner-link prefetch, use no-store requests/responses, and never serialize the
token into page HTML. Tokenless stored polls return 410 from public and vote endpoints. Exact ID/token
validation prevents Redis namespace collisions.

Refactor Redis initialization behind a lazy getter. Move the in-memory implementation into production
source ownership but allow it only when an explicit E2E/test marker is present. Export a Lua script
and a typed append result. The script checks that `poll:{id}` exists and is not past its 90-day absolute
expiry, returns an existing response for a repeated submission before consuming capacity, atomically
enforces 20/hour trusted-IP and 100/hour poll buckets, rejects response 251, appends a new response,
records the submission, and refreshes all poll TTLs to the lesser of 30 idle days or remaining absolute
lifetime.

### Milestone 4: Trustworthy product behavior

Stream-read at most 16 KiB, parse unknown request bodies, apply the exact matrix in
`docs/FINISH_AUDIT.md`, normalize accepted strings, and return stable API errors. Production trusts
`x-vercel-forwarded-for`/`x-real-ip` only when `VERCEL=1`; self-hosted production requires
`TRUST_PROXY=1` before reading `x-forwarded-for`; missing identity fails closed. Rate-limit responses
include `Retry-After`. Inspect resolved Resend errors, pass `vote/{pollId}/{submissionId}` as its
idempotency key, omit results links, and return truthful notification state.

Keep existing results visible during transient refresh failures, add manual retry/last-updated state,
and reserve "not found" for a real 404 or invalid token. Use pure result helpers for counts and ties.
Provide separate copy controls for vote and private results links. Persist at most ten conservatively
30-day-valid creator records in local storage, show a private recent-polls recovery area, and provide clear-history.
Remove medals and misleading bar minimums. Add designed global error and not-found pages.

### Milestone 5: Bold visual redesign

Generate `public/whatitdo-backdrop.jpg` as a wide, edge-weighted collage with an inky night base,
hot-pink/cyan/acid-lime/tangerine paper fragments, stars, dice, ticket shapes, scribbles, and generous
quiet space behind the central content. It contains no words, logos, people, or essential UI.

Replace the generic glass treatment with a coherent tokenized design in `globals.css`: paper and ink
surfaces, thick dark outlines, offset shadows, imperfect rotations, sticker labels, a restrained neon
glow, and responsive composition. Rework create, created/share, vote, submitted, results, 404, and
error states with playful but clear copy. Add pressed semantics, visible focus, live errors, long-word
wrapping, touch-safe layouts, and reduced-motion behavior.

### Milestone 6: Evidence and release

Add regression tests for every finish-audit behavior. Run the Lua script against Redis 7 in CI and
locally skip only when `REDIS_URL` is absent. Extend Playwright with unauthorized-results, Classic,
Dubious, notification-truth, refresh-recovery, 375 px overflow, and axe accessibility coverage.
Capture desktop and mobile screenshots for visual inspection.

Add a focused 85% line/function/statement and 80% branch coverage floor for API routes and critical
`src/lib` modules. The private-results test alternates valid and invalid tokens against a built server
and proves no response replay. Configuration-matrix tests prove in-memory storage is selected only for
`NODE_ENV=test`, or for `E2E_TEST=1` with loopback `E2E_BASE_URL` and no recognized deployment marker.

Rewrite README and env docs against final behavior; add dependency-license metadata for the four
scanner findings; mark the older completion plan historical. Run an independent code/security/UI
review and fix its findings. Push the branch, reply to and resolve all 28 review threads, request fresh
checks, retry Vercel, and merge only when the definition of done is satisfied.

## Concrete Steps

All commands run from the repository root.

1. Confirm branch and baseline:

       git status --short --branch
       git fetch origin
       npm ci
       npm run typecheck
       npm test
       npm run build
       npm audit --package-lock-only

2. After Milestone 2, run its isolated gate:

       npm run lint
       npm run typecheck
       npm test
       npm run build
       npm audit --audit-level=high

3. During Milestones 3-5, run the focused test file first, then `npm test`. Never proceed from a red
   focused test to unrelated implementation.

4. Run the complete local gate:

       npm run lint
       npm run typecheck
       npm test
       npm run test:integration
       npm run e2e
       npm run build
       npm audit --audit-level=high

5. Inspect the production build in a real browser at desktop and 375 px widths. Save screenshots under
   `artifacts/verification/` if that directory is excluded from deployment, or record their external
   test artifact paths in this plan.

6. Fetch PR #4 review threads with the bundled GitHub review script and update
   `docs/PR4_REVIEW_THREADS.md`. For each unresolved ID, apply or
   cite the fix, reply with evidence, resolve it, refetch, and require an unresolved count of zero.

## Validation and Acceptance

- Given only `/vote/{id}`, GET returns exactly title/mode/suggestions. `/results/{id}` without a
  fragment and POST results with a guess show no data. The real fragment token displays results.
- Private results responses are dynamic with `Cache-Control: private, no-store`; the page is
  noindex/nofollow and no-referrer; alternating valid/invalid requests never replay authorized data.
- Two concurrent unique submissions both appear. Retrying one `submissionId` returns success with one
  stored response and one provider-idempotent email attempt. A missing poll cannot create an orphan
  response key. A duplicate reports only that the vote was already recorded.
- A tokenless legacy poll returns 410 from public GET and vote POST, creates no keys, and sends no email.
- Response 251 is rejected; production rate limits are mandatory; trusted IP and poll buckets are
  independent; duplicate retries do not consume new capacity; responses carry `Retry-After`.
- Poll TTL is at most 30 idle days and never extends beyond 90 days after creation.
- Missing Redis configuration fails with a direct configuration message on request, not at build.
- Missing or failed email never produces "creator notified" UI. Successful mocked delivery does.
- A transient refresh failure leaves existing results visible with retry status; recovery clears it.
- A tie is labeled as a tie; bar geometry matches the displayed percentage; response order has no rank.
- Home, vote, results, error, and not-found states have no serious axe findings, no horizontal overflow
  at 375 px, visible keyboard focus, and reduced-motion behavior.
- `npm audit --audit-level=high` exits zero; lint, typecheck, unit, integration, E2E, and build exit zero.
- PR #4 has zero unresolved review threads and green application checks. Deployment serves the new UI,
  or the plan records a proven account/platform credential blocker after a retry.

## Idempotence and Recovery

Dependency installation and test commands are repeatable. Keep the lockfile paired with the manifest.
If the Next upgrade causes widespread failures, preserve a commit containing only the operating docs,
return to the last green commit without rewriting remote history, and repair the upgrade as its own
commit before resuming.

The results-token schema affects only new polls. No destructive migration runs. Tokenless legacy
records remain untouched but every application read/write returns 410. They disappear under their
existing storage lifecycle or an owner-directed cleanup; no compatibility path writes inaccessible
responses.

The Lua append is safe to retry because `submissionId` is the idempotency key. If notification fails
after persistence, the API reports failure but a retry does not send again; the result remains visible.
If this tradeoff changes, it requires an outbox ExecPlan rather than an inline retry patch.

Generated art is additive. The optimized JPEG is the deployed asset; the full-resolution generated
source remains outside the repository. Reverting the redesign must not revert privacy, storage,
dependency, or test commits.

## Artifacts and Notes

- PR #4: `https://github.com/Phazzie/whatitdo/pull/4`
- Active audit: `docs/FINISH_AUDIT.md`
- Historical audit/plan: `docs/AUDIT.md`, `docs/COMPLETION_PLAN.md`
- Reference repositories: `Phazzie/ErinsEscapades`, `Phazzie/EscapadesofErin`
- Review inventory: `docs/PR4_REVIEW_THREADS.md` durably records all 28 baseline thread IDs,
  classifications, required evidence, reply state, and resolution state.

## Interfaces and Dependencies

Target API shapes:

    POST /api/poll
    request: { title?: string, suggestions: string[], mode: "normal" | "dubious" }
    response: { id: string, resultsToken: string, poll: PublicPoll }

    GET /api/poll?id={10-char-id}
    response: { poll: PublicPoll }

    POST /api/results
    request: { pollId: string, resultsToken: string }
    response: { poll: PollResults }

    POST /api/vote
    request: { pollId: string, submissionId: string, voterName?: string,
               votes: Vote[], counterProposal?: string }
    response: { success: true,
                notification: "sent" | "not_configured" | "failed" | "duplicate" }

`PublicPoll` is exactly `{ title, mode, suggestions }`. `PollResults` adds owner timestamps, expiry,
and responses but still contains no ID, token/hash, or email. The Redis Lua append returns `appended`,
`duplicate`, `not_found`, `expired`, `identity_unavailable`, `capacity_reached`, or `rate_limited`.
Successful and duplicate results include the stable response ID and current count internally.

Runtime packages remain limited to Next.js/React, Upstash Redis, Nano ID, and Resend. Dev tooling adds
ESLint 9, Vitest, Playwright, axe Playwright, and a Redis protocol client used only by the Redis 7
integration test. Do not introduce a component library during the redesign; the interface is small
enough for semantic React and design tokens.
