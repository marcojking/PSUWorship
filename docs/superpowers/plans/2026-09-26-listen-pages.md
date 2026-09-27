# Listen Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a linktree-style listen page at `wmaac.org/listen` (gentle & lowly) and
`marcoking.com/listen` (marco king). Each page counts where visitors came from and which streaming
service they tapped, and has a stats page that shows the counts.

**Architecture:** The page, the click redirect and the stats page are Next.js route handlers that
return HTML strings, the same pattern as wmaac.org's `/sept13`. They use no React and no client JS.
Five small modules in `src/lib/listen/` hold the work:
- `catalog.ts`: site data (artist, links, tags, theme). It's the only file that differs between
  the two sites.
- `attribution.ts`: source resolution.
- `summary.ts`: adds up the counts.
- `render.ts`: builds the HTML.
- `respond.ts`: glue to Next and Convex.

Events go to each site's own Convex deployment. Both repos get the same module layout, so the second
site is a port.

**Tech Stack:** Next.js 16 (App Router route handlers, `after()` from `next/server`), Convex 1.31,
TypeScript. Tests use Vitest in PSUWorship, and `node --test` plus `tsx` in ProjectOS. Both use
`node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-26-listen-pages-design.md` (PSUWorship branch
`feature/listen-page`).

**Repos and worktrees** (both on new branch `feature/listen-page`; neither is pushed):
- `W` = PSUWorship (wmaac.org) worktree:
  `/private/tmp/claude-501/-Users-marcoking-Desktop-Projects-WMA-02-Events-2026-09-13-HUB-Lawn-Worship-Night-06-Media-Recordings-Logic-Multitrack-Project/e34980ca-b9d5-4435-9124-f64c79d337e9/scratchpad/wt/wmaac-listen`
- `M` = ProjectOS (marcoking.com) worktree: the sibling directory `.../scratchpad/wt/marcoking-listen`
- `L` = research folder `.../scratchpad/listen` (holds `links.json`, `art/` and the Simple Icons package in `si/package/icons/`)

## Global Constraints

- **Never touch a live backend or site.** Don't run `npx convex dev` or `npx convex deploy` against a
  configured deployment, and don't run `git push` or `vercel`. wmaac.org's "dev" Convex deployment
  `fearless-dotterel-730` *is* production. Local testing uses
  `CONVEX_AGENT_MODE=anonymous npx convex dev`, which runs a throwaway backend on 127.0.0.1.
- Don't modify `/sept13` or any existing table or module. The changes only add things.
- No new npm dependencies in either repo.
- Paths are lowercase (Vercel builds on case-sensitive Linux).
- Static assets live under `public/listen-art/`, **not** `public/listen/`, so no file path can
  collide with the `/listen/[tag]` route.
- Public copy has no em dash (U+2014), and a test enforces it. Use plain words.
- Every page response is `Cache-Control: no-store`, and every route file exports
  `dynamic = "force-dynamic"`. A cached response is an uncounted visit.
- Only link URLs from `L/links.json` whose `url` is non-null and verified. An honest missing button
  beats a link to the wrong artist.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **A cached response hides visits.** Two identical requests must produce two rows. The Task 5 E2E
   step pins it: it curls `/listen/ig` twice and expects two stored visits.
2. **Link previews look like people.** A pasted link fetched by iMessage (`facebookexternalhit/1.1
   Facebot Twitterbot/1.0`), or pre-loaded by an in-app browser (`X-Purpose: preview`), must be stored
   as a bot and kept out of every count. The Task 1 unit
   test and a Task 5 E2E curl pin it.
3. **Hostile or garbage URL input.** `/listen/%3Cscript%3E`, `?p=<script>`, `/listen/go/nope` and
   `?p=spotify&t=1` must render or redirect normally, with nothing reflected unescaped. Task 1 unit
   tests plus Task 5 E2E curls.
4. **Convex unreachable or the env var missing.** The page still returns 200 and the redirect still
   returns 302. Task 5 E2E runs the dev server once with `NEXT_PUBLIC_CONVEX_URL` unset.
5. **A narrow phone in an in-app browser.** At 320 px wide nothing overflows sideways, and the
   longest label ("YouTube Music") stays on one line. Task 6 checks it with a screenshot at 320 px.

---

## Part A: wmaac.org (all paths relative to `W`)

### Task 1: Catalog and attribution

**Files:**
- Create: `src/lib/listen/catalog.ts`
- Create: `src/lib/listen/attribution.ts`
- Test: `src/lib/listen/attribution.test.ts`, `src/lib/listen/catalog.test.ts`

**Interfaces:**
- Produces:
  - from `catalog.ts`: `Service {key,label,url,kind:"stream"|"follow",icon}`, `ARTIST`, `THEME`,
    `SERVICES: readonly Service[]`, `TAG_INFO: Record<string,string>`, `TAGS: readonly string[]`,
    `GUESSES`, `SOURCES`, `SOURCE_LABELS`, `OWN_HOSTS`, `isTag(t)`, `isSource(s)`,
    `serviceByKey(k): Service|undefined`;
  - from `attribution.ts`: `Attribution {source:string; tagged:boolean}`, `isBot(ua)`,
    `isPrefetch(headers): boolean`, `resolveSource({tag,ua,referer}): Attribution`, `clickAttribution(p,t): Attribution`.

- [ ] **Step 1: Write the failing tests**

`src/lib/listen/attribution.test.ts`:

```ts
import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { clickAttribution, isBot, isPrefetch, resolveSource } from "./attribution";
import { OWN_HOSTS } from "./catalog";

const IG_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 620473307)";
const FB_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/472.0.0.41.106;FBBV/617255013;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]";
const TIKTOK =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_35.2.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US";
const SNAP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.0.0.40 (like Safari/8617.2.4.10.8, panda)";
const SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IMESSAGE_PREVIEW = "facebookexternalhit/1.1 Facebot Twitterbot/1.0";

describe("resolveSource", () => {
  it("takes a tag we gave out, whatever else the request says", () => {
    assert.deepEqual(resolveSource({ tag: "ig", ua: TIKTOK, referer: "https://www.youtube.com/" }), {
      source: "ig",
      tagged: true,
    });
  });

  it("reads tags case-insensitively and trims them", () => {
    assert.deepEqual(resolveSource({ tag: " IG " }), { source: "ig", tagged: true });
  });

  it("treats an unknown tag as no tag", () => {
    assert.deepEqual(resolveSource({ tag: "xyz" }), { source: "direct", tagged: false });
    assert.deepEqual(resolveSource({ tag: "<script>", ua: IG_IOS }), { source: "ig", tagged: false });
  });

  it("does not accept a guess-only value as a tag", () => {
    assert.deepEqual(resolveSource({ tag: "snap" }), { source: "direct", tagged: false });
    assert.deepEqual(resolveSource({ tag: "direct" }), { source: "direct", tagged: false });
  });

  it("guesses from in-app browsers", () => {
    assert.equal(resolveSource({ ua: IG_IOS }).source, "ig");
    assert.equal(resolveSource({ ua: FB_IOS }).source, "fb");
    assert.equal(resolveSource({ ua: TIKTOK }).source, "tt");
    assert.equal(resolveSource({ ua: SNAP }).source, "snap");
    assert.equal(resolveSource({ ua: IG_IOS }).tagged, false);
  });

  it("prefers the in-app browser over the referrer", () => {
    assert.equal(resolveSource({ ua: FB_IOS, referer: "https://www.youtube.com/" }).source, "fb");
  });

  it("guesses from the referrer", () => {
    const from = (referer: string) => resolveSource({ ua: SAFARI, referer }).source;
    assert.equal(from("https://l.instagram.com/"), "ig");
    assert.equal(from("https://m.youtube.com/"), "yt");
    assert.equal(from("https://t.co/abc"), "x");
    assert.equal(from("https://www.google.com/"), "search");
    assert.equal(from("https://lm.facebook.com/"), "fb");
    assert.equal(from("https://example.com/"), "direct");
    assert.equal(from("not a url"), "direct");
  });

  it("calls our own sites web", () => {
    for (const host of OWN_HOSTS) {
      assert.equal(resolveSource({ referer: `https://www.${host}/` }).source, "web");
      assert.equal(resolveSource({ referer: `https://${host}/about` }).source, "web");
    }
  });

  it("falls back to direct", () => {
    assert.deepEqual(resolveSource({}), { source: "direct", tagged: false });
    assert.deepEqual(resolveSource({ tag: null, ua: null, referer: null }), { source: "direct", tagged: false });
  });
});

describe("isBot", () => {
  it("catches link-preview fetchers", () => {
    assert.equal(isBot(IMESSAGE_PREVIEW), true);
    assert.equal(isBot("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"), true);
    assert.equal(isBot("WhatsApp/2.23.20.0"), true);
  });

  it("lets people through, in-app browsers included", () => {
    for (const ua of [SAFARI, IG_IOS, FB_IOS, TIKTOK, SNAP]) assert.equal(isBot(ua), false);
    assert.equal(isBot(null), false);
    assert.equal(isBot(undefined), false);
  });
});

describe("isPrefetch", () => {
  it("catches preview and prefetch loads", () => {
    assert.equal(isPrefetch(new Headers({ "x-purpose": "preview" })), true);
    assert.equal(isPrefetch(new Headers({ "sec-purpose": "prefetch;prerender" })), true);
    assert.equal(isPrefetch(new Headers({ purpose: "prefetch" })), true);
  });

  it("passes an ordinary load", () => {
    assert.equal(isPrefetch(new Headers({ accept: "text/html" })), false);
  });
});

describe("clickAttribution", () => {
  it("keeps a known source and its tag flag", () => {
    assert.deepEqual(clickAttribution("ig", "1"), { source: "ig", tagged: true });
    assert.deepEqual(clickAttribution("ig", null), { source: "ig", tagged: false });
  });

  it("never marks a guess-only source as tagged", () => {
    assert.deepEqual(clickAttribution("snap", "1"), { source: "snap", tagged: false });
  });

  it("turns anything unknown into direct", () => {
    assert.deepEqual(clickAttribution("<script>", "1"), { source: "direct", tagged: false });
    assert.deepEqual(clickAttribution("spotify", "1"), { source: "direct", tagged: false });
    assert.deepEqual(clickAttribution(null, null), { source: "direct", tagged: false });
  });
});
```

`src/lib/listen/catalog.test.ts`:

```ts
import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { GUESSES, SERVICES, SOURCE_LABELS, SOURCES, TAGS, TAG_INFO, serviceByKey } from "./catalog";
import { ICONS } from "./icons";

