# PR #4 Review Thread Ledger

Repository: `Phazzie/whatitdo`
Pull request: `#4`
Baseline head: `02f73ef`
Baseline on 2026-07-16: 28 unresolved threads (17 current, 11 outdated)

Stack snapshot on 2026-07-19:

- Draft prerequisite PR #5 is `75f432d..02f73ef` with exactly 16 commits and 28 paths.
- PR #4 is retargeted to `pr4-audit-prerequisites` and starts at giant commit `de8af4a`.
- The complete paginated GraphQL refetch returned the same 28 unresolved thread IDs: 0 current and
  28 outdated after retargeting. Retargeting did not resolve or discard any thread.
- No effective approval or change-request review exists; the latest bot reviews are comments only.

Update this ledger after each push. A thread moves to `resolved` only after its required evidence is
green and a concise reply has been posted. The final GraphQL fetch must report zero unresolved.

| # | Thread node ID | Anchor | Baseline | Category / intended disposition | Required evidence | Reply | Resolution |
|---:|---|---|---|---|---|---|---|
| 1 | `PRRT_kwDOQoDeUc6ObWE8` | `package-lock.json:170` | current | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | pending | pending |
| 2 | `PRRT_kwDOQoDeUc6ObWE9` | `package-lock.json:270` | current | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | pending | pending |
| 3 | `PRRT_kwDOQoDeUc6ObWE-` | `package-lock.json:4791` | current | BlueOak-1.0.0 dev dependency; verify and explain | Final lock + dependency license notice | pending | pending |
| 4 | `PRRT_kwDOQoDeUc6ObWFA` | `package-lock.json:5900` | current | MIT-0 license metadata; verify and explain | Final lock + dependency license notice | pending | pending |
| 5 | `PRRT_kwDOQoDeUc6ObWGy` | `src/test/mockRedis.ts:63` | current | LRANGE negative stop; already fixed | Focused mock test + full unit suite | pending | pending |
| 6 | `PRRT_kwDOQoDeUc6ObWu0` | `vitest.config.ts` | outdated | ESM `__dirname`; already fixed | Lint/type/test on final head | pending | pending |
| 7 | `PRRT_kwDOQoDeUc6ObWu8` | `src/test/mockRedis.ts:39` | outdated | SET without EX TTL; already fixed | Focused mock test + Redis contract | pending | pending |
| 8 | `PRRT_kwDOQoDeUc6ObWu-` | `.github/workflows/ci.yml:27` | outdated | Node version; already fixed and will remain supported | Final CI on Node 22 | pending | pending |
| 9 | `PRRT_kwDOQoDeUc6ObWvB` | `docs/COMPLETION_PLAN.md` | outdated | Absolute local path; already fixed | Portable final docs | pending | pending |
| 10 | `PRRT_kwDOQoDeUc6ObWvF` | `package.json:9` | current | Node engine; already fixed, README must match | Manifest/README + CI | pending | pending |
| 11 | `PRRT_kwDOQoDeUc6ObY6F` | `README.md:94` | current | `EMAIL_FROM` drift; rewrite docs to final email contract | README verified against route | pending | pending |
| 12 | `PRRT_kwDOQoDeUc6ObY6G` | `README.md:264` | current | `PollResponse` name; already fixed | Final README type examples | pending | pending |
| 13 | `PRRT_kwDOQoDeUc6ObY6H` | `src/app/page.tsx:132` | current | Create error live region; preserve/finalize in redesign | Axe + keyboard E2E | pending | pending |
| 14 | `PRRT_kwDOQoDeUc6ObY6L` | `src/app/vote/[id]/page.tsx:345` | current | Vote error live region; preserve/finalize in redesign | Axe + keyboard E2E | pending | pending |
| 15 | `PRRT_kwDOQoDeUc6ObbZu` | `package.json` | outdated | Next ambient types claim; CI proves false positive | Fresh install typecheck + build | pending | pending |
| 16 | `PRRT_kwDOQoDeUc6ObbZv` | `src/test/smoke.test.ts:6` | current | Vitest mock hoist concern; remove trivial smoke/mocked ambiguity | Final unit suite on fresh install | pending | pending |
| 17 | `PRRT_kwDOQoDeUc6ObbZy` | `README.md` | outdated | Email env advertised before wiring; code fixed | Final README + email tests | pending | pending |
| 18 | `PRRT_kwDOQoDeUc6OcASy` | `src/lib/redis.ts` | outdated | Limiter RMW race; superseded by atomic Lua | Redis 7 concurrency integration | pending | pending |
| 19 | `PRRT_kwDOQoDeUc6OcASz` | `src/lib/validation.ts` | outdated | Duplicate suggestion validation; positional contract | Validation regression test | pending | pending |
| 20 | `PRRT_kwDOQoDeUc6OcAS0` | `src/lib/validation.ts` | outdated | Reordered vote miscount; positional contract | Validation regression test | pending | pending |
| 21 | `PRRT_kwDOQoDeUc6OcAS1` | `src/app/api/vote/route.ts` | outdated | Extra persisted fields; allowlist remains | Route persistence test | pending | pending |
| 22 | `PRRT_kwDOQoDeUc6OcHha` | `src/app/api/vote/route.ts:24` | current | Production limiter disabled; replace with mandatory policy | Config matrix + route tests | pending | pending |
| 23 | `PRRT_kwDOQoDeUc6OcHhc` | `src/lib/redis.ts:68` | current | Unbounded limiter list; replace with bounded atomic buckets | Redis 7 boundary test | pending | pending |
| 24 | `PRRT_kwDOQoDeUc6QAwwY` | `src/app/api/poll/route.ts:50` | current | Private email exposure; new exact DTO removes field | Exact-key privacy tests | pending | pending |
| 25 | `PRRT_kwDOQoDeUc6QA9aw` | `src/app/api/poll/route.ts` | outdated | Legacy response fallback; superseded by explicit HTTP 410 | Legacy GET/vote no-mutation tests | pending | pending |
| 26 | `PRRT_kwDOQoDeUc6QA9az` | `src/app/api/poll/route.test.ts:13` | current | Vitest hoist concern; remove differing route mocks | Fresh full unit suite | pending | pending |
| 27 | `PRRT_kwDOQoDeUc6QBJZJ` | `README.md:289` | current | Response list/TTL called future work | Final storage/retention docs | pending | pending |
| 28 | `PRRT_kwDOQoDeUc6QBJZK` | `package.json:39` | current | README Node mismatch | README matches engine | pending | pending |

## Top-level review feedback

CodeRabbit also requested immutable GitHub Action references outside an inline thread. Pin every
`actions/checkout` and `actions/setup-node` use to a full commit SHA with a version comment, then cite
the green workflow run in the PR conversation.

## Final proof

- Latest head: pending
- Thread fetch command/date: pending
- Unresolved current: 0
- Unresolved outdated: 28
- Unresolved total: 28
- Final GraphQL unresolved count: pending
