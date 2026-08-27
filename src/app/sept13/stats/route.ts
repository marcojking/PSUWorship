/* wmaac.org/sept13/stats — where visits to the Sept 13 page came from.
 *
 * Every link we control carries ?p=<source>: one value per poster QR, one per
 * place we post the link online. This is where those land. Unlisted rather than
 * authenticated: it exposes visit counts for a free public event, and a login
 * wall is more machinery than that is worth. Do not put anything else here.
 *
 * A route handler, not a page, to match /sept13 — same reason, no site chrome.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

/* Grouped because a flat list of thirteen numbers is a wall. The split is also
   the question actually being asked: is the printed spend or the online push
   doing the work? */
const GROUPS: { title: string; items: { key: string; label: string; colour: string }[] }[] = [
  {
    title: "Print",
    items: [
      { key: "figs", label: "Figs poster", colour: "#d4a3c7" },
      { key: "psu", label: "PSU Football poster", colour: "#8fa8cc" },
      { key: "pizza", label: "Free Pizza poster", colour: "#e2a75c" },
      { key: "card", label: "Cards / direct", colour: "#8f8f8f" },
    ],
  },
  {
    title: "Online",
    items: [
      { key: "ig", label: "Instagram", colour: "#c86dd7" },
      { key: "igstory", label: "IG story", colour: "#a86bc4" },
      { key: "tiktok", label: "TikTok", colour: "#4fd1c5" },
      { key: "yt", label: "YouTube", colour: "#d76d6d" },
      { key: "fb", label: "Facebook", colour: "#6d8fd7" },
    ],
  },
  {
    title: "Sent directly",
    items: [
      { key: "email", label: "Email", colour: "#9fb87a" },
      { key: "groupme", label: "GroupMe", colour: "#6dbfd7" },
      { key: "text", label: "Text", colour: "#c9b06d" },
      { key: "other", label: "Other", colour: "#6e6e6e" },
    ],
  },
];

type Row = { source: string; count: number };
type Summary = {
  totals: Row[];
  bots: Row[];
  total: number;
  botTotal: number;
  truncated: boolean;
  days: { day: string; total: number; counts: Row[] }[];
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Traffic sources - Sept 13</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a0a0a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:'Inter',system-ui,sans-serif;
       -webkit-font-smoothing:antialiased;padding:clamp(1.5rem,6vw,3rem) 1.25rem;line-height:1.5}
  .wrap{max-width:620px;margin:0 auto}
  h1{font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;
     letter-spacing:.06em;font-size:clamp(1.2rem,5vw,1.6rem)}
  .sub{color:#919191;font-size:.85rem;font-weight:300;margin-top:.3rem}
  h2{font-family:'Oswald',sans-serif;font-weight:400;text-transform:uppercase;
     letter-spacing:.12em;font-size:.72rem;color:#919191;margin:1.9rem 0 .6rem}
  .rows{display:grid;gap:1px;background:#1c1c1c;border:1px solid #1c1c1c;border-radius:10px;overflow:hidden}
  .r{background:#0a0a0a;padding:.62rem .9rem;display:grid;
     grid-template-columns:1fr auto auto;align-items:center;gap:.9rem}
  .name{font-size:.86rem;font-weight:300;display:flex;align-items:center;gap:.6rem;min-width:0}
  .dot{width:7px;height:7px;border-radius:50%;flex:none}
  .bar{height:4px;border-radius:2px;min-width:2px}
  .barwrap{width:110px}
  .n{font-family:'Oswald',sans-serif;font-weight:600;font-size:1.05rem;
     min-width:2.6ch;text-align:right;font-variant-numeric:tabular-nums}
  .zero .name,.zero .n{color:#4a4a4a}
  .tot{margin-top:1.2rem;color:#919191;font-size:.85rem;font-weight:300}
  table{width:100%;border-collapse:collapse;font-size:.8rem;font-weight:300;margin-top:.4rem}
  th{text-align:right;color:#919191;font-weight:400;padding:.32rem .3rem;
     border-bottom:1px solid #262626;font-size:.66rem;text-transform:uppercase;letter-spacing:.06em}
  th:first-child,td:first-child{text-align:left}
  td{text-align:right;padding:.32rem .3rem;border-bottom:1px solid #161616;font-variant-numeric:tabular-nums}
  .note{color:#5e5e5e;font-size:.72rem;font-weight:300;margin-top:1.7rem;line-height:1.65}
  code{color:#8f8f8f}
  .warn{color:#e2a75c}
</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

export async function GET(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return new Response(page("<h1>Traffic sources</h1><p class='sub'>Not configured.</p>"), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let s: Summary;
  try {
    s = (await new ConvexHttpClient(url).query(api.posterScans.summary, {})) as Summary;
  } catch {
    return new Response(
      page("<h1>Traffic sources</h1><p class='sub'>Could not reach the database. Try again.</p>"),
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const count = (k: string) => s.totals.find((t) => t.source === k)?.count ?? 0;
  const peak = Math.max(1, ...s.totals.map((t) => t.count));

  const groups = GROUPS.map((g) => {
    const sub = g.items.reduce((a, i) => a + count(i.key), 0);
    const rows = g.items
      .map((i) => {
        const n = count(i.key);
        const w = Math.round((n / peak) * 100);
        return `<div class="r${n === 0 ? " zero" : ""}">
          <span class="name"><span class="dot" style="background:${i.colour}"></span>${esc(i.label)}</span>
          <span class="barwrap"><span class="bar" style="display:block;width:${w}%;background:${i.colour};opacity:${n ? 1 : 0}"></span></span>
          <span class="n">${n}</span>
        </div>`;
      })
      .join("");
    return `<h2>${esc(g.title)} &middot; ${sub}</h2><div class="rows">${rows}</div>`;
  }).join("");

  const cols = GROUPS.flatMap((g) => g.items);
  const dayRows = s.days.length
    ? s.days
        .slice()
        .reverse()
        .map((d) => {
          const c = (k: string) => d.counts.find((x) => x.source === k)?.count ?? 0;
          return `<tr><td>${esc(d.day)}</td>${cols
            .map((i) => `<td>${c(i.key) || "&middot;"}</td>`)
            .join("")}<td><strong>${d.total}</strong></td></tr>`;
        })
        .join("")
    : `<tr><td colspan="${cols.length + 2}" style="color:#5e5e5e">No visits yet.</td></tr>`;

  const body = `
    <h1>Traffic sources</h1>
    <p class="sub">HUB Lawn Worship Night &middot; Sunday, September 13</p>
    ${groups}
    <p class="tot"><strong>${s.total}</strong> visits total${
      s.botTotal ? ` &middot; ${s.botTotal} link-preview fetches excluded` : ""
    }</p>
    <h2>By day</h2>
    <table>
      <tr><th>Day</th>${cols.map((i) => `<th>${esc(i.label.split(" ")[0])}</th>`).join("")}<th>All</th></tr>
      ${dayRows}
    </table>
    <p class="note">
      Counts page loads, not unique people &mdash; one person opening it twice counts twice.
      Each source is a <code>?p=</code> value on the link. The printed cards were made
      before that existed and point at the bare URL, so <strong>Cards / direct</strong> is
      every visit with no parameter: mostly the 2,500 cards, but also anyone who typed the
      address or opened a link someone forwarded. Link-preview fetches from iMessage,
      Slack and the like are detected by user-agent and excluded.
      ${s.truncated ? '<br><span class="warn">Showing the most recent 20,000 visits only.</span>' : ""}
    </p>`;

  return new Response(page(body), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
