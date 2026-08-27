/* wmaac.org/sept13/stats — how many people scanned each poster.
 *
 * Three posters went up for Sept 13, each with its own QR code carrying a
 * different ?p= value. This is where those land. Unlisted rather than
 * authenticated: it exposes four numbers about a free public event, and a login
 * wall is more machinery than that is worth. Do not put anything else here.
 *
 * A route handler, not a page, to match /sept13 — same reason, no site chrome.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const POSTERS = [
  { key: "figs", label: "The Figs", colour: "#d4a3c7" },
  { key: "psu", label: "PSU Football", colour: "#8fa8cc" },
  { key: "pizza", label: "Free Pizza", colour: "#e2a75c" },
  /* The 2,500 printed cards. Their QR predates the ?p= scheme and points at the
     bare URL, so this bucket is "no param" — mostly cards, plus anyone who typed
     the address or opened a shared link. */
  { key: "card", label: "Cards / direct", colour: "#8f8f8f" },
] as const;

type Counts = { figs: number; psu: number; pizza: number; card: number };
type Summary = {
  totals: Counts;
  bots: Counts;
  total: number;
  botTotal: number;
  truncated: boolean;
  days: ({ day: string } & Counts)[];
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Poster scans - Sept 13</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a0a0a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#fff;font-family:'Inter',system-ui,sans-serif;
       -webkit-font-smoothing:antialiased;padding:clamp(1.5rem,6vw,3rem) 1.25rem;line-height:1.5}
  .wrap{max-width:560px;margin:0 auto}
  h1{font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;
     letter-spacing:.06em;font-size:clamp(1.2rem,5vw,1.6rem)}
  .sub{color:#919191;font-size:.85rem;font-weight:300;margin-top:.3rem}
  .cards{display:grid;gap:.7rem;margin-top:1.6rem}
  .card{border:1px solid #262626;border-radius:12px;padding:.9rem 1.1rem;
        display:flex;align-items:baseline;justify-content:space-between;gap:1rem}
  .name{font-family:'Oswald',sans-serif;font-weight:400;text-transform:uppercase;
        letter-spacing:.09em;font-size:.95rem;display:flex;align-items:center;gap:.6rem}
  .dot{width:8px;height:8px;border-radius:50%;flex:none}
  .n{font-family:'Oswald',sans-serif;font-weight:600;font-size:1.9rem;line-height:1}
  .pct{color:#919191;font-size:.78rem;font-weight:300;margin-left:.45rem}
  .tot{margin-top:1.1rem;color:#919191;font-size:.85rem;font-weight:300}
  h2{font-family:'Oswald',sans-serif;font-weight:400;text-transform:uppercase;
     letter-spacing:.12em;font-size:.75rem;color:#919191;margin:2rem 0 .7rem}
  table{width:100%;border-collapse:collapse;font-size:.85rem;font-weight:300}
  th{text-align:right;color:#919191;font-weight:400;padding:.35rem .4rem;
     border-bottom:1px solid #262626;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}
  th:first-child,td:first-child{text-align:left}
  td{text-align:right;padding:.35rem .4rem;border-bottom:1px solid #161616;font-variant-numeric:tabular-nums}
  .note{color:#5e5e5e;font-size:.72rem;font-weight:300;margin-top:1.6rem;line-height:1.6}
  .warn{color:#e2a75c}
</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

export async function GET(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return new Response(page("<h1>Poster scans</h1><p class='sub'>Not configured.</p>"), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let s: Summary;
  try {
    s = (await new ConvexHttpClient(url).query(api.posterScans.summary, {})) as Summary;
  } catch {
    return new Response(
      page("<h1>Poster scans</h1><p class='sub'>Could not reach the database. Try again.</p>"),
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const cards = POSTERS.map((p) => {
    const n = s.totals[p.key];
    const pct = s.total ? Math.round((n / s.total) * 100) : 0;
    return `<div class="card">
      <span class="name"><span class="dot" style="background:${p.colour}"></span>${esc(p.label)}</span>
      <span><span class="n">${n}</span><span class="pct">${pct}%</span></span>
    </div>`;
  }).join("");

  const rows = s.days.length
    ? s.days
        .slice()
        .reverse()
        .map(
          (d) =>
            `<tr><td>${esc(d.day)}</td><td>${d.figs}</td><td>${d.psu}</td><td>${d.pizza}</td><td>${d.card}</td><td>${
              d.figs + d.psu + d.pizza + d.card
            }</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6" style="color:#5e5e5e">No scans yet.</td></tr>`;

  const body = `
    <h1>Poster scans</h1>
    <p class="sub">HUB Lawn Worship Night &middot; Sunday, September 13</p>
    <div class="cards">${cards}</div>
    <p class="tot"><strong>${s.total}</strong> scans total${
      s.botTotal ? ` &middot; ${s.botTotal} link-preview fetches excluded` : ""
    }</p>
    <h2>By day</h2>
    <table>
      <tr><th>Day</th><th>Figs</th><th>PSU</th><th>Pizza</th><th>Cards</th><th>All</th></tr>
      ${rows}
    </table>
    <p class="note">
      Counts page loads, not unique people &mdash; one person scanning twice counts twice.
      Each poster's QR carries its own <code>?p=</code>. The printed cards were made
      before that existed and point at the bare URL, so <strong>Cards / direct</strong> is
      every visit with no parameter: mostly the 2,500 cards, but also anyone who typed the
      address or opened a link someone shared. Link-preview fetches from iMessage, Slack
      and the like are detected by user-agent and excluded.
      ${s.truncated ? '<br><span class="warn">Showing the most recent 20,000 scans only.</span>' : ""}
    </p>`;

  return new Response(page(body), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