describe("catalog", () => {
  it("has unique, URL-safe service keys", () => {
    const keys = SERVICES.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const k of keys) assert.match(k, /^[a-z0-9]+$/);
  });

  it("links only to clean https URLs", () => {
    for (const s of SERVICES) {
      assert.match(s.url, /^https:\/\/[^\s?#]+$/, `${s.key}: ${s.url}`);
    }
  });

  it("has an icon for every service", () => {
    for (const s of SERVICES) assert.ok(ICONS[s.icon], `no icon ${s.icon} for ${s.key}`);
  });

  it("leads with Spotify, then Apple Music", () => {
    const streams = SERVICES.filter((s) => s.kind === "stream").map((s) => s.key);
    assert.deepEqual(streams.slice(0, 2), ["spotify", "apple"]);
  });

  it("has URL-safe tags that can't shadow the go or stats routes", () => {
    for (const t of TAGS) {
      assert.match(t, /^[a-z0-9]+$/);
      assert.ok(!["go", "stats"].includes(t));
      assert.ok(TAG_INFO[t]);
    }
  });

  it("labels every source, tagged or guessed", () => {
    for (const s of [...TAGS, ...GUESSES]) assert.ok(SOURCES.includes(s));
    for (const s of SOURCES) assert.ok(SOURCE_LABELS[s], `no label for ${s}`);
  });

  it("finds services by key", () => {
    assert.equal(serviceByKey("spotify")?.label, "Spotify");
    assert.equal(serviceByKey("nope"), undefined);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd W && npx vitest run src/lib/listen`
Expected: FAIL, with "Failed to resolve import ./attribution" (and ./catalog, ./icons).

- [ ] **Step 3: Generate `src/lib/listen/icons.ts`**

Run this from `W`. It reads the CC0 Simple Icons paths from `L/si/package/icons`; Amazon Music has
no Simple Icons mark, so it falls back to the Material note glyph (Apache-2.0):

```bash
python3 - "$L/si/package/icons" > src/lib/listen/icons.ts <<'EOF'
import re, sys, pathlib
si = pathlib.Path(sys.argv[1])
names = ["spotify", "applemusic", "youtubemusic", "tidal", "deezer", "pandora", "soundcloud",
         "audiomack", "iheartradio", "instagram", "youtube", "tiktok"]
print("/* Brand marks from Simple Icons 16.32.0 (CC0, simpleicons.org), 24x24 viewBox. Amazon Music")
print("   has no Simple Icons mark, so it uses `note`, the Material Design music note (Apache-2.0).")
print("   `chevron` is Material's chevron_right. Paths only; the <svg> wrapper is in render.ts. */")
print()
print("export const ICONS: Record<string, string> = {")
for n in names:
    d = re.search(r' d="([^"]+)"', (si / f"{n}.svg").read_text()).group(1)
    print(f'  {n}: "{d}",')
print('  note: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",')
print('  chevron: "M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z",')
print("};")
EOF
```

- [ ] **Step 4: Write `src/lib/listen/catalog.ts`**

(Full file in the **Catalog data** appendix at the end of this plan, "wmaac.org". It's filled from
`L/links.json`.)

- [ ] **Step 5: Write `src/lib/listen/attribution.ts`**

```ts
/* Where a visit to /listen came from, and whether it was a person.
 *
 * A tag we handed out wins. Without one, the in-app browser usually gives it
 * away (Instagram, Facebook, TikTok and Snapchat all stamp their user agent),
 * and failing that the referrer might. Whatever is left is "direct".
 *
 * Pure, with relative imports only: the page, the click redirect, the Convex
 * mutation and the tests all call these same functions. */

import { OWN_HOSTS, isSource, isTag } from "./catalog";

export interface Attribution {
  source: string;
  /** True when the source is a tag we gave out, false when it was guessed. */
  tagged: boolean;
}

/* Link-preview fetchers. iMessage, Slack and the rest fetch a URL the moment it
   is pasted, so without this every share would count as a visit. Same list as
   /sept13 (src/app/sept13/event.ts); copied so this module stands alone. */
const BOT_UA =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|whatsapp|telegram|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|skypeuripreview|applebot|googlebot|bingbot|headless/i;

export const isBot = (ua: string | null | undefined): boolean => BOT_UA.test(ua ?? "");

/* Facebook's and Instagram's in-app browsers can fetch a link before it is
   tapped (X-Purpose: preview), and browsers mark speculative loads with
   Sec-Purpose or Purpose: prefetch. None of those is a person arriving. */
export function isPrefetch(headers: { get(name: string): string | null }): boolean {
  return ["sec-purpose", "purpose", "x-purpose", "x-moz"].some((h) => /prefetch|preview/i.test(headers.get(h) ?? ""));
}

/* Checked in order. Instagram's user agent is Safari plus "Instagram", so it
   goes first, before Facebook's markers get a chance to claim it. */
const IN_APP: readonly (readonly [RegExp, string])[] = [
  [/\bInstagram\b/i, "ig"],
  [/FBAN|FBAV|FB_IAB|FBIOS/, "fb"],
  [/musical_ly|BytedanceWebview|\bTikTok\b|trill_/i, "tt"],
  [/Snapchat/i, "snap"],
];

const REFERRERS: readonly (readonly [RegExp, string])[] = [
  [/(^|\.)instagram\.com$/, "ig"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "fb"],
  [/(^|\.)tiktok\.com$/, "tt"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "yt"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)snapchat\.com$/, "snap"],
  [/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/, "search"],
];

function hostOf(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveSource(input: {
  tag?: string | null;
  ua?: string | null;
  referer?: string | null;
}): Attribution {
  const tag = (input.tag ?? "").trim().toLowerCase();
  if (isTag(tag)) return { source: tag, tagged: true };

  const ua = input.ua ?? "";
  for (const [re, source] of IN_APP) if (re.test(ua)) return { source, tagged: false };

  const host = hostOf(input.referer);
  if (host) {
    if (OWN_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
      return { source: "web", tagged: false };
    }
    for (const [re, source] of REFERRERS) if (re.test(host)) return { source, tagged: false };
  }
  return { source: "direct", tagged: false };
}

/* The click redirect's ?p= and ?t=, which the page writes. Checked again
   rather than trusted, because anyone can type a URL. */
export function clickAttribution(p: string | null, t: string | null): Attribution {
  const source = p !== null && isSource(p) ? p : "direct";
  return { source, tagged: t === "1" && isTag(source) };
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `cd W && npx vitest run src/lib/listen`
Expected: PASS, both files.

- [ ] **Step 7: Commit**

```bash
cd W && git add src/lib/listen/catalog.ts src/lib/listen/attribution.ts src/lib/listen/icons.ts src/lib/listen/*.test.ts
git commit -m "Add the /listen catalog and visit attribution

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 2: Summary arithmetic

**Files:**
- Create: `src/lib/listen/summary.ts`
- Test: `src/lib/listen/summary.test.ts`

**Interfaces:**
- Produces: `EventRow`, `SourceRow {source,visits,tagged,clicks}`, `ServiceRow {service,clicks}`,
  `Cell {source,service,clicks}`, `DayRow {day,visits,clicks}`,
  `Summary {visits,clicks,bots,sources,services,cells,days,truncated,since}`, `DAYS = 30`,
  `easternDay(at): string`, `lastDays(now, n?): string[]`,
  `summarize(rows, now, truncated?): Summary`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { DAYS, easternDay, lastDays, summarize, type EventRow } from "./summary";

const NOW = Date.parse("2026-09-27T16:00:00Z"); // noon Eastern, Sun 9/27
const at = (iso: string) => Date.parse(iso);
const visit = (source: string, iso: string, extra: Partial<EventRow> = {}): EventRow => ({
  kind: "visit", source, tagged: false, bot: false, at: at(iso), ...extra,
});
const click = (source: string, service: string, iso: string, extra: Partial<EventRow> = {}): EventRow => ({
  kind: "click", source, service, tagged: false, bot: false, at: at(iso), ...extra,
});

describe("easternDay", () => {
  it("uses the Eastern calendar day, not UTC", () => {
    assert.equal(easternDay(at("2026-09-27T03:30:00Z")), "2026-09-26");
    assert.equal(easternDay(at("2026-09-27T04:30:00Z")), "2026-09-27");
  });
});

describe("lastDays", () => {
  it("returns DAYS consecutive days ending today, oldest first", () => {
    const d = lastDays(NOW);
    assert.equal(d.length, DAYS);
    assert.equal(d[d.length - 1], "2026-09-27");
    assert.equal(d[0], "2026-08-29");
  });

  it("neither skips nor repeats a day across the November clock change", () => {
    const d = lastDays(at("2026-11-02T17:00:00Z"));
    assert.equal(new Set(d).size, DAYS);
    assert.ok(d.includes("2026-11-01"));
    assert.equal(d[d.length - 1], "2026-11-02");
  });
});

describe("summarize", () => {
  it("is all zeros with no rows", () => {
    const s = summarize([], NOW);
    assert.equal(s.visits, 0);
    assert.equal(s.clicks, 0);
    assert.equal(s.bots, 0);
    assert.deepEqual(s.sources, []);
    assert.deepEqual(s.services, []);
    assert.equal(s.days.length, DAYS);
    assert.ok(s.days.every((d) => d.visits === 0 && d.clicks === 0));
    assert.equal(s.since, null);
    assert.equal(s.truncated, false);
  });

  it("counts visits, clicks and tagged visits per source", () => {
    const s = summarize(
      [
        visit("ig", "2026-09-27T15:00:00Z", { tagged: true }),
        visit("ig", "2026-09-27T15:01:00Z"),
        visit("tt", "2026-09-27T15:02:00Z", { tagged: true }),
        click("ig", "spotify", "2026-09-27T15:03:00Z", { tagged: true }),
        click("ig", "apple", "2026-09-27T15:04:00Z"),
        click("tt", "spotify", "2026-09-27T15:05:00Z"),
      ],
      NOW,
    );
    assert.equal(s.visits, 3);
    assert.equal(s.clicks, 3);
    assert.deepEqual(s.sources[0], { source: "ig", visits: 2, tagged: 1, clicks: 2 });
    assert.deepEqual(s.sources[1], { source: "tt", visits: 1, tagged: 1, clicks: 1 });
    assert.deepEqual(s.services, [
      { service: "spotify", clicks: 2 },
      { service: "apple", clicks: 1 },
    ]);
    const cell = (so: string, se: string) => s.cells.find((c) => c.source === so && c.service === se)?.clicks;
    assert.equal(cell("ig", "spotify"), 1);
    assert.equal(cell("ig", "apple"), 1);
    assert.equal(cell("tt", "spotify"), 1);
    assert.equal(cell("tt", "apple"), undefined);
  });

  it("keeps bots out of every count but their own", () => {
    const s = summarize(
      [visit("ig", "2026-09-27T15:00:00Z", { bot: true }), click("ig", "spotify", "2026-09-27T15:00:00Z", { bot: true })],
      NOW,
    );
    assert.equal(s.bots, 2);
    assert.equal(s.visits, 0);
    assert.equal(s.clicks, 0);
    assert.deepEqual(s.sources, []);
    assert.ok(s.days.every((d) => d.visits === 0 && d.clicks === 0));
  });

  it("puts events on their Eastern day and counts old ones in totals only", () => {
    const s = summarize(
      [
        visit("ig", "2026-09-27T03:30:00Z"), // 9/26, 11:30 PM Eastern
        click("ig", "spotify", "2026-09-27T14:00:00Z"),
        visit("yt", "2026-07-01T12:00:00Z"), // outside the 30-day window
      ],
      NOW,
    );
    const day = (d: string) => s.days.find((x) => x.day === d);
    assert.equal(day("2026-09-26")?.visits, 1);
    assert.equal(day("2026-09-27")?.clicks, 1);
    assert.equal(s.visits, 2);
    assert.equal(s.since, at("2026-07-01T12:00:00Z"));
  });

  it("passes truncated through", () => {
    assert.equal(summarize([], NOW, true).truncated, true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd W && npx vitest run src/lib/listen/summary.test.ts`
Expected: FAIL, with "Failed to resolve import ./summary".

- [ ] **Step 3: Write `src/lib/listen/summary.ts`**

```ts
/* Adds up listenEvents rows for the stats page. Pure, so it is tested without
 * a database; convex/listen.ts calls it inside the summary query.
 *
 * Counts are page loads and taps, not people. One person opening the page
 * twice is two visits. */

export interface EventRow {
  kind: "visit" | "click";
  source: string;
  service?: string;
  tagged: boolean;
  bot: boolean;
  at: number;
}

export interface SourceRow { source: string; visits: number; tagged: number; clicks: number }
export interface ServiceRow { service: string; clicks: number }
export interface Cell { source: string; service: string; clicks: number }
export interface DayRow { day: string; visits: number; clicks: number }

export interface Summary {
  visits: number;
  clicks: number;
  bots: number;
  /** Sorted by visits, most first. */
  sources: SourceRow[];
  /** Sorted by clicks, most first. */
  services: ServiceRow[];
  cells: Cell[];
  /** The last DAYS Eastern days, oldest first, zero days included. */
  days: DayRow[];
  truncated: boolean;
  /** Time of the oldest row read, or null with no rows. */
  since: number | null;
}

export const DAYS = 30;

/** Eastern calendar date, YYYY-MM-DD. The audience is in Pennsylvania, so a day means their day. */
export function easternDay(at: number): string {
  return new Date(at).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

/** The last `n` Eastern days ending today, oldest first. Calendar arithmetic rather than
 *  subtracting 24 hours, so a clock change can't skip or repeat a day. */
export function lastDays(now: number, n: number = DAYS): string[] {
  const [y, m, d] = easternDay(now).split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return out;
}

export function summarize(rows: readonly EventRow[], now: number, truncated = false): Summary {
  const sources = new Map<string, SourceRow>();
  const services = new Map<string, number>();
  const cells = new Map<string, Cell>();
  const days = new Map<string, DayRow>(lastDays(now).map((day) => [day, { day, visits: 0, clicks: 0 }]));
  let visits = 0;
  let clicks = 0;
  let bots = 0;
  let since: number | null = null;

  for (const r of rows) {
    since = since === null ? r.at : Math.min(since, r.at);
    if (r.bot) {
      bots++;
      continue;
    }
    let s = sources.get(r.source);
    if (!s) {
      s = { source: r.source, visits: 0, tagged: 0, clicks: 0 };
      sources.set(r.source, s);
    }
    const day = days.get(easternDay(r.at));
    if (r.kind === "visit") {
      visits++;
      s.visits++;
      if (r.tagged) s.tagged++;
      if (day) day.visits++;
    } else {
      const service = r.service ?? "unknown";
      clicks++;
      s.clicks++;
      services.set(service, (services.get(service) ?? 0) + 1);
      const key = `${r.source} ${service}`;
      const c = cells.get(key) ?? { source: r.source, service, clicks: 0 };
      c.clicks++;
      cells.set(key, c);
      if (day) day.clicks++;
    }
  }

  return {
    visits,
    clicks,
    bots,
    sources: [...sources.values()].sort(
      (a, b) => b.visits - a.visits || b.clicks - a.clicks || a.source.localeCompare(b.source),
    ),
    services: [...services]
      .map(([service, n]) => ({ service, clicks: n }))
      .sort((a, b) => b.clicks - a.clicks || a.service.localeCompare(b.service)),
    cells: [...cells.values()],
    days: [...days.values()],
    truncated,
    since,
  };
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `cd W && npx vitest run src/lib/listen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd W && git add src/lib/listen/summary.ts src/lib/listen/summary.test.ts
git commit -m "Add the /listen stats arithmetic

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 3: Convex table and functions (local backend only)

**Files:**
- Modify: `convex/schema.ts`, adding the `listenEvents` table just before `liveSession`
- Create: `convex/listen.ts`
- Modify: `convex/_generated/api.d.ts` (by codegen, from the local backend)

**Interfaces:**
- Consumes: `isSource`, `serviceByKey` (catalog), `summarize` (summary)
- Produces: `api.listen.log({kind, source, service?, tagged, bot}) → null`,
  `api.listen.summary({}) → Summary`, `internal.listen.reset({}) → number`

- [ ] **Step 1: Add the table to `convex/schema.ts`** (insert before `liveSession: defineTable({`)

```ts
  /* wmaac.org/listen: one row per page visit or tap through to a streaming
     service. See convex/listen.ts and src/lib/listen/. */
  listenEvents: defineTable({
    kind:    v.union(v.literal("visit"), v.literal("click")),
    source:  v.string(),              // a tag we gave out, or a guessed channel
    service: v.optional(v.string()),  // clicks only
    tagged:  v.boolean(),
    bot:     v.boolean(),             // link-preview fetch rather than a person
    at:      v.number(),
  }).index("by_at", ["at"]),

```

- [ ] **Step 2: Write `convex/listen.ts`**

```ts
/* Visits to /listen and taps through to a streaming service, one row each.
 * summarize() in src/lib/listen/summary.ts adds them up and is unit tested.
 *
 * The whitelists come from src/lib/listen/catalog.ts, the same file the page
 * links from, so a direct call to log cannot store a key the page never offers. */

import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isSource, serviceByKey } from "../src/lib/listen/catalog";
import { summarize } from "../src/lib/listen/summary";

/** Ceiling on one summary read. Years of traffic for a band this size. */
const MAX_ROWS = 20000;

export const log = mutation({
  args: {
    kind: v.union(v.literal("visit"), v.literal("click")),
    source: v.string(),
    service: v.optional(v.string()),
    tagged: v.boolean(),
    bot: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    if (!isSource(a.source)) return null;
    if (a.kind === "click" && !(a.service && serviceByKey(a.service))) return null;
    if (a.kind === "visit" && a.service !== undefined) return null;
    await ctx.db.insert("listenEvents", { ...a, at: Date.now() });
    return null;
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("listenEvents").withIndex("by_at").order("desc").take(MAX_ROWS + 1);
    const truncated = rows.length > MAX_ROWS;
    return summarize(truncated ? rows.slice(0, MAX_ROWS) : rows, Date.now(), truncated);
  },
});

/* Clears the table, e.g. of rows left by an end-to-end check. Internal, so only
   the CLI or the dashboard can call it, never a browser. Batches of 4,000; run
   again until it returns 0. */
export const reset = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("listenEvents").withIndex("by_at").take(4000);
    for (const r of rows) await ctx.db.delete(r._id);
    return rows.length;
  },
});
```

- [ ] **Step 3: Push to a throwaway local backend and let codegen run**

The worktree has no `.env.local` (it's gitignored), so nothing points at a real deployment. Confirm
that first, then start the anonymous local backend:

```bash
cd W && test ! -e .env.local && echo "no env, good"
CONVEX_AGENT_MODE=anonymous npx convex dev --once --typecheck enable 2>&1 | tail -20
cat .env.local   # expect CONVEX_DEPLOYMENT=anonymous:… and NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:…
```

Expected: it ends with Convex functions ready and typechecks with no errors, and `.env.local`
names an `anonymous:` deployment on 127.0.0.1. **If it names `dev:` or `prod:`, or asks to log
in, stop.** Delete `.env.local` and do not go on.

`git diff --stat convex/_generated` should show only `api.d.ts` gaining `listen`.

- [ ] **Step 4: Exercise the functions against the local backend**

```bash
cd W && npx convex run listen:log '{"kind":"visit","source":"ig","tagged":true,"bot":false}'
npx convex run listen:log '{"kind":"click","source":"ig","service":"spotify","tagged":true,"bot":false}'
npx convex run listen:log '{"kind":"click","source":"ig","service":"nope","tagged":false,"bot":false}'
npx convex run listen:log '{"kind":"visit","source":"<script>","tagged":false,"bot":false}'
npx convex run listen:summary '{}'
npx convex run listen:reset '{}'
```

Expected: the summary shows `visits: 1`, `clicks: 1` and `services: [{service:"spotify",clicks:1}]`
(the `nope` and `<script>` rows were refused), and `reset` returns `2`.

- [ ] **Step 5: Commit**

```bash
cd W && git add convex/schema.ts convex/listen.ts convex/_generated/api.d.ts
git commit -m "Add the listenEvents table and its log and summary functions

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 4: The page renderer

**Files:**
- Create: `src/lib/listen/render.ts`
- Test: `src/lib/listen/render.test.ts`

**Interfaces:**
- Consumes: catalog exports, `Attribution`, `ICONS`, `Summary`
- Produces: `esc(s)`, `goHref(service, attribution)`, `renderListenPage(a): string`,
  `renderStats(s: Summary): string`, `renderStatsMessage(title, msg): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { ARTIST, SERVICES, TAGS } from "./catalog";
import { goHref, renderListenPage, renderStats } from "./render";
import { summarize } from "./summary";

const NOW = Date.parse("2026-09-27T16:00:00Z");

describe("renderListenPage", () => {
  it("routes every service through the counting redirect with the source", () => {
    const html = renderListenPage({ source: "ig", tagged: true });
    for (const s of SERVICES) {
      assert.ok(html.includes(`href="${ARTIST.path}/go/${s.key}?p=ig&amp;t=1"`), s.key);
      assert.ok(!html.includes(`href="${s.url}"`), `${s.key} links out directly`);
    }
  });

  it("leaves the tag flag off guessed sources", () => {
    const html = renderListenPage({ source: "direct", tagged: false });
    assert.ok(html.includes(`${ARTIST.path}/go/spotify?p=direct"`));
    assert.ok(!html.includes("t=1"));
  });

  it("makes Spotify the one primary button", () => {
    const html = renderListenPage({ source: "direct", tagged: false });
    assert.equal(html.match(/class="svc rise primary"/g)?.length, 1);
    const primary = html.indexOf('class="svc rise primary"');
    assert.ok(html.indexOf("/go/spotify", primary) - primary < 200);
  });

  it("has no em dash in the public copy", () => {
    assert.ok(!renderListenPage({ source: "ig", tagged: true }).includes("—"));
  });

  it("carries a share card and a canonical URL", () => {
    const html = renderListenPage({ source: "ig", tagged: true });
    assert.ok(html.includes(`<link rel="canonical" href="${ARTIST.origin}${ARTIST.path}">`));
    assert.ok(html.includes(`<meta property="og:image" content="${ARTIST.origin}${ARTIST.og}">`));
  });
});

describe("goHref", () => {
  it("encodes whatever it is given", () => {
    assert.equal(goHref(SERVICES[0], { source: "a b", tagged: false }), `${ARTIST.path}/go/${SERVICES[0].key}?p=a%20b`);
  });
});

describe("renderStats", () => {
  it("shows the zero state and every link to hand out", () => {
    const html = renderStats(summarize([], NOW));
    assert.ok(html.includes("No visits yet"));
    for (const t of TAGS) assert.ok(html.includes(`${ARTIST.path}/${t}<`), t);
  });

  it("shows totals and escapes stored values", () => {
    const html = renderStats(
      summarize(
        [
          { kind: "visit", source: "ig", tagged: true, bot: false, at: NOW - 1000 },
          { kind: "click", source: "ig", service: "spotify", tagged: true, bot: false, at: NOW - 500 },
          { kind: "visit", source: "<b>x</b>", tagged: false, bot: false, at: NOW - 400 },
        ],
        NOW,
      ),
    );
    assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
    assert.ok(!html.includes("<b>x</b>"));
    assert.ok(html.includes(">2<")); // two visits
    assert.ok(html.includes("50%")); // one click over two visits
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd W && npx vitest run src/lib/listen/render.test.ts`
Expected: FAIL, with "Failed to resolve import ./render".

- [ ] **Step 3: Write `src/lib/listen/render.ts`**

```ts
/* The /listen page and its stats page, as HTML strings.
 *
 * Route handlers, not React pages, the same as /sept13: no site chrome and no
 * client JavaScript, so the page is up at once inside the Instagram and TikTok
 * in-app browsers, where nearly every visit happens.
 *
 * Everything that belongs to one site (artist, links, colours, fonts) is in
 * catalog.ts, so this file is identical on wmaac.org and marcoking.com. */

import {
  ARTIST,
  SERVICES,
  SOURCE_LABELS,
  TAGS,
  TAG_INFO,
  THEME,
  type Service,
} from "./catalog";
import type { Attribution } from "./attribution";
import { ICONS } from "./icons";
import type { Summary } from "./summary";

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const svg = (key: string, cls = "ico"): string =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${
    ICONS[key] ?? ICONS.note
  }"/></svg>`;

/** Every button goes through the counting redirect, carrying where the visit came from. */
export function goHref(s: Service, a: Attribution): string {
  return `${ARTIST.path}/go/${encodeURIComponent(s.key)}?p=${encodeURIComponent(a.source)}${a.tagged ? "&t=1" : ""}`;
}

const TOKENS = `:root{--bg:${THEME.bg};--card:${THEME.card};--line:${THEME.line};--ink:${THEME.ink};--ink-2:${THEME.ink2};--ink-3:${THEME.ink3};--accent:${THEME.accent};--display:${THEME.display};--body:${THEME.body};--label:${THEME.label}}`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${THEME.fontsHref}" rel="stylesheet">`;

const PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;background:var(--bg)}
body{min-height:100svh;background:var(--bg);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;line-height:1.5;overflow-x:hidden}
.glow{position:fixed;left:50%;top:-12vh;width:150vw;max-width:980px;aspect-ratio:1;transform:translateX(-50%);background-size:cover;background-position:center;filter:blur(80px) saturate(1.2);opacity:.34;pointer-events:none}
.veil{position:fixed;inset:0;background:linear-gradient(to bottom,transparent 0,transparent 22%,var(--bg) 72%);pointer-events:none}
.wrap{position:relative;max-width:27rem;margin:0 auto;padding:max(2.75rem,calc(env(safe-area-inset-top) + 1.5rem)) 1.25rem max(2.25rem,calc(env(safe-area-inset-bottom) + 1.5rem));display:flex;flex-direction:column;align-items:center;text-align:center}
.cover{display:block;width:min(62vw,15.5rem);height:auto;aspect-ratio:1/1;object-fit:cover;border-radius:6px;box-shadow:0 28px 70px -24px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.07)}
.name{margin-top:1.6rem;font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,10vw,2.8rem);line-height:1.02;letter-spacing:-.01em}
.amp{color:var(--accent);font-style:italic}
.line{margin-top:.5rem;color:var(--ink-2);font-size:.95rem;font-weight:300}
.rel{margin-top:.3rem;color:var(--ink-3);font-size:.8rem}
.rel em{font-family:var(--display);font-size:1.05rem;color:var(--ink-2)}
.eyebrow{display:flex;align-items:center;gap:.9rem;width:100%;margin:2.1rem 0 .85rem;font-family:var(--label);font-size:.64rem;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-3)}
.eyebrow::before,.eyebrow::after{content:"";flex:1;height:1px;background:var(--line)}
.svcs{display:grid;gap:.6rem;width:100%}
.svc{display:flex;align-items:center;gap:.95rem;min-height:3.6rem;padding:0 1.1rem 0 1.15rem;border:1px solid var(--line);border-radius:14px;background:var(--card);background:color-mix(in srgb,var(--card) 80%,transparent);color:var(--ink);text-decoration:none;font-size:1.02rem;white-space:nowrap;-webkit-tap-highlight-color:transparent;transition:border-color .2s,background-color .2s,transform .15s}
.svc .ico{width:1.35rem;height:1.35rem;flex:none}
.svc .lbl{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis}
.svc .go{width:1.1rem;height:1.1rem;flex:none;opacity:.35;transition:transform .2s,opacity .2s}
.svc:hover,.svc:focus-visible{border-color:var(--accent)}
.svc:hover .go,.svc:focus-visible .go{opacity:.85;transform:translateX(2px)}
.svc:active{transform:scale(.985)}
.svc.primary{background:var(--ink);border-color:var(--ink);color:var(--bg);font-weight:600}
.svc.primary .go{opacity:.5}
.more{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;width:100%;margin-top:.6rem}
.more .svc{min-height:3.1rem;padding:0 .9rem;gap:.7rem;font-size:.93rem;border-radius:12px}
.more .svc .ico{width:1.2rem;height:1.2rem}
.more .svc:last-child:nth-child(odd){grid-column:1/-1}
@media (max-width:22rem){.more{grid-template-columns:1fr}}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.follow{display:flex;justify-content:center;gap:.9rem;margin-top:1.9rem}
.follow a{display:grid;place-items:center;width:2.9rem;height:2.9rem;border-radius:50%;border:1px solid transparent;color:var(--ink-2);transition:color .2s,border-color .2s}
.follow a:hover,.follow a:focus-visible{color:var(--accent);border-color:var(--line)}
.follow .ico{width:1.3rem;height:1.3rem}
.foot{margin-top:1.4rem;color:var(--ink-3);font-size:.72rem;letter-spacing:.03em}
.foot a{color:inherit;text-decoration:none;border-bottom:1px solid var(--line)}
.foot a:hover,.foot a:focus-visible{color:var(--ink-2)}
@media (prefers-reduced-motion:no-preference){
  .rise{animation:rise .55s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0) * 40ms)}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}}
}
@media (min-width:40rem){.wrap{padding-top:4.5rem}}
`;

export function renderListenPage(a: Attribution): string {
  const streams = SERVICES.filter((s) => s.kind === "stream");
  const more = SERVICES.filter((s) => s.kind === "more");
  const follows = SERVICES.filter((s) => s.kind === "follow");
  let i = 0;
  const rise = () => `style="--i:${i++}"`;
  const url = ARTIST.origin + ARTIST.path;
  const og = ARTIST.origin + ARTIST.og;
  const art = ARTIST.featured.art;

  const header = `<header class="head">
  <img class="cover rise" ${rise()} src="${art}" width="640" height="640" alt="${esc(ARTIST.featured.title)} cover art" fetchpriority="high">
  <h1 class="name rise" ${rise()}>${ARTIST.nameHtml}</h1>
  <p class="line rise" ${rise()}>${esc(ARTIST.line)}</p>
  <p class="rel rise" ${rise()}><em>${esc(ARTIST.featured.title)}</em> &middot; ${esc(ARTIST.featured.note)}</p>
</header>`;

  // Built in page order so the rise-in delays run top to bottom.
  const eyebrow = `<p class="eyebrow rise" ${rise()}>Listen on</p>`;

  const buttons = streams
    .map(
      (s, n) =>
        `<a class="svc rise${n === 0 ? " primary" : ""}" ${rise()} href="${esc(goHref(s, a))}">${svg(s.icon)}<span class="lbl">${esc(
          s.label,
        )}</span>${svg("chevron", "go")}</a>`,
    )
    .join("\n");

  const moreButtons = more
    .map((s) => `<a class="svc rise" ${rise()} href="${esc(goHref(s, a))}">${svg(s.icon)}<span class="lbl">${esc(s.label)}</span></a>`)
    .join("\n");

  const follow = follows
    .map((s) => `<a href="${esc(goHref(s, a))}" aria-label="${esc(s.label)}">${svg(s.icon)}</a>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(ARTIST.title)}</title>
<meta name="description" content="${esc(ARTIST.description)}">
<meta name="theme-color" content="${THEME.bg}">
<link rel="canonical" href="${url}">
<link rel="icon" href="${ARTIST.icon}">
<link rel="apple-touch-icon" href="${ARTIST.icon}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(ARTIST.title)}">
<meta property="og:description" content="${esc(ARTIST.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${esc(ARTIST.siteName)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ARTIST.featured.title)} cover art">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ARTIST.title)}">
<meta name="twitter:description" content="${esc(ARTIST.description)}">
<meta name="twitter:image" content="${og}">
<link rel="preload" as="image" href="${art}">
${FONTS}
<style>${TOKENS}${PAGE_CSS}${THEME.extraCss}</style>
</head>
<body>
<div class="glow" style="background-image:url('${art}')" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>
<main class="wrap">
${header}
${eyebrow}
<nav class="svcs" aria-label="Listen on">
${buttons}
</nav>
${more.length ? `<nav class="more" aria-label="Also on">\n${moreButtons}\n</nav>` : ""}
<nav class="follow rise" ${rise()} aria-label="Follow">${follow}</nav>
<footer class="foot rise" ${rise()}><a href="${ARTIST.footerHref}">${esc(ARTIST.footer)}</a></footer>
</main>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- stats */

