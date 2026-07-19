# PR #4 Review Thread Ledger

Repository: `Phazzie/whatitdo`
Pull request: `#4`
Baseline head: `02f73ef`
Baseline on 2026-07-16: 28 unresolved threads (17 current, 11 outdated)

Stack snapshot on 2026-07-19 at pushed head `2da1d00`:

- Draft prerequisite PR #5 is `75f432d..02f73ef` with exactly 16 commits and 28 paths.
- PR #4 is retargeted to `pr4-audit-prerequisites`, starts at giant commit `de8af4a`, and has exact
  pushed head `2da1d00`.
- Before disposition, the complete paginated GraphQL refetch returned the same 29 unresolved thread
  IDs, all outdated. After distinct evidence replies and resolution, it returned zero unresolved.
- No effective approval or change-request review exists; the latest bot reviews are comments only.
- Exact-head CI runs `29690493749` and `29690494814` are green; each Redis 7 job reports 14 passed
  with zero skipped and each browser job reports 19 passed. Preview deployment
  `dpl_DiwQyw7KexX5mT9kxA25gfXCACgk` returned the intentional read-only 404 sentinel with no redirect.
- A reply-by-reply proof audit found that the giant rewrite had removed the old direct regressions
  for threads 5 and 7. The replacement adapter implements both behaviors correctly, but those two
  assertions were restored and proven on the exact head before either thread was resolved.
- The same audit found that both outside-diff UI error-propagation changes were implemented but not
  directly asserted. Intercepted create and vote API failures are therefore part of the focused
  follow-up browser proof; both passed before the top-level disposition was posted.
- Node 22 final local proof is green: lint, typecheck, build, zero-vulnerability audit, 147 Vitest
  cases passed, the permitted 14 Redis-only cases skipped without `REDIS_URL`, and 17 full-browser
  cases passed. Coverage is 90.95% statements, 85.11% branches, 96.33% functions, and 94.43% lines.
- The focused thread-proof follow-up passes both direct in-memory regressions, both intercepted-
  response browser cases, a fresh production build, lint, typecheck, and the full 149-case coverage
  suite. Coverage remains above every gate at 90.95% statements, 85.33% branches, 96.33% functions,
  and 94.43% lines; three exact-head reviews and all remote proofs pass.

Update this ledger after each push. A thread moves to `resolved` only after its required evidence is
green and a concise reply has been posted. The final GraphQL fetch must report zero unresolved.

