# Finish PR #4 with a Two-PR Repair Stack

This ExecPlan follows `.agent/PLANS.md`. It is the execution checklist for the owner-authorized
2026-07-19 repair run through PR-A's exact-head Preview proof. Keep it current after every commit,
push, merge, or stopping point. Production is a separate owner-gated run because the provider
incident introduced a paid/terms/credential decision that the original authorization did not cover.
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
  `222fc6d`, but its authenticated Preview sentinel exposed the dead deployed Redis resource. That required the
  standard Redis adapter and Preview provider path, another complete local gate, and literal final-
  SHA review before C-08 could close. The first Redis-repair review caught a healthy-idle socket
  churn defect; the command-scoped replacement and its full local gate are green, and three exact-
  head lanes cleared `b2b3ea4`. A new current client/server import-boundary thread arrived after that push, so its small
  follow-up passed focused tests, lint, typecheck, build, emitted-client scan, coverage, 17/17
  browser proof, three exact-head reviews, both CI event suites, and exact Preview proof. The final
  thread-by-thread disposition audit then caught two deleted mock regressions: negative `LRANGE`
  stop handling and plain `SET` clearing an existing TTL. The replacement in-memory adapter is
  correct; both direct assertions and both missing browser error-propagation checks were restored.
  Their focused tests, production build, lint, typecheck, 149-case coverage gate, three exact-head
  reviews, both CI event suites, and exact Preview proof all pass at `2da1d00`.
- [ ] C-09 Push the repair candidate, make it green, resolve every review thread, and push the
  evidence-only closeout; record its final exact-head proof in PR #4. Candidate `b2b3ea4` passed
  push run `29689374588`, pull-request run `29689376387`, 14/14 Redis cases in both, and exact
  Preview `dpl_GZjJ6eYfbo3BviomvBKoKukKe8tF`. Follow-up `c12b160` passed push run `29689940711`,
  pull-request run `29689941869`, 14/14 Redis cases in both, and exact Preview
  `dpl_39BdZpasnZGjZw6ibscbDYjYtCP6`. Final code head `2da1d00` passed push run `29690493749`, pull-
  request run `29690494814`, 14/14 Redis and 19/19 browser cases in both, and exact Preview
  `dpl_DiwQyw7KexX5mT9kxA25gfXCACgk`. All 29 threads have evidence replies and are resolved; the
  GraphQL refetch reports zero unresolved and no change-request review. Record and prove the
  evidence-only closeout before C-09 closes.
- [ ] C-10 Merge PR #4 into PR-A, commit the inner-merge evidence, prove PR-A's exact head in CI and
  Preview, leave PR #5 draft, and STOP with default and Production unchanged.
- [ ] C-11 OWNER GATE: after separately recorded owner authorization, verify an owner-approved
  persistent provider, fresh Production-only credentials, and the staged sentinel plan; only then
  mark PR #5 ready, merge default, stage, verify, and promote Production.
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
  fresh credentials scoped only to Production, and an approved staged sentinel/promotion/rollback
  plan.

## Outcomes & Retrospective

Planning outcome: the executable unit is a coherent behavior packet, not an arbitrary line count or
one-file microticket. The run has five planned repair commits plus explicit hostile-review follow-up,
two implementation waves, a final integrated local gate, and one intentional code-candidate push.
Evidence-only commits are allowed where remote proof cannot exist earlier. The current run ends
after the C-10 inner merge and PR-A's exact-head Preview proof, with PR #5 still draft and Production
unchanged. Update this section through that stopping point in Git. Only a later owner-authorized C-11
run may append the Production SHA, deployment, promotion, C-12 checks, and retrospective to the
relevant PR's durable release-evidence record.

## Context and Orientation

The working branch is `claude/repo-audit-completion-plan-uau7sr`. Its published head is giant commit
`de8af4a`; its immediate parent `02f73ef` is the tip after the first 16 commits. The repository
default is `claude/voting-suggestions-app-01QZyxebMi27ePup8cniRCws` at `75f432d`.

The current shared worktree begins with two intended modified tests:

- `e2e/poll-flows.spec.ts`
- `src/lib/redis.integration.test.ts`

It also contains this plan and the older untracked `docs/SPARK_REPAIR_EXEC_PLAN.md`. Preserve the old
Spark file and never stage it implicitly. Use explicit paths for every commit.

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
- Leave PR #5 draft and STOP. Record the PR-A head, CI runs, Preview deployment, sentinel result, and
  unresolved-thread count. Do not mark PR #5 ready or mutate default, Production credentials,
  domains, aliases, promotion, or rollback state in this run.

#### C-11 and C-12 — separately owner-gated Production release

- Resume only after the owner authorization record names the persistent provider, authorizes fresh
  Production-only credentials, and approves the exact staged sentinel/promotion/rollback sequence.
- After all owner-gate checks are recorded, mark PR #5 ready, disable automatic custom-domain
  assignment, merge with expected-head protection, require exact default CI and a staged
  `target=production` deployment, run the generated-host sentinel, promote, and rerun the public
  sentinel.
- Record final SHAs, URLs, check outcomes, deployment and rollback IDs, log window, and retrospective.

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
- [ ] Record the green run IDs, Preview ID, replies, and zero-thread result in the plan/ledger; commit
  only those evidence files and push once.
- [ ] Require both CI event suites, no current change request, zero unresolved threads, deployment
  SHA equality, and the Preview sentinel again on the evidence commit. This is PR #4's merge head.

### E. Permitted inner merge and owner-gated Production