const STATS_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;padding:clamp(1.5rem,6vw,3rem) 1.25rem;line-height:1.5}
.wrap{max-width:680px;margin:0 auto}
h1{font-family:var(--display);font-weight:400;font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1}
.sub{color:var(--ink-3);font-size:.85rem;margin-top:.3rem}
h2{font-family:var(--label);font-weight:500;text-transform:uppercase;letter-spacing:.16em;font-size:.68rem;color:var(--ink-3);margin:2.2rem 0 .7rem}
.tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-top:1.6rem}
@media (min-width:36rem){.tiles{grid-template-columns:repeat(4,1fr)}}
.tile{border:1px solid var(--line);border-radius:12px;padding:.8rem .9rem;background:var(--card)}
.tile .k{font-size:.7rem;color:var(--ink-3)}
.tile .v{font-family:var(--display);font-size:1.7rem;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rows{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.r{background:var(--bg);padding:.6rem .9rem;display:grid;grid-template-columns:minmax(0,1fr) 7rem 3.2rem;align-items:center;gap:.8rem}
.nm{font-size:.9rem;min-width:0}
.nm small{display:block;color:var(--ink-3);font-size:.72rem}
.bar{display:block;height:5px;border-radius:3px;background:var(--accent);min-width:2px}
.n{font-family:var(--display);font-size:1.25rem;text-align:right;font-variant-numeric:tabular-nums}
.empty{background:var(--bg);padding:.8rem .9rem;color:var(--ink-3);font-size:.85rem}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;min-width:100%;white-space:nowrap;font-size:.8rem}
th{text-align:right;color:var(--ink-3);font-weight:400;padding:.35rem .45rem;border-bottom:1px solid var(--line);font-size:.68rem}
td{text-align:right;padding:.35rem .45rem;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
th:first-child,td:first-child{text-align:left}
.chart{display:grid;grid-template-columns:repeat(30,1fr);gap:3px;align-items:end;height:90px;padding:.5rem;border:1px solid var(--line);border-radius:12px}
.chart span{position:relative;height:100%;display:flex;align-items:flex-end}
.chart i{display:block;width:100%;background:var(--ink-3);border-radius:2px 2px 0 0}
.chart b{position:absolute;left:0;right:0;bottom:0;background:var(--accent);border-radius:2px 2px 0 0}
.axis{display:flex;justify-content:space-between;color:var(--ink-3);font-size:.68rem;margin-top:.3rem}
.key{color:var(--ink-3);font-size:.72rem;margin-top:.4rem}
.key i,.key b{display:inline-block;width:.6rem;height:.6rem;border-radius:2px;margin:0 .3rem 0 .6rem;vertical-align:-1px}
.key i{background:var(--ink-3)}.key b{background:var(--accent)}
code{font-family:ui-monospace,'SF Mono',monospace;font-size:.8rem;color:var(--ink)}
.note{color:var(--ink-3);font-size:.75rem;margin-top:2rem;line-height:1.65}
.warn{color:var(--accent)}
`;

function statsDoc(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Listen stats - ${esc(ARTIST.name)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${THEME.bg}">
${FONTS}
<style>${TOKENS}${STATS_CSS}</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

export function renderStatsMessage(title: string, msg: string): string {
  return statsDoc(`<h1>${esc(title)}</h1><p class="sub">${esc(msg)}</p>`);
}

const sourceLabel = (k: string) => SOURCE_LABELS[k] ?? k;
const serviceLabel = (k: string) => SERVICES.find((s) => s.key === k)?.label ?? k;
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "n/a");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const shortDate = (at: number) =>
  new Date(at).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });
const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });

export function renderStats(s: Summary): string {
  const host = ARTIST.origin.replace(/^https?:\/\/(www\.)?/, "");
  const top = s.sources[0];
  const tiles = [
    ["Visits", String(s.visits)],
    ["Taps to a service", String(s.clicks)],
    ["Tap rate", pct(s.clicks, s.visits)],
    ["Top channel", top ? sourceLabel(top.source) : "n/a"],
  ]
    .map(([k, v]) => `<div class="tile"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`)
    .join("");

  const peakVisits = Math.max(1, ...s.sources.map((r) => r.visits));
  const sourceRows = s.sources.length
    ? s.sources
        .map((r) => {
          const meta = [
            r.visits ? `${r.tagged} tagged, ${r.visits - r.tagged} guessed` : "",
            plural(r.clicks, "tap", "taps"),
            r.visits ? `${pct(r.clicks, r.visits)} tap rate` : "",
          ]
            .filter(Boolean)
            .join(" &middot; ");
          return `<div class="r"><span class="nm">${esc(sourceLabel(r.source))}<small>${meta}</small></span><span><span class="bar" style="width:${Math.round(
            (r.visits / peakVisits) * 100,
          )}%"></span></span><span class="n">${r.visits}</span></div>`;
        })
        .join("")
    : `<div class="empty">No visits yet.</div>`;

  const peakClicks = Math.max(1, ...s.services.map((r) => r.clicks));
  const serviceRows = s.services.length
    ? s.services
        .map(
          (r) =>
            `<div class="r"><span class="nm">${esc(serviceLabel(r.service))}<small>${pct(r.clicks, s.clicks)} of taps</small></span><span><span class="bar" style="width:${Math.round(
              (r.clicks / peakClicks) * 100,
            )}%"></span></span><span class="n">${r.clicks}</span></div>`,
        )
        .join("")
    : `<div class="empty">No taps yet.</div>`;

  const cols = s.services.map((r) => r.service);
  const cell = (so: string, se: string) => s.cells.find((c) => c.source === so && c.service === se)?.clicks ?? 0;
  const matrix = cols.length
    ? `<div class="scroll"><table><tr><th>Channel</th>${cols.map((c) => `<th>${esc(serviceLabel(c))}</th>`).join("")}</tr>${s.sources
        .filter((r) => r.clicks > 0)
        .map(
          (r) =>
            `<tr><td>${esc(sourceLabel(r.source))}</td>${cols
              .map((c) => `<td>${cell(r.source, c) || "&middot;"}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</table></div>`
    : `<div class="rows"><div class="empty">Fills in once people tap a service.</div></div>`;

  const peakDay = Math.max(1, ...s.days.map((d) => d.visits), ...s.days.map((d) => d.clicks));
  const chart = `<div class="chart">${s.days
    .map(
      (d) =>
        `<span title="${esc(dayLabel(d.day))}: ${d.visits} visits, ${d.clicks} taps"><i style="height:${Math.round(
          (d.visits / peakDay) * 100,
        )}%"></i><b style="height:${Math.round((d.clicks / peakDay) * 100)}%"></b></span>`,
    )
    .join("")}</div><div class="axis"><span>${esc(dayLabel(s.days[0].day))}</span><span>Today</span></div>
