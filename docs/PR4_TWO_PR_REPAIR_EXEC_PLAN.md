# Finish PR #4 with a Two-PR Repair Stack

This ExecPlan follows `.agent/PLANS.md`. It is the execution checklist for the owner-authorized
2026-07-19 repair run and the owner-authorized 2026-07-20 production completion run. Keep it current
after every commit, push, merge, or stopping point. The owner selected Upstash Free for Production,
accepted its free-tier durability/availability limits, and authorized the staged release below.
A fresh agent must be able to resume from this file and the repository without chat history.

## Purpose / Big Picture

Finish WhatItDo without discarding the valuable privacy, storage, and redesign work in commit
`de8af4a`. Review the first 16 already-published audit commits separately from that giant commit,
repair the remaining correctness and accessibility defects, close every PR #4 review thread, and
ship only the complete repaired tree.

The implementation stack has exactly two pull requests:

    repository default at 75f432d
        |
        +-- PR-A: first 16 commits, ending at 02f73ef
                |
                +-- existing PR #4: de8af4a plus repair commits

PR #4 merges into PR-A's branch first. PR-A then merges once into the repository default. The
default branch never points at the incomplete `02f73ef` tree by itself.

## Progress

- [x] (2026-07-18) Verified the 17-commit graph, the first-16 tip, and the giant commit parent.
- [x] (2026-07-18) Reduced the giant commit repair from the old 1,126-line Spark train to six required
  behavioral outcomes.
- [x] (2026-07-18) Obtained history, application/security, and CI/release review of the two-PR design.
- [x] (2026-07-19) Received owner authorization to execute the planned safe repair through release.
  During execution, the dead provider exposed a new terms/cost/durability decision that the plan did
  not contain. The current safe run therefore ends after the PR #4 inner merge and PR-A's exact-head
  Preview proof; it does not guess a provider choice, accept terms, buy a tier, weaken an invariant,
  or advance PR #5/default/Production without that newly required decision.
- [x] (2026-07-19) Rechecked GitHub authentication, PR #4 OIDs, merge-commit support, protection and
  ruleset state, Vercel identity/project linkage, and the production branch.
- [x] (2026-07-19) Provisioned a checksum-verified Node 22.23.1 runtime for this run.
- [x] (2026-07-19) C-01 Activated this plan in repository guidance with one docs-only commit after
  three hostile reviews cleared its execution and provider-safety runbook.
- [x] (2026-07-19) C-02 Installed/read back the temporary Vercel guard, pushed the exact first-16
  ref, opened draft PR #5, and retargeted PR #4. The new stack is `75f432d <- PR #5 @ 02f73ef <-
  PR #4 @ de8af4a`; all 28 review threads remain unresolved and are now outdated.
- [x] (2026-07-19) C-03 Committed the three existing CI test corrections as `4123668`; Node
  22.23.1 `npm run typecheck` passed.
- [x] (2026-07-19) C-04 Implemented atomic/private poll creation as `cb45d3c`; 42 focused
  route/storage cases, typecheck, and focused lint passed. The Redis 7 file skipped locally as
  expected and remains a non-skipping CI gate.
- [x] (2026-07-19) C-05 Bound submission IDs to normalized ballot digests as `0b883e6`; 56 focused
  digest/route/storage cases, typecheck, and focused lint passed. All 13 Redis 7 cases are present
  and locally skipped without `REDIS_URL`.
- [x] (2026-07-19) C-06 Made notification email detailed, escaped, provider-idempotent, and
  time-bounded as `bc09e29`; 16 focused route/timeout cases, typecheck, and focused lint passed.
- [x] (2026-07-19) C-07 Restored forced-colors keyboard focus as `3b014dc`; typecheck, focused lint,
  and the two-case forced-colors/ambiguous-retry production-browser proof passed.
- [x] (2026-07-19) C-08 Ran the integrated local gate and exact-head adversarial reviews. The first
  complete local gate was green. Three hostile lanes found no blocker in application/history, two
  high release-runbook gaps, and ten useful medium findings; app follow-up is `2164293`, CI job
  bounds are `5f0bf28`. The post-review full local gate is green. Exact-head CI was also green at
  `222fc6d`, but its authenticated Preview sentinel exposed the dead deployed Redis resource. That
  required the standard Redis adapter and Preview provider path, another complete local gate, and
  literal final-SHA review before C-08 could close. The first Redis-repair review caught a healthy-idle socket
  churn defect; the command-scoped replacement and its full local gate are green, and three exact-
  head lanes cleared `b2b3ea4`. A new current client/server import-boundary thread arrived after
  that push, so its small follow-up passed focused tests, lint, typecheck, build, emitted-client
  scan, coverage, 17/17 browser proof, three exact-head reviews, both CI event suites, and exact Preview proof. The final
  thread-by-thread disposition audit then caught two deleted mock regressions: negative `LRANGE`
  stop handling and plain `SET` clearing an existing TTL. The replacement in-memory adapter is
  correct; both direct assertions and both missing browser error-propagation checks were restored.
  Their focused tests, production build, lint, typecheck, 149-case coverage gate, three exact-head
  reviews, both CI event suites, and exact Preview proof all pass at `2da1d00`.
- [x] (2026-07-19) C-09 Pushed the repair candidate, made it green, resolved every review thread,
  and pushed the evidence-only closeout; record its final exact-head proof in PR #4. Candidate `b2b3ea4` passed
  push run `29689374588`, pull-request run `29689376387`, 14/14 Redis cases in both, and exact
  Preview `dpl_GZjJ6eYfbo3BviomvBKoKukKe8tF`. Follow-up `c12b160` passed push run `29689940711`,
  pull-request run `29689941869`, 14/14 Redis cases in both, and exact Preview
  `dpl_39BdZpasnZGjZw6ibscbDYjYtCP6`. Final code head `2da1d00` passed push run `29690493749`, pull-
  request run `29690494814`, 14/14 Redis and 19/19 browser cases in both, and exact Preview
  `dpl_DiwQyw7KexX5mT9kxA25gfXCACgk`. All 29 threads have evidence replies and are resolved; the
  GraphQL refetch reports zero unresolved and no change-request review. Evidence head `9ac0fa9`
  then passed push run `29690851759`, pull-request run `29690852977`, 14/14 Redis and 19/19 browser
  cases in both, exact Preview `dpl_EP7Xv212kkN8dQmeTpsVBZ9ELqat`, zero unresolved threads, and no
  change-request review.
- [ ] C-10 Merge PR #4 into PR-A, commit the inner-merge evidence, prove PR-A's exact head in CI and
  Preview. The guarded inner
  merge created `ca1d217`: first parent `02f73ef`, second parent `9ac0fa9`, with a tree identical to
  the proven PR #4 head. The closure commit now also contains the Upstash mutation-safety fix and
  four review corrections found before the C-10 gate; its local and remote proof remain.
- [x] (2026-07-20) Closed stale PR #2 without merging it after recording that PR #5 fully supersedes
  its Next.js dependency update. The branch and history were preserved.
- [x] (2026-07-20) C-11 OWNER GATE: the owner selected Upstash Free for Production, accepted the
  archive/manual-restore, quota, and no-SLA limitations, rejected keepalive traffic and automatic
  paid upgrades, and approved the staged probe/fallback/promotion plan. Provider terms or MFA still
  require the owner personally if Vercel presents an interactive checkpoint.
- [x] (2026-07-20) Built the seven-path PR #5 closure packet. Hostile review caught that
  `retry: false` still performs two fetch attempts in pinned Upstash 1.35.8; the code now uses
  `retry: { retries: 0 }`, a fresh five-second signal, and a real-SDK one-fetch regression. It also
  corrected every actionable PR #5 documentation/example inconsistency and replaced the unsafe old
  Production runbook with the owner-authorized provider/fallback/release sequence. Application,
  test, scope, and thread-disposition reviews are clear. Local Node gates hit the separately recorded
  kernel-I/O non-start; exact-head GitHub CI remains mandatory.
- [ ] (2026-07-20) The first exact-head CI attempt at `61f7d99` passed lint, typecheck, install/audit,
  and both Redis 7 jobs, but both build jobs rejected the new real-SDK test fixture: Upstash's
  auto-pipelined `GET` expects an array of command results and the fixture returned one object. The
  production adapter and single-fetch proof were unaffected. One focused repair changes the mock
  body to `[{ result: null }]`; its exact-head remote gate is pending.
- [ ] C-11 Provision the isolated provider, prove fresh Production-only credentials with a direct
  fake-data adapter probe, create a healthy hidden production-target fallback from the exact PR #5
  tree, then merge, verify, and promote without moving aliases early.
- [ ] C-12 After the authorized Production release, record final evidence and retrospective.

## Surprises & Discoveries

- The first 16 commits change 28 files with 3,871 insertions and 395 deletions. The giant commit
  changes 55 files with 6,599 insertions and 4,087 deletions, but 3,594 changed lines are generated
  `package-lock.json` and roughly 1,100 are documentation/planning.
- Twenty-six of the 28 first-16 paths are changed again by `de8af4a`. The giant commit inherits
  earlier code such as `src/lib/escapeHtml.ts`, so it must stay on its existing parent history.
- The exact giant-commit CI failures are three small test defects already present in the worktree:
  an overly narrow inferred UUID type, Redis `hExists` returning numeric `0`, and a Playwright alert
  locator that also matched Next's route announcer.
- PR branches currently trigger both `push` and `pull_request` CI. The two event refs do not share a
  concurrency key, so each pushed PR SHA normally executes six jobs. This rescue does not alter CI
  topology; it minimizes waste by batching local commits into one push per integrated PR head.
- GitHub currently permits merge commits. The default branch has no protection object and the
  repository has no rulesets. Therefore a fresh GitHub approval is not invented as a merge blocker;
  exact-head subagent reviews, green checks, no current change request, and zero unresolved threads
  are the review gates unless live rules change.
- The Vercel project is `phazzies-projects/what-it-do`, project ID
  `prj_xO6lqwoneBD6PJSVxNbMtFuvmCO6`. Its production branch is the repository default. Preview is
  SSO-protected, but the same encrypted Redis and Resend variables target Preview and Production.
  Therefore the incomplete PR-A branch must not receive a usable deployment.
- `README.md` still documents metadata-only email and submission receipts containing only response
  IDs. Repairs C-05 and C-06 must update those claims.
- The shell default Node 23.8.0 is unsupported. This run uses the verified Node 22.23.1 distribution
  recorded under Artifacts. No local Redis server or container runtime exists; local integration may
  skip, but GitHub Redis 7 must run all cases with zero skips before merge.
- Vercel documents that a Git push whose SHA was deployed previously creates no new Deployment and
  returns the last matching SHA deployment instead. The prerequisite ref reuses `02f73ef`; its only
  prior deployment is terminal `ERROR`, and GitHub reports no deployment for the new ref. This is the
  safe deduplication case in the guard proof. See
  `https://vercel.com/docs/project-configuration/project-settings#ignored-build-step`.
- The three initial implementation-agent turns produced no file artifacts before their bounded
  cutoff, so root integrated the planned packets locally. A later focused accessibility review was
  productive: it caught a runbook/test-name mismatch and replaced brittle fixed Tab counts with
  bounded keyboard traversal before C-07 was committed.
- The first final-head hostile pass found no blocker and no high application/history defect. It did
  catch two high release-process defects: GitHub/provider waits were not uniformly bounded, and a
  Vercel CLI promotion timeout could race an immediate rollback even though Vercel continues the
  timed-out operation. It also caught bearer-link copy, repeated accessible labels, partial email
  configuration, terminal ballot states, literal exact-head review ordering, missing push/parent
  guards, Redis skip proof, Preview target binding, and log-window precision before any candidate
  push. See `https://vercel.com/docs/cli/promote` and `https://vercel.com/docs/cli/rollback`.
- Both exact-head GitHub event suites passed at `222fc6d` (`29686383707` and `29686384879`), and each
  Redis job ran all 13 cases with zero skips. The exact Preview deployment
  `dpl_9adBbEwJcbszEJPvEy92kyrd2V87` was `READY`, but the valid-ID storage sentinel returned 500.
  The currently promoted Production deployment returns the same 500, so this is a pre-existing
  provider incident rather than a repair regression.
- The deployed Upstash REST hostname fails DNS resolution with `ENOTFOUND`. Vercel still held the
  218-day-old encrypted variables, but Marketplace inspection shows the only linked Redis resource,
  `redis-pink-door`, as `Uninstalled`. A new Upstash resource was not created because the team has
  not accepted that provider's Marketplace terms; this run must not accept legal terms for the owner.
- The already-authorized official Redis Marketplace provider offers a zero-cost 30 MB plan with a
  `REDIS_URL`, 100 operations/second, and no persistence or high availability. It is the only
  no-cost provider repair this run may provision autonomously. Hostile review correctly rejected it
  as Production storage: no persistence contradicts the recorded-vote and 30/90-day retention
  invariants, and 30 connections is unsafe for unconstrained serverless scale. It is scoped to
  Preview only while empty and may prove the PR, but Production promotion requires an owner-approved
  persistent provider or an explicit product-invariant change.
- Exact-head review caught that node-redis `socketTimeout` measures all TCP inactivity rather than a
  single command. A five-second value would churn healthy idle connections and briefly reject warm-
  process traffic. The repair now leaves healthy idle sockets alone and applies a five-second
  command-scoped deadline that discards only the timed-out client without retrying the mutation.
- The first pushed repaired candidate caused GitHub to add a 29th, current review thread: shared
  `validation.ts` imported `resultsToken.ts`, whose hashing helpers import `node:crypto`, while the
  ballot client imports validation limits. The current build tree-shook the server code and passed,
  but the emitted ballot chunk contained `crypto-browserify`. Pure token-format validation is now
  split from server-only hashing; a fresh build contains no `crypto-browserify`, `createHash`, or
  `timingSafeEqual` marker in `.next/static/chunks` or the vote client manifest.
- The reply-by-reply disposition audit found two fixes whose direct regressions had disappeared when
  the giant rewrite replaced the original mock, plus two outside-diff UI fixes that lacked direct
  browser assertions. Green aggregate gates did not reveal that evidence loss. Restoring all four
  cases before resolution raised the final unit count to 149 and browser count to 19.
- PR #5 has 12 unresolved threads at the start of C-10 closeout: five current and seven outdated.
  Three current comments require small repository corrections; the CI job-name and mock-credential
  comments are evidence-backed false positives. Every thread still needs a reply and resolution.
- `@upstash/redis` retries failed requests five times by default. Retrying a mutating Lua command can
  repeat an indeterminate create or vote. In pinned version 1.35.8, even `retry: false` makes two
  attempts; the Production adapter must set `retry: { retries: 0 }` and create a fresh five-second
  abort signal for every request. A real-SDK fetch-boundary regression proves both facts.
- The Vercel integration CLI normally connects a new Marketplace resource to Development, Preview,
  and Production. Provision Upstash disconnected (or with `--no-connect --no-env-pull`) and attach
  only the two REST credentials to Production after reviewing their names without printing values.
- The five public aliases still point at old SHA `75f432d`, whose valid-ID storage sentinel is broken.
  It is not a safe recovery target. Before merging, redeploy the exact green PR #5 Preview deployment as a
  hidden production-target deployment, prove it `READY` and healthy, and prove aliases did not move.
- During the 2026-07-20 C-10 closeout, Node processes entered macOS uninterruptible I/O before
  Vitest or TypeScript printed a startup banner in both the isolated worktree and the unchanged main
  checkout. Every wait was capped at 30 seconds and abandoned processes were signaled; this is an
  environment non-start, not a test result. A direct real-SDK probe independently proved one fetch
  for `retries: 0`, and three static hostile reviews cleared the code. Fresh-install exact-head
  GitHub CI is the executable gate; the plan must not claim a local full-gate pass for this commit.

## Decision Log

- Decision (2026-07-18): Use two PRs and preserve published history. Rationale: this is the smallest
  review stack that isolates `de8af4a` without cherry-picking, squashing, or rebuilding its parent.
- Decision (2026-07-19): Start with five coherent repair commits for six planned behavioral outcomes.
  Cache privacy and atomic poll creation share one route/storage boundary and belong together.
  Hostile review produced two transparent follow-up commits rather than rewriting already reviewed
  local commits. Commit count is not used as a test boundary.
- Decision (2026-07-19): Use a validation ladder. Agents run focused proofs; root runs typecheck at
  the backend handoff and the complete local gate once on the integrated PR #4 head. Remote full CI
  runs on PR #4, the completed PR-A head, and final default. Rationale: repeated full gates after
  every small commit add latency without adding distinct evidence.
- Decision (2026-07-19): Parallelize only file-disjoint work. Storage owns poll/Redis/vote files
  through C-05; accessibility owns CSS/E2E after C-03; notification may build its new timeout helper
  in parallel but cannot edit the vote route until storage relinquishes it.
- Decision (2026-07-19): Keep CI trigger configuration unchanged during the rescue. Batch all local
  repair commits before each push. A separate follow-up may restrict `push` CI to default.