| # | Thread node ID | Anchor | Latest status | Category / intended disposition | Required evidence | Reply | Resolution |
|---:|---|---|---|---|---|---|---|
| 1 | `PRRT_kwDOQoDeUc6ObWE8` | `package-lock.json:170` | outdated | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | posted | resolved |
| 2 | `PRRT_kwDOQoDeUc6ObWE9` | `package-lock.json:270` | outdated | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | posted | resolved |
| 3 | `PRRT_kwDOQoDeUc6ObWE-` | `package-lock.json:4791` | outdated | BlueOak-1.0.0 dev dependency; verify and explain | Final lock + dependency license notice | posted | resolved |
| 4 | `PRRT_kwDOQoDeUc6ObWFA` | `package-lock.json:5900` | outdated | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | posted | resolved |
| 5 | `PRRT_kwDOQoDeUc6ObWGy` | `src/test/mockRedis.ts:63` | outdated | LRANGE negative stop; replacement is fixed | Direct in-memory regression + full unit suite | posted | resolved |
| 6 | `PRRT_kwDOQoDeUc6ObWu0` | `vitest.config.ts` | outdated | ESM `__dirname`; already fixed | Lint/type/test on final head | posted | resolved |
| 7 | `PRRT_kwDOQoDeUc6ObWu8` | `src/test/mockRedis.ts:39` | outdated | SET without EX clears TTL; replacement is fixed | Direct in-memory regression + Redis contract | posted | resolved |
| 8 | `PRRT_kwDOQoDeUc6ObWu-` | `.github/workflows/ci.yml:27` | outdated | Node version; already fixed and will remain supported | Final CI on Node 22 | posted | resolved |
| 9 | `PRRT_kwDOQoDeUc6ObWvB` | `docs/COMPLETION_PLAN.md` | outdated | Absolute local path; already fixed | Portable final docs | posted | resolved |
| 10 | `PRRT_kwDOQoDeUc6ObWvF` | `package.json:9` | outdated | Node engine; already fixed, README must match | Manifest/README + CI | posted | resolved |
| 11 | `PRRT_kwDOQoDeUc6ObY6F` | `README.md:94` | outdated | `EMAIL_FROM` drift; rewrite docs to final email contract | README verified against route | posted | resolved |
| 12 | `PRRT_kwDOQoDeUc6ObY6G` | `README.md:264` | outdated | `PollResponse` name; already fixed | Final README type examples | posted | resolved |
| 13 | `PRRT_kwDOQoDeUc6ObY6H` | `src/app/page.tsx:132` | outdated | Create error live region; preserve/finalize in redesign | Axe + keyboard E2E | posted | resolved |
| 14 | `PRRT_kwDOQoDeUc6ObY6L` | `src/app/vote/[id]/page.tsx:345` | outdated | Vote error live region; preserve/finalize in redesign | Axe + keyboard E2E | posted | resolved |
| 15 | `PRRT_kwDOQoDeUc6ObbZu` | `package.json` | outdated | Next ambient types claim; CI proves false positive | Fresh install typecheck + build | posted | resolved |
| 16 | `PRRT_kwDOQoDeUc6ObbZv` | `src/test/smoke.test.ts:6` | outdated | Vitest mock hoist concern; remove trivial smoke/mocked ambiguity | Final unit suite on fresh install | posted | resolved |
| 17 | `PRRT_kwDOQoDeUc6ObbZy` | `README.md` | outdated | Email env advertised before wiring; code fixed | Final README + email tests | posted | resolved |
| 18 | `PRRT_kwDOQoDeUc6OcASy` | `src/lib/redis.ts` | outdated | Limiter RMW race; superseded by atomic Lua | Redis 7 concurrency integration | posted | resolved |
| 19 | `PRRT_kwDOQoDeUc6OcASz` | `src/lib/validation.ts` | outdated | Duplicate suggestion validation; positional contract | Validation regression test | posted | resolved |
| 20 | `PRRT_kwDOQoDeUc6OcAS0` | `src/lib/validation.ts` | outdated | Reordered vote miscount; positional contract | Validation regression test | posted | resolved |
| 21 | `PRRT_kwDOQoDeUc6OcAS1` | `src/app/api/vote/route.ts` | outdated | Extra persisted fields; allowlist remains | Route persistence test | posted | resolved |
| 22 | `PRRT_kwDOQoDeUc6OcHha` | `src/app/api/vote/route.ts:24` | outdated | Production limiter disabled; replace with mandatory policy | Config matrix + route tests | posted | resolved |
| 23 | `PRRT_kwDOQoDeUc6OcHhc` | `src/lib/redis.ts:68` | outdated | Unbounded limiter list; replace with bounded atomic buckets | Redis 7 boundary test | posted | resolved |
| 24 | `PRRT_kwDOQoDeUc6QAwwY` | `src/app/api/poll/route.ts:50` | outdated | Private email exposure; new exact DTO removes field | Exact-key privacy tests | posted | resolved |
| 25 | `PRRT_kwDOQoDeUc6QA9aw` | `src/app/api/poll/route.ts` | outdated | Legacy response fallback; superseded by explicit HTTP 410 | Legacy GET/vote no-mutation tests | posted | resolved |
| 26 | `PRRT_kwDOQoDeUc6QA9az` | `src/app/api/poll/route.test.ts:13` | outdated | Vitest hoist concern; remove differing route mocks | Fresh full unit suite | posted | resolved |
| 27 | `PRRT_kwDOQoDeUc6QBJZJ` | `README.md:289` | outdated | Response list/TTL called future work | Final storage/retention docs | posted | resolved |
| 28 | `PRRT_kwDOQoDeUc6QBJZK` | `package.json:39` | outdated | README Node mismatch | README matches engine | posted | resolved |
| 29 | `PRRT_kwDOQoDeUc6SFC8r` | `src/lib/validation.ts:2` | outdated | Browser/server boundary split; pure format validation is now separate from Node-only hashing | 52 focused tests + clean emitted-client scan + typecheck/build/E2E | posted | resolved |

## Top-level review feedback

CodeRabbit's outside-diff review requested CI hardening plus propagation of create/vote API error
messages. All three are implemented and directly proven. The evidence disposition is posted at
`https://github.com/Phazzie/WhatItDo/pull/4#issuecomment-5016067474`.

## Final proof

- Latest remote code head: `2da1d00`
- Latest local code head: `2da1d00`; this ledger update is the pending evidence-only closeout
- Exact-head CI: runs `29690493749` and `29690494814` green; 14 Redis tests and 19 browser tests
  passed with zero skips in each run
- Exact-head Preview: `dpl_DiwQyw7KexX5mT9kxA25gfXCACgk`; read-only sentinel returned 404 with
  no redirect on the exact deployment host
- Thread fetch/date: complete paginated GraphQL refetch on 2026-07-19
- Evidence replies posted: 29
- Unresolved current: 0
- Unresolved outdated: 0
- Unresolved total: 0
- Current `CHANGES_REQUESTED`: 0
- Final zero-unresolved GraphQL proof: passed after all replies and resolutions