<p class="key"><i></i>visits<b></b>taps</p>`;

  const active = s.days.filter((d) => d.visits || d.clicks).reverse();
  const dayTable = active.length
    ? `<div class="scroll"><table><tr><th>Day</th><th>Visits</th><th>Taps</th></tr>${active
        .map((d) => `<tr><td>${esc(dayLabel(d.day))}</td><td>${d.visits}</td><td>${d.clicks}</td></tr>`)
        .join("")}</table></div>`
    : "";

  const links = TAGS.map(
    (t) =>
      `<div class="r"><span class="nm">${esc(TAG_INFO[t])}</span><span></span><span></span><code style="grid-column:1/-1">${esc(
        host,
      )}${ARTIST.path}/${t}</code></div>`,
  ).join("");

  return statsDoc(`
<h1>Listen page</h1>
<p class="sub">${esc(host)}${ARTIST.path}${s.since !== null ? ` &middot; counting since ${esc(shortDate(s.since))}` : ""}</p>
<div class="tiles">${tiles}</div>
<h2>Where visitors came from</h2>
<div class="rows">${sourceRows}</div>
<h2>Where they went</h2>
<div class="rows">${serviceRows}</div>
<h2>Channel &times; service</h2>
${matrix}
<h2>Last 30 days</h2>
${chart}
${dayTable}
<h2>Links to use</h2>
<div class="rows">${links}</div>
<p class="note">
  Counts are page loads and taps, not people: one person opening the page twice is two visits.
  <strong>Tagged</strong> means the link carried its tag (like <code>${ARTIST.path}/ig</code>).
  <strong>Guessed</strong> means it didn't, and the channel was read from the in-app browser or the
  referring site. <strong>Direct</strong> is what's left: typed in, or opened from somewhere that
  says nothing. Tap rate is taps divided by visits, so it can pass 100% when people tap more than
  one service. Link-preview fetches from iMessage, Slack and the like are left out${
    s.bots ? ` (${s.bots} so far)` : ""
  }.
  ${s.truncated ? '<br><span class="warn">Showing the most recent 20,000 events only.</span>' : ""}