- Decision (2026-07-19): Do not require a GitHub approval that the repository itself does not require.
  Require final exact-head history, application/security, and CI reviews instead. Any live
  `CHANGES_REQUESTED` review or newly enabled rule remains a hard stop.
- Decision (2026-07-19): The `AGENTS.md` email rule supersedes the older metadata-only decision.
  Email contains escaped vote details, no private results link, and uses the exact submission ID as
  Resend's idempotency key.
- Decision (2026-07-19): Suppress only the unsafe PR-A branch build, restore the prior Vercel setting
  before PR #4 merges into it, and disable automatic custom-domain assignment only during the final
  staged Production release.
- Decision (2026-07-19): Permit evidence-only pushes after remote facts exist. PR #4 needs one code
  candidate push and one evidence closeout push because threads may be resolved only after the code
  gate passes. After the inner merge, commit C-10 evidence to PR-A before its single final gate.
  Final exact-head CI results and C-11/C-12 happen after their repository evidence commits or final
  repository SHA exist, so their canonical durable record is the relevant PR body and linked final
  comment. This avoids circular evidence commits, a third PR, or a docs-only commit that would
  silently change the released SHA.
- Decision (2026-07-19): Request promotion/rollback asynchronously and poll provider status plus the
  exact alias binding. A CLI timeout never authorizes a competing mutation because official Vercel
  behavior continues the original operation after the client stops waiting.
- Decision (2026-07-19): Recover the pre-existing storage outage without weakening fail-closed
  behavior. Add a lazy Redis-protocol adapter selected by `REDIS_URL` and preserve the existing
  Upstash REST adapter as a fallback. `REDIS_URL` wins when both configurations exist so stale
  orphaned Upstash variables cannot mask a healthy linked resource. The protocol client uses a
  five-second connect timeout with at most two bounded reconnect attempts, plus a separate five-
  second deadline around each storage command. A timed-out command discards its client and is not
  transparently retried. A cold failure may span multiple timed attempts plus backoff; five seconds
  is not a total request bound. Lua and DTO semantics remain provider-independent. Use the already-
  authorized official Redis free plan only for empty Preview verification. It is not Production
  authorization; a paid persistent plan, new-provider terms, or weakened durability invariant
  requires the owner.
- Decision (2026-07-19): The permitted run ends after PR #4 is merged into PR-A and PR-A's exact-head
  CI and Preview proof pass. Leave PR #5 draft. C-11 and every command that can ready PR #5, merge
  default, change domain assignment, create a Production deployment, promote, or roll back are
  blocked until four facts are recorded: fresh owner authorization, an approved persistent provider,
  fresh credentials scoped only to Production, and an approved staged sentinel/promotion/recovery
  plan.
- Decision (2026-07-20): Use Upstash Free as the Production store. Create
  `whatitdo-upstash-production` in `us-east-1` with no read replica, eviction, Prod Pack, keepalive,
  or automatic paid upgrade. Treat 400,000 monthly commands, 204.8 MB, or 8 GB bandwidth as the
  80-percent stop/review thresholds. If the database is archived after inactivity, restore manually
  and do not reconnect it until the application expiration invariants are re-proven.
- Decision (2026-07-20): Combine the Upstash retry/timeout safety correction, four review
  fixes, and C-10 evidence into one closure commit. The intended complete local gate hit the recorded
  macOS kernel-I/O non-start; use the inherited full gate, direct pinned-SDK proof, three clean
  hostile reviews, and one mandatory fresh-install exact-head GitHub/Preview gate. Repetition of the
  same known-stuck local runner is ceremony, not evidence.
- Decision (2026-07-20): Use the exact PR #5 tree to build the hidden healthy fallback before merge.
  Disable automatic domain assignment, require aliases to remain byte-for-byte unchanged, and make
  no competing provider mutation while a deploy or promotion is indeterminate. A hidden deployment
  is not Instant-Rollback eligible, so recovery promotes the proven fallback once and polls it like
  any other promotion; it never invokes Vercel rollback against the old broken deployment.
- Decision (2026-07-20): Merge race-safely. A normal two-parent merge commit must be based on the
  observed default tip and pushed without force; a concurrent default update must reject the push.
  If default moves once, merge it into PR #5 and repeat the exact-head proof. A second move stops the
  release for owner review.
- Decision (2026-07-20): Do not repeat a local runner that enters uninterruptible I/O before test
  startup. Preserve the earlier complete local gate on the identical inherited tree, require the
  focused real-SDK behavior proof and clean hostile reviews for the small closure patch, then make
  fresh-install exact-head GitHub CI mandatory before any thread resolution, provider connection,
  ready/merge, or deployment mutation. This is an explicit evidence substitution, not a green local
  result.

## Outcomes & Retrospective

Planning outcome: the executable unit is a coherent behavior packet, not an arbitrary line count or
one-file microticket. The run has five planned repair commits plus explicit hostile-review follow-up,
two implementation waves, a final integrated local gate, and one intentional code-candidate push.
Evidence-only commits are allowed where remote proof cannot exist earlier. The 2026-07-20 run is now
authorized through Production using Upstash Free. Repository evidence stops at the one PR #5 closure
commit; later CI, provider, merge, deployment, promotion, and delayed-log evidence belongs in the PR
body and an idempotently updated release-evidence comment so documentation does not create another
untested release SHA.

Execution outcome through the inner merge: PR #4 completed at `9ac0fa9`, passed both exact-head CI
event suites and Preview proof, received 29 evidence replies, and reached zero unresolved threads.
GitHub merged it into draft PR #5 as `ca1d217`; the merge parents and identical tree are proven.
Default, public aliases, Production environment metadata, automatic domain assignment, and the
current Production deployment were unchanged at the pre-merge freeze. C-10 remains open only for
this PR #5 evidence commit's guarded push, exact CI/Preview/review proof, and final unchanged-state
comparison.

## Context and Orientation

C-01 through C-09 ran on `claude/repo-audit-completion-plan-uau7sr`; its final proven head is
`9ac0fa9`. C-10 continues on draft branch `pr4-audit-prerequisites`, whose inner merge is `ca1d217`.
The merge's first parent `02f73ef` is the tip after the first 16 commits. The repository default is
`claude/voting-suggestions-app-01QZyxebMi27ePup8cniRCws` at `75f432d`.

The active isolated PR #5 worktree starts at `ca1d217` and contains exactly the seven intended closure
paths named in C-10. The main checkout separately contains the user's untracked
`docs/SPARK_REPAIR_EXEC_PLAN.md`; preserve it and never stage from that checkout. Use explicit paths
for every commit.

The public poll route is `src/app/api/poll/route.ts`. Redis selection, Lua, and typed storage
boundaries live in `src/lib/redis.ts`; the test/E2E adapter is `src/lib/inMemoryRedis.ts`. Vote
persistence and email orchestration live in `src/app/api/vote/route.ts`. The browser regression suite
is `e2e/poll-flows.spec.ts`.

## Plan of Work

### Granularity contract

A work packet is large enough to produce one observable behavior and small enough for one owner to
hold every changed production interface. Do not split a packet merely to satisfy a line or file cap.
Split only when two owners would edit the same file, an unresolved design choice appears, or a
focused proof cannot identify which behavior failed.

Each packet checklist names: behavior, exclusive paths, interface, targeted proof, integration
handoff, and stop rule. Root alone changes plan/review ledger state, integrates commits, pushes,
merges, and operates provider settings.

### Wave 0: control plane and baseline

#### C-01 — Activate the plan

- Owner: root.
- Paths: `docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md`, `AGENTS.md`, `docs/FINISH_EXEC_PLAN.md`.
- Outcome: repository guidance names this file as the active repair plan and records that it
  supersedes the older finish plan only for PR #4 repair/release.
- Proof: the activation commit contains exactly those three paths.
- Stop: do not include either modified test or `docs/SPARK_REPAIR_EXEC_PLAN.md`.

#### C-02 — Establish the two-PR stack

- Owner: root.
- Install and read back a branch-specific Vercel Ignored Build Step for
  `pr4-audit-prerequisites`; preserve the previous null setting for rollback.
- Push remote branch `pr4-audit-prerequisites` at exactly `02f73ef` without switching the dirty
  worktree. Verify the attempted deployment is canceled and exposes no usable URL.
- Open draft PR-A against the repository default. Require draft state, no auto-merge, 16 commits,
  and the exact 28-path comparison.
- Snapshot all PR #4 review-thread IDs/states, retarget PR #4 to PR-A, and verify its merge-base is
  `02f73ef` and its displayed starting diff is `de8af4a`.
- Stop: any OID drift, unexpected existing branch, usable incomplete Preview, or Vercel/GitHub auth
  failure stops remote mutation. Local implementation may continue.

#### C-03 — Restore trustworthy baseline evidence

- Owner: root.
- Paths: `e2e/poll-flows.spec.ts`, `src/lib/redis.integration.test.ts`.
- Outcome: explicit `string` IP parameter, numeric Redis `hExists` expectation, and app-specific
  alert locator.
- Proof: `npm run typecheck`; focused Redis test when Redis exists; Playwright ambiguous-retry grep
  at the integrated browser boundary.

### Wave 1: parallel, file-disjoint implementation

#### C-04 — Private and atomic poll creation

- Owner: storage agent.
- Paths: `src/app/api/poll/route.ts`, `src/app/api/poll/route.test.ts`, `src/lib/redis.ts`,
  `src/lib/inMemoryRedis.ts`, `src/lib/redis.test.ts`, `src/lib/redis.upstash.test.ts`, and
  `src/lib/redis.integration.test.ts`.
- Interface: `createPollAtomically(poll: StoredPoll)` returns `created` or `namespace_conflict`.
  Redis Lua and the in-memory adapter check `poll:{id}`, `poll:{id}:responses`, and
  `poll:{id}:submissions` together; a free namespace writes metadata with the idle TTL, while any
  occupied companion key changes nothing.
- Route behavior: consume the create rate bucket once, generate at most three fresh ID/token pairs,
  retry only `namespace_conflict`, and return successful token-bearing responses with
  `Cache-Control: private, no-store, max-age=0`.
- Focused proof: poll route tests; Redis unit/Upstash tests; Redis 7 integration test in CI.
- Stop: never delete or overwrite a colliding namespace and never reuse a token across attempts.

#### C-05 — Bind a retry ID to its normalized ballot

- Owner: storage agent, continuing exclusive ownership of Redis and vote route files.
- Paths: C-04 Redis files plus `src/app/api/vote/route.ts`, its test, and new
  `src/lib/submissionDigest.ts` with its test.
- Interface: `createSubmissionDigest` returns SHA-256 of
  `JSON.stringify(['vote-v1', voterName, [[text, vote, comment]...], counterProposal ?? ''])` using
  server-normalized values. `AppendVoteInput` adds `submissionDigest`; submission receipts are JSON
  `{ responseId, digest }`; `AppendVoteResult` adds `idempotency_conflict`.
- Ordering: equal digest returns `duplicate` before identity/rate/capacity checks. Changed digest or
  a legacy plain receipt returns `idempotency_conflict` before mutation and maps to HTTP 409. It
  never sends email.
- Focused proof: digest tests, vote route tests, Redis unit/Upstash tests, Redis 7 integration in CI.
- Stop: the client never supplies or controls the digest.

#### C-07 — Forced-colors keyboard focus

- Owner: accessibility agent after C-03 is committed.
- Paths: `src/app/globals.css`, `e2e/poll-flows.spec.ts`.
- Behavior: in forced-colors mode, keyboard-focused inputs, textareas, buttons, and links retain a
  visible system-color outline after the ordinary `input:focus` rule.
- Focused proof: Playwright emulates forced colors, focuses controls by keyboard, and asserts
  computed outline style and width.
- Stop: do not alter ordinary color design or use color alone as the focus indicator.

#### C-08a — Recover the dead deployed Redis provider path

- Owner: root for existing files; one test agent owns only new `src/lib/redis.protocol.test.ts`.
- Paths: `src/lib/redis.ts`, `src/lib/redis.protocol.test.ts`, `src/lib/redis.test.ts`,
  `package.json`, `package-lock.json`, `.env.example`, `README.md`, this plan, and the audit/ledger
  only when recording final evidence.
- Runtime behavior: keep test-only in-memory selection unchanged. In all other processes, prefer a
  non-empty `REDIS_URL` and adapt node-redis to the existing four-command `RedisLike` boundary;
  otherwise use the existing Upstash REST URL/token pair. Construct clients lazily, connect only on
  the first command, reuse one successful connection, use a five-second connect timeout with at most
  two bounded reconnect attempts, and wrap each storage command in a separate five-second deadline.
  Attach a credential-free error listener, clear a rejected connection promise, and discard a client
  whose command times out so a later request can connect cleanly. Never transparently retry an
  ambiguous mutation. Do not claim a five-second total cold-failure bound because connection retries
  and backoff may extend it. Preserve `SET` expiration, `LRANGE`, and Lua key/argument semantics.
- Provider behavior: provision only the already-authorized official Redis `$0` plan, never select a
  paid tier, bind its credential to Preview only while the database is empty, and verify the
  project/environment names without printing values. Existing deployments retain old environment
  snapshots, so require a fresh exact-SHA Preview after the provider connection exists. Never expose
  a Preview-tested credential to Production; persistent Production storage remains an owner gate.
- Proof: focused Redis selection/protocol/Upstash/unit tests; typecheck and lint; complete local gate;
  both exact-head GitHub event suites with all 14 Redis 7 cases and zero skips; exact Preview
  metadata equality; valid-ID read-only sentinel returns 404 with `Poll not found` and no redirect.
- Stop: no production in-memory fallback, no credential output, no acceptance of new provider terms,
  no paid plan, no weakening the valid-ID sentinel, no merge while Preview returns 500, and no final
  default merge or Production promotion until a persistent provider is owner-approved and verified.

#### C-06a — Build the timeout primitive

- Owner: notification agent, parallel with C-04/C-05. Return a patch or a local commit that root
  applies without committing; C-06a and C-06b become one coherent C-06 repair commit.
- Paths: new `src/lib/withTimeout.ts` and `src/lib/withTimeout.test.ts` only.
- Interface: `withTimeout<T>(promise, timeoutMs)` rejects at the deadline, clears its timer, and
  consumes any late rejection from the provider promise.
- Focused proof: success, rejection, timeout, timer cleanup, and late-rejection tests.
- Stop: notification agent does not edit vote route files until storage relinquishes them.

### Wave 2: notification integration

#### C-06b — Send truthful, bounded vote-detail email

- Owner: notification agent after C-05 handoff; root owns `README.md` wording.
- Agent paths: `src/app/api/vote/route.ts`, its test, `src/lib/withTimeout.ts`, and its test.
- Root-only integration path: `README.md`.
- Behavior: after persistence, email contains escaped poll title, alias, every suggestion/choice/
  comment, and optional counterproposal. Its subject and HTML body do not interpolate the destination
  address, poll/response IDs, token/hash, results link, or raw markup; the provider envelope still
  necessarily contains `to`. Resend receives `{ idempotencyKey: submissionId }`. The wait for the
  provider is bounded to 5 seconds; timeout, thrown error, or resolved error returns `failed` without
  undoing the vote. Validation and persistence time are outside that provider-wait bound.
- Documentation: describe digest-bearing receipts and detailed-but-link-free email.
- Focused proof: timeout tests, escape tests, vote route tests.
- Stop: do not make notification a prerequisite for recording a vote.

### Wave 3: integration, review, and release

#### C-08 — Integrated local candidate

- Root cherry-picks/integrates packet commits in order C-04, C-05, C-06a/C-06b, C-07. Fold C-06a
  into C-06b before committing so the repair train remains five commits including the C-03 baseline
  correction.
- Run focused tests during integration. Then run one complete local gate under Node 22.
- Dispatch exact-head history, application/security, and CI reviewers. Fix blocker/high findings and
  rerun only affected focused proofs, followed by the complete gate once on the final candidate.
- Update this plan and `docs/PR4_REVIEW_THREADS.md` before the push.

#### C-09 and C-10 — GitHub finish and permitted inner merge

- Push the complete repair train once. Require both automatically generated CI event suites green on
  the exact code head because earlier events disagreed on E2E.
- Reply to every PR #4 thread with commit/test evidence, resolve it, and refetch until unresolved is
  zero. Explain license-only and false-positive findings rather than changing code for them.
- Commit the updated plan and review ledger as an evidence-only PR #4 closeout, push once, and require
  both CI event suites and the Preview sentinel again on that final exact head.
- Restore the Vercel Ignored Build Step, merge PR #4 into PR-A with expected-head protection, prove
  tree equality/ancestry, and require the completed PR-A CI and Preview sentinel.
- Leave PR #5 draft at the C-10 checkpoint. Record the PR-A head, CI runs, Preview deployment,
  sentinel result, and unresolved-thread count. Continue only through the active C-11 runbook after
  every C-10 proof and the provider/account checkpoint pass.

#### C-11 and C-12 — owner-authorized Production release

