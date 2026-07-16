# WhatItDo Agent Guide

This repository is a small public polling application built with the Next.js App Router. The active
completion plan is `docs/FINISH_EXEC_PLAN.md`; read it and `docs/FINISH_AUDIT.md` before making a
product or architecture change.

## Product invariants

- A voting link and public poll response reveal exactly the poll title, mode, and suggestions. They
  must never reveal IDs in the response body, timestamps, voter names, comments, counterproposals,
  notification addresses, or the secret results credential.
- Results are owner-only-by-link. New polls use an independent, unguessable results token; knowing a
  vote URL must not make the results URL derivable.
- A recorded vote is the source of truth. Email is best-effort enhancement, so the UI may claim that
  a notification was sent only when the API confirms delivery.
- Concurrent submissions must not overwrite one another. Retrying one logical submission must not
  create a duplicate response or duplicate notification.
- Poll data expires after 30 days of inactivity and no later than 90 days after creation. A successful
  vote refreshes every key that belongs to that poll, capped by the absolute expiry, in one atomic
  operation.
- The app may accept at most 250 responses per poll. This bound keeps results reads and Redis storage
  predictable; do not remove it without adding pagination and a replacement abuse boundary.
- Classic mode accepts `yes`, `no`, and `maybe`. Dubious mode additionally accepts `yolo`.
- Vote summaries must be mathematically honest: ties are ties, bar widths match labeled percentages,
  and response order is not presented as a ranking.

## Security and privacy rules

- Never commit credentials, personal email addresses, deployment tokens, or real poll data.
- Validate and normalize all API input on the server. Client-side limits are usability only.
- New poll IDs are exactly 10 Nano ID characters. Results tokens are exactly 24 Nano ID characters,
  returned once in a URL fragment and stored only as SHA-256 hashes.
- Never return a stored results-token hash or notification email from a read endpoint. Never place a
  raw results token in a server path, query string, log, email, or referrer.
- Redis and Resend clients are initialized lazily. A build must not require runtime credentials.
- In-memory Redis is allowed only when `NODE_ENV=test`, or when `E2E_TEST=1`, `E2E_BASE_URL` is a
  loopback URL, and no recognized deployment marker is present. It must fail closed in every other
  production process, including non-Vercel hosting.
- Production rate limiting is always on. Resolve IPs only from Vercel-owned headers or an explicitly
  trusted proxy, fail closed when production identity is unavailable, and apply both IP and per-poll
  buckets to new vote submissions. A known duplicate succeeds before consuming rate capacity.
- Email contains vote details but no private results link. Escape every user-controlled HTML or header
  value, inspect resolved Resend errors, and reuse the submission ID as the provider idempotency key.

## Working agreement

- Preserve unrelated user changes. Check `git status --short --branch` before and after each slice.
- Work on the PR #4 branch, `claude/repo-audit-completion-plan-uau7sr`, until this plan is complete.
- Keep commits focused and reviewable. Do not rewrite published history.
- Use subagents for bounded audits, test design, and review. One agent owns a file at a time; the root
  agent integrates changes and runs repository-wide gates.
- Give every subagent and long-running diagnostic a hard 10-minute wall-clock limit. At the limit,
  interrupt it, retain any partial evidence, and continue locally or replace it with a narrower task;
  never extend the wait silently.
- For complex features or significant refactors, use an ExecPlan as described in `.agent/PLANS.md`
  from design through implementation.
- Keep the active plan's `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes &
  Retrospective` sections current at every stopping point.
- A review thread is not "addressed" merely because code changed. Link the fix or test in a concise
  reply, then resolve the thread only after the relevant gate passes. Explicitly explain false
  positives and license-only findings before resolving them.
- Do not merge stale PR #2 or the unmerged Copilot branch wholesale. Mine individual ideas only after
  reviewing them against the active branch.

## Target architecture

- `src/app/api/poll/route.ts`: create polls and return the exact public voting DTO.
- `src/app/api/results/route.ts`: accept private results credentials by POST body and return no-store
  owner data.
- `src/app/api/vote/route.ts`: validate, rate-limit, atomically append, and best-effort notify.
- `src/lib/validation.ts`: request parsing, normalization, ID/token validation, shared limits.
- `src/lib/redis.ts`: lazy Redis selection, rate limiting, and the atomic response-append boundary.
- `src/lib/types.ts`: distinct stored, voting, results, and API response contracts.
- `src/lib/results.ts`: pure vote-count and tie calculation helpers.
- `src/app/results/[id]/page.tsx`: read the token from the URL fragment and POST it to the results API.
- `src/test/`: test-only helpers. Production modules must not import from this directory.

## Required checks

Run these from the repository root after the dependency-upgrade slice lands:

    npm run lint
    npm run typecheck
    npm test
    npm run test:integration
    npm run e2e
    npm run build
    npm audit --audit-level=high

`test:integration` may skip locally when `REDIS_URL` is absent, but CI must run it against Redis 7.
Browser coverage must include Classic and Dubious happy paths, an unauthorized-results check, the
best-effort email message, a 375 px mobile viewport, and an automated accessibility scan.

## Visual direction

The finish pass uses a bold "midnight scrapbook" direction inspired by the Erin repositories' neon
pink/cyan/chartreuse glow and playful copy. Preserve semantic HTML, visible focus, high contrast, touch
targets, and `prefers-reduced-motion`. Generated background art belongs in `public/` and must not
contain text, logos, copyrighted characters, or essential information.

## Definition of done

Done means the active ExecPlan is complete; the audit has a disposition for every finding; local and
GitHub checks are green; every PR #4 review thread is replied to and resolved; the branch is pushed;
and the deployment is verified. A platform-owned Vercel credential failure may be recorded as an
external blocker only after application build evidence is green and a retry/repair attempt is logged.