</p>`);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd W && npx vitest run src/lib/listen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd W && git add src/lib/listen/render.ts src/lib/listen/render.test.ts
git commit -m "Render the /listen page and its stats page

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 5: Routes, wired end to end against the local backend

**Files:**
- Create: `src/lib/listen/respond.ts`
- Create: `src/app/listen/route.ts`, `src/app/listen/[tag]/route.ts`,
  `src/app/listen/go/[service]/route.ts`, `src/app/listen/stats/route.ts`

**Interfaces:**
- Consumes: everything above, `api.listen.log`, `api.listen.summary`
- Produces: `listenPage(request, tag): Response`, `listenGo(request, key): Response`,
  `listenStats(): Promise<Response>`

- [ ] **Step 1: Write `src/lib/listen/respond.ts`**

```ts
/* Request handling for /listen, shared by its route files. */

import { after } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { clickAttribution, isBot, isPrefetch, resolveSource } from "./attribution";
import { ARTIST, serviceByKey } from "./catalog";
import { renderListenPage, renderStats, renderStatsMessage } from "./render";

type ListenEvent = {
  kind: "visit" | "click";
  source: string;
  service?: string;
  tagged: boolean;
  bot: boolean;
};

/* Written after the response has gone out. after() keeps the function alive
   until the write finishes, where an un-awaited promise can be frozen mid-flight
   and lost. Any failure costs one count, never the page or the redirect. */
