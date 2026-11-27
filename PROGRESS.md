# PROGRESS — What It Do

## Morning report (2026-11-27)

**Done?** Not fully. Every line of the definition of done holds **except one**: on the private
preview, creating a poll fails because the preview's database is dead (details under Blockers). The
whole flow (create, vote, results) was clicked through and passes on a local production build with
the test store, and all 23 browser tests plus 169 unit tests pass.

**The world:** your group chat becomes a televised House floor vote. A poll is a bill, options are
sections, friends get a floor pass and vote YEA / PRESENT / NAY (or HELL YEA when the rules are
suspended), and only the sponsor holds the Clerk's key to the electronic vote board.

**Preview link (private, needs your Vercel login):**
https://what-it-do-git-claude-project-thread-iqv2ap-phazzies-projects.vercel.app/

**Pull request (not merged, main untouched):** https://github.com/Phazzie/WhatItDo/pull/13

**Honest score:** 8/10. The vote board and the Record are the best things on the site. The home page
is strong but quieter than the results; it could use one more bold move.

**What's still rough**
- Preview can't create polls until its database is replaced (see Blockers).
- The bill number (H.R. 4424) is decoration from the poll id, not a real count.
- Email alerts still say `yes / maybe / no / yolo`, not the chamber words.
- On phones, the member wall scrolls sideways on three-section bills with long names.
- A missing ballot logs a browser "404" line in the console. That is the real HTTP status, not a crash.

**Choices I made on my own that you should check**
1. **The world: the House floor vote.** The three pitches were:
   - a televised House floor vote (picked);
   - a 2 a.m. gas-station lottery terminal where every plan is a scratch-off;
   - a hostage-negotiation transcript where the group chat is holding the plan hostage.
   I picked the floor vote because it maps one-to-one onto how the app already works (bill,
   sections, roll call, amendments, a private tally), and because the joke is the gap: deadly
   procedural seriousness about Waffle House at 3 a.m. It is also unlike the motel, tarot, romance
   and fairytale worlds the other sites are likely to get.
   The obvious version, which I didn't build: a template poll page with a hero banner, three feature
   cards and a bar chart.
2. **Vote words changed, data didn't.** Yes/Maybe/Nope/YOLO now read YEA/PRESENT/NAY/HELL YEA. The
   stored values and the API are unchanged, so old polls and links keep working.
3. **"CHAT-SPAN" is our own made-up network.** I used no real network name, logo or real government
   seal. The seal is ours: "E PLURIBUS WHATEVER" around a question mark.
4. **Embarrassment budget:** the chyron crawl ("MEMBER WHO IS '5 MINUTES AWAY' HAS BEEN 5 MINUTES AWAY
   SINCE 9:40 P.M.", "ETHICS PANEL CLEARS MEMBER WHO TEXTED 'OMW' FROM BED") and the dubious example
   section "text the ex 'you up?' as a group." Cut them if they're too much.
5. **Server errors now speak the chamber's language** ("The Clerk's office is not answering")
   instead of the raw "Failed to create poll". 4xx reasons from the server are still shown as-is.
6. **Footer says "A Skeptical Wombat production."**
7. I left the old backdrop image file in `public/` (unused) rather than deleting it.
8. I didn't request your review on the PR because GitHub won't let the author review their own PR.

**Blockers / what I need from you**
- **Replace the Preview database.** The Preview `REDIS_URL` in the Vercel project `what-it-do` is the
  temporary verification database from PR 4 and no longer connects (`redis_client_error` on
  `/api/poll` since 2026-08-23). Changing project settings was off-limits overnight, so I didn't.
  Fix: point Preview at a working Redis (or remove `REDIS_URL` from Preview so it falls back to the
  Upstash Preview variables, if that database is alive), then redeploy the branch.
- Production (whatitdo.xyz) was not touched or tested, so no poll data was created there.

## What I tested (clicked through as a stranger)
Local production build (`npm run build && npm start`, test store), laptop 1366px and phone 390px:
- Home: switch Regular order / Suspend the rules; introduce a bill with 1 to 3 sections; empty-bill
  error; "Your bills on the calendar" list and clearing it.
- Created screen: copy floor pass, Text it to the chat link, copy the Clerk's key, open the board.
- Ballot: every vote option on every section, HELL YEA only under suspended rules, name, remarks,
  amendment, "Answer N more sections" countdown, Cast my vote, receipt slip.
- Results: tallies with honest ties, member wall, amendments, the Record, pause/resume and refresh.
- States: missing key, wrong key, unknown bill, bad URL (404), feed lost + reconnect, chamber full,
  died in committee, server failure (the last four via mocked responses in the browser tests).
  No console errors during the click-through.
- Automated: lint, typecheck, 169 unit tests, 23 Playwright flows with axe accessibility scans,
  reduced motion, forced colors, and the 375px no-overflow check. All pass.
Preview (desktop Claude browser): home page loads the new version; creating a poll fails only because
of the dead preview database.

## Log
- Shakedown: everything built and passed before any change. Nothing in the app was broken.
- Draft 1 of the world, then two screenshot rounds at phone and laptop. Fixed: the "how it works"
  list collapsing into one word per line, a background that stopped one screen down, the RECORDED
  stamp covering the line under it, error-card labels turning into giant spaced text, names on the
  member wall breaking mid-letter, the vote-board header wrapping on phones, a contrast failure, a
  sideways scroll from long amendments, and the LIVE dot sitting above the word.
- Deployed the branch preview, found the dead preview database, made server failures speak the
  world's language.
