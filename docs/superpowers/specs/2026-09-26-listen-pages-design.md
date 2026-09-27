# Listen pages with channel and service tracking

**Date:** 2026-09-26 (built overnight into 9/27)
**Status:** Draft. Built on `feature/listen-page` branches in PSUWorship (wmaac.org) and ProjectOS
(marcoking.com). **Nothing is deployed.** Marco reviews in the morning; deploying touches two live
sites and two live Convex backends, so it waits for his explicit OK.

## The ask

Marco, 2026-09-26:

> overnight, can you build a beautiful clean polished page on wmaac.org that has nice links to
> spotify, apple music, etc. all major streaming services. so its like a nice linktree for folks to
> listen to our music, then that could be the link we put for streaming on our socials and then we
> could track closely which social media channel is getting most of the traffic and which streaming
> service most traffic is going to etc. ... also, build a page like that on marcoking.com for my
> personal music.

## What success looks like

1. One link per artist that goes in every bio and "listen" call to action:
   `wmaac.org/listen` for gentle & lowly, `marcoking.com/listen` for marco king.
2. It opens fast and looks finished inside the Instagram and TikTok in-app browsers, which is where
   almost every visit will happen.
3. A stats page answers three questions:
   - which channel sends the most visitors,
   - which streaming service they choose,
   - for each channel, how many of its visitors go on to a service (click-through).
4. No new accounts, no cookies, no personal data stored. Counts only.

## Assumptions made without Marco (he was asleep; each is a one-line change)

- The paths are `/listen` on both sites.
- The gentle & lowly page lives on wmaac.org, as asked, even though gentleandlowlyband.com exists.
  It can point its own `/listen` at this page later.
- Service buttons open each service's **artist page**, which stays current as releases come out
  and carries the Follow button. The exception is Marco on Amazon Music, Tidal, Deezer and
  iHeartRadio: there his artist page is merged with other artists named Marco King, and the newest
  release it shows isn't his, so those four buttons open "the more i see" until his distributor
  splits the profiles. The cover shown on the page is the release the socials are
  pushing ("peace like a river" for the band, the newest solo release for Marco).
- Spotify is the first button and the only filled one, because Spotify monthly listeners is the
  band's goal metric (see the `music-audience-growth` skill).
- wmaac.org's stats page is unlisted, like `/sept13/stats`. marcoking.com's goes behind the existing
  `/admin` login.

## URLs

| URL | What it does |
|---|---|
| `/listen` | The page. No tag, so the source is guessed (below). |
| `/listen/<tag>` | The same page, tagged. This is the form that goes in bios: `wmaac.org/listen/ig`. |
| `/listen?p=<tag>` | Also accepted, matching the `/sept13?p=` convention. |
| `/listen/go/<service>?p=<source>` | Logs a click, then 302s to that service. Every button on the page points here. |
| `/listen/stats` (wmaac.org) | Unlisted stats page. |
| `/admin/listen` (marcoking.com) | Stats page behind the admin login. |

Static segments (`go`, `stats`) win over the dynamic `[tag]` segment in the Next router, so no tag
can be named `go` or `stats`.

## Where a visit came from

A visit's source is decided in this order:

1. **A tag we gave out**, from `/listen/<tag>` or `?p=`, checked against a whitelist.
   gentle & lowly: `ig` (band Instagram bio), `wma` (@wma.pennstate bio), `story` (IG story link
   sticker), `tt`, `yt`, `fb`, `qr` (a QR code on a slide or in print), `email`, `text`, `web` (a
   link on gentleandlowlyband.com or wmaac.org). marco king: `ig`, `story`, `tt`, `yt`, `qr`,
   `email`, `text`, `web`.
2. **The in-app browser**, from the user agent: `Instagram` → `ig`, `FBAN`/`FBAV`/`FB_IAB` → `fb`,
   `musical_ly`/`BytedanceWebview`/`TikTok` → `tt`, `Snapchat` → `snap`. This catches the link being
   pasted into a DM or a caption without its tag.
3. **The referrer host**: youtube.com → `yt`, t.co or x.com → `x`, google/bing/duckduckgo → `search`,
   our own sites → `web`, instagram.com → `ig`, facebook.com → `fb`, tiktok.com → `tt`.
4. Otherwise `direct`.

Each visit stores `tagged: true|false`, so the stats page can say "Instagram 40 (32 tagged, 8
guessed)". An unknown tag like `/listen/xyz` still renders the page and is treated as untagged,
never an error, and the raw string is not stored.

Link-preview fetchers (iMessage, Slack, WhatsApp and so on) are detected with the same user-agent
test `/sept13` uses and stored with `bot: true`. They are left out of every count and shown as one
footnote. HEAD requests are not logged. Pre-loads that in-app browsers and browsers mark with
`X-Purpose: preview` or `Sec-Purpose: prefetch` are stored as bots.

## Clicks

Every button's `href` is `/listen/go/<service>?p=<resolved source>`. The go route logs
`{kind: "click", service, source}` and returns a 302 to the service's URL. A redirect can't be
missed the way a JavaScript click beacon can (content blockers, long-press, open in new tab), and
it's the pattern `/sept13/cal` already uses. An unknown service redirects back to `/listen`.