- Use the recorded Upstash Free decision, fresh Production-only credentials, and the active staged
  sentinel/fallback/promotion sequence. Pause only for interactive provider terms or MFA.
- After the provider probe passes, disable automatic custom-domain assignment and create/prove the
  exact PR #5 hidden Production fallback while every alias remains unchanged. Then mark PR #5 ready,
  push the race-safe local two-parent merge, require exact default CI and a staged
  `target=production` deployment, run the generated-host sentinel, promote, and rerun the public
  sentinel.
- Record final SHAs, URLs, check outcomes, deployment and fallback-recovery IDs, log window, and retrospective.

## Concrete Steps

Run from `/Users/hbpheonix/whatitdo` unless a disposable worktree is named.

### A. Immutable preflight

- [x] `gh auth status` succeeds for the repository owner account.
- [x] `git fetch origin --prune` completed.
- [x] PR #4 base/head are `75f432d`/`de8af4a`; `de8af4a^` is `02f73ef`.
- [x] Merge commits are allowed; rulesets are empty; default protection returns not protected.
- [x] Remote `pr4-audit-prerequisites` is absent.
- [x] Vercel identity is `phazzie`; exact project/team/production branch match this plan.
- [x] Vercel Preview is protected but shares secret targets with Production, requiring the branch
  guard.
- [x] Node 22.23.1 checksum and executable version were verified.
- [x] Before the integrated full gate, select Node 22 and assert both direct Node and npm's child
  process resolve to `v22.23.1`:

      export WHATITDO_NODE22_BIN=/private/tmp/whatitdo-node22.NCpP5f/node-v22.23.1-darwin-x64/bin
      export PATH="$WHATITDO_NODE22_BIN:$PATH"
      test "$(node -p 'process.version')" = v22.23.1
      test "$(npm exec -- node -p 'process.version')" = v22.23.1

- [x] The temporary runtime remained present, so no fallback download was needed. If it is missing
  on resume, reproduce it without changing system Node:

      WHATITDO_NODE22_DIR=$(mktemp -d /private/tmp/whatitdo-node22.XXXXXX)
      curl -fsSLo "$WHATITDO_NODE22_DIR/node-v22.23.1-darwin-x64.tar.gz" \
        https://nodejs.org/dist/v22.23.1/node-v22.23.1-darwin-x64.tar.gz
      printf '%s  %s\n' \
        b8da981b8a0b1241b70249204916da76c63573ddf5814dbd2d1e41069105cb81 \
        "$WHATITDO_NODE22_DIR/node-v22.23.1-darwin-x64.tar.gz" \
        | shasum -a 256 -c -
      tar -xzf "$WHATITDO_NODE22_DIR/node-v22.23.1-darwin-x64.tar.gz" \
        -C "$WHATITDO_NODE22_DIR"
      export WHATITDO_NODE22_BIN="$WHATITDO_NODE22_DIR/node-v22.23.1-darwin-x64/bin"
      export PATH="$WHATITDO_NODE22_BIN:$PATH"

### B. Activation and stack

- [x] Patch `AGENTS.md` and `docs/FINISH_EXEC_PLAN.md` to route repair work here.
- [x] Stage exactly the three C-01 files; inspect `git diff --cached --check`; commit
  `Activate lean PR #4 repair plan`.
- [x] Read the current Vercel project setting, then set and read back:

      if [ "$VERCEL_GIT_COMMIT_REF" = "pr4-audit-prerequisites" ]; then exit 0; else exit 1; fi

- [x] Push `02f73ef:refs/heads/pr4-audit-prerequisites` without checking out that branch.
- [x] Verify no usable Vercel deployment exists for that branch.
- [x] Open PR-A as draft PR #5 against the default branch and record its number/URL.
- [x] Export PR #4 thread state, retarget PR #4 to `pr4-audit-prerequisites`, and verify OIDs/diff.
- [x] Commit C-03 with only the two existing test files.

### C. Implementation and local validation

- [x] Create isolated worktrees/branches for storage, timeout, and accessibility at the C-03 head.
- [x] Dispatch C-04/C-05, C-06a, and C-07 with exclusive ownership and a ten-minute turn limit.
- [x] Integrate C-04 and run poll/Redis focused tests.
- [x] Integrate C-05 and run digest/vote/Redis focused tests plus typecheck.
- [x] Start C-06b from the C-05 head; integrate it and update README.
- [x] Integrate C-07 and run the forced-colors and ambiguous-retry browser cases.
- [x] Run `git diff --check` and inspect the complete diff for secrets and unrelated files.
- [x] Under Node 22 run:

      npm run lint
      npm run typecheck
      npm test
      npm run test:integration
      CI=1 npm run e2e
      npm run build
      npm audit --audit-level=high

- [x] Record local totals and the allowed local Redis skip; CI must later show zero Redis skips.
  Lint, typecheck, build, and audit passed; audit found zero vulnerabilities; Vitest reported 125
  passed and 13 Redis-only skips; the explicit integration run reported all 13 cases skipped without
  `REDIS_URL`; Playwright reported 17/17 passed. Coverage passed at 91.27% statements, 85.71%
  branches, 97.61% functions, and 94.47% lines.
- [x] Implement C-08a dual-provider selection and focused protocol-adapter proof. The protocol,
  Upstash, and core Redis files pass 49 focused tests and the adapter passes TypeScript validation.
- [x] Provision/connect only the already-authorized official Redis free plan; its direct read passed
  and `REDIS_URL` is bound to Preview only without displaying its value.
- [x] Rerun the complete local gate after C-08a. Under Node 22, lint, typecheck, build, and audit
  passed; audit found zero vulnerabilities; Vitest reported 147 passed and the permitted 14 local
  Redis skips; the explicit integration run reported the same 14 skips without `REDIS_URL`;
  Playwright reported 17/17 passed. Coverage passed at 90.95% statements, 85.11% branches, 96.33%
  functions, and 94.43% lines.
- [x] Add the adapter-mediated Redis 7 integration case. The focused workflow passed against the
  empty Preview database with its credential injected transiently and not printed: one selected test
  passed and the 13 unrelated cases were filtered. Require all future exact-head Redis CI jobs to
  run the complete file and report 14 passed with zero skips.
- [x] Split browser-safe results-token format checks from server-only hashing. Fifty-two focused
  token/validation/results-route tests, lint, typecheck, production build, and 17/17 E2E pass. The
  fresh emitted-client scan contains none of the three server-crypto markers found before the split.
- [x] Audit every proposed thread reply against its required evidence. This found that the giant
  rewrite had deleted the direct negative-`LRANGE` and plain-`SET` TTL regressions even though the
  replacement adapter behavior was correct. It also found that the implemented create/vote API-
  error propagation from CodeRabbit's outside-diff review lacked direct browser assertions. All
  four focused checks are restored and pass locally before thread or top-level disposition.
- [x] Obtain final exact-head history, application/security, and CI reviews. Three lanes explicitly
  cleared `2da1d00` after its 149-case coverage and focused browser proof.

### D. PR #4 proof and cleanup

- [x] Updated pre-push plan/ledger state and pushed final code head `2da1d00` with a guarded parent.
- [x] Required successful `push` and `pull_request` runs on the exact code SHA: build, 14/14 Redis,
  and 19/19 E2E passed in runs `29690493749` and `29690494814`.
- [x] Required Vercel Preview `READY`, metadata SHA equality, and an authenticated, no-redirect,
  read-only 404 sentinel.
- [x] Replied to and resolved all 29 review threads (28 baseline plus the boundary thread); the full
  refetch reports zero unresolved.
- [x] Required no current `CHANGES_REQUESTED` review. The review decision is empty and all submitted
  reviews are comments; no approval requirement was invented.
- [x] Recorded the green run IDs, Preview ID, replies, and zero-thread result in the plan/ledger;
  committed and pushed only those evidence files as `9ac0fa9`.
- [x] Required both CI event suites, no current change request, zero unresolved threads, deployment
  SHA equality, and the Preview sentinel again on evidence head `9ac0fa9`. This is PR #4's merge
  head.

### E. Permitted inner merge and owner-gated Production

- [x] Restored the prior null Vercel Ignored Build Step and verified readback while automatic domain
  assignment remained `true`.
- [x] Rechecked PR #4 base/head OIDs and merged with `--merge --match-head-commit 9ac0fa9`.
- [x] Proved PR #4 head `9ac0fa9` is the second parent and an ancestor of PR-A merge `ca1d217`, and
  both trees are identical.
- [x] Updated this plan through the inner merge in this PR-A evidence commit. Its guarded push and
  readback are the next checklist item.
- [ ] Push this single evidence commit with remote parent `ca1d217`, then require completed PR-A CI,
  zero unresolved PR-A threads, no current change request, and the exact-host Preview sentinel on
  that evidence head.
- [ ] Leave PR #5 draft at the C-10 checkpoint. Record the PR-A exact head and Preview evidence;
  confirm default, Production credentials, domain assignment, aliases, and the current Production
  deployment did not change during C-10, then continue only if the active C-11 preconditions pass.

- [x] Record fresh owner authorization to resume C-11 and identify PR #5 as its durable evidence
  location.
- [x] Record Upstash Free as the owner-approved Production provider/tier and record its archive,
  quota, availability, and manual-recovery limitations without claiming stronger durability.
- [ ] Install fresh credentials scoped to Production only; prove their project/environment names
  without printing values. `REDIS_URL` must be absent from Production so stale protocol credentials
  cannot override the new REST credentials; Preview remains unchanged.
- [x] Record owner approval of the staged release plan: keep aliases on the prior deployment, probe
  the provider directly with unique fake data, build a hidden healthy fallback from the exact PR #5
  tree, and promote only after both provider and generated-host sentinels pass.
- [ ] OWNER GATE COMPLETE: after credentials and the provider probe pass, mark PR-A ready, read back
  `isDraft=false`, and recheck its exact base/head OIDs.
- [ ] Recheck the live default OID. If it moved, merge that tip into PR-A and rerun PR-A proof.
- [ ] Set Vercel `autoAssignCustomDomains=false`; snapshot every alias and create a hidden
  production-target deployment from the exact PR #5 Preview deployment. Require `READY`, exact SHA,
  exact project/target, a healthy generated-host sentinel, and unchanged aliases. This hidden
  deployment is the recovery target because the currently promoted deployment is unhealthy.
- [ ] Create a local two-parent merge from the observed default tip and exact PR-A head, push it to
  default normally with no force, and verify first-parent/ancestry/default tip. A concurrent default
  update must reject this push.
- [ ] Require final default push CI green and locate the exact-SHA `target=production`, `READY`,
  staged deployment while public domains remain on the prior deployment.
- [ ] Run the read-only generated-host sentinel, promote the exact deployment, verify public-domain
  binding, and rerun the sentinel on `https://www.whatitdo.xyz`.
- [ ] Restore `autoAssignCustomDomains` to its captured pre-release value on every determinate
  coherent exit; preserve the freeze only for a documented mixed-alias inconsistency.
- [ ] Scan exact-deployment runtime errors immediately and again after one hour; record both results.
- [ ] Append the C-11/C-12 checklist disposition, exact evidence, and retrospective to PR-A's
  `Release evidence` body section and a final comment. Link the comment from the body. This merged PR
  record is the post-release extension of this ExecPlan; do not create a third deployment merely to
  backfill the repository copy.

## Remote Command Runbook

Use these task-specific variables in a fresh shell. Never put a credential in a command, plan,
comment, or captured output.

    set -euo pipefail
    export WHATITDO_REPO=Phazzie/WhatItDo
    export WHATITDO_PR_A=5
    export WHATITDO_DEFAULT_BRANCH=claude/voting-suggestions-app-01QZyxebMi27ePup8cniRCws
    export WHATITDO_FIRST16=02f73efef6b57242073cc0573e105dd835b5009f
    export WHATITDO_PR4_BRANCH=claude/repo-audit-completion-plan-uau7sr
    export WHATITDO_PR_A_BRANCH=pr4-audit-prerequisites
    export WHATITDO_PROJECT_ID=prj_xO6lqwoneBD6PJSVxNbMtFuvmCO6
    export WHATITDO_VERCEL_SCOPE=phazzies-projects
    export WHATITDO_VERCEL=/Users/hbpheonix/.local/bin/vercel

### Vercel guard, prerequisite ref, and PR retarget

Read and assert the starting provider state, then install the narrow ignored-build command. Exit
zero means Vercel cancels that branch build; every other branch exits nonzero and builds normally.

    WHATITDO_PROJECT_JSON=$(
      "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw
    )
    jq -e \
      --arg branch "$WHATITDO_DEFAULT_BRANCH" \
      '.commandForIgnoringBuildStep == null and
       .autoAssignCustomDomains == true and
       .link.productionBranch == $branch' \
      <<<"$WHATITDO_PROJECT_JSON"
    export WHATITDO_IGNORE_CMD='if [ "$VERCEL_GIT_COMMIT_REF" = "pr4-audit-prerequisites" ]; then exit 0; else exit 1; fi'
    "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
      -f "commandForIgnoringBuildStep=$WHATITDO_IGNORE_CMD" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e --arg expected "$WHATITDO_IGNORE_CMD" \
          '.commandForIgnoringBuildStep == $expected'

Create the prerequisite ref only when it is absent, and bind it to the reviewed SHA without checking
out or force-pushing it.

    test -z "$(git ls-remote --heads origin "$WHATITDO_PR_A_BRANCH")"
    test "$(git rev-list --count "origin/$WHATITDO_DEFAULT_BRANCH..$WHATITDO_FIRST16")" = 16
    test "$(git diff --name-only "origin/$WHATITDO_DEFAULT_BRANCH...$WHATITDO_FIRST16" | wc -l | tr -d ' ')" = 28
    git push origin "$WHATITDO_FIRST16:refs/heads/$WHATITDO_PR_A_BRANCH"
    test "$(git ls-remote origin "refs/heads/$WHATITDO_PR_A_BRANCH" | cut -f1)" = \
      "$WHATITDO_FIRST16"

Poll in communicated intervals for the exact PR-A branch and first-16 SHA. For a never-deployed SHA,
the exact deployment must appear and reach terminal `CANCELED`; absence is not success. Vercel's
documented exception is a SHA deployed previously: no new Deployment is created and the last matching
SHA deployment is returned. In that case require zero GitHub deployments for the new ref and require
every prior matching-SHA Vercel deployment to be terminal and non-READY. Any ambiguous, `BUILDING`,
or `READY` state blocks PR creation and retargeting. Inspect only safe fields.

    WHATITDO_DEPLOYMENTS=$(
      "$WHATITDO_VERCEL" api \
        "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw
    )
    WHATITDO_GITHUB_DEPLOYMENTS=$(gh api --method GET \
      "repos/$WHATITDO_REPO/deployments" \
      -f ref="$WHATITDO_PR_A_BRANCH" -f per_page=100)
    jq -e --arg ref "$WHATITDO_PR_A_BRANCH" --arg sha "$WHATITDO_FIRST16" \
      --argjson github "$WHATITDO_GITHUB_DEPLOYMENTS" '
      [.deployments[] |
       select(.meta.githubCommitRef == $ref and .meta.githubCommitSha == $sha) |
       {uid, url, readyState, created, sha: .meta.githubCommitSha}] as $exact_ref |
      [.deployments[] |
       select(.meta.githubCommitSha == $sha) |
       {uid, url, readyState, created, ref: .meta.githubCommitRef}] as $same_sha |
      if ($exact_ref | length) >= 1 then
        (($exact_ref | sort_by(.created) | last).readyState == "CANCELED")
      else
        (($github | length) == 0 and ($same_sha | length) >= 1 and
         ($same_sha | all(.readyState != "READY" and .readyState != "BUILDING")))
      end
    ' <<<"$WHATITDO_DEPLOYMENTS"