function record(event: ListenEvent): void {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return;
  after(async () => {
    try {
      await new ConvexHttpClient(url).mutation(api.listen.log, event);
    } catch {
      /* lose the count, keep the page */
    }
  });
}

/* no-store on everything: a response served from any cache is a visit nobody
   counted, and the totals would flatten into something that looks like real data. */
const HTML = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

export function listenPage(request: Request, tag: string | null): Response {
  const ua = request.headers.get("user-agent");
  const a = resolveSource({ tag, ua, referer: request.headers.get("referer") });
  if (request.method === "GET") {
    record({ kind: "visit", source: a.source, tagged: a.tagged, bot: isBot(ua) || isPrefetch(request.headers) });
  }
  return new Response(renderListenPage(a), { headers: HTML });
}

export function listenGo(request: Request, key: string): Response {
  const service = serviceByKey(key);
  if (!service) {
    return new Response(null, {
      status: 302,
      headers: { Location: new URL(ARTIST.path, request.url).toString(), "Cache-Control": "no-store" },
    });
  }
  const q = new URL(request.url).searchParams;
  const a = clickAttribution(q.get("p"), q.get("t"));
  if (request.method === "GET") {
    record({
      kind: "click",
      source: a.source,
      service: service.key,
      tagged: a.tagged,
      bot: isBot(request.headers.get("user-agent")) || isPrefetch(request.headers),
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: service.url, "Cache-Control": "no-store" },
  });
}

export async function listenStats(): Promise<Response> {
  const headers = { ...HTML, "X-Robots-Tag": "noindex, nofollow" };
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return new Response(renderStatsMessage("Listen page", "Not configured."), { status: 503, headers });
  }
  try {
    const s = await new ConvexHttpClient(url).query(api.listen.summary, {});
    return new Response(renderStats(s), { headers });
  } catch {
    return new Response(renderStatsMessage("Listen page", "Could not reach the database. Try again."), {
      status: 502,
      headers,
    });
  }
}
```

- [ ] **Step 2: Write the four route files**

`src/app/listen/route.ts`:

```ts
/* wmaac.org/listen: every place to hear gentle & lowly, in the one link that
   goes in bios and posts. The code is in src/lib/listen/, and the design is in
   docs/superpowers/specs/2026-09-26-listen-pages-design.md. */
import { listenPage } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return listenPage(request, new URL(request.url).searchParams.get("p"));
}
```

`src/app/listen/[tag]/route.ts`:

```ts
/* wmaac.org/listen/<tag>: the same page, tagged with where the link was posted,
   e.g. wmaac.org/listen/ig in the Instagram bio. The tags are TAG_INFO in
   src/lib/listen/catalog.ts. An unknown tag still shows the page. */
import { listenPage } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ tag: string }> }): Promise<Response> {
  const { tag } = await ctx.params;
  return listenPage(request, tag);
}
```

`src/app/listen/go/[service]/route.ts`:

```ts
/* wmaac.org/listen/go/<service>: counts a tap, then sends the person on.
   A redirect rather than a click beacon, like /sept13/cal: content blockers,
   long-press and open-in-new-tab all skip a beacon, but every one of them
   still has to come through here to find out where it's going. */
import { listenGo } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ service: string }> }): Promise<Response> {
  const { service } = await ctx.params;
  return listenGo(request, service);
}
```

`src/app/listen/stats/route.ts`:

```ts
/* wmaac.org/listen/stats: where /listen visitors came from and where they went.
   Unlisted rather than behind a login, like /sept13/stats. It shows counts for
   a public page and nothing personal. */
