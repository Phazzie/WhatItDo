# GRUDGES

Things that failed silently or lied. Check this list before every deploy.

- **2026-11-27 — The old backdrop quietly stopped halfway down long pages.** The zine-collage
  background image was a fixed layer that ended at one screen height on full-page captures; the
  results page looked "done" at the top and bare below. The new chamber background is a plain
  scrolling gradient. Before deploying: screenshot a *full* results page, not the first screen.
- **2026-11-27 — Two "200 OK" pages that were actually errors.** A missing ballot and a bad URL log
  `Failed to load resource: 404` in the console. That is the browser reporting a real 404 from the
  API/page, not an app crash, but it reads like an error in a console sweep. Don't mistake it for a
  regression, and don't "fix" it by making the API lie with a 200.
- **2026-11-27 — The sandbox can't reach `*.vercel.app`.** Preview checks from the cloud container
  get a proxy 403, which looks like "the site is down." Verify previews from a real browser (the
  desktop Claude browser) instead.
- **Styles silently overriding labels.** `.state-card > p` restyled the little red labels inside
  error cards (`.card-label`) into big spaced serif text. Tests passed; it only showed up in
  screenshots. Any broad `> p` rule in this file needs a `:not(.card-label)`.
- **2026-11-27 — The preview database is dead, and the error said so in plain server-speak.**
  The Preview `REDIS_URL` (labeled "Temporary empty-database PR 4 verification only") no longer
  connects: `redis_client_error` on `/api/poll` since 2026-08-23. The preview page loads fine and
  looks finished, but "Introduce the bill" fails with a 500. Every 5xx now shows the chamber's own
  message instead of "Failed to create poll". Before trusting a preview, create a poll on it.