Open PR-A with its post-release evidence anchor, record its number, and assert its immutable shape.

    WHATITDO_PR_A_URL=$(gh pr create --repo "$WHATITDO_REPO" --draft \
      --base "$WHATITDO_DEFAULT_BRANCH" --head "$WHATITDO_PR_A_BRANCH" \
      --title 'Audit prerequisites for repaired PR #4' \
      --body $'## Purpose\n\nReview the first 16 audit commits separately. PR #4 stacks the giant completion commit and repairs on this branch. Do not merge this draft until PR #4 has merged into it and the completed tree is green.\n\n## Release evidence\n\nPending final merge and deployment.')
    export WHATITDO_PR_A=${WHATITDO_PR_A_URL##*/}
    gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json isDraft,state,baseRefName,baseRefOid,headRefName,headRefOid,commits,files,autoMergeRequest \
      | jq -e \
          --arg base "$WHATITDO_DEFAULT_BRANCH" \
          --arg head "$WHATITDO_PR_A_BRANCH" \
          --arg sha "$WHATITDO_FIRST16" '
            .isDraft == true and .state == "OPEN" and
            .baseRefName == $base and .headRefName == $head and
            .headRefOid == $sha and
            (.commits | length) == 16 and (.files | length) == 28 and
            .autoMergeRequest == null'

Snapshot the complete, paginated PR #4 review state before retargeting. This query accepts an
explicit PR number and therefore works from any branch or detached worktree. Reuse it for PR-A by
changing only `WHATITDO_PROOF_PR`; do not depend on a plugin-cache path or branch inference.

    export WHATITDO_PROOF_PR=4
    WHATITDO_THREAD_PAGES=$(gh api graphql --paginate --slurp \
      -f owner=Phazzie -f repo=WhatItDo -F number="$WHATITDO_PROOF_PR" \
      -f query='query($owner:String!,$repo:String!,$number:Int!,$endCursor:String){repository(owner:$owner,name:$repo){pullRequest(number:$number){number reviewThreads(first:100,after:$endCursor){nodes{id isResolved isOutdated path line originalLine comments(first:100){nodes{id url author{login}}}} pageInfo{hasNextPage endCursor}}}}}')
    WHATITDO_PR4_REVIEW_JSON=$(jq -c '
      {number: .[0].data.repository.pullRequest.number,
       review_threads: [.[].data.repository.pullRequest.reviewThreads.nodes[]]}
    ' <<<"$WHATITDO_THREAD_PAGES")
    jq -e '
      (.number == 4) and
      ([.review_threads[] | select(.isResolved == false)] | length == 28)
    ' <<<"$WHATITDO_PR4_REVIEW_JSON"
    gh pr edit 4 --repo "$WHATITDO_REPO" --base "$WHATITDO_PR_A_BRANCH"
    gh pr view 4 --repo "$WHATITDO_REPO" \
      --json state,isDraft,baseRefName,baseRefOid,headRefName,headRefOid \
      | jq -e \
          --arg base "$WHATITDO_PR_A_BRANCH" \
          --arg base_oid "$WHATITDO_FIRST16" \
          --arg head "$WHATITDO_PR4_BRANCH" '
            .state == "OPEN" and .isDraft == false and
            .baseRefName == $base and .baseRefOid == $base_oid and
            .headRefName == $head'
    test "$(git merge-base "$WHATITDO_FIRST16" HEAD)" = "$WHATITDO_FIRST16"

### Exact-head GitHub proof and thread disposition

For each PR #4 candidate—the code candidate and the later evidence-only closeout—push exactly the
current head, read the remote ref back, and reset `WHATITDO_CANDIDATE_SHA`. Poll checks every 15
seconds with a hard ten-minute deadline; never use an unbounded `gh pr checks --watch`. Then
independently require one successful completed `CI` run for each event, all three named jobs, and a
Redis reporter total of 14 passed with no skipped tests in each run.

    export WHATITDO_PROOF_PR=4
    export WHATITDO_CANDIDATE_SHA=$(git rev-parse HEAD)
    git push origin "HEAD:refs/heads/$WHATITDO_PR4_BRANCH"
    test "$(git ls-remote origin "refs/heads/$WHATITDO_PR4_BRANCH" | cut -f1)" = \
      "$WHATITDO_CANDIDATE_SHA"
    wait_for_pr_checks() {
      WHATITDO_CHECK_PR=$1
      WHATITDO_CHECK_DEADLINE=$(( $(date +%s) + 600 ))
      while :; do
        if ! WHATITDO_CHECKS=$(gh pr checks "$WHATITDO_CHECK_PR" \
          --repo "$WHATITDO_REPO" --json name,bucket,link); then
          WHATITDO_CHECKS='[]'
        fi
        if jq -e 'length > 0 and all(.[]; .bucket == "pass" or .bucket == "skipping")' \
          <<<"$WHATITDO_CHECKS" >/dev/null; then
          break
        fi
        if jq -e 'any(.[]; .bucket == "fail" or .bucket == "cancel")' \
          <<<"$WHATITDO_CHECKS" >/dev/null; then
          jq '[.[] | {name, bucket, link}]' <<<"$WHATITDO_CHECKS"
          return 1
        fi
        if [ "$(date +%s)" -ge "$WHATITDO_CHECK_DEADLINE" ]; then
          jq '[.[] | {name, bucket, link}]' <<<"$WHATITDO_CHECKS"
          return 124
        fi
        sleep 15
      done
    }
    wait_for_pr_checks "$WHATITDO_PROOF_PR"
    WHATITDO_RUNS=$(gh api --method GET \
      "repos/$WHATITDO_REPO/actions/runs" \
      -f head_sha="$WHATITDO_CANDIDATE_SHA" -f per_page=100)
    for WHATITDO_EVENT in push pull_request; do
      WHATITDO_RUN_ID=$(jq -er --arg event "$WHATITDO_EVENT" '
        [.workflow_runs[] |
         select(.name == "CI" and .event == $event and
                .status == "completed" and .conclusion == "success")] |
        first | .id
      ' <<<"$WHATITDO_RUNS")
      WHATITDO_RUN_VIEW=$(gh run view "$WHATITDO_RUN_ID" \
        --repo "$WHATITDO_REPO" --json headSha,jobs)
      jq -e --arg sha "$WHATITDO_CANDIDATE_SHA" '
            .headSha == $sha and
            ([.jobs[] | {name, conclusion}] | sort_by(.name)) ==
            ([{"name":"build","conclusion":"success"},
              {"name":"e2e","conclusion":"success"},
              {"name":"redis-integration","conclusion":"success"}] |
             sort_by(.name))' <<<"$WHATITDO_RUN_VIEW"
      WHATITDO_REDIS_JOB_ID=$(jq -er \
        '.jobs[] | select(.name == "redis-integration") | .databaseId' \
        <<<"$WHATITDO_RUN_VIEW")
      WHATITDO_REDIS_LOG=$(gh run view "$WHATITDO_RUN_ID" \
        --repo "$WHATITDO_REPO" --job "$WHATITDO_REDIS_JOB_ID" --log)
      grep -Eq '14 passed.*\(14\)' <<<"$WHATITDO_REDIS_LOG"
      if grep -Eq 'Tests.*skipped' <<<"$WHATITDO_REDIS_LOG"; then
        exit 1
      fi
      if [ "$WHATITDO_EVENT" = push ]; then
        export WHATITDO_PUSH_RUN_ID=$WHATITDO_RUN_ID
      else
        export WHATITDO_PR_RUN_ID=$WHATITDO_RUN_ID
      fi
    done

Refetch threads with the same paginated helper. For each unresolved thread, prepare a concise body
that cites its repair commit and green run, or explains the license/false-positive disposition. Reply
first; only then resolve. Do not automate a generic response across materially different findings.

    gh api graphql \
      -f query='mutation($thread:ID!,$body:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$thread,body:$body}){comment{url}}}' \
      -F thread="$WHATITDO_THREAD_ID" -f body="$WHATITDO_THREAD_REPLY" \
      | jq -e '.data.addPullRequestReviewThreadReply.comment.url'
    gh api graphql \
      -f query='mutation($thread:ID!){resolveReviewThread(input:{threadId:$thread}){thread{id isResolved}}}' \
      -F thread="$WHATITDO_THREAD_ID" \
      | jq -e --arg id "$WHATITDO_THREAD_ID" \
          '.data.resolveReviewThread.thread.id == $id and
           .data.resolveReviewThread.thread.isResolved == true'

After all 29 dispositions, require zero unresolved and no latest per-reviewer change request.

    WHATITDO_FINAL_THREAD_PAGES=$(gh api graphql --paginate --slurp \
      -f owner=Phazzie -f repo=WhatItDo -F number="$WHATITDO_PROOF_PR" \
      -f query='query($owner:String!,$repo:String!,$number:Int!,$endCursor:String){repository(owner:$owner,name:$repo){pullRequest(number:$number){number reviewThreads(first:100,after:$endCursor){nodes{id isResolved isOutdated path line originalLine comments(first:100){nodes{id url author{login}}}} pageInfo{hasNextPage endCursor}}}}}')
    WHATITDO_FINAL_REVIEW_JSON=$(jq -c '
      {number: .[0].data.repository.pullRequest.number,
       review_threads: [.[].data.repository.pullRequest.reviewThreads.nodes[]]}
    ' <<<"$WHATITDO_FINAL_THREAD_PAGES")
    jq -e '[.review_threads[] | select(.isResolved == false)] | length == 0' \
      <<<"$WHATITDO_FINAL_REVIEW_JSON"
    gh api --paginate "repos/$WHATITDO_REPO/pulls/$WHATITDO_PROOF_PR/reviews" \
      | jq -s -e '
          add | sort_by(.submitted_at) | group_by(.user.login) | map(last) |
          [ .[] | select(.state == "CHANGES_REQUESTED") ] | length == 0'

After PR #4's evidence head proves green, and again after the final release for PR-A, create one
durable evidence comment and link it from the PR body. `WHATITDO_EVIDENCE_TEXT` must contain only
verified SHAs, run/deployment IDs or URLs, counts, outcomes, and the retrospective—never secrets or
user data. On recovery, reuse/edit the existing evidence comment rather than creating a duplicate.

    export WHATITDO_EVIDENCE_TEXT="Exact verified evidence for PR $WHATITDO_PROOF_PR at $WHATITDO_CANDIDATE_SHA"
    export WHATITDO_EVIDENCE_COMMENT_URL=$(gh pr comment "$WHATITDO_PROOF_PR" \
      --repo "$WHATITDO_REPO" --body "$WHATITDO_EVIDENCE_TEXT")
    WHATITDO_CURRENT_BODY=$(gh pr view "$WHATITDO_PROOF_PR" \
      --repo "$WHATITDO_REPO" --json body -q .body)
    WHATITDO_UPDATED_BODY=$(python3 -c 'import sys; body,url=sys.argv[1:3]; marker="## Release evidence"; prefix=body.split(marker,1)[0].rstrip(); print(f"{prefix}\n\n{marker}\n\n{url}\n")' \
      "$WHATITDO_CURRENT_BODY" "$WHATITDO_EVIDENCE_COMMENT_URL")
    gh api "repos/$WHATITDO_REPO/pulls/$WHATITDO_PROOF_PR" -X PATCH \
      -f body="$WHATITDO_UPDATED_BODY" \
      | jq -e --arg url "$WHATITDO_EVIDENCE_COMMENT_URL" '.body | contains($url)'

### Preview binding and permitted inner merge

Select a single `READY` deployment whose Git metadata matches the exact candidate. The authenticated
CLI probe automatically handles Preview protection and must return the intentional JSON 404 without
a redirect.

    WHATITDO_DEPLOYMENTS=$(
      "$WHATITDO_VERCEL" api \
        "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw
    )
    export WHATITDO_DEPLOYMENT_ID=$(jq -er \
      --arg sha "$WHATITDO_CANDIDATE_SHA" --arg project "$WHATITDO_PROJECT_ID" '
      [.deployments[] |
       select(.meta.githubCommitSha == $sha and .projectId == $project and
              .target != "production" and .readyState == "READY")] |
      if length == 1 then .[0].uid
      else error("expected exactly one READY Preview deployment for this project") end
    ' <<<"$WHATITDO_DEPLOYMENTS")
    WHATITDO_PROBE=$(
      "$WHATITDO_VERCEL" curl '/api/poll?id=AAAAAAAAAA' \
        --deployment "$WHATITDO_DEPLOYMENT_ID" --scope "$WHATITDO_VERCEL_SCOPE" -- \
        --silent --show-error --max-time 15 --max-redirs 0 \
        --write-out $'\n__STATUS__%{http_code}\n__REDIRECT__%{redirect_url}'
    )
    test "$(sed -n 's/^__STATUS__//p' <<<"$WHATITDO_PROBE")" = 404
    test -z "$(sed -n 's/^__REDIRECT__//p' <<<"$WHATITDO_PROBE")"
    sed '/^__STATUS__/,$d' <<<"$WHATITDO_PROBE" \
      | jq -e '.error == "Poll not found"'

Before the inner merge, restore the ignored-build setting to its recorded null value. Merge PR #4
only at the reviewed SHA, fetch PR-A, and prove the merge contains that SHA with an identical tree.

    printf '%s' '{"commandForIgnoringBuildStep":null}' \
      | "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
          --input - --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e '.commandForIgnoringBuildStep == null'
    git fetch origin --prune
    export WHATITDO_LIVE_PR_A=$(git ls-remote origin \
      "refs/heads/$WHATITDO_PR_A_BRANCH" | cut -f1)
    test "$WHATITDO_LIVE_PR_A" = "$WHATITDO_FIRST16"
    WHATITDO_PR4_STATE=$(gh pr view 4 --repo "$WHATITDO_REPO" \
      --json state,isDraft,baseRefName,baseRefOid,headRefOid)
    WHATITDO_PR_A_STATE=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json state,isDraft,headRefOid)
    jq -e --arg base "$WHATITDO_PR_A_BRANCH" --arg oid "$WHATITDO_LIVE_PR_A" '
      .state == "OPEN" and .isDraft == false and
      .baseRefName == $base and .baseRefOid == $oid
    ' <<<"$WHATITDO_PR4_STATE"
    jq -e --arg oid "$WHATITDO_LIVE_PR_A" '
      .state == "OPEN" and .isDraft == true and .headRefOid == $oid
    ' <<<"$WHATITDO_PR_A_STATE"
    export WHATITDO_PR4_HEAD=$(jq -er '.headRefOid' <<<"$WHATITDO_PR4_STATE")
    test "$WHATITDO_PR4_HEAD" = "$WHATITDO_CANDIDATE_SHA"
    gh pr merge 4 --repo "$WHATITDO_REPO" --merge \
      --match-head-commit "$WHATITDO_PR4_HEAD" \
      --subject 'Merge repaired PR #4 into audit prerequisites'
    export WHATITDO_INNER_MERGE=$(gh pr view 4 --repo "$WHATITDO_REPO" --json mergeCommit -q .mergeCommit.oid)
    git fetch origin --prune
    test "$(git rev-parse "origin/$WHATITDO_PR_A_BRANCH")" = "$WHATITDO_INNER_MERGE"
    test "$(git rev-parse "$WHATITDO_INNER_MERGE^1")" = "$WHATITDO_LIVE_PR_A"
    test "$(git rev-parse "$WHATITDO_INNER_MERGE^2")" = "$WHATITDO_PR4_HEAD"
    test "$(git merge-base "$WHATITDO_PR4_HEAD" "origin/$WHATITDO_PR_A_BRANCH")" = \
      "$WHATITDO_PR4_HEAD"
    test "$(git rev-parse "$WHATITDO_PR4_HEAD^{tree}")" = \
      "$(git rev-parse "origin/$WHATITDO_PR_A_BRANCH^{tree}")"

Create the C-10 closure commit in the existing isolated PR #5 worktree. It contains the inner-merge
evidence, the Upstash single-attempt/fresh-timeout safety correction, and four review corrections
discovered before the gate. Stage exactly the seven named paths. Then run the same exact-
head CI, thread, review, and Preview proof with `WHATITDO_PROOF_PR=$WHATITDO_PR_A`.

The seven local commands below are the normal gate. On this recorded run they were attempted with
hard startup limits and hit the macOS non-start documented in Surprises & Discoveries. Do not launch
them again on this host until the stuck kernel-I/O condition clears. The authorized substitution is
the inherited full local gate, direct pinned-SDK proof, three clean hostile reviews, and mandatory
fresh-install exact-head GitHub CI before any subsequent mutation.

    cd /Users/hbpheonix/.codex-worktrees/whatitdo-pr5-final
    test "$(git rev-parse HEAD)" = ca1d217264b1f4a31fb745fbea9920368a27a544
    test "$(git ls-remote origin refs/heads/$WHATITDO_PR_A_BRANCH | cut -f1)" = \
      ca1d217264b1f4a31fb745fbea9920368a27a544
    test "$(git diff --name-only | sort)" = "$(printf '%s\n' \
      .env.example README.md docs/COMPLETION_PLAN.md docs/PR4_REVIEW_THREADS.md \
      docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md src/lib/redis.ts \
      src/lib/redis.upstash.test.ts | sort)"
    test -z "$(git diff --cached --name-only)"
    test -z "$(git ls-files --others --exclude-standard)"
    git diff --check
    npm run lint
    npm run typecheck
    npm test
    npm run test:integration
    npm run e2e
    npm run build
    npm audit --audit-level=high
    git add .env.example README.md docs/COMPLETION_PLAN.md docs/PR4_REVIEW_THREADS.md \
      docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md src/lib/redis.ts src/lib/redis.upstash.test.ts
    git diff --cached --check
    test -z "$(git diff --name-only)"
    test "$(git diff --cached --name-only | sort)" = "$(printf '%s\n' \
      .env.example README.md docs/COMPLETION_PLAN.md docs/PR4_REVIEW_THREADS.md \
      docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md src/lib/redis.ts \
      src/lib/redis.upstash.test.ts | sort)"
    git commit -m 'Harden Upstash requests and close PR 5 review'
    test "$(git diff-tree --no-commit-id --name-only -r HEAD | sort)" = "$(printf '%s\n' \
      .env.example README.md docs/COMPLETION_PLAN.md docs/PR4_REVIEW_THREADS.md \
      docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md src/lib/redis.ts \
      src/lib/redis.upstash.test.ts | sort)"
    test "$(git rev-parse HEAD^)" = ca1d217264b1f4a31fb745fbea9920368a27a544
    test "$(git ls-remote origin refs/heads/$WHATITDO_PR_A_BRANCH | cut -f1)" = \
      ca1d217264b1f4a31fb745fbea9920368a27a544
    git push origin "HEAD:refs/heads/$WHATITDO_PR_A_BRANCH"
    export WHATITDO_PROOF_PR=$WHATITDO_PR_A
    export WHATITDO_CANDIDATE_SHA=$(git rev-parse HEAD)
    test "$(git ls-remote origin "refs/heads/$WHATITDO_PR_A_BRANCH" | cut -f1)" = \
      "$WHATITDO_CANDIDATE_SHA"
    if ! typeset -f wait_for_pr_checks >/dev/null 2>&1; then
      wait_for_pr_checks() {
        WHATITDO_CHECK_PR=$1
        WHATITDO_CHECK_DEADLINE=$(( $(date +%s) + 600 ))
        while :; do
          WHATITDO_CHECKS=$(gh pr checks "$WHATITDO_CHECK_PR" \
            --repo "$WHATITDO_REPO" --json name,bucket,link 2>/dev/null || printf '[]')
          if jq -e 'length > 0 and all(.[]; .bucket == "pass" or .bucket == "skipping")' \
            <<<"$WHATITDO_CHECKS" >/dev/null; then return 0; fi
          if jq -e 'any(.[]; .bucket == "fail" or .bucket == "cancel")' \
            <<<"$WHATITDO_CHECKS" >/dev/null; then return 1; fi
          if test "$(date +%s)" -ge "$WHATITDO_CHECK_DEADLINE"; then return 124; fi
          echo 'waiting for PR checks' >&2
          sleep 15
        done
      }
    fi
    wait_for_pr_checks "$WHATITDO_PROOF_PR"

After committing C-10 on PR-A, repeat the exact-head CI, thread/review, deployment-metadata, and
authenticated Preview sentinel proof above with `WHATITDO_PROOF_PR=$WHATITDO_PR_A`. Record that
evidence and prove PR #5 remains draft. This is a mandatory checkpoint: continue into the active
C-11 runbook only if every gate is green and the provider/account checkpoint is available.

    gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json isDraft,state,headRefOid \
      | jq -e --arg head "$WHATITDO_CANDIDATE_SHA" '
          .isDraft == true and .state == "OPEN" and .headRefOid == $head'
    export WHATITDO_PROVEN_PR5_HEAD="$WHATITDO_CANDIDATE_SHA"

### Active authorized C-11/C-12 runbook

This section is authoritative for the 2026-07-20 Production run. The older provider commands below
are retained only as historical evidence and must not be executed. Never print or capture a secret.

    set -euo pipefail
    : "${WHATITDO_PROVEN_PR5_HEAD:?complete and record the C-10 exact-head gate first}"
    cd /Users/hbpheonix/.codex-worktrees/whatitdo-pr5-final
    test "$(git rev-parse HEAD)" = "$WHATITDO_PROVEN_PR5_HEAD"
    test "$(git ls-remote origin refs/heads/$WHATITDO_PR_A_BRANCH | cut -f1)" = \
      "$WHATITDO_PROVEN_PR5_HEAD"
    test -z "$(git status --porcelain)"
    export WHATITDO_NODE22_BIN=/private/tmp/whatitdo-node22.NCpP5f/node-v22.23.1-darwin-x64/bin
    test -x "$WHATITDO_NODE22_BIN/node"
    export PATH="$WHATITDO_NODE22_BIN:$PATH"
    test "$(/usr/bin/perl -e 'alarm shift; exec @ARGV' 15 node --version)" = v22.23.1

1. Authenticate the Vercel CLI to `phazzies-projects/what-it-do`. If Upstash presents terms, plan
   selection, payment, or MFA, stop for the owner to complete that screen. Create exactly one Free
   database named `whatitdo-upstash-production`, primary region `us-east-1`, disconnected from the
   project. Select no read region, eviction, Prod Pack, keepalive, or automatic paid upgrade.
2. Remove Production from every stale `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, and
   `UPSTASH_REDIS_REST_TOKEN` record. Delete a record only when Production is its sole target;
   otherwise patch its target list to preserve Preview/Development without reading its value. Prove
   Preview metadata is unchanged and Production has zero Redis credentials, then add only the fresh
   Upstash URL/token to Production. Require exactly one effective pair there.
3. Run a direct probe under Production environment variables. It must use the application adapter
   for rate limiting, atomic create, atomic append, and duplicate append. Use one random ten-
   character poll ID and unique synthetic IP/submission/response values, require `created`,
   `appended`, then `duplicate`, and delete only the three poll namespace keys and three probe rate-limit keys in
   `finally` through a separately constructed Upstash client. Never use `KEYS` or `FLUSHDB`.
4. Require the recorded inherited full gate, direct pinned-SDK proof, three clean hostile reviews,
   green exact-head push and PR CI, 14/14 Redis tests with zero skips, 19/19 browser tests, a `READY`
   exact-SHA Preview sentinel, zero unresolved threads in two identical snapshots 60 seconds apart,
   and no current change request. Do not describe the closure patch as locally green.
5. Snapshot the project setting and all five alias-to-deployment bindings. Set
   `autoAssignCustomDomains=false` and read it back. Redeploy the exact PR #5 Preview deployment as
   a hidden Production target, without waiting in the mutation command. Poll to one determinate
   `READY` deployment and require exact project ID, exact PR #5 Git SHA, `target=production`, a green
   generated-host sentinel, and byte-for-byte unchanged aliases. Record this healthy hidden
   deployment as `WHATITDO_FALLBACK_ID`; the old promoted deployment is never a recovery target.
6. Mark PR #5 ready and read back its exact head/base. Fetch default and create a normal local merge
   commit whose first parent is that observed default and second parent is the exact PR #5 head.
   Push it normally to default with no force. A concurrent update must reject the push. If default
   moved once, merge the new default into PR #5, rerun step 4, rebuild/reprove the hidden fallback in
   step 5 from that new head, and retry with the new fallback ID. A second move stops.
7. Require final-default CI green and exactly one exact-merge-SHA Production deployment to become
   `READY`. Probe its generated host while aliases remain unchanged, then promote that exact ID.
   Poll promotion and all five aliases to a determinate result. A timeout is indeterminate: freeze
   mutations and query status only. After binding, run the public sentinel. On failure, request
   promote `WHATITDO_FALLBACK_ID` once as the recovery deployment and poll to a determinate binding.
8. Restore `autoAssignCustomDomains` to the captured value on every determinate coherent
   success/failure exit. A mixed alias map after two no-pending reads is classified as externally
   inconsistent rather than coherent; keep assignment disabled and require manual/status-only
   recovery. Scan exact-deployment `error` and `fatal` logs immediately and again one hour after the
   promotion request. Update one idempotent PR #5 release-evidence comment; do not create another
   commit or deployment merely to record remote facts.

Capture environment metadata before provisioning. The API response is filtered before shell capture,
so values never enter the variable or terminal. Preview metadata must remain byte-for-byte unchanged.
Vercel's official `PATCH /v9/projects/{idOrName}/env/{id}` contract declares `target` and `value` as
independently optional, so a target-only patch preserves the encrypted value. If that call or its
metadata readback disagrees, strict mode stops before fresh credentials are added. Reference:
`https://vercel.com/docs/rest-api/projects/edit-an-environment-variable`.

    WHATITDO_ENV_META_BEFORE=$("$WHATITDO_VERCEL" api \
      "/v9/projects/$WHATITDO_PROJECT_ID/env" --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c '[.envs[] | {id,key,target:(if (.target|type) == "array" then
          (.target|sort) else [.target] end),gitBranch,type}] | sort_by(.id)')
    WHATITDO_PREVIEW_ENV_BEFORE=$(jq -c \
      '[.[] | select(.target | index("preview")) |
        {id,key,gitBranch,type}] | sort_by(.id)' <<<"$WHATITDO_ENV_META_BEFORE")

Safe setup/readback commands follow. Interactive credential values are entered only at Vercel
prompts. Provision the Marketplace resource disconnected; if the CLI cannot honor both isolation
flags, use the Upstash/Vercel dashboard and do not click Connect.

    "$WHATITDO_VERCEL" whoami --scope "$WHATITDO_VERCEL_SCOPE"
    "$WHATITDO_VERCEL" link --yes --project what-it-do --scope "$WHATITDO_VERCEL_SCOPE"
    "$WHATITDO_VERCEL" integration add upstash --name whatitdo-upstash-production \
      --no-connect --no-env-pull --scope "$WHATITDO_VERCEL_SCOPE"
    # Mandatory dashboard readback before continuing: provider=Upstash, resource name exactly
    # whatitdo-upstash-production, tier=Free, primary region=us-east-1, read regions=0,
    # project connections=0, eviction=off, Prod Pack=off, auto-upgrade=off. Record the non-secret
    # readback in PR #5. Any mismatch or unavailable field is a hard stop.
    jq -c '.[] | select(
      (.key == "REDIS_URL" or .key == "UPSTASH_REDIS_REST_URL" or
       .key == "UPSTASH_REDIS_REST_TOKEN") and (.target | index("production"))) |
      {id, remainingTargets:(.target - ["production"])}' <<<"$WHATITDO_ENV_META_BEFORE" \
      | while IFS= read -r record; do
          id=$(jq -er '.id' <<<"$record")
          remaining=$(jq -c '.remainingTargets' <<<"$record")
          if test "$(jq 'length' <<<"$remaining")" = 0; then
            "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID/env/$id" -X DELETE \
              --scope "$WHATITDO_VERCEL_SCOPE" --raw >/dev/null
          else
            jq -cn --argjson target "$remaining" '{target:$target}' \
              | "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID/env/$id" \
                  -X PATCH --input - --scope "$WHATITDO_VERCEL_SCOPE" --raw >/dev/null
          fi
        done
    WHATITDO_ENV_META_ISOLATED=$("$WHATITDO_VERCEL" api \
      "/v9/projects/$WHATITDO_PROJECT_ID/env" --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c '[.envs[] | {id,key,target:(if (.target|type) == "array" then
          (.target|sort) else [.target] end),gitBranch,type}] | sort_by(.id)')
    jq -e '[.[] | select(
      (.key == "REDIS_URL" or .key == "UPSTASH_REDIS_REST_URL" or
       .key == "UPSTASH_REDIS_REST_TOKEN") and
      (.target | index("production")))] | length == 0' <<<"$WHATITDO_ENV_META_ISOLATED"
    WHATITDO_PREVIEW_ENV_ISOLATED=$(jq -c \
      '[.[] | select(.target | index("preview")) |
        {id,key,gitBranch,type}] | sort_by(.id)' <<<"$WHATITDO_ENV_META_ISOLATED")
    test "$WHATITDO_PREVIEW_ENV_ISOLATED" = "$WHATITDO_PREVIEW_ENV_BEFORE"
    "$WHATITDO_VERCEL" env add UPSTASH_REDIS_REST_URL production --sensitive \
      --scope "$WHATITDO_VERCEL_SCOPE"
    "$WHATITDO_VERCEL" env add UPSTASH_REDIS_REST_TOKEN production --sensitive \
      --scope "$WHATITDO_VERCEL_SCOPE"
    "$WHATITDO_VERCEL" env ls production --scope "$WHATITDO_VERCEL_SCOPE"

