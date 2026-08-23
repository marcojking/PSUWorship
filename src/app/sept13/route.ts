/* wmaac.org/sept13 — the destination for the printed promo cards and the general
   event link. Deliberately a route handler, not a page, so it renders full-bleed
   with no site chrome. Visual language matches the card: flat black, white type,
   condensed display face. Someone scans a black card and lands on a black page.

   LOWERCASE IS LOAD-BEARING. This path is printed on ~3,000 cards. macOS is
   case-insensitive so /Sept13 and /sept13 look identical in local dev, but Vercel
   builds on case-sensitive Linux where they are different routes. The folder is
   lowercase in git, and src/middleware.ts redirects the old capitalised /Sept13/*
   here so the UNITUS sponsorship link that was already shared keeps resolving. */

const EVENT = {
  artist: "The Figs",
  date: "Sunday, September 13",
  time: "6:30 PM",
  place: "HUB Lawn",
  campus: "Penn State, University Park",
};

/* Set this to the RSVP destination (Google Form, ticketing page, whatever) and the
   button appears. Left null on purpose: a dead RSVP link on a card that is printed
   3,000 times is worse than no RSVP link at all. One-line change to switch on. */
const RSVP_URL: string | null = null;

const UNITUS_URL = "https://weareunitus.com";

// Google Calendar expects UTC. Sept 13 2026 is EDT (UTC-4), so 6:30 PM ET = 22:30Z.
const GCAL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("The Figs — Live on HUB Lawn") +
  "&dates=20260913T223000Z/20260914T023000Z" +
  "&location=" + encodeURIComponent("HUB Lawn, Penn State, University Park, PA") +
  "&details=" + encodeURIComponent("Free and outdoor. wmaac.org/sept13");

const rsvpButton = RSVP_URL
  ? `<a class="btn primary" href="${RSVP_URL}" target="_blank" rel="noopener">RSVP</a>`
  : "";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Figs — Live on HUB Lawn · Sept 13</title>
