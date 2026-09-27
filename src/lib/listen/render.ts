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
html{-webkit-text-size-adjust:100%;background:var(--bg);overflow-x:clip}
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
.tile .v{font-family:var(--display);font-size:1.7rem;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:lining-nums}
.rows{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.r{background:var(--bg);padding:.6rem .9rem;display:grid;grid-template-columns:minmax(0,1fr) 7rem 3.2rem;align-items:center;gap:.8rem}
.nm{font-size:.9rem;min-width:0}
.nm small{display:block;color:var(--ink-3);font-size:.72rem}
.bar{display:block;height:5px;border-radius:3px;background:var(--accent);min-width:2px}
.n{font-family:var(--display);font-size:1.25rem;text-align:right;font-variant-numeric:lining-nums tabular-nums}
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
<title>Listen stats &middot; ${esc(ARTIST.name)}</title>
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

  const followRows = s.follows
    .map(
      (r) =>
        `<div class="r"><span class="nm">${esc(serviceLabel(r.service))}</span><span></span><span class="n">${r.clicks}</span></div>`,
    )
    .join("");

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
${followRows ? `<h2>Follow taps</h2>\n<div class="rows">${followRows}</div>` : ""}
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
  one service. Taps on the follow icons are counted on their own and left out of the tap rate.
  Link-preview fetches from iMessage, Slack and the like are left out${
    s.bots ? ` (${s.bots} so far)` : ""
  }.
  ${s.truncated ? '<br><span class="warn">Showing the most recent 20,000 events only.</span>' : ""}
</p>`);
}