import { listenStats } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export function GET(): Promise<Response> {
  return listenStats();
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd W && npx tsc --noEmit -p . && npx eslint src/lib/listen src/app/listen convex/listen.ts`
Expected: no errors.

- [ ] **Step 4: Run it end to end on the local backend**

Terminal A (leave it running; it keeps the local backend up):
`cd W && CONVEX_AGENT_MODE=anonymous npx convex dev --tail-logs disable`

Terminal B: `cd W && npx next dev -p 3107`

Then:

```bash
B=http://localhost:3107
IG='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91'
curl -s -o /dev/null -w '%{http_code} %header{cache-control}\n' $B/listen/ig        # 200 no-store
curl -s -o /dev/null -w '%{http_code}\n' $B/listen/ig                                 # 200 (second visit)
curl -s -o /dev/null -w '%{http_code}\n' -A "$IG" $B/listen                            # 200, guessed ig
curl -s -o /dev/null -w '%{http_code}\n' -A 'facebookexternalhit/1.1 Facebot Twitterbot/1.0' $B/listen/ig   # 200, bot
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$B/listen/go/spotify?p=ig&t=1"   # 302 → Spotify artist URL
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$B/listen/go/nope?p=ig"           # 302 → /listen
curl -s "$B/listen/%3Cscript%3E" | grep -c '<script>'                                  # 0
curl -s "$B/listen?p=%3Cscript%3E" | grep -c '<script>'                                # 0
sleep 2; npx convex run listen:summary '{}'
```

Expected summary: `visits: 5`, with `ig` = 3 visits (2 tagged, 1 guessed) and `direct` = 2 (the two
garbage tags); `bots: 1`; `clicks: 1` on spotify from `ig`. Then open `$B/listen/stats` in the
browser and check it shows the same numbers.

- [ ] **Step 5: Check it keeps working without the database**

Stop terminal B and restart it as `NEXT_PUBLIC_CONVEX_URL= npx next dev -p 3107`. Then check:
- `curl -s -o /dev/null -w '%{http_code}' $B/listen/ig` gives `200`
- `/listen/go/spotify` gives `302`
- `/listen/stats` gives `503` with "Not configured."

Restart B normally afterwards.

- [ ] **Step 6: Clear the test rows and commit**

```bash
cd W && npx convex run listen:reset '{}'
git add src/lib/listen/respond.ts src/app/listen
git commit -m "Serve /listen, count taps through /listen/go, show /listen/stats

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 6: Art, share card and the visual pass

**Files:**
- Create: `public/listen-art/gl-plar-v1.jpg` (640 px cover), `public/listen-art/gl-icon-v1.png` (192 px icon),
  `public/listen-art/og-gl-v1.png` (1200×630 share card)

- [ ] **Step 1: Make the cover and share card**

```bash
cd W && mkdir -p public/listen-art
sips -s format jpeg -s formatOptions 82 -Z 640 "$L/art/gl_peace_like_a_river.jpg" --out public/listen-art/gl-plar-v1.jpg
sips -s format png -Z 192 "$L/art/gl_peace_like_a_river.jpg" --out public/listen-art/gl-icon-v1.png
```

Expected: `gl-plar-v1.jpg` about 60-120 KB at 640x640, and `gl-icon-v1.png` at 192x192.

Build the share card with `L/make_og.py` (PIL, fonts from `~/Projects/gentleandlowlyband.com/fonts/`),
then look at it with the Read tool:

```bash
cd W && python3 "$L/make_og.py" gl public/listen-art/og-gl-v1.png   # prints (1200, 630)
```

`L/make_og.py`:

```python
"""Share cards (Open Graph, 1200x630) for the two /listen pages.

    python3 make_og.py gl <out.png>
    python3 make_og.py mk <out.png>

The cover sits on the left with a soft shadow. On the right, the artist name is set in
Cormorant Garamond, with a quiet line under it. Fonts come from the band site's own
fonts folder (variable TTFs, set to a fixed weight here).
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FONTS = Path.home() / "Projects/gentleandlowlyband.com/fonts"

CARDS = {
    "gl": {
        "art": HERE / "art/gl_peace_like_a_river.jpg",
        "bg": (26, 23, 20),
        "ink": (245, 234, 214),
        "ink2": (166, 157, 143),  # cream at 63% over the espresso; ImageDraw doesn't blend alpha
        "accent": (196, 121, 58),
        # (text, colour key, italic)
        "name": [("gentle ", "ink", False), ("&", "accent", True), (" lowly", "ink", False)],
        "line": "peace like a river is out now",
        "foot": "Listen on Spotify, Apple Music and more",
    },
    "mk": {
        "art": HERE / "art/mk_the_more_i_see.jpg",
        "bg": (9, 9, 11),
        "ink": (244, 237, 221),
        "ink2": (157, 153, 143),  # cream at 63% over the black
        "accent": (212, 197, 169),
        "name": [("marco king", "ink", False)],
        "line": "the more i see",
        "foot": "Listen on Spotify, Apple Music and more",
    },
}

W, H = 1200, 630
COVER = 470


def font(file: str, size: int, weight: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONTS / file), size)
    try:
        f.set_variation_by_axes([weight])
    except (OSError, AttributeError):
        pass
    return f


def main(which: str, out: str) -> None:
    c = CARDS[which]
    img = Image.new("RGBA", (W, H), c["bg"] + (255,))

    # A wash of the cover's own colours behind everything, like the page's glow.
    wash = Image.open(c["art"]).convert("RGB").resize((W, W)).filter(ImageFilter.GaussianBlur(90))
    wash = wash.crop((0, (W - H) // 2, W, (W + H) // 2)).convert("RGBA")
    wash.putalpha(70)
    img.alpha_composite(wash)

    x0, y0 = 80, (H - COVER) // 2
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x0, y0 + 18, x0 + COVER, y0 + COVER + 18), radius=10, fill=(0, 0, 0, 170)
    )
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))

    cover = Image.open(c["art"]).convert("RGB").resize((COVER, COVER), Image.LANCZOS)
    mask = Image.new("L", (COVER, COVER), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, COVER, COVER), radius=8, fill=255)
    img.paste(cover, (x0, y0), mask)

    d = ImageDraw.Draw(img)
    tx = x0 + COVER + 64
    roman = font("CormorantGaramond-VariableFont_wght.ttf", 84, 400)
    italic = font("CormorantGaramond-Italic-VariableFont_wght.ttf", 84, 500)
    line_f = font("CormorantGaramond-Italic-VariableFont_wght.ttf", 38, 400)
    foot_f = font("SourceSans3-VariableFont_wght.ttf", 24, 400)

    # Fit the name to the space left of the right margin.
    max_w = W - 70 - tx
    size = 84
    while True:
        roman = font("CormorantGaramond-VariableFont_wght.ttf", size, 400)
        italic = font("CormorantGaramond-Italic-VariableFont_wght.ttf", size, 500)
        width = sum(d.textlength(t, font=italic if it else roman) for t, _, it in c["name"])
        if width <= max_w or size <= 48:
            break
        size -= 4

    y = H // 2 - 70
    x = tx
    for text, key, it in c["name"]:
        f = italic if it else roman
        d.text((x, y), text, font=f, fill=c[key], anchor="ls")
        x += d.textlength(text, font=f)

    d.text((tx, y + 62), c["line"], font=line_f, fill=c["ink2"], anchor="ls")
    d.line((tx, y + 112, tx + 56, y + 112), fill=c["accent"], width=2)
    d.text((tx, y + 160), c["foot"], font=foot_f, fill=c["ink2"], anchor="ls")

    img.convert("RGB").save(out, optimize=True)
    print(out, img.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
```

- [ ] **Step 2: Look at the page at phone widths**

With both dev servers running, open `http://localhost:3107/listen/ig` in the browser at 390×844,
then at 320×640. Screenshot each and look at them:
- Nothing scrolls sideways.
- "YouTube Music" and every other label stays on one line.
- The cover glow reads as a soft wash, not a smear.
- Spotify is the one filled button.

Fix any CSS problem in `render.ts` and rerun the Task 4 tests.

- [ ] **Step 3: Commit**

```bash
cd W && git add public/listen-art src/lib/listen
git commit -m "Add the /listen cover art and share card

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

## Part B: marcoking.com (all paths relative to `M`)

These are the same modules, ported. `attribution.ts`, `summary.ts`, `render.ts`, `respond.ts` and
`icons.ts` are copied **byte for byte** from `W`. Only `catalog.ts`, the tests' import line, the
stats route and the art differ.

### Task 7: Port the library and its tests

**Files:**
- Create: `src/lib/listen/{attribution,summary,render,respond,icons}.ts` (copied from `W`)
- Create: `src/lib/listen/catalog.ts` (the **Catalog data** appendix, "marcoking.com")
- Create: `src/lib/listen/{attribution,catalog,summary,render}.test.ts` (copied from `W`, with
  `from "vitest"` changed to `from "node:test"`)
- Modify: `package.json` scripts: add `"test": "node --import tsx --test src/lib/listen/*.test.ts"`

- [ ] **Step 1: Copy the tests and switch the runner**

```bash
cd M && mkdir -p src/lib/listen
for f in attribution catalog summary render; do
  sed 's/from "vitest"/from "node:test"/' "$W/src/lib/listen/$f.test.ts" > "src/lib/listen/$f.test.ts"
done
```

Then edit `M/package.json` scripts to add the `"test"` line above.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd M && npm test`
Expected: FAIL, with modules not found.

- [ ] **Step 3: Copy the modules and write the catalog**

```bash
cd M && for f in attribution summary render respond icons; do cp "$W/src/lib/listen/$f.ts" src/lib/listen/; done
```

Write `src/lib/listen/catalog.ts` from the appendix, "marcoking.com".

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd M && npm test`
Expected: PASS, all four files.

- [ ] **Step 5: Commit**

```bash
cd M && git add package.json src/lib/listen
git commit -m "Add the /listen library for marco king

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 8: Convex, routes and the admin stats page

**Files:**
- Modify: `M/convex/schema.ts` (add `listenEvents` as in Task 3 Step 1, before the closing `});`, with the comment saying marcoking.com/listen)
- Create: `M/convex/listen.ts` (byte for byte from `W/convex/listen.ts`)
- Create: `M/src/app/listen/route.ts`, `[tag]/route.ts`, `go/[service]/route.ts` (from `W`, with "wmaac.org" changed to "marcoking.com" and "gentle & lowly" to "Marco King" in the comments)
- Create: `M/src/app/admin/listen/route.ts`

- [ ] **Step 1: Schema, functions, routes**

Copy them as listed. Then write `src/app/admin/listen/route.ts`:

```ts
/* marcoking.com/admin/listen: where /listen visitors came from and where they
   went. Behind the admin login. A route handler rather than a page so it
   shares its renderer with wmaac.org/listen/stats; the admin layout does not
   apply to route handlers, so the auth check is done here. */
import { isAuthenticated } from "@/lib/auth";
import { listenStats } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(null, {
      status: 307,
      headers: { Location: new URL("/admin/login", request.url).toString(), "Cache-Control": "no-store" },
    });
  }
  return listenStats();
}
```

- [ ] **Step 2: Local backend, codegen, typecheck**

Same as Task 3 Step 3, but in `M`:
- confirm there's no `.env.local` first;
- run `CONVEX_AGENT_MODE=anonymous npx convex dev --once --typecheck enable`;
- **stop if `.env.local` names anything other than `anonymous:`**.

Then run `npx tsc --noEmit -p .` and expect no new errors in `src/lib/listen`, `src/app/listen` or
`src/app/admin/listen`. The repo may already have errors elsewhere; compare against a run on
`master`.

- [ ] **Step 3: End to end**

Repeat Task 5 Step 4 on port 3108, with the local backend running in `M` (`B=http://localhost:3108`). Then:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $B/admin/listen
# 307 http://localhost:3108/admin/login
curl -s -b 'admin-auth-token=true' $B/admin/listen | grep -o '<div class="v">[^<]*</div>' | head -2
# the Visits and Taps tiles, with the same numbers as the summary
```

The second curl uses the cookie value `src/lib/auth.ts` accepts, on localhost only. It's the same
weakness the handoff reports to Marco. Finish with `npx convex run listen:reset '{}'`.

- [ ] **Step 4: Commit**

```bash
cd M && git add convex/schema.ts convex/listen.ts convex/_generated/api.d.ts src/app/listen src/app/admin/listen
git commit -m "Serve marcoking.com/listen and its admin stats page

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

### Task 9: Art, share card and the visual pass for marcoking.com

Same as Task 6, in `M`:

```bash
cd M && mkdir -p public/listen-art
sips -s format jpeg -s formatOptions 82 -Z 640 "$L/art/mk_the_more_i_see.jpg" --out public/listen-art/mk-tmis-v1.jpg
sips -s format png -Z 192 "$L/art/mk_the_more_i_see.jpg" --out public/listen-art/mk-icon-v1.png
```

- The share card: `python3 "$L/make_og.py" mk public/listen-art/og-mk-v1.png` (the `mk` entry in
  Task 6's script: marcoking.com's colours, with Source Sans 3 standing in for Manrope, which isn't
  on this machine). Look at it with the Read tool.
- Screenshots at 390 and 320 px on port 3108.
- Commit: `git add public/listen-art && git commit -m "Add the /listen cover art and share card"`,
  with the co-author line.

---

## Part C: Handoff

### Task 10: Review, record and hand off

- [ ] **Step 1: Whole-branch review.** Hand one fresh reviewer both branch diffs
  (`git diff main...feature/listen-page` in `W`, `git diff master...feature/listen-page` in `M`)
  plus the spec, and have it look for bugs and spec gaps. Fix what holds up.
- [ ] **Step 2: Write `DEPLOY_LISTEN.md`** in the event folder's `07_Post_Event/`, next to the
  social plans (where Marco will look). It covers:
  - the exact deploy commands for each site;
  - the smoke test (curl with a user agent containing "bot");
  - the bio links table: one tagged URL per channel, per account.
- [ ] **Step 3: To-dos for Marco,** via `todo.py add`:
  - review both pages and OK the deploy;
  - after the deploy, swap in the tagged links in the IG, TikTok and YouTube bios.
- [ ] **Step 4:** Update the event `CLAUDE.md` log (run `date` first) and the handoff file.

---

## Appendix: Catalog data

Every URL below comes from `L/links.json`, where each one was fetched on 2026-09-26 and matched to
the right artist by release UPC or the service's own album-to-artist link.

### wmaac.org: `W/src/lib/listen/catalog.ts`

```ts
/* Everything on wmaac.org/listen that belongs to gentle & lowly rather than to
 * the page itself: the artist, where to listen, the tags we hand out, the
 * colours. attribution.ts, summary.ts, render.ts and respond.ts are identical
 * on marcoking.com; this is the only file that differs.
 *
 * Links checked 2026-09-26: each one loads and belongs to the band (matched by
 * release UPC where the service shows one). Pandora, SoundCloud, Audiomack and
 * Bandcamp don't carry the band, so they aren't listed. */

export interface Service {
  /** In the /listen/go/<key> URL and in stored events. Never rename one: old rows keep the old key. */
  key: string;
  label: string;
  url: string;
  /** stream: full-width button. more: the smaller two-column grid. follow: the icon row. */
  kind: "stream" | "more" | "follow";
  /** A key of ICONS in icons.ts. */
  icon: string;
}

export const ARTIST = {
  name: "gentle & lowly",
  nameHtml: 'gentle <span class="amp">&amp;</span> lowly',
  line: "Student-written worship from Penn State",
  featured: { title: "peace like a river", note: "Out now", art: "/listen-art/gl-plar-v1.jpg" },
  title: "gentle & lowly | Listen",
  description: "Listen to gentle & lowly on Spotify, Apple Music and wherever else you listen.",
  siteName: "Worship Music & Arts at Penn State",
  footer: "A Worship Music & Arts project at Penn State",
  footerHref: "https://www.wmaac.org",
  origin: "https://www.wmaac.org",
  path: "/listen",
  og: "/listen-art/og-gl-v1.png",
  icon: "/listen-art/gl-icon-v1.png",
} as const;

export const SERVICES: readonly Service[] = [
  { key: "spotify", label: "Spotify", kind: "stream", icon: "spotify", url: "https://open.spotify.com/artist/2rE4LSwX4hBzbu424HqILy" },
  { key: "apple", label: "Apple Music", kind: "stream", icon: "applemusic", url: "https://music.apple.com/us/artist/gentle-lowly/1896290978" },
  { key: "ytmusic", label: "YouTube Music", kind: "stream", icon: "youtubemusic", url: "https://music.youtube.com/channel/UCMqjHqS48Nw0y_QVN7KyG9A" },
  { key: "amazon", label: "Amazon Music", kind: "stream", icon: "note", url: "https://music.amazon.com/artists/B0GZK571MD/gentle-lowly" },
  { key: "tidal", label: "Tidal", kind: "more", icon: "tidal", url: "https://tidal.com/artist/79055215" },
  { key: "deezer", label: "Deezer", kind: "more", icon: "deezer", url: "https://www.deezer.com/artist/389181691" },
  { key: "iheart", label: "iHeartRadio", kind: "more", icon: "iheartradio", url: "https://www.iheart.com/artist/gentle-lowly-50635777/" },
  { key: "instagram", label: "Instagram", kind: "follow", icon: "instagram", url: "https://www.instagram.com/gentleandlowlyband/" },
  { key: "youtube", label: "YouTube", kind: "follow", icon: "youtube", url: "https://www.youtube.com/@gentleandlowlyband" },
  { key: "tiktok", label: "TikTok", kind: "follow", icon: "tiktok", url: "https://www.tiktok.com/@gentleandlowlyband" },
];

/** Tags we hand out, each for one place a link gets posted: wmaac.org/listen/<tag>. */
export const TAG_INFO: Record<string, string> = {
  ig: "Band Instagram bio (@gentleandlowlyband)",
  wma: "Club Instagram bio (@wma.pennstate)",
  story: "Instagram story link sticker",
  tt: "TikTok bio",
  yt: "YouTube channel links and video descriptions",
  fb: "Facebook",
  qr: "QR code on a slide, flyer or card",
  email: "Emails",
  text: "Texts and group chats",
  web: "Links on gentleandlowlyband.com or wmaac.org",
};
export const TAGS: readonly string[] = Object.keys(TAG_INFO);

/** Sources attribution.ts can guess when there's no tag. */
export const GUESSES: readonly string[] = ["ig", "fb", "tt", "yt", "snap", "x", "search", "web", "direct"];

export const SOURCES: readonly string[] = [...new Set([...TAGS, ...GUESSES])];

export const SOURCE_LABELS: Record<string, string> = {
  ig: "Instagram",
  wma: "Instagram (@wma.pennstate)",
  story: "Instagram story",
  tt: "TikTok",
  yt: "YouTube",
  fb: "Facebook",
  qr: "QR code",
  email: "Email",
  text: "Texts",
  web: "Our websites",
  snap: "Snapchat",
  x: "X",
  search: "Search",
  direct: "Direct",
};

/** A referrer from one of these (or a subdomain) is counted as "web". */
export const OWN_HOSTS: readonly string[] = ["wmaac.org", "gentleandlowlyband.com"];

/* gentleandlowlyband.com's own tokens (css/, 2026-09): espresso, cream, amber. */
export const THEME = {
  bg: "#1a1714",
  card: "#242019",
  line: "#3a3228",
  ink: "#f5ead6",
  ink2: "rgba(245, 234, 214, 0.68)",
  ink3: "rgba(245, 234, 214, 0.5)",
  accent: "#c4793a",
  display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  body: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  label: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Source+Sans+3:wght@300;400;600&display=swap",
  extraCss: "",
} as const;

/* hasOwnProperty, not Object.hasOwn: convex/ typechecks against ES2021. */
export const isTag = (t: string): boolean => Object.prototype.hasOwnProperty.call(TAG_INFO, t);
export const isSource = (s: string): boolean => SOURCES.includes(s);
export const serviceByKey = (k: string): Service | undefined => SERVICES.find((s) => s.key === k);
```

### marcoking.com: `M/src/lib/listen/catalog.ts`

The same file, with these values. The comment header says marcoking.com/listen and marco king.
The `Service` interface and the three helpers at the bottom are unchanged.

```ts
/* Everything on marcoking.com/listen that belongs to marco king rather than to
 * the page itself: the artist, where to listen, the tags we hand out, the
 * colours. attribution.ts, summary.ts, render.ts and respond.ts are identical
 * on wmaac.org; this is the only file that differs.
 *
 * Links checked 2026-09-26: each one loads and belongs to Marco (matched by
 * release UPC where the service shows one). On Amazon Music, Tidal, Deezer and
 * iHeartRadio his artist page is merged with other artists called Marco King,
 * and the newest thing it shows isn't his, so those four link to his latest
 * single instead. Point them back at the artist page once the distributor
 * splits the profiles. Bandcamp doesn't carry him. */

export interface Service {
  /** In the /listen/go/<key> URL and in stored events. Never rename one: old rows keep the old key. */
  key: string;
  label: string;
  url: string;
  /** stream: full-width button. more: the smaller two-column grid. follow: the icon row. */
  kind: "stream" | "more" | "follow";
  /** A key of ICONS in icons.ts. */
  icon: string;
}

export const ARTIST = {
  name: "marco king",
  nameHtml: "marco king",
  line: "Singer-songwriter",
  featured: { title: "the more i see", note: "Latest single", art: "/listen-art/mk-tmis-v1.jpg" },
  title: "marco king | Listen",
  description: "Listen to marco king on Spotify, Apple Music and wherever else you listen.",
  siteName: "Marco King",
  footer: "marcoking.com",
  footerHref: "https://www.marcoking.com",
  origin: "https://www.marcoking.com",
  path: "/listen",
  og: "/listen-art/og-mk-v1.png",
  icon: "/listen-art/mk-icon-v1.png",
} as const;

export const SERVICES: readonly Service[] = [
  { key: "spotify", label: "Spotify", kind: "stream", icon: "spotify", url: "https://open.spotify.com/artist/2WAEN0pxKg9HCfb6k1M3F2" },
  { key: "apple", label: "Apple Music", kind: "stream", icon: "applemusic", url: "https://music.apple.com/us/artist/marco-king/1532636841" },
  { key: "ytmusic", label: "YouTube Music", kind: "stream", icon: "youtubemusic", url: "https://music.youtube.com/channel/UC5BvhIShmR_xRcBYKlRg12g" },
  { key: "amazon", label: "Amazon Music", kind: "stream", icon: "note", url: "https://music.amazon.com/albums/B0FKJF8QYQ" },
  { key: "soundcloud", label: "SoundCloud", kind: "more", icon: "soundcloud", url: "https://soundcloud.com/marcoking-music" },
  { key: "pandora", label: "Pandora", kind: "more", icon: "pandora", url: "https://www.pandora.com/artist/marco-king/AR2jcJ2dwZ52lhX" },
  { key: "tidal", label: "Tidal", kind: "more", icon: "tidal", url: "https://tidal.com/album/451222163" },
  { key: "deezer", label: "Deezer", kind: "more", icon: "deezer", url: "https://www.deezer.com/album/796742011" },
  { key: "audiomack", label: "Audiomack", kind: "more", icon: "audiomack", url: "https://audiomack.com/marco-king-3" },
  { key: "iheart", label: "iHeartRadio", kind: "more", icon: "iheartradio", url: "https://www.iheart.com/artist/marco-king-37211038/albums/the-more-i-see-342493905/" },
  { key: "instagram", label: "Instagram", kind: "follow", icon: "instagram", url: "https://www.instagram.com/marcojking/" },
];

/** Tags we hand out, each for one place a link gets posted: marcoking.com/listen/<tag>. */
export const TAG_INFO: Record<string, string> = {
  ig: "Instagram bio (@marcojking)",
  story: "Instagram story link sticker",
  tt: "TikTok",
  yt: "YouTube",
  qr: "QR code on a slide, flyer or card",
  email: "Emails",
  text: "Texts and group chats",
  web: "Links on marcoking.com",
};
export const TAGS: readonly string[] = Object.keys(TAG_INFO);

/** Sources attribution.ts can guess when there's no tag. */
export const GUESSES: readonly string[] = ["ig", "fb", "tt", "yt", "snap", "x", "search", "web", "direct"];

export const SOURCES: readonly string[] = [...new Set([...TAGS, ...GUESSES])];

export const SOURCE_LABELS: Record<string, string> = {
  ig: "Instagram",
  story: "Instagram story",
  tt: "TikTok",
  yt: "YouTube",
  fb: "Facebook",
  qr: "QR code",
  email: "Email",
  text: "Texts",
  web: "marcoking.com",
  snap: "Snapchat",
  x: "X",
  search: "Search",
  direct: "Direct",
};

/** A referrer from one of these (or a subdomain) is counted as "web". */
export const OWN_HOSTS: readonly string[] = ["marcoking.com"];

/* marcoking.com's dark tokens (src/app/globals.css .dark) and its three fonts. */
export const THEME = {
  bg: "#09090b",
  card: "#111113",
  line: "#27272a",
  ink: "#f4eddd",
  ink2: "rgba(244, 237, 221, 0.68)",
  ink3: "rgba(244, 237, 221, 0.5)",
  accent: "#d4c5a9",
  display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  body: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  label: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Manrope:wght@300;400;600&family=Geist+Mono:wght@400;500&display=swap",
  extraCss: "",
} as const;

/* hasOwnProperty, not Object.hasOwn: convex/ typechecks against ES2021. */
export const isTag = (t: string): boolean => Object.prototype.hasOwnProperty.call(TAG_INFO, t);
export const isSource = (s: string): boolean => SOURCES.includes(s);
export const serviceByKey = (k: string): Service | undefined => SERVICES.find((s) => s.key === k);
```