Read back only names, targets, branch scopes, and secret types. Require one Production REST URL,
one Production REST token, no Production `REDIS_URL`, and an unchanged Preview environment.

    WHATITDO_ENV_META_AFTER=$("$WHATITDO_VERCEL" api \
      "/v9/projects/$WHATITDO_PROJECT_ID/env" --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c '[.envs[] | {id,key,target:(if (.target|type) == "array" then
          (.target|sort) else [.target] end),gitBranch,type}] | sort_by(.id)')
    jq -e '
      ([.[] | select(
        (.key == "UPSTASH_REDIS_REST_URL" or .key == "UPSTASH_REDIS_REST_TOKEN") and
        (.target | index("production")))] | length) == 2 and
      (all(.[]; if (.key == "UPSTASH_REDIS_REST_URL" or
                    .key == "UPSTASH_REDIS_REST_TOKEN") and
                   (.target | index("production"))
                then .target == ["production"] and .gitBranch == null and
                     .type == "sensitive"
                else true end)) and
      ([.[] | select(.key == "REDIS_URL" and
                      (.target | index("production")))] | length) == 0
    ' <<<"$WHATITDO_ENV_META_AFTER"
    WHATITDO_PREVIEW_ENV_AFTER=$(jq -c \
      '[.[] | select(.target | index("preview")) |
        {id,key,gitBranch,type}] | sort_by(.id)' <<<"$WHATITDO_ENV_META_AFTER")
    test "$WHATITDO_PREVIEW_ENV_AFTER" = "$WHATITDO_PREVIEW_ENV_BEFORE"

Install the exact probe runner outside the Production-secret process, verify its package version,
then run the adapter probe from the PR #5 worktree with Production variables. The separate raw
client is used only for exact cleanup. The script prints one generic success line and never prints
credentials, raw provider errors, or synthetic ballot contents.

    export WHATITDO_PROBE_TOOLS=$(mktemp -d /private/tmp/whatitdo-probe-tools.XXXXXX)
    whatitdo_cleanup_probe_tools() {
      case "$WHATITDO_PROBE_TOOLS" in
        /private/tmp/whatitdo-probe-tools.*) rm -rf -- "$WHATITDO_PROBE_TOOLS" ;;
        *) return 1 ;;
      esac
    }
    trap whatitdo_cleanup_probe_tools EXIT
    /usr/bin/perl -e 'alarm shift; exec @ARGV' 300 npm install \
      --prefix "$WHATITDO_PROBE_TOOLS" --ignore-scripts --no-save \
      --package-lock=false tsx@4.20.3
    test "$(/usr/bin/perl -e 'alarm shift; exec @ARGV' 15 node -p \
      "require('$WHATITDO_PROBE_TOOLS/node_modules/tsx/package.json').version")" = 4.20.3
    /usr/bin/perl -e 'alarm shift; exec @ARGV' 120 \
      "$WHATITDO_VERCEL" env run -e production --scope "$WHATITDO_VERCEL_SCOPE" -- \
        "$WHATITDO_PROBE_TOOLS/node_modules/.bin/tsx" --eval '
      import { createHash, randomBytes } from "node:crypto";
      import { Redis } from "@upstash/redis";
      import {
        appendVoteAtomically, checkPollCreateRateLimit, createPollAtomically,
      } from "./src/lib/redis";
      const id = randomBytes(8).toString("hex").slice(0, 10);
      const marker = randomBytes(8).toString("hex");
      const ip = `2001:db8:${marker.slice(0, 4)}:${marker.slice(4, 8)}::1`;
      const submissionId = `probe-${marker}`;
      const responseId = `response-${marker}`;
      const now = Date.now();
      const keys = [
        `poll:${id}`, `poll:${id}:responses`, `poll:${id}:submissions`,
        `ratelimit:poll:${ip}`, `ratelimit:vote:ip:${ip}`, `ratelimit:vote:poll:${id}`,
      ];
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token || process.env.REDIS_URL) throw new Error("probe configuration failed");
      const cleanup = new Redis({
        url, token, retry: { retries: 0 }, signal: () => AbortSignal.timeout(5_000),
      });
      let failed = false;
      let cleanupFailed = false;
      let deleted = 0;
      try {
        const rate = await checkPollCreateRateLimit(ip);
        if (!rate.allowed) throw new Error("probe rate limit failed");
        const created = await createPollAtomically({
          id, title: "Synthetic provider probe", mode: "normal", suggestions: ["Probe"],
          createdAt: now, expiresAt: now + 90 * 24 * 60 * 60 * 1_000,
          resultsTokenHash: createHash("sha256").update(marker).digest("hex"),
        });
        if (created.status !== "created") throw new Error("probe create failed");
        const input = {
          pollId: id, submissionId,
          submissionDigest: createHash("sha256").update(`digest:${marker}`).digest("hex"),
          responseId, clientIp: ip, now,
          response: {
            id: responseId, voterName: "Synthetic probe",
            votes: [{ text: "Probe", vote: "yes", comment: "" }], submittedAt: now,
          },
        } as const;
        const appended = await appendVoteAtomically(input);
        const duplicate = await appendVoteAtomically(input);
        if (appended.status !== "appended" || duplicate.status !== "duplicate") {
          throw new Error("probe append failed");
        }
      } catch { failed = true; }
      finally {
        try { deleted = await cleanup.del(...keys); } catch { cleanupFailed = true; }
      }
      if (failed || cleanupFailed || deleted !== keys.length) {
        throw new Error("provider probe failed");
      }
      console.log("provider probe passed and synthetic keys removed");
    '
    whatitdo_cleanup_probe_tools
    trap - EXIT