<meta name="description" content="${EVENT.artist} live on the ${EVENT.place} at Penn State. ${EVENT.date}, ${EVENT.time}. Free and outdoor.">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:title" content="The Figs — Live on HUB Lawn">
<meta property="og:description" content="${EVENT.date} · ${EVENT.time} · Free and outdoor. ${EVENT.campus}.">
<meta property="og:url" content="https://www.wmaac.org/sept13">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Figs — Live on HUB Lawn">
<meta name="twitter:description" content="${EVENT.date} · ${EVENT.time} · Free and outdoor.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --black:#0a0a0a;
    --white:#fff;
    --dim:#919191;
    --faint:#5e5e5e;
    --line:#262626;
    /* The Figs' brand pink, sampled from their album art — same value used on the
       printed card, so a scan lands somewhere that visibly matches what's in hand. */
    --figs:#d4a3c7;
  }
  html{-webkit-text-size-adjust:100%}
  body{
    background:var(--black);
    color:var(--white);
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    -webkit-font-smoothing:antialiased;
    min-height:100svh;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:clamp(2rem,8vw,4rem) 1.5rem;
    text-align:center;
    line-height:1.5;
  }
  .wrap{width:100%;max-width:540px}

  /* HERO — mirrors the card exactly: artist, hairline rule, venue, date/time */
  h1{
    font-family:'Oswald',Impact,sans-serif;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.02em;
    font-size:clamp(3.3rem,16vw,6rem);
    line-height:.92;
    color:var(--figs);
  }
  .rule{height:1px;background:var(--line);width:min(220px,60%);margin:clamp(1rem,4vw,1.4rem) auto}
  h2{
    font-family:'Oswald',sans-serif;
    font-weight:400;
    text-transform:uppercase;
    letter-spacing:.16em;
    font-size:clamp(.95rem,4.2vw,1.3rem);
    line-height:1.35;
  }
  .when{
    margin-top:clamp(1rem,4vw,1.5rem);
    color:var(--dim);
    font-size:clamp(.9rem,3.6vw,1.05rem);
    letter-spacing:.06em;
    font-weight:300;
  }
  .when b{color:var(--white);font-weight:500}

  /* FACTS */
  .facts{
    margin-top:clamp(2rem,8vw,3rem);
    padding-top:clamp(1.4rem,5vw,1.9rem);
    border-top:1px solid var(--line);
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:1rem;
  }
  .fact .k{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);margin-bottom:.4rem}
  .fact .v{font-family:'Oswald',sans-serif;font-size:clamp(.88rem,3.5vw,1.05rem);text-transform:uppercase;letter-spacing:.04em;font-weight:500}
  .note{margin-top:1.4rem;color:var(--dim);font-size:.85rem;font-weight:300}

  /* ACTIONS */
  .actions{margin-top:clamp(2rem,8vw,2.75rem);display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
  .btn{
    display:inline-block;
    padding:.9rem 1.9rem;
    border:1px solid var(--line);
    color:var(--dim);
    text-decoration:none;
    font-size:.7rem;
    letter-spacing:.22em;
    text-transform:uppercase;
    font-weight:500;
    transition:background .18s ease,color .18s ease,border-color .18s ease;
  }
  .btn:hover,.btn:focus-visible{border-color:var(--white);color:var(--white)}
  .btn.primary{border-color:var(--white);color:var(--white)}
  .btn.primary:hover,.btn.primary:focus-visible{background:var(--white);color:var(--black)}

  /* SPONSOR — artwork is solid black with alpha, so invert() paints it white */
  .partner{
    margin-top:clamp(2.5rem,9vw,3.25rem);
    padding-top:clamp(1.4rem,5vw,1.9rem);
    border-top:1px solid var(--line);
  }
  .partner .k{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);margin-bottom:.9rem}
  .partner a{display:inline-block;line-height:0;opacity:.75;transition:opacity .18s ease}
  .partner a:hover,.partner a:focus-visible{opacity:1}
  .partner img{width:118px;max-width:44vw;height:auto;filter:invert(1)}

  /* The credit line the UPAC allocation letter requires on promotional material. */
  footer{
    margin-top:clamp(2rem,7vw,2.5rem);
    color:var(--faint);
    font-size:.6rem;
    letter-spacing:.16em;
    text-transform:uppercase;
    line-height:1.9;
  }

  @media(max-width:380px){.facts{grid-template-columns:1fr;gap:1.3rem}}
  @media(prefers-reduced-motion:reduce){.btn,.partner a{transition:none}}
</style>
</head>
<body>
  <main class="wrap">
    <h1>${EVENT.artist}</h1>
    <div class="rule"></div>
    <h2>Live on ${EVENT.place}</h2>
    <p class="when"><b>${EVENT.date}</b> &nbsp;·&nbsp; <b>${EVENT.time}</b></p>

    <div class="facts">
      <div class="fact"><div class="k">Where</div><div class="v">${EVENT.place}</div></div>
      <div class="fact"><div class="k">Cost</div><div class="v">Free</div></div>
      <div class="fact"><div class="k">Setting</div><div class="v">Outdoor</div></div>
    </div>
    <p class="note">No ticket needed. Bring a blanket or a chair.</p>

    <div class="actions">
      ${rsvpButton}
      <a class="btn${RSVP_URL ? "" : " primary"}" href="${GCAL}" target="_blank" rel="noopener">Add to Calendar</a>
    </div>

    <div class="partner">
      <div class="k">In partnership with</div>
      <a href="${UNITUS_URL}" target="_blank" rel="noopener">
        <img src="/unitus_wordmark.png" alt="UNITUS" width="800" height="161">
      </a>
    </div>

    <footer>
      ${EVENT.campus}<br>
      Funded by the Student Initiated Fee
    </footer>
  </main>
</body>
</html>
`;

export async function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Short cache: this URL is printed on physical cards, so a wrong value has
      // to be correctable in minutes, not hours.
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