The follow links (Instagram, YouTube, TikTok) go through the same route, so they're counted too.

## Data

Each site writes to its **own** Convex deployment, so the club's data and Marco's stay apart.

```ts
listenEvents: defineTable({
  kind: v.union(v.literal("visit"), v.literal("click")),
  source: v.string(),              // whitelisted tag or guessed channel
  service: v.optional(v.string()), // clicks only; whitelisted service key
  tagged: v.boolean(),
  bot: v.boolean(),
  at: v.number(),
}).index("by_at", ["at"])
```

- `listen.log` (public mutation) re-checks `kind`, `source` and `service` against the same
  whitelists the pages use, imported from one catalog file, so a direct call to the mutation can't
  add junk rows.
- `listen.summary` (public query) reads the newest 20,000 rows at most, and says when it hit that
  limit. It returns visits by source (with the tagged share), clicks by service, a source × service
  click table, and a per-day series for the last 30 days in America/New_York. The adding-up is a
  pure function in the catalog module so it can be unit tested.
- Logging runs in Next's `after()`, so the page and the redirect are never held up by the
  database, and Vercel keeps the function alive until the write finishes. The existing `/sept13`
  page uses a bare `void` promise, and a write can be lost when the function freezes.
- If `NEXT_PUBLIC_CONVEX_URL` is missing or Convex is down, the page and redirects work exactly the
  same and the count is lost.

## The page

- A route handler that returns one HTML string, like `/sept13`. It carries no site chrome and no
  client JavaScript, so it loads fast in in-app browsers. `Cache-Control: no-store`, so every visit
  reaches the server and is counted.
- One centred column, max about 420 px wide. It has the cover art (with a soft glow of its own
  colours behind it), the artist name and one quiet line, then the service buttons. Spotify comes
  first and filled. Apple Music, YouTube Music and Amazon Music follow as full-width outlined
  buttons, and the smaller services sit in a two-column grid under them (one column below 352 px).
  Every button has a monochrome icon. Below those is a row of follow icons and a footer line.
- **gentle & lowly** uses the band's own tokens from gentleandlowlyband.com: espresso `#1a1714`,
  cream `#f5ead6`, amber `#c4793a` for the "&", Cormorant Garamond with Source Sans 3. The footer
  reads "A Worship Music & Arts project at Penn State".
- **marco king** uses marcoking.com's tokens: `#09090b`, cream `#F4EDDD`, sand `#D4C5A9`, Cormorant
  Garamond with Manrope, and Geist Mono for the small label.
- Open Graph tags carry a 1200×630 share card built from the cover, with a versioned filename (the
  `/sept13` comment explains why the name has to change when the picture does).
- Public copy follows Marco's voice rules: plain words, no em dashes.

## Stats page

It has four headline numbers: visits, clicks, click-through, and the top channel. Below them:

1. **Where visitors came from**: bars per source, each with its tagged or guessed split and its own
   click-through.
2. **Where they went**: bars per service.
3. **Channel × service**: a table with one row per source and one column per service.
4. **Last 30 days**: visits and clicks per day.

A note explains what's counted: page loads, not unique people. Bots are excluded, and "direct" means
no tag and nothing to guess from. It reuses the `/sept13/stats` look on wmaac.org and marcoking.com's
admin palette on marcoking.com.

## Error handling

| Failure | Result |
|---|---|
| Convex unreachable or env var missing | Page and redirects work; the event is not counted. |
| Unknown tag | Page renders; the source is guessed as usual. |
| Unknown service in `/go/` | 302 to `/listen`. |
| Stats page can't reach Convex | 502 with a "try again" line, like `/sept13/stats`. |
| marcoking.com stats, not signed in | 307 to `/admin/login`. |

## Testing

- **Unit tests** cover source resolution (tags, in-app UAs, referrers, unknown tags, bots),
  catalog integrity (unique keys, every URL is https with no tracking query string), the HTML
  render (every button carries `/listen/go/<key>?p=<source>`, text is escaped, no em dash in the
  copy) and the summary arithmetic. PSUWorship already has Vitest. ProjectOS has no test runner,
  so its copy runs under `node --test` with the `tsx` it already has, which adds no dependency.
- **End to end, locally only.** Each worktree runs against a throwaway local Convex backend, never
  the live deployments. Load the page with each tag and with in-app user agents, follow each
  button's 302, then check the stats page. Screenshots are taken at phone width.

## Deploying (Marco's OK first; not done overnight)

On both sites the Convex push is live the moment it runs. wmaac.org's `dev` deployment
`fearless-dotterel-730` is the one serving the site. The changes only add a table and a module, and
change nothing that exists.

1. wmaac.org: push the Convex functions, then deploy the branch the way this repo deploys (it has a
   linked `.vercel/` project).
2. marcoking.com: push its Convex functions, then merge to `master` and push.
3. Smoke test each with a user agent containing "bot", so the test visits are stored as bots and
   stay out of the numbers.
4. Swap the links in bios and posts (the table in the handoff).

## Out of scope

Email capture, pre-save pages, per-release pages, counting unique visitors, location, paid-ad UTM
schemes, and changes to gentleandlowlyband.com.