Before any deployment mutation, capture the complete alias map and setting. The alias list is fixed
for this release; any addition, deletion, or changed deployment before promotion is a hard stop.

    export WHATITDO_PROJECT_BEFORE=$("$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    export WHATITDO_AUTO_ASSIGN_BEFORE=$(jq -r '.autoAssignCustomDomains' \
      <<<"$WHATITDO_PROJECT_BEFORE")
    test "$WHATITDO_AUTO_ASSIGN_BEFORE" = true || \
      test "$WHATITDO_AUTO_ASSIGN_BEFORE" = false
    WHATITDO_PRIMARY_ALIAS_BEFORE=$("$WHATITDO_VERCEL" api \
      /v4/aliases/www.whatitdo.xyz --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    export WHATITDO_PUBLIC_DEPLOYMENT_BEFORE=$(jq -er \
      --arg project "$WHATITDO_PROJECT_ID" '
        select(.alias == "www.whatitdo.xyz" and .projectId == $project) | .deploymentId
      ' <<<"$WHATITDO_PRIMARY_ALIAS_BEFORE")
    WHATITDO_ALIAS_MAP_BEFORE=$("$WHATITDO_VERCEL" api \
      "/v4/aliases?projectId=$WHATITDO_PROJECT_ID&limit=100" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c --arg deployment "$WHATITDO_PUBLIC_DEPLOYMENT_BEFORE" '
          [.aliases[] | select(.deploymentId == $deployment) |
            {alias, deploymentId, projectId}] | sort_by(.alias)')
    jq -e --arg project "$WHATITDO_PROJECT_ID" \
      'length == 5 and all(.projectId == $project)' <<<"$WHATITDO_ALIAS_MAP_BEFORE"
    export WHATITDO_ALIAS_NAMES_BEFORE=$(jq -c '[.[] | .alias]' \
      <<<"$WHATITDO_ALIAS_MAP_BEFORE")
    export WHATITDO_RELEASE_INDETERMINATE=0
    whatitdo_restore_setting() {
      if test "$WHATITDO_RELEASE_INDETERMINATE" = 1; then
        echo 'provider mutation is indeterminate; aliases stay frozen and recovery is status-only' >&2
        return 0
      fi
      jq -cn --argjson value "$WHATITDO_AUTO_ASSIGN_BEFORE" \
        '{autoAssignCustomDomains:$value}' \
        | "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH --input - \
            --scope "$WHATITDO_VERCEL_SCOPE" --raw \
        | jq -e --argjson value "$WHATITDO_AUTO_ASSIGN_BEFORE" \
            '.autoAssignCustomDomains == $value'
    }
    whatitdo_release_exit() {
      status=$?
      if ! whatitdo_restore_setting; then
        test "$status" -ne 0 || status=1
      fi
      trap - EXIT
      exit "$status"
    }
    trap whatitdo_release_exit EXIT
    "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
      -F autoAssignCustomDomains=false --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e '.autoAssignCustomDomains == false'

Create the hidden fallback from the already-proven PR #5 Preview deployment. Poll with fresh reads;
do not infer success from the mutation command returning zero.

    export WHATITDO_FINAL_HEAD=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json headRefOid -q .headRefOid)
    test "$WHATITDO_FINAL_HEAD" = "$WHATITDO_PROVEN_PR5_HEAD"
    WHATITDO_PR5_PREVIEW_DEPLOYMENT_ID=$("$WHATITDO_VERCEL" api \
      "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -er --arg sha "$WHATITDO_FINAL_HEAD" '
          [.deployments[] | select(.meta.githubCommitSha == $sha and
            .target != "production" and .readyState == "READY")] |
          sort_by(.createdAt) | last | .uid')
    WHATITDO_PR5_PREVIEW=$("$WHATITDO_VERCEL" api \
      "/v13/deployments/$WHATITDO_PR5_PREVIEW_DEPLOYMENT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    jq -e --arg id "$WHATITDO_PR5_PREVIEW_DEPLOYMENT_ID" \
      --arg project "$WHATITDO_PROJECT_ID" --arg sha "$WHATITDO_FINAL_HEAD" '
        .id == $id and .projectId == $project and .readyState == "READY" and
        .target != "production" and .meta.githubCommitSha == $sha
      ' <<<"$WHATITDO_PR5_PREVIEW"
    export WHATITDO_FALLBACK_REQUESTED_MS=$(( $(date +%s) * 1000 ))
    export WHATITDO_RELEASE_INDETERMINATE=1
    "$WHATITDO_VERCEL" redeploy "$WHATITDO_PR5_PREVIEW_DEPLOYMENT_ID" --target=production \
      --no-wait --scope "$WHATITDO_VERCEL_SCOPE"
    WHATITDO_FALLBACK_DEADLINE=$(( $(date +%s) + 600 ))
    while :; do
      WHATITDO_FALLBACK_MATCHES=$("$WHATITDO_VERCEL" api \
        "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100&target=production" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw \
        | jq -c --arg sha "$WHATITDO_FINAL_HEAD" \
          --argjson since "$WHATITDO_FALLBACK_REQUESTED_MS" '
            [.deployments[] | select(.meta.githubCommitSha == $sha and
              .target == "production" and .createdAt >= $since)]')
      if jq -e 'any(.readyState == "ERROR" or .readyState == "CANCELED")' \
        <<<"$WHATITDO_FALLBACK_MATCHES" >/dev/null; then
        export WHATITDO_RELEASE_INDETERMINATE=0
        exit 1
      fi
      WHATITDO_HIDDEN_DEPLOYMENT_ID=$(jq -r \
        'select(length == 1 and .[0].readyState == "READY") | .[0].uid // empty' \
        <<<"$WHATITDO_FALLBACK_MATCHES")
      test -z "$WHATITDO_HIDDEN_DEPLOYMENT_ID" || break
      test "$(date +%s)" -lt "$WHATITDO_FALLBACK_DEADLINE"
      echo 'waiting for hidden fallback deployment' >&2
      sleep 15
    done
    export WHATITDO_RELEASE_INDETERMINATE=0
    WHATITDO_HIDDEN_DEPLOYMENT=$("$WHATITDO_VERCEL" api \
      "/v13/deployments/$WHATITDO_HIDDEN_DEPLOYMENT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    jq -e --arg id "$WHATITDO_HIDDEN_DEPLOYMENT_ID" \
      --arg project "$WHATITDO_PROJECT_ID" --arg sha "$WHATITDO_FINAL_HEAD" '
        .id == $id and .projectId == $project and .readyState == "READY" and
        .target == "production" and .meta.githubCommitSha == $sha
      ' <<<"$WHATITDO_HIDDEN_DEPLOYMENT"
    WHATITDO_FALLBACK_PROBE=$("$WHATITDO_VERCEL" curl '/api/poll?id=AAAAAAAAAA' \
      --deployment "$WHATITDO_HIDDEN_DEPLOYMENT_ID" --scope "$WHATITDO_VERCEL_SCOPE" -- \
      --silent --show-error --max-time 15 --max-redirs 0 \
      --write-out $'\n__STATUS__%{http_code}\n__REDIRECT__%{redirect_url}')
    test "$(sed -n 's/^__STATUS__//p' <<<"$WHATITDO_FALLBACK_PROBE")" = 404
    test -z "$(sed -n 's/^__REDIRECT__//p' <<<"$WHATITDO_FALLBACK_PROBE")"
    sed '/^__STATUS__/,$d' <<<"$WHATITDO_FALLBACK_PROBE" \
      | jq -e '.error == "Poll not found"'
    WHATITDO_ALIAS_MAP_AFTER=$("$WHATITDO_VERCEL" api \
      "/v4/aliases?projectId=$WHATITDO_PROJECT_ID&limit=100" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c --argjson names "$WHATITDO_ALIAS_NAMES_BEFORE" '
          [.aliases[] | select(.alias as $alias | $names | index($alias)) |
            {alias, deploymentId, projectId}] | sort_by(.alias)')
    test "$WHATITDO_ALIAS_MAP_AFTER" = "$WHATITDO_ALIAS_MAP_BEFORE"
    export WHATITDO_FALLBACK_ID="$WHATITDO_HIDDEN_DEPLOYMENT_ID"

Create and push the race-safe merge. The explicit refspec makes a concurrent default move reject
the push rather than silently merging an unproven base.

    git fetch origin --prune
    export WHATITDO_LIVE_DEFAULT=$(git rev-parse "origin/$WHATITDO_DEFAULT_BRANCH")
    gh pr ready "$WHATITDO_PR_A" --repo "$WHATITDO_REPO"
    gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json state,isDraft,headRefOid,baseRefName,baseRefOid \
      | jq -e --arg head "$WHATITDO_FINAL_HEAD" --arg base "$WHATITDO_DEFAULT_BRANCH" \
          --arg base_oid "$WHATITDO_LIVE_DEFAULT" '
          .state == "OPEN" and .isDraft == false and
          .headRefOid == $head and .baseRefName == $base and .baseRefOid == $base_oid'
    git fetch origin --prune
    test "$(git rev-parse "origin/$WHATITDO_DEFAULT_BRANCH")" = "$WHATITDO_LIVE_DEFAULT"
    test "$(git rev-parse "origin/$WHATITDO_PR_A_BRANCH")" = "$WHATITDO_FINAL_HEAD"
    export WHATITDO_MERGE_WORKTREE=$(mktemp -d /private/tmp/whatitdo-final-merge.XXXXXX)
    git worktree add --detach "$WHATITDO_MERGE_WORKTREE" "$WHATITDO_LIVE_DEFAULT"
    git -C "$WHATITDO_MERGE_WORKTREE" merge --no-ff --no-edit "$WHATITDO_FINAL_HEAD"
    export WHATITDO_FINAL_MERGE=$(git -C "$WHATITDO_MERGE_WORKTREE" rev-parse HEAD)
    test "$(git rev-parse "$WHATITDO_FINAL_MERGE^1")" = "$WHATITDO_LIVE_DEFAULT"
    test "$(git rev-parse "$WHATITDO_FINAL_MERGE^2")" = "$WHATITDO_FINAL_HEAD"
    export WHATITDO_FINAL_PUSH_MS=$(( $(date +%s) * 1000 ))
    export WHATITDO_RELEASE_INDETERMINATE=1
    if ! git -C "$WHATITDO_MERGE_WORKTREE" push origin \
      "$WHATITDO_FINAL_MERGE:refs/heads/$WHATITDO_DEFAULT_BRANCH"; then
      git fetch origin "$WHATITDO_DEFAULT_BRANCH"
      WHATITDO_DEFAULT_AFTER_REJECT=$(git rev-parse "origin/$WHATITDO_DEFAULT_BRANCH")
      if ! git merge-base --is-ancestor "$WHATITDO_FINAL_MERGE" \
        "$WHATITDO_DEFAULT_AFTER_REJECT"; then
        export WHATITDO_RELEASE_INDETERMINATE=0
        git worktree remove "$WHATITDO_MERGE_WORKTREE"
        echo 'default moved before push: restore setting, sync PR #5 once, rerun exact-head proof and hidden fallback' >&2
        exit 75
      fi
      echo 'push outcome may have deployed the merge; keep aliases frozen and query status only' >&2
      exit 124
    fi
    test "$(git ls-remote origin refs/heads/$WHATITDO_DEFAULT_BRANCH | cut -f1)" = \
      "$WHATITDO_FINAL_MERGE"
    git worktree remove "$WHATITDO_MERGE_WORKTREE"
    WHATITDO_PR_CLOSE_DEADLINE=$(( $(date +%s) + 60 ))
    while :; do
      WHATITDO_PR_AFTER_MERGE=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
        --json state,mergedAt,mergeCommit)
      if jq -e --arg merge "$WHATITDO_FINAL_MERGE" '
        .state == "MERGED" and .mergedAt != null and .mergeCommit.oid == $merge
      ' <<<"$WHATITDO_PR_AFTER_MERGE" >/dev/null; then break; fi
      test "$(date +%s)" -lt "$WHATITDO_PR_CLOSE_DEADLINE"
      echo 'waiting for GitHub to record PR #5 merged' >&2
      sleep 5
    done
    test "$(gh pr list --repo "$WHATITDO_REPO" --state open --json number | jq 'length')" = 0

Poll exact default CI and the exact final Production deployment. Each loop prints a status line and
has a ten-minute ceiling. A failed terminal CI/deployment exits immediately.

    WHATITDO_FINAL_DEADLINE=$(( $(date +%s) + 600 ))
    while :; do
      WHATITDO_FINAL_RUN=$(gh api --method GET "repos/$WHATITDO_REPO/actions/runs" \
        -f head_sha="$WHATITDO_FINAL_MERGE" -f per_page=100 \
        | jq -c '[.workflow_runs[] | select(.name == "CI" and .event == "push")] |
          sort_by(.created_at) | last // {}')
      WHATITDO_FINAL_RUN_ID=$(jq -r \
        'select(.status == "completed" and .conclusion == "success") | .id // empty' \
        <<<"$WHATITDO_FINAL_RUN")
      WHATITDO_FINAL_DEPLOYS=$("$WHATITDO_VERCEL" api \
        "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100&target=production" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw \
        | jq -c --arg sha "$WHATITDO_FINAL_MERGE" --argjson since "$WHATITDO_FINAL_PUSH_MS" '
            [.deployments[] | select(.meta.githubCommitSha == $sha and
              .target == "production" and .createdAt >= $since)]')
      if jq -e '.status == "completed" and .conclusion != "success"' \
        <<<"$WHATITDO_FINAL_RUN" >/dev/null ||
        jq -e 'any(.readyState == "ERROR" or .readyState == "CANCELED")' \
          <<<"$WHATITDO_FINAL_DEPLOYS" >/dev/null; then
        if jq -e 'length > 0 and all(.readyState == "READY" or .readyState == "ERROR" or
          .readyState == "CANCELED")' <<<"$WHATITDO_FINAL_DEPLOYS" >/dev/null; then
          export WHATITDO_RELEASE_INDETERMINATE=0
        fi
        exit 1
      fi
      WHATITDO_FINAL_DEPLOYMENT_ID=$(jq -r \
        'select(length == 1 and .[0].readyState == "READY") | .[0].uid // empty' \
        <<<"$WHATITDO_FINAL_DEPLOYS")
      if test -n "$WHATITDO_FINAL_RUN_ID" && test -n "$WHATITDO_FINAL_DEPLOYMENT_ID"; then break; fi
      test "$(date +%s)" -lt "$WHATITDO_FINAL_DEADLINE"
      echo 'waiting for exact default CI and Production deployment' >&2
      sleep 15
    done
    export WHATITDO_RELEASE_INDETERMINATE=0
    WHATITDO_FINAL_RUN_VIEW=$(gh run view "$WHATITDO_FINAL_RUN_ID" --repo "$WHATITDO_REPO" \
      --json headSha,jobs)
    jq -e --arg sha "$WHATITDO_FINAL_MERGE" '
      .headSha == $sha and
      ([.jobs[] | select(.conclusion == "success") | .name] | sort) ==
      (["build","e2e","redis-integration"] | sort)
    ' <<<"$WHATITDO_FINAL_RUN_VIEW"
    WHATITDO_FINAL_REDIS_JOB=$(jq -er \
      '.jobs[] | select(.name == "redis-integration") | .databaseId' \
      <<<"$WHATITDO_FINAL_RUN_VIEW")
    WHATITDO_FINAL_E2E_JOB=$(jq -er \
      '.jobs[] | select(.name == "e2e") | .databaseId' <<<"$WHATITDO_FINAL_RUN_VIEW")
    WHATITDO_FINAL_REDIS_LOG=$(gh run view "$WHATITDO_FINAL_RUN_ID" \
      --repo "$WHATITDO_REPO" --job "$WHATITDO_FINAL_REDIS_JOB" --log)
    WHATITDO_FINAL_E2E_LOG=$(gh run view "$WHATITDO_FINAL_RUN_ID" \
      --repo "$WHATITDO_REPO" --job "$WHATITDO_FINAL_E2E_JOB" --log)
    grep -Eq '14 passed.*\(14\)' <<<"$WHATITDO_FINAL_REDIS_LOG"
    grep -Eq '19 passed' <<<"$WHATITDO_FINAL_E2E_LOG"
    if grep -Eq 'Tests.*skipped' <<<"$WHATITDO_FINAL_REDIS_LOG"; then exit 1; fi
    WHATITDO_FINAL_DEPLOYMENT=$("$WHATITDO_VERCEL" api \
      "/v13/deployments/$WHATITDO_FINAL_DEPLOYMENT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    jq -e --arg id "$WHATITDO_FINAL_DEPLOYMENT_ID" \
      --arg project "$WHATITDO_PROJECT_ID" --arg sha "$WHATITDO_FINAL_MERGE" '
        .id == $id and .projectId == $project and .readyState == "READY" and
        .target == "production" and .meta.githubCommitSha == $sha
      ' <<<"$WHATITDO_FINAL_DEPLOYMENT"
    WHATITDO_ALIAS_MAP_STAGED=$("$WHATITDO_VERCEL" api \
      "/v4/aliases?projectId=$WHATITDO_PROJECT_ID&limit=100" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -c --argjson names "$WHATITDO_ALIAS_NAMES_BEFORE" '
          [.aliases[] | select(.alias as $alias | $names | index($alias)) |
            {alias, deploymentId, projectId}] | sort_by(.alias)')
    test "$WHATITDO_ALIAS_MAP_STAGED" = "$WHATITDO_ALIAS_MAP_BEFORE"
    WHATITDO_FINAL_PROBE=$("$WHATITDO_VERCEL" curl '/api/poll?id=AAAAAAAAAA' \
      --deployment "$WHATITDO_FINAL_DEPLOYMENT_ID" --scope "$WHATITDO_VERCEL_SCOPE" -- \
      --silent --show-error --max-time 15 --max-redirs 0 \
      --write-out $'\n__STATUS__%{http_code}\n__REDIRECT__%{redirect_url}')
    test "$(sed -n 's/^__STATUS__//p' <<<"$WHATITDO_FINAL_PROBE")" = 404
    test -z "$(sed -n 's/^__REDIRECT__//p' <<<"$WHATITDO_FINAL_PROBE")"
    sed '/^__STATUS__/,$d' <<<"$WHATITDO_FINAL_PROBE" \
      | jq -e '.error == "Poll not found"'

Promote once, then poll provider status and the full alias map. Until two consecutive status reads
say no mutation is pending, do not promote or roll back again. A timeout leaves aliases frozen and
permits status-only recovery.

    export WHATITDO_PROMOTION_REQUESTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    export WHATITDO_RELEASE_INDETERMINATE=1
    "$WHATITDO_VERCEL" promote "$WHATITDO_FINAL_DEPLOYMENT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --yes --timeout 0 || true
    WHATITDO_PROMOTION_DEADLINE=$(( $(date +%s) + 600 ))
    WHATITDO_STABLE_PROMOTION_READS=0
    while :; do
      WHATITDO_ALIAS_MAP_CURRENT=$("$WHATITDO_VERCEL" api \
        "/v4/aliases?projectId=$WHATITDO_PROJECT_ID&limit=100" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw \
        | jq -c --argjson names "$WHATITDO_ALIAS_NAMES_BEFORE" '
            [.aliases[] | select(.alias as $alias | $names | index($alias)) |
              {alias, deploymentId, projectId}] | sort_by(.alias)')
      jq -e --argjson before "$WHATITDO_ALIAS_MAP_BEFORE" \
        --arg final "$WHATITDO_FINAL_DEPLOYMENT_ID" --arg project "$WHATITDO_PROJECT_ID" '
          ([.[] | .alias] == [$before[] | .alias]) and
          all(.projectId == $project) and
          all(. as $item |
            ($before[] | select(.alias == $item.alias) | .deploymentId) as $old |
            $item.deploymentId == $old or $item.deploymentId == $final)
        ' <<<"$WHATITDO_ALIAS_MAP_CURRENT"
      if WHATITDO_PROMOTION_STATUS=$("$WHATITDO_VERCEL" promote status \
        "$WHATITDO_PROJECT_ID" --timeout 15s --scope "$WHATITDO_VERCEL_SCOPE" --no-color) &&
        grep -Fq 'No deployment promotion in progress' <<<"$WHATITDO_PROMOTION_STATUS"; then
        WHATITDO_STABLE_PROMOTION_READS=$(( WHATITDO_STABLE_PROMOTION_READS + 1 ))
      else
        WHATITDO_STABLE_PROMOTION_READS=0
      fi
      if test "$WHATITDO_STABLE_PROMOTION_READS" -ge 2; then
        # A failure here means Vercel says idle while aliases are mixed. Keep the indeterminate flag
        # set so the EXIT trap deliberately preserves the freeze for manual/status-only recovery.
        jq -e --arg final "$WHATITDO_FINAL_DEPLOYMENT_ID" \
          'all(.deploymentId == $final)' <<<"$WHATITDO_ALIAS_MAP_CURRENT"
        export WHATITDO_RELEASE_INDETERMINATE=0
        break
      fi
      test "$(date +%s)" -lt "$WHATITDO_PROMOTION_DEADLINE"
      echo 'waiting for determinate promotion and five-alias binding' >&2
      sleep 15
    done
    if DEPLOYMENT_URL=https://www.whatitdo.xyz \
      /usr/bin/perl -e 'alarm shift; exec @ARGV' 30 node --input-type=module -e '
      const url = new URL("/api/poll?id=AAAAAAAAAA", process.env.DEPLOYMENT_URL);
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
      const body = await response.json().catch(() => null);
      if (response.status !== 404 || response.headers.has("location") ||
          body?.error !== "Poll not found") throw new Error("public sentinel failed");
    '; then
      echo 'public Production sentinel passed' >&2
    else
      export WHATITDO_RELEASE_INDETERMINATE=1
      "$WHATITDO_VERCEL" promote "$WHATITDO_FALLBACK_ID" \
        --scope "$WHATITDO_VERCEL_SCOPE" --yes --timeout 0 || true
      WHATITDO_RECOVERY_DEADLINE=$(( $(date +%s) + 600 ))
      WHATITDO_STABLE_RECOVERY_READS=0
      while :; do
        WHATITDO_ALIAS_MAP_RECOVERY=$("$WHATITDO_VERCEL" api \
          "/v4/aliases?projectId=$WHATITDO_PROJECT_ID&limit=100" \
          --scope "$WHATITDO_VERCEL_SCOPE" --raw \
          | jq -c --argjson names "$WHATITDO_ALIAS_NAMES_BEFORE" '
              [.aliases[] | select(.alias as $alias | $names | index($alias)) |
                {alias, deploymentId, projectId}] | sort_by(.alias)')
        jq -e --argjson before "$WHATITDO_ALIAS_MAP_BEFORE" \
          --arg final "$WHATITDO_FINAL_DEPLOYMENT_ID" --arg fallback "$WHATITDO_FALLBACK_ID" \
          --arg project "$WHATITDO_PROJECT_ID" '
            ([.[] | .alias] == [$before[] | .alias]) and
            all(.projectId == $project) and
            all(.deploymentId == $final or .deploymentId == $fallback)
          ' <<<"$WHATITDO_ALIAS_MAP_RECOVERY"
        if WHATITDO_RECOVERY_STATUS=$("$WHATITDO_VERCEL" promote status \
          "$WHATITDO_PROJECT_ID" --timeout 15s --scope "$WHATITDO_VERCEL_SCOPE" --no-color) &&
          grep -Fq 'No deployment promotion in progress' <<<"$WHATITDO_RECOVERY_STATUS"; then
          WHATITDO_STABLE_RECOVERY_READS=$(( WHATITDO_STABLE_RECOVERY_READS + 1 ))
        else
          WHATITDO_STABLE_RECOVERY_READS=0
        fi
        if test "$WHATITDO_STABLE_RECOVERY_READS" -ge 2; then
          # A failure here is the same externally inconsistent mixed-alias state; preserve the freeze.
          jq -e --arg fallback "$WHATITDO_FALLBACK_ID" \
            'all(.deploymentId == $fallback)' <<<"$WHATITDO_ALIAS_MAP_RECOVERY"
          export WHATITDO_RELEASE_INDETERMINATE=0
          break
        fi
        test "$(date +%s)" -lt "$WHATITDO_RECOVERY_DEADLINE"
        echo 'waiting for determinate fallback binding' >&2
        sleep 15
      done
      DEPLOYMENT_URL=https://www.whatitdo.xyz \
        /usr/bin/perl -e 'alarm shift; exec @ARGV' 30 node --input-type=module -e '
        const url = new URL("/api/poll?id=AAAAAAAAAA", process.env.DEPLOYMENT_URL);
        const response = await fetch(url, {
          redirect: "manual", signal: AbortSignal.timeout(15000),
        });
        const body = await response.json().catch(() => null);
        if (response.status !== 404 || response.headers.has("location") ||
            body?.error !== "Poll not found") throw new Error("fallback sentinel failed");
      '
      echo 'public sentinel failed; healthy hidden fallback restored' >&2
      whatitdo_restore_setting
      trap - EXIT
      exit 1
    fi

Restore the captured setting with JSON, not a hardcoded Boolean, after every determinate coherent
exit. The only exception is the explicitly classified mixed-alias inconsistency above:

    whatitdo_restore_setting
    trap - EXIT

Run the same exact-deployment log assertion now and after the clock is at least one hour past
`WHATITDO_PROMOTION_REQUESTED_AT`; the second query is the C-12 delayed gate. Never print raw log
events because they may contain user data. Any returned error/fatal event fails the gate and requires
a redacted manual disposition before release evidence can say clean. Do not sleep in this shell; if
the hour has not elapsed, record the resume timestamp and exit 75 for the later C-12 continuation.

    whatitdo_assert_clean_logs() {
      WHATITDO_LOG_UNTIL=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      for WHATITDO_LOG_LEVEL in error fatal; do
        WHATITDO_LOG_JSONL=$("$WHATITDO_VERCEL" logs "$WHATITDO_FINAL_DEPLOYMENT_ID" \
          --no-follow --json --level "$WHATITDO_LOG_LEVEL" \
          --since "$WHATITDO_PROMOTION_REQUESTED_AT" --until "$WHATITDO_LOG_UNTIL" \
          --limit 1000 --scope "$WHATITDO_VERCEL_SCOPE")
        WHATITDO_LOG_COUNT=$(printf '%s\n' "$WHATITDO_LOG_JSONL" | jq -s 'length')
        if test "$WHATITDO_LOG_COUNT" -ne 0; then
          echo "runtime $WHATITDO_LOG_LEVEL logs require redacted disposition" >&2
          return 1
        fi
      done
    }
    whatitdo_assert_clean_logs
    export WHATITDO_PROMOTION_EPOCH=$(/usr/bin/perl -e 'alarm shift; exec @ARGV' 15 node -e \
      'process.stdout.write(String(Date.parse(process.argv[1]) / 1000))' \
      "$WHATITDO_PROMOTION_REQUESTED_AT")
    export WHATITDO_DELAYED_LOG_NOT_BEFORE=$(( WHATITDO_PROMOTION_EPOCH + 3600 ))
    if test "$(date +%s)" -lt "$WHATITDO_DELAYED_LOG_NOT_BEFORE"; then
      echo "C-12 delayed log gate resumes at epoch $WHATITDO_DELAYED_LOG_NOT_BEFORE" >&2
      exit 75
    fi
    whatitdo_assert_clean_logs

### Historical superseded Production runbook — do not execute

The commands below describe the pre-authorization design and are retained solely to explain earlier
evidence. They select the known-broken deployment as rollback, inspect only one alias, hardcode a
project setting, and use a race-prone server-side merge. They are explicitly superseded by the active
runbook above and must never be copied or executed.

    : "${WHATITDO_OWNER_AUTHORIZATION_RECORD:?STOP: recorded owner authorization is required}"
    : "${WHATITDO_PERSISTENT_PROVIDER_RECORD:?STOP: approved persistent provider evidence is required}"
    : "${WHATITDO_PRODUCTION_CREDENTIAL_RECORD:?STOP: fresh Production-only credential evidence is required}"
    : "${WHATITDO_STAGED_SENTINEL_PLAN_RECORD:?STOP: approved staged sentinel plan is required}"

Only after that gate passes may PR #5 be marked ready and the final merge protected with a readback
SHA. Stop if the default tip moved until it is merged into PR-A and every PR-A gate is rerun.

    gh pr ready "$WHATITDO_PR_A" --repo "$WHATITDO_REPO"
    gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json isDraft,state,baseRefOid,headRefOid \
      | jq -e '.isDraft == false and .state == "OPEN"'
    export WHATITDO_FINAL_HEAD=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json headRefOid -q .headRefOid)
    test "$(git ls-remote origin "refs/heads/$WHATITDO_DEFAULT_BRANCH" | cut -f1)" = \
      "$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" --json baseRefOid -q .baseRefOid)"

Resolve the deployment currently bound to `www.whatitdo.xyz`, prove it is a READY Production
deployment for this project, and record that exact ID as rollback target. Do not infer rollback from
deployment-list ordering. Then disable automatic domain assignment and read it back before the final
merge. This keeps public aliases on the proven deployment until the new generated host passes.

    WHATITDO_ALIAS_BEFORE=$("$WHATITDO_VERCEL" api \
      /v4/aliases/www.whatitdo.xyz --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    export WHATITDO_ROLLBACK_ID=$(jq -er --arg project "$WHATITDO_PROJECT_ID" '
      select(.alias == "www.whatitdo.xyz" and .projectId == $project) | .deploymentId
    ' <<<"$WHATITDO_ALIAS_BEFORE")
    WHATITDO_ROLLBACK_DEPLOYMENT=$("$WHATITDO_VERCEL" api \
      "/v13/deployments/$WHATITDO_ROLLBACK_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --raw)
    jq -e --arg id "$WHATITDO_ROLLBACK_ID" --arg project "$WHATITDO_PROJECT_ID" '
      .id == $id and .projectId == $project and
      .readyState == "READY" and .target == "production"
    ' <<<"$WHATITDO_ROLLBACK_DEPLOYMENT"
    "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
      -F autoAssignCustomDomains=false --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e '.autoAssignCustomDomains == false'
    export WHATITDO_LIVE_DEFAULT=$(git ls-remote origin \
      "refs/heads/$WHATITDO_DEFAULT_BRANCH" | cut -f1)
    WHATITDO_FINAL_PR_STATE=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json state,isDraft,baseRefName,baseRefOid,headRefOid)
    jq -e \
      --arg base "$WHATITDO_DEFAULT_BRANCH" \
      --arg base_oid "$WHATITDO_LIVE_DEFAULT" \
      --arg head_oid "$WHATITDO_FINAL_HEAD" '
        .state == "OPEN" and .isDraft == false and
        .baseRefName == $base and .baseRefOid == $base_oid and
        .headRefOid == $head_oid
    ' <<<"$WHATITDO_FINAL_PR_STATE"
    gh pr merge "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" --merge \
      --match-head-commit "$WHATITDO_FINAL_HEAD" \
      --subject 'Merge completed WhatItDo audit and PR #4 repairs'
    export WHATITDO_FINAL_MERGE=$(gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json mergeCommit -q .mergeCommit.oid)
    git fetch origin --prune
    test "$(git rev-parse "origin/$WHATITDO_DEFAULT_BRANCH")" = "$WHATITDO_FINAL_MERGE"
    test "$(git rev-parse "$WHATITDO_FINAL_MERGE^1")" = "$WHATITDO_LIVE_DEFAULT"
    test "$(git rev-parse "$WHATITDO_FINAL_MERGE^2")" = "$WHATITDO_FINAL_HEAD"
    test "$(git merge-base "$WHATITDO_FINAL_HEAD" "$WHATITDO_FINAL_MERGE")" = \
      "$WHATITDO_FINAL_HEAD"
    test "$(git rev-parse "$WHATITDO_FINAL_MERGE^{tree}")" = \
      "$(git rev-parse "$WHATITDO_FINAL_HEAD^{tree}")"

Wait in communicated intervals of no more than 60 seconds for the exact default-branch `push` CI and
a single `target=production`, `READY` deployment whose Git SHA is `WHATITDO_FINAL_MERGE`. Query fresh
state on every interval; never reuse the pre-merge deployment JSON. Require all three CI jobs, probe
the deployment by ID, then promote and verify the public domain. Restore automatic domain assignment
after promotion.

    WHATITDO_FINAL_GATE_DEADLINE=$(( $(date +%s) + 600 ))
    while :; do
      WHATITDO_RUNS=$(gh api --method GET \
        "repos/$WHATITDO_REPO/actions/runs" \
        -f head_sha="$WHATITDO_FINAL_MERGE" -f per_page=100)
      WHATITDO_DEFAULT_RUN=$(jq -c '
        [.workflow_runs[] |
         select(.name == "CI" and .event == "push")] |
        sort_by(.created_at) | last // {}
      ' <<<"$WHATITDO_RUNS")
      WHATITDO_DEFAULT_RUN_ID=$(jq -r '
        select(.status == "completed" and .conclusion == "success") | .id // empty
      ' <<<"$WHATITDO_DEFAULT_RUN")
      if jq -e '.status == "completed" and .conclusion != "success"' \
        <<<"$WHATITDO_DEFAULT_RUN" >/dev/null; then
        exit 1
      fi
      WHATITDO_DEPLOYMENTS=$("$WHATITDO_VERCEL" api \
        "/v6/deployments?projectId=$WHATITDO_PROJECT_ID&limit=100" \
        --scope "$WHATITDO_VERCEL_SCOPE" --raw)
      WHATITDO_FINAL_DEPLOYMENT_ID=$(jq -r \
        --arg sha "$WHATITDO_FINAL_MERGE" --arg project "$WHATITDO_PROJECT_ID" '
        [.deployments[] |
         select(.meta.githubCommitSha == $sha and .projectId == $project and
                .target == "production" and .readyState == "READY")] |
        if length == 1 then .[0].uid else empty end
      ' <<<"$WHATITDO_DEPLOYMENTS")
      if [ -n "$WHATITDO_DEFAULT_RUN_ID" ] && \
         [ -n "$WHATITDO_FINAL_DEPLOYMENT_ID" ]; then
        export WHATITDO_DEFAULT_RUN_ID WHATITDO_FINAL_DEPLOYMENT_ID
        break
      fi
      if [ "$(date +%s)" -ge "$WHATITDO_FINAL_GATE_DEADLINE" ]; then
        exit 124
      fi
      sleep 15
    done
    WHATITDO_DEFAULT_RUN_VIEW=$(gh run view "$WHATITDO_DEFAULT_RUN_ID" \
      --repo "$WHATITDO_REPO" --json headSha,jobs)
    jq -e --arg sha "$WHATITDO_FINAL_MERGE" '
      .headSha == $sha and
      ([.jobs[] | select(.conclusion == "success") | .name] | sort) ==
      (["build","e2e","redis-integration"] | sort)' <<<"$WHATITDO_DEFAULT_RUN_VIEW"
    WHATITDO_DEFAULT_REDIS_JOB_ID=$(jq -er \
      '.jobs[] | select(.name == "redis-integration") | .databaseId' \
      <<<"$WHATITDO_DEFAULT_RUN_VIEW")
    WHATITDO_DEFAULT_REDIS_LOG=$(gh run view "$WHATITDO_DEFAULT_RUN_ID" \
      --repo "$WHATITDO_REPO" --job "$WHATITDO_DEFAULT_REDIS_JOB_ID" --log)
    grep -Eq '14 passed.*\(14\)' <<<"$WHATITDO_DEFAULT_REDIS_LOG"
    if grep -Eq 'Tests.*skipped' <<<"$WHATITDO_DEFAULT_REDIS_LOG"; then
      exit 1
    fi
    WHATITDO_FINAL_PROBE=$(
      "$WHATITDO_VERCEL" curl '/api/poll?id=AAAAAAAAAA' \
        --deployment "$WHATITDO_FINAL_DEPLOYMENT_ID" --scope "$WHATITDO_VERCEL_SCOPE" -- \
        --silent --show-error --max-time 15 --max-redirs 0 \
        --write-out $'\n__STATUS__%{http_code}\n__REDIRECT__%{redirect_url}'
    )
    if test "$(sed -n 's/^__STATUS__//p' <<<"$WHATITDO_FINAL_PROBE")" = 404 && \
       test -z "$(sed -n 's/^__REDIRECT__//p' <<<"$WHATITDO_FINAL_PROBE")" && \
       sed '/^__STATUS__/,$d' <<<"$WHATITDO_FINAL_PROBE" \
         | jq -e '.error == "Poll not found"' >/dev/null; then
      :
    else
      WHATITDO_ABORT_ALIAS=$("$WHATITDO_VERCEL" api \
        /v4/aliases/www.whatitdo.xyz --scope "$WHATITDO_VERCEL_SCOPE" --raw)
      jq -e --arg deployment "$WHATITDO_ROLLBACK_ID" \
        --arg project "$WHATITDO_PROJECT_ID" '
        .alias == "www.whatitdo.xyz" and .projectId == $project and
        .deploymentId == $deployment
      ' <<<"$WHATITDO_ABORT_ALIAS"
      "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
        -F autoAssignCustomDomains=true --scope "$WHATITDO_VERCEL_SCOPE" --raw \
        | jq -e '.autoAssignCustomDomains == true'
      exit 1
    fi
    export WHATITDO_PROMOTION_REQUESTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if ! "$WHATITDO_VERCEL" promote "$WHATITDO_FINAL_DEPLOYMENT_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --yes --timeout 0; then
      echo 'Promotion request returned nonzero; polling because Vercel timeouts do not cancel it.' >&2
    fi
    WHATITDO_PROMOTION_DEADLINE=$(( $(date +%s) + 600 ))
    WHATITDO_NO_PENDING_PROMOTION=0
    while :; do
      WHATITDO_ALIAS_AFTER=$("$WHATITDO_VERCEL" api \
        /v4/aliases/www.whatitdo.xyz --scope "$WHATITDO_VERCEL_SCOPE" --raw)
      WHATITDO_BOUND_DEPLOYMENT=$(jq -er --arg project "$WHATITDO_PROJECT_ID" '
        select(.alias == "www.whatitdo.xyz" and .projectId == $project) | .deploymentId
      ' <<<"$WHATITDO_ALIAS_AFTER")
      if [ "$WHATITDO_BOUND_DEPLOYMENT" != "$WHATITDO_FINAL_DEPLOYMENT_ID" ] && \
         [ "$WHATITDO_BOUND_DEPLOYMENT" != "$WHATITDO_ROLLBACK_ID" ]; then
        exit 1
      fi
      if WHATITDO_PROMOTION_STATUS=$("$WHATITDO_VERCEL" promote status \
        "$WHATITDO_PROJECT_ID" --timeout 15s --scope "$WHATITDO_VERCEL_SCOPE" --no-color); then
        if grep -Fq 'No deployment promotion in progress' <<<"$WHATITDO_PROMOTION_STATUS"; then
          WHATITDO_NO_PENDING_PROMOTION=$(( WHATITDO_NO_PENDING_PROMOTION + 1 ))
        else
          WHATITDO_NO_PENDING_PROMOTION=0
        fi
      else
        WHATITDO_NO_PENDING_PROMOTION=0
      fi
      if [ "$WHATITDO_NO_PENDING_PROMOTION" -ge 2 ]; then
        if [ "$WHATITDO_BOUND_DEPLOYMENT" = "$WHATITDO_FINAL_DEPLOYMENT_ID" ]; then
          break
        fi
        "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
          -F autoAssignCustomDomains=true --scope "$WHATITDO_VERCEL_SCOPE" --raw \
          | jq -e '.autoAssignCustomDomains == true'
        echo 'Promotion ended without binding the target; prior Production remains live.' >&2
        exit 1
      fi
      if [ "$(date +%s)" -ge "$WHATITDO_PROMOTION_DEADLINE" ]; then
        echo 'Promotion is still indeterminate; do not issue a competing rollback.' >&2
        exit 124
      fi
      sleep 15
    done
    DEPLOYMENT_URL=https://www.whatitdo.xyz node --input-type=module -e '
      const base = new URL(process.env.DEPLOYMENT_URL)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      try {
        const response = await fetch(new URL("/api/poll?id=AAAAAAAAAA", base), {
          redirect: "manual",
          signal: controller.signal,
        })
        const body = await response.json().catch(() => null)
        if (response.status !== 404 || response.headers.has("location") ||
            body?.error !== "Poll not found") throw new Error("production sentinel failed")
        console.log("production sentinel passed")
      } finally {
        clearTimeout(timer)
      }'
    "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
      -F autoAssignCustomDomains=true --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e '.autoAssignCustomDomains == true'

Vercel documents that a CLI timeout does not cancel promotion or rollback. Therefore never issue a
rollback merely because the promotion command or ten-minute poll timed out. A pre-promotion
generated-host failure leaves the recorded prior alias untouched: verify that binding, restore the
project setting, and stop without calling rollback. If the public sentinel fails only after the
alias is conclusively bound to the new deployment, request the recorded rollback asynchronously and
poll both rollback status and alias binding. Do not issue a second promotion or rollback while the
first mutation is pending.

    if ! "$WHATITDO_VERCEL" rollback "$WHATITDO_ROLLBACK_ID" \
      --scope "$WHATITDO_VERCEL_SCOPE" --yes --timeout 0; then
      echo 'Rollback request returned nonzero; polling because Vercel timeouts do not cancel it.' >&2
    fi
    WHATITDO_ROLLBACK_DEADLINE=$(( $(date +%s) + 600 ))
    WHATITDO_NO_PENDING_ROLLBACK=0
    while :; do
      WHATITDO_ALIAS_ROLLED_BACK=$("$WHATITDO_VERCEL" api \
        /v4/aliases/www.whatitdo.xyz --scope "$WHATITDO_VERCEL_SCOPE" --raw)
      WHATITDO_BOUND_DEPLOYMENT=$(jq -er --arg project "$WHATITDO_PROJECT_ID" '
        select(.alias == "www.whatitdo.xyz" and .projectId == $project) | .deploymentId
      ' <<<"$WHATITDO_ALIAS_ROLLED_BACK")
      if [ "$WHATITDO_BOUND_DEPLOYMENT" = "$WHATITDO_ROLLBACK_ID" ]; then
        break
      fi
      test "$WHATITDO_BOUND_DEPLOYMENT" = "$WHATITDO_FINAL_DEPLOYMENT_ID"
      if WHATITDO_ROLLBACK_STATUS=$("$WHATITDO_VERCEL" rollback status \
        "$WHATITDO_PROJECT_ID" --timeout 15s --scope "$WHATITDO_VERCEL_SCOPE" --no-color); then
        if grep -Fq 'No deployment rollback in progress' <<<"$WHATITDO_ROLLBACK_STATUS"; then
          WHATITDO_NO_PENDING_ROLLBACK=$(( WHATITDO_NO_PENDING_ROLLBACK + 1 ))
        else
          WHATITDO_NO_PENDING_ROLLBACK=0
        fi
      else
        WHATITDO_NO_PENDING_ROLLBACK=0
      fi
      if [ "$WHATITDO_NO_PENDING_ROLLBACK" -ge 2 ]; then
        echo 'Rollback ended without restoring the recorded deployment.' >&2
        exit 1
      fi
      if [ "$(date +%s)" -ge "$WHATITDO_ROLLBACK_DEADLINE" ]; then
        echo 'Rollback is still indeterminate; do not issue a competing mutation.' >&2
        exit 124
      fi
      sleep 15
    done
    "$WHATITDO_VERCEL" api "/v9/projects/$WHATITDO_PROJECT_ID" -X PATCH \
      -F autoAssignCustomDomains=true --scope "$WHATITDO_VERCEL_SCOPE" --raw \
      | jq -e '.autoAssignCustomDomains == true'

After at least one hour of availability, query both error and fatal logs for the exact deployment
from the recorded promotion-request timestamp through the observation time. Empty JSONL output is
the expected clean result; inspect and redact any user data before recording a real error excerpt.

    export WHATITDO_LOG_UNTIL=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    for WHATITDO_LOG_LEVEL in error fatal; do
      "$WHATITDO_VERCEL" logs "$WHATITDO_FINAL_DEPLOYMENT_ID" --no-follow --json \
        --level "$WHATITDO_LOG_LEVEL" --since "$WHATITDO_PROMOTION_REQUESTED_AT" \
        --until "$WHATITDO_LOG_UNTIL" --limit 1000 --scope "$WHATITDO_VERCEL_SCOPE"
    done

## Validation and Acceptance

Focused commands, selected by changed packet:

    npx vitest run src/app/api/poll/route.test.ts
    npx vitest run src/lib/resultsTokenFormat.test.ts src/lib/resultsToken.test.ts \
      src/lib/validation.test.ts src/app/api/results/route.test.ts
    npx vitest run src/lib/redis.test.ts src/lib/redis.upstash.test.ts src/lib/redis.protocol.test.ts
    npx vitest run src/lib/submissionDigest.test.ts src/app/api/vote/route.test.ts
    npx vitest run src/lib/withTimeout.test.ts src/lib/escapeHtml.test.ts src/app/api/vote/route.test.ts
    REDIS_URL=redis://127.0.0.1:6379 npx vitest run src/lib/redis.integration.test.ts
    CI=1 npx playwright test e2e/poll-flows.spec.ts \
      --grep "ambiguous vote retry|forced-colors focus|ballot closes"

The candidate is acceptable only when:

- PR-A initially shows exactly the first 16 commits and PR #4 shows `de8af4a` plus repairs.
- Poll creation consumes rate capacity once, never overwrites an occupied companion namespace,
  retries at most three fresh ID/token pairs, and returns private/no-store success.
- Equal submission retries produce one response and one provider-idempotent email attempt. Changed
  payload reuse and legacy receipts return 409 before rate/mutation/email.
- Email contains escaped vote details; its subject/body contain no private credential, link, ID, or
  destination address. Missing key, destination, or verified sender is `not_configured`. Only the
  provider wait is capped at five seconds.
- Classic, Dubious, unauthorized results, notification truth, retry, 375 px, accessibility, and
  forced-colors cases pass.
- Lint, typecheck, unit tests, Redis 7 integration, E2E, build, and high-severity audit are green on
  the required integrated heads; every new exact-head Redis CI job reports 14 passed and zero
  skipped.
- Every PR #4 review thread has an evidence-backed reply and is resolved.
- C-10 is accepted only when PR #4 is merged into PR-A, PR-A's exact head passes CI and authenticated
  Preview proof, PR #5 remains draft, and default and Production are unchanged at that checkpoint.
- C-11/C-12 are accepted only when the authorized active runbook proves the isolated provider,
  Production-only credentials, exact-tree fallback, race-safe merge, exact final deployment,
  five-alias promotion, setting restoration, and immediate plus delayed log checks.

Use this read-only sentinel with `DEPLOYMENT_URL` set to the exact provider-attested generated URL or
the public Production URL. A protection bypass may come only from a non-printed environment variable.

    node --input-type=module -e '
      const base = new URL(process.env.DEPLOYMENT_URL)
      if (base.protocol !== "https:") throw new Error("HTTPS deployment URL required")
      const url = new URL("/api/poll?id=AAAAAAAAAA", base)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      try {
        const bypass = process.env.VERCEL_PROTECTION_BYPASS
        const response = await fetch(url, {
          redirect: "manual",
          signal: controller.signal,
          headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
        })
        const body = await response.json().catch(() => null)
        if (response.status !== 404 || response.headers.has("location") ||
            new URL(response.url).host !== url.host || body?.error !== "Poll not found") {
          throw new Error("deployment sentinel failed")
        }
        console.log("read-only deployment sentinel passed")
      } finally {
        clearTimeout(timer)
      }
    '

## Idempotence and Recovery

All local commits are additive; published history is never rewritten. Stage explicit paths and never
use `git add -A`. If an agent packet fails, leave its isolated worktree/branch intact and continue
with another disjoint packet. Cherry-pick only reviewed commits.

Creating the remote prerequisite ref is repeatable only when it is absent or exactly `02f73ef`.
Retargeting PR #4 is reversible before the inner merge by restoring its recorded original base. The
Vercel ignored-build and automatic-domain settings must always have a recorded before value and
readback after restoration.

If PR #4 has merged into PR-A but PR-A is not ready, default remains unchanged; add normal repair
commits to PR-A without force-pushing. If the final merge deployment fails, keep aliases on the prior
deployment or use the recorded rollback deployment. Never reset published history, delete production
data, print credentials, or place real poll/token/email data in logs or comments.

Every subagent turn and long-running diagnostic has a ten-minute wall-clock limit. At the limit,
interrupt it, retain partial evidence, and replace it with a narrower task.

## Artifacts and Notes

- Existing PR #4: `https://github.com/Phazzie/WhatItDo/pull/4`
- Prerequisite PR #5: `https://github.com/Phazzie/WhatItDo/pull/5`
- Giant commit: `de8af4ada4df2462302d35d436a9bdd75b1c42ff`
- First-16 tip/giant parent: `02f73efef6b57242073cc0573e105dd835b5009f`
- Starting default: `75f432d78647103618619319320317e603bde23e`
- Historical CI runs: push `29493097345`, pull request `29493099429`
- Vercel project: `phazzies-projects/what-it-do`, ID `prj_xO6lqwoneBD6PJSVxNbMtFuvmCO6`
- Starting Vercel settings: production branch is the repository default,
  `autoAssignCustomDomains=true`, ignored-build command absent, Preview SSO protected.
- Current-run Node: `/private/tmp/whatitdo-node22.NCpP5f/node-v22.23.1-darwin-x64/bin/node`.
  Reproduction URL and SHA-256 are recorded in Concrete Steps A.
- Active product audit: `docs/FINISH_AUDIT.md`
- Review ledger: `docs/PR4_REVIEW_THREADS.md`
- Superseded oversized draft: untracked `docs/SPARK_REPAIR_EXEC_PLAN.md`

## Interfaces and Dependencies

New interfaces:

    createPollAtomically(poll: StoredPoll):
      Promise<{ status: 'created' } | { status: 'namespace_conflict' }>

    createSubmissionDigest(ballot: {
      voterName: string
      votes: PollVote[]
      counterProposal?: string
    }): string

    AppendVoteInput.submissionDigest: string
    AppendVoteResult.status += 'idempotency_conflict'
    stored submission receipt: JSON { responseId: string, digest: string }

    withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>

Runtime dependencies are Next.js/React, the Upstash REST and node-redis clients, Nano ID, and Resend.
The two Redis clients implement one existing storage boundary; this incident repair does not add a
second logical database. Do not add a queue, another database, UI library, HMAC secret, or deployment
platform dependency.