- [ ] Restore the prior null Vercel Ignored Build Step and verify readback.
- [ ] Recheck PR #4 base/head OIDs and merge with `--merge --match-head-commit`.
- [ ] Prove PR #4 repaired head is an ancestor of PR-A head and both trees are identical.
- [ ] Update this plan through C-10 on PR-A, commit that inner-merge evidence, and push once.
- [ ] Require completed PR-A CI, zero unresolved PR-A threads, no current change request, and the
  exact-host Preview sentinel on that evidence head.
- [ ] Leave PR #5 draft and STOP. Record the PR-A exact head and Preview evidence; confirm default,
  Production credentials, domain assignment, aliases, and the current Production deployment did not
  change during C-10.

The following owner gate is intentionally unchecked. None of the C-11/C-12 items or Production
commands below are authorized by the current run.

- [ ] Record fresh owner authorization to resume C-11 and identify its durable evidence location.
- [ ] Record the owner-approved persistent Redis provider/tier and prove it satisfies the recorded-
  vote and 30/90-day retention invariants.
- [ ] Install fresh credentials scoped to Production only; prove their project/environment names
  without printing values and prove the free Preview credential is not available to Production.
- [ ] Record owner approval of the staged release plan: keep aliases on the prior deployment, probe
  the exact generated host read-only, promote only after it passes, and use the recorded rollback ID
  if the post-promotion public sentinel fails.
- [ ] OWNER GATE COMPLETE: only after all four preceding items are checked, mark PR-A ready, read back
  `isDraft=false`, and recheck its exact base/head OIDs.
- [ ] Recheck the live default OID. If it moved, merge that tip into PR-A and rerun PR-A proof.
- [ ] Set Vercel `autoAssignCustomDomains=false`; record the prior production deployment/rollback ID.
- [ ] Merge PR-A with `--merge --match-head-commit` and verify first-parent/ancestry/default tip.
- [ ] Require final default push CI green and locate the exact-SHA `target=production`, `READY`,
  staged deployment while public domains remain on the prior deployment.
- [ ] Run the read-only generated-host sentinel, promote the exact deployment, verify public-domain
  binding, and rerun the sentinel on `https://www.whatitdo.xyz`.
- [ ] Restore `autoAssignCustomDomains=true` unless recorded evidence shows its prior value changed.
- [ ] Scan one hour of exact-deployment runtime error logs and record the result.
- [ ] Append the C-11/C-12 checklist disposition, exact evidence, and retrospective to PR-A's
  `Release evidence` body section and a final comment. Link the comment from the body. This merged PR
  record is the post-release extension of this ExecPlan; do not create a third deployment merely to
  backfill the repository copy.

## Remote Command Runbook

Use these task-specific variables in a fresh shell. Never put a credential in a command, plan,
comment, or captured output.

    export WHATITDO_REPO=Phazzie/WhatItDo
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

Create the C-10 evidence commit in an isolated worktree so the PR #4 worktree remains recoverable.
Use `apply_patch` to record C-10, the inner merge SHA, and completed prior evidence in the plan and
ledger; stage only those explicit files. Then run the same exact-head CI, thread, review, and Preview
proof with `WHATITDO_PROOF_PR=$WHATITDO_PR_A`.

    export WHATITDO_PR_A_WORKTREE=$(mktemp -d /private/tmp/whatitdo-pr-a.XXXXXX)
    git worktree add --detach "$WHATITDO_PR_A_WORKTREE" "origin/$WHATITDO_PR_A_BRANCH"
    cd "$WHATITDO_PR_A_WORKTREE"
    # Use apply_patch here; do not edit with shell redirection.
    git add docs/PR4_TWO_PR_REPAIR_EXEC_PLAN.md docs/PR4_REVIEW_THREADS.md
    git diff --cached --check
    git commit -m 'Record repaired PR #4 inner-merge evidence'
    git push origin "HEAD:refs/heads/$WHATITDO_PR_A_BRANCH"
    export WHATITDO_PROOF_PR=$WHATITDO_PR_A
    export WHATITDO_CANDIDATE_SHA=$(git rev-parse HEAD)
    test "$(git ls-remote origin "refs/heads/$WHATITDO_PR_A_BRANCH" | cut -f1)" = \
      "$WHATITDO_CANDIDATE_SHA"
    wait_for_pr_checks "$WHATITDO_PROOF_PR"

After committing C-10 evidence on PR-A, repeat the exact-head CI, thread/review, deployment-metadata,
and authenticated Preview sentinel proof above with `WHATITDO_PROOF_PR=$WHATITDO_PR_A`. Record that
evidence, prove PR #5 remains draft, and STOP. This is the current run endpoint; default and
Production remain unchanged.

    gh pr view "$WHATITDO_PR_A" --repo "$WHATITDO_REPO" \
      --json isDraft,state,headRefOid \
      | jq -e --arg head "$WHATITDO_CANDIDATE_SHA" '
          .isDraft == true and .state == "OPEN" and .headRefOid == $head'

### OWNER-GATED Production merge, staging, promotion, and rollback

Do not execute any command in this section during the current run. A future run must first check the
four owner-gate items in Checklist E and record non-secret evidence for each. The four shell evidence
variables below are deliberately required as a second fail-closed boundary; an agent must never set
them merely to bypass the checklist.

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
- The current run is accepted at C-10 only when PR #4 is merged into PR-A, PR-A's exact head passes
  CI and authenticated Preview proof, PR #5 remains draft, and default and Production are unchanged.
- C-11/C-12 remain unacceptable until the four owner-gate records exist. Only the later authorized
  run may accept that default contains the repaired PR-A head and Production serves the exact staged,
  sentinel-verified final merge deployment with no observed post-deploy errors.

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
