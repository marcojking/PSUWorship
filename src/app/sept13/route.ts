/* wmaac.org/sept13 — the destination for the printed promo cards and the general
   event link. Deliberately a route handler, not a page, so it renders full-bleed
   with no site chrome. Visual language matches the card: flat black, white type,
   condensed display face. Someone scans a black card and lands on a black page.

   LOWERCASE IS LOAD-BEARING. This path is printed on ~3,000 cards. macOS is
   case-insensitive so /Sept13 and /sept13 look identical in local dev, but Vercel
   builds on case-sensitive Linux where they are different routes. The folder is
   lowercase in git, and src/middleware.ts redirects the old capitalised /Sept13/*
   here so the UNITUS sponsorship link that was already shared keeps resolving. */

import { GCAL, isBot } from "./event";

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

/* Both artists link to Spotify from the lineup. Neither band's own domain is used:
   thefigsband.com does not resolve at all, and gentleandlowlyband.com was
   unreachable when this shipped. Share trackers (?si=) are stripped — they
   identify whoever shared the link and have no place on a public page. */
const LINKS = {
  /* Verified, not guessed: 1.5M monthly listeners, releases match (LEMONADE 2025,
     How Did We Get Here? 2026). A DIFFERENT Spotify artist is also called "The
     Figs" — a 1990s duo who became Pandora's Vox — and it outranks this one in
     search. Check the releases before ever changing this ID. */
  figsSpotify: "https://open.spotify.com/artist/0guOtxDAwFFEGGCxrbW5KF",
  // Verified: "gentle & lowly", "Your Son before me" / "peace like a river" (2026).
  gentleAndLowly: "https://open.spotify.com/artist/2rE4LSwX4hBzbu424HqILy",
};

/* Inline SVG rather than a "↗" character: iOS renders U+2197 as a blue EMOJI arrow,
   which looked broken next to the type on a phone. An SVG inherits currentColor and
   is identical everywhere. */
const SPOTIFY_ICON =
  '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 ' +
  '17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421' +
  '.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239' +
  '-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 ' +
  '12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601' +
  '.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>';

const rsvpButton = RSVP_URL
  ? `<a class="btn primary" href="${RSVP_URL}" target="_blank" rel="noopener">RSVP</a>`
  : "";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Figs — Live on HUB Lawn · Sept 13</title>
<meta name="description" content="${EVENT.artist} live on the ${EVENT.place} at Penn State. ${EVENT.date}, ${EVENT.time}. Free and open to everyone.">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:title" content="PSU Football + The Figs — Live on HUB Lawn">
<meta property="og:description" content="${EVENT.date} · ${EVENT.time} · Free and open to everyone. ${EVENT.campus}.">
<meta property="og:url" content="https://www.wmaac.org/sept13">
<meta property="og:site_name" content="Worship Music &amp; Arts Club at Penn State">
<!-- The card iMessage, WhatsApp and Slack draw when this link is pasted. Without
     an og:image they render a bare line of text, which is what this link did
     until now. Absolute URL on purpose: iMessage does not resolve relative ones.
     Built by the promo folder's build_social.py (og_sept13_1200x630.png).
     Every scraper caches by URL — change the picture and you must change the
     FILENAME too, or old previews keep showing the old image forever. -->
<meta property="og:image" content="https://www.wmaac.org/sept13-og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PSU Football and The Figs, live on HUB Lawn. Sunday, September 13, 6:30 PM.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PSU Football + The Figs — Live on HUB Lawn">
<meta name="twitter:description" content="${EVENT.date} · ${EVENT.time} · Free and open to everyone.">
<meta name="twitter:image" content="https://www.wmaac.org/sept13-og.png">
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

  /* ROTATING HEADLINE — the three posters share this page, so the hero cycles
     THE FIGS / PSU FOOTBALL / FREE PIZZA, each carrying its poster's colour,
     1.5s apiece.
     A grid stack (every span in the same cell) means the box is always as tall
     as the tallest headline, so nothing below it moves as they swap. Pure CSS:
     this route ships as a string with no client bundle, so there is no JS to
     hydrate and it still animates with scripting disabled. */
  h1.rot{display:grid}
  h1.rot>span{
    grid-area:1/1;
    opacity:0;
    animation:rot 4.5s infinite;
    /* Every headline stays on ONE line. The stack is only ever one line tall, so
       the rule and everything under it hold still through the whole cycle. */
    white-space:nowrap;
    --hg:linear-gradient(176deg,#e0b6d6 0%,#d4a3c7 48%,#bf8db2 100%);
  }
  h1.rot>span:nth-child(1){color:var(--figs)}
  h1.rot>span:nth-child(2){color:#8fa8cc;--hg:linear-gradient(176deg,#a9bedd 0%,#8fa8cc 48%,#7791b8 100%);animation-delay:1.5s;font-size:clamp(2.6rem,13vw,5rem)}
  h1.rot>span:nth-child(3){color:#e2a75c;--hg:linear-gradient(176deg,#efbe7d 0%,#e2a75c 48%,#c98d44 100%);animation-delay:3.0s}
  /* Each headline owns a third of the loop and is fully GONE before the next
     arrives. Deliberately not a cross-dissolve: two different words fading
     through each other in the same grid cell superimposes the letterforms and
     reads as garbled type, not as a transition. Fading out to nothing and back
     in leaves a ~70ms gap that scans as a beat rather than a blank. */
  @keyframes rot{
    0%{opacity:0} 6%{opacity:1} 27%{opacity:1} 32%{opacity:0} 100%{opacity:0}
  }
  /* Motion-sensitive users get the first headline, held still. */
  @media (prefers-reduced-motion:reduce){
    h1.rot>span{animation:none}
    h1.rot>span:nth-child(1){opacity:1}
  }

  /* THE FIGS is a CUTOUT: the letterforms are a window onto a pink, faintly
     grained "paper" layer sitting behind the black. Two background layers —
     SVG fractal-noise grain over a soft vertical gradient — clipped to the text.

     Behind @supports because background-clip:text with a transparent fill makes
     the word INVISIBLE where it is unsupported. The flat colour above is the
     fallback and has to survive. */
  @supports ((-webkit-background-clip:text) or (background-clip:text)){
    h1.rot>span{
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.42'/%3E%3C/svg%3E"),
        var(--hg);
      background-size:220px 220px, 100% 260%;
      background-repeat:repeat, no-repeat;
      background-position:0 0, 50% 0;
      background-blend-mode:overlay, normal;
      -webkit-background-clip:text;
      background-clip:text;
      -webkit-text-fill-color:transparent;
      color:transparent;
    }
  }
  @media (prefers-reduced-motion:reduce){
    h1{background-attachment:scroll}
  }
  /* CHALK UNDERLINE — the flat 1px hairline replaced with a hand-drawn line.
     Same trick the headline cutout already uses: feTurbulence noise, but fed to
     feDisplacementMap so it shoves the stroke around instead of tinting it. That
     gives the ragged, dusty edge chalk has. The wave is four QUADRATIC half-waves,
     not cubics: a cubic segment with one control above the line and one below
     cancels itself out and draws almost flat, which is what the first attempt did.
     A quadratic reaches half its control offset, so the controls sit at ~2x the
     amplitude actually wanted. Two passes: a
     solid stroke, plus a wider, fainter, dashed one for the dust that skips off
     the tooth of the board. Inline SVG — no canvas, no JS, no request. */
  .rule{display:block;width:min(240px,66%);height:22px;margin:clamp(.6rem,3vw,1rem) auto;overflow:visible}
  .rule .ink{stroke:#d8d8d8;opacity:.62}
  .rule .dust{stroke:#d8d8d8;opacity:.20}

  /* THE BOIL — see the script at the end of <body>. Driven by JS swapping the d
     ATTRIBUTE, exactly as /gospel does it (src/contact.ts, boilRules).

     This was written first as a CSS @keyframes animation on the d PROPERTY. That
     works in Chrome and silently does nothing in Safari, which does not implement
     d as a CSS property at all -- CSS.supports('d', 'path(...)') is false there.
     It shipped, and the line sat dead still on every iPhone, which is most of the
     traffic this page gets since it is what the poster QR codes open. Animating
     the attribute from script is the portable way and is what gospel already did. */}
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

  /* Where and cost used to be a two-up fact grid. Cut: the hero already says
     "Live on HUB Lawn", so restating it read as filler. "Free" survives here,
     where it is a useful reassurance rather than a label. */
  .note{
    margin-top:clamp(1.6rem,6vw,2.2rem);
    color:var(--dim);
    font-size:.9rem;
    font-weight:300;
    max-width:34ch;
    margin-left:auto;
    margin-right:auto;
  }

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
  /* THE NIGHT — what actually happens, in plain language. Someone arriving from a
     card or a church bulletin has no other context, so this has to answer "what
     is this?" before it asks anything of them. */
  .sec{
    margin-top:clamp(2.25rem,8vw,3rem);
    padding-top:clamp(1.4rem,5vw,1.9rem);
    border-top:1px solid var(--line);
  }
  .sec > .k{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);margin-bottom:1.1rem}
  /* Same thin rounded frame the printed flyer and email-ad PDFs put around this
     section — the whole promo family shares it now. */
  .bill{display:grid;gap:1.05rem;text-align:left;border:1px solid #3a3a3a;border-radius:16px;padding:1.3rem 1.4rem}
  .bill .row{display:grid;grid-template-columns:auto 1fr;gap:.85rem;align-items:start}
  /* The dots track the headline's colour on the same 4.5s clock, but they only
     ever CHANGE HUE — never fade out. Blinking four dots in and out alongside the
     headline would read as a glitch; a slow tint shift reads as one system. Holds
     on each colour, then a short fade timed to land with the headline swap. */
  .bill .dot{width:5px;height:5px;border-radius:50%;background:var(--figs);margin-top:.55rem;
    animation:dothue 4.5s infinite}
  @keyframes dothue{
    0%,27%   {background-color:#d4a3c7}
    33%,60%  {background-color:#8fa8cc}
    67%,94%  {background-color:#e2a75c}
    100%     {background-color:#d4a3c7}
  }
  @media (prefers-reduced-motion:reduce){
    .bill .dot{animation:none}
  }
  .bill .t{font-family:'Oswald',sans-serif;font-size:1rem;text-transform:uppercase;letter-spacing:.07em;font-weight:500}
  .bill .d{color:var(--dim);font-size:.88rem;font-weight:300;margin-top:.15rem;line-height:1.5}
  /* Small inline "Spotify" tag beside the band. Deliberately quiet — it is a way
     to go hear them, not a call to action competing with the hero. Picks up
     Spotify's own green only on hover, which is enough to identify it. */
  .bill .lst{
    display:inline-block;margin-left:.6rem;vertical-align:.05em;
    font-family:'Inter',sans-serif;font-size:.6rem;font-weight:500;
    letter-spacing:.16em;text-transform:uppercase;color:var(--faint);
    text-decoration:none;padding:.18rem .5rem;border:1px solid var(--line);
    border-radius:999px;transition:color .18s ease,border-color .18s ease;
  }
  .bill .lst .ico{width:.85em;height:.85em;vertical-align:-.12em;margin-right:.4em}
  .bill .lst:hover,.bill .lst:focus-visible{color:var(--white);border-color:var(--white)}
  /* Spotify's own green, but only on hover and only where it IS Spotify. */
  .bill .lst.sp:hover,.bill .lst.sp:focus-visible{color:#1db954;border-color:#1db954}
  /* On a phone the title plus pill wraps; keep the pill from stranding itself
     alone on a line by letting the title and pill share a flex row. */
  .bill .t{display:flex;flex-wrap:wrap;align-items:center;gap:.55rem}
  .bill .t .lst{margin-left:0}


  /* Collapsed behind the "Come early" button. Hidden via the [hidden] attribute set
     by JS on load, NOT in CSS — if scripting fails the text stays visible instead of
     becoming permanently unreachable. */
  .sec[hidden]{display:none}
  .invite{
    color:var(--dim);font-size:.92rem;font-weight:300;line-height:1.6;
    max-width:42ch;margin:0 auto;
  }
  /* The hand-off to the promo kit, under the prayer invitation it belongs with.
     Smaller and quieter than the two buttons at the top of the page: this is a
     second ask made of someone who has already said yes to the first. */
  .invite.giveout{margin-top:1.5rem;font-size:.85rem;color:var(--faint)}
  .actions.tight{margin-top:.85rem}
  .actions.tight .btn{font-size:.7rem;padding:.7rem 1.4rem}

  /* Wordmark | wing mark, the same lockup used on the printed card. Both files are
     solid black art with alpha, so invert() paints them white on the dark field. */
  .partner a{
    display:inline-flex;align-items:center;justify-content:center;gap:.85rem;
    line-height:0;opacity:.75;transition:opacity .18s ease;
  }
  .partner a:hover,.partner a:focus-visible{opacity:1}
  .partner .word{width:104px;max-width:34vw;height:auto;filter:invert(1)}
  .partner .bar{width:1px;align-self:stretch;background:#3a3a3a;margin:.15rem 0}
  .partner .mark{width:112px;max-width:36vw;height:auto;filter:invert(1)}

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
    <h1 class="rot">
      <span>${EVENT.artist}</span>
      <span>PSU Football</span>
      <span>Free pizza</span>
    </h1>
    <svg class="rule" viewBox="0 0 240 22" fill="none" aria-hidden="true" focusable="false">
      <filter id="chalk" x="-15%" y="-80%" width="130%" height="260%">
        <feTurbulence type="fractalNoise" baseFrequency="0.62 0.42" numOctaves="3" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.1" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <g filter="url(#chalk)">
        <path class="ink" d="M6 11 Q 44 2, 82 11 Q 120 20, 158 11 Q 196 2, 234 11"
              stroke-width="2.1" stroke-linecap="round"/>
        <path class="dust" d="M8 12.2 Q 45 3.4, 83 12.2 Q 121 21, 159 12.2 Q 197 3.4, 232 12.2"
              stroke-width="3.4" stroke-linecap="round" stroke-dasharray="19 8 34 6 26 12"/>
      </g>
    </svg>
    <h2>Live on ${EVENT.place}</h2>
    <p class="when"><b>${EVENT.date}</b> &nbsp;·&nbsp; <b>${EVENT.time}</b></p>

    <p class="note">Free and open to everyone. No ticket needed &mdash; bring a blanket or a chair.</p>

    <section class="sec">
      <div class="k">The night</div>
      <div class="bill">
        <div class="row"><span class="dot"></span><div>
          <div class="t">Free pizza</div>
          <div class="d">Come hungry.</div>
        </div></div>
        <div class="row"><span class="dot"></span><div>
          <div class="t">The Figs, live<a class="lst sp" href="${LINKS.figsSpotify}" target="_blank" rel="noopener">${SPOTIFY_ICON}Spotify</a></div>
          <div class="d">A folk band playing a full set on the lawn.</div>
        </div></div>
        <div class="row"><span class="dot"></span><div>
          <div class="t">Penn State football players</div>
          <div class="d">Athletes from the team sharing their own stories and what faith
            has meant to them.</div>
        </div></div>
        <div class="row"><span class="dot"></span><div>
          <div class="t">Student band closes the night<a class="lst sp" href="${LINKS.gentleAndLowly}" target="_blank" rel="noopener">${SPOTIFY_ICON}Spotify</a></div>
        </div></div>
      </div>
    </section>

    <div class="actions">
      ${rsvpButton}
      <a class="btn${RSVP_URL ? "" : " primary"}" href="/sept13/cal" target="_blank" rel="noopener">Add to Calendar</a>
      <a class="btn" href="#early" id="earlyBtn" aria-expanded="false" aria-controls="early">Come early</a>
    </div>


    <section class="sec" id="early">
      <div class="k">Come early</div>
      <p class="invite">We'll pray together at 6:15, before doors open at 6:30. If you'd like to
        help welcome people, come find us then &mdash; students, churches and campus
        ministries all welcome.</p>
      <!-- Only shown to someone who already opened "Come early", which is as close
           as this page gets to a self-selected volunteer. Everyone else is here to
           find out when to turn up, and should not be handed a job.
           A button rather than an inline link: nothing else on this page is a
           blue underlined link, and one would read as a mistake. -->
      <p class="invite giveout">Helping us get the word out?</p>
      <div class="actions tight">
        <a class="btn" href="/sept13/promo">Promo materials</a>
      </div>
    </section>

    <div class="partner">
      <div class="k">In partnership with</div>
      <a href="${UNITUS_URL}" target="_blank" rel="noopener" aria-label="UNITUS">
        <img class="word" src="/unitus_wordmark.png" alt="UNITUS" width="800" height="161">
        <span class="bar" aria-hidden="true"></span>
        <img class="mark" src="/unitus_mark.png" alt="" width="1600" height="238">
      </a>
    </div>

    <footer>
      ${EVENT.campus}<br>
      Funded by the Student Initiated Fee
    </footer>
  </main>

<script>
(function(){
  var sec = document.getElementById('early');
  var btn = document.getElementById('earlyBtn');
  /* The pink "paper" behind the THE FIGS cutout drifts as you scroll, so it reads
     as a layer sitting behind the black rather than painted onto it.

     Only background-position moves — no element is transformed, nothing reflows,
     so this cannot push the rest of the page around or stutter the layout. The
     gradient layer is oversized (260% tall) precisely so it has room to travel
     without ever running out of paint. rAF-throttled, passive listener, and
     skipped entirely for anyone who asked for reduced motion. */
  var figs = document.querySelector('h1');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (figs && !reduce) {
    var ticking = false;
    var paint = function(){
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var grain = (y * 0.10).toFixed(1);
      var paper = (y * 0.22).toFixed(1);
      figs.style.backgroundPosition = '0 ' + grain + 'px, 50% ' + paper + 'px';
      ticking = false;
    };
    window.addEventListener('scroll', function(){
      if (!ticking) { ticking = true; window.requestAnimationFrame(paint); }
    }, {passive:true});
    paint();
  }

  if (!sec || !btn) return;
  sec.hidden = true;
  btn.addEventListener('click', function(e){
    e.preventDefault();
    var opening = sec.hidden;
    sec.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    if (opening) sec.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
</script>
<script>
(function(){
  /* Nine ink frames against eight dust frames on one 160ms tick. Co-prime, so the
     two strokes only realign every 11.52s and the eye never catches a loop. */
  var I=["M6.5 10.5 Q 43.9 1.9, 81.2 11.9 Q 120.8 21.3, 158.8 12.3 Q 196.2 1.2, 233.9 10.4","M5.9 9.6 Q 43.6 3.0, 81.5 9.9 Q 120.6 18.5, 157.6 9.6 Q 196.7 1.6, 234.8 11.3","M5.3 9.9 Q 44.0 1.5, 81.8 10.7 Q 120.6 19.7, 157.5 10.7 Q 195.3 1.3, 234.1 11.2","M5.5 9.4 Q 44.8 3.4, 82.4 11.5 Q 119.3 21.6, 157.2 10.2 Q 195.2 3.6, 234.1 12.4","M6.7 10.1 Q 43.3 0.6, 82.7 11.7 Q 119.4 19.3, 158.5 10.9 Q 195.4 0.4, 234.7 12.1","M6.6 9.9 Q 43.7 3.4, 82.7 11.0 Q 119.4 21.0, 158.4 9.5 Q 195.4 2.4, 233.1 11.2","M5.3 9.7 Q 43.2 0.5, 82.5 11.0 Q 120.9 19.5, 158.4 11.8 Q 196.0 1.3, 234.7 10.0","M5.4 11.9 Q 44.3 1.3, 81.4 10.6 Q 120.7 18.5, 157.1 12.5 Q 196.7 0.7, 234.0 9.5","M6.4 12.1 Q 44.0 3.4, 81.5 11.8 Q 119.6 21.1, 158.2 10.7 Q 196.1 1.4, 233.2 11.8"];
  var D=["M8.1 12.9 Q 45.6 2.2, 82.2 11.0 Q 120.8 20.3, 159.1 13.1 Q 196.4 2.7, 231.6 12.3","M8.3 12.6 Q 45.7 4.3, 82.9 13.4 Q 120.6 20.9, 159.5 13.2 Q 197.8 2.1, 231.6 10.8","M8.8 12.3 Q 44.5 2.6, 83.1 12.4 Q 121.8 21.1, 159.8 11.2 Q 197.6 3.0, 232.3 11.5","M8.3 11.6 Q 45.6 2.3, 82.3 13.7 Q 120.7 20.0, 159.0 11.6 Q 196.4 3.1, 231.5 11.2","M8.0 10.8 Q 45.4 4.7, 82.3 13.2 Q 120.9 21.7, 158.1 13.7 Q 196.8 4.7, 232.5 11.0","M7.1 11.5 Q 45.7 4.7, 82.4 10.7 Q 120.4 22.2, 159.7 13.5 Q 197.0 3.1, 232.0 12.0","M8.9 12.0 Q 45.4 4.9, 82.2 11.6 Q 121.9 22.4, 158.1 12.3 Q 196.4 4.0, 231.7 11.1","M8.5 12.5 Q 45.8 4.3, 82.8 10.8 Q 120.3 20.0, 158.8 11.7 Q 197.4 4.7, 231.2 12.8"];
  var ink=document.querySelector(".rule .ink"), dust=document.querySelector(".rule .dust");
  if(!ink||!dust) return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var i=0;
  setInterval(function(){
    if(document.hidden) return;              /* gospel skips hidden frames too */
    i++;
    ink.setAttribute("d", I[i%I.length]);
    dust.setAttribute("d", D[i%D.length]);
  },160);
})();
</script>
</body>
</html>
`;

/* Anything that fetches a URL to build a preview card rather than to read it.
   iMessage, Slack, Discord, WhatsApp and friends all hit the link the moment it
   is pasted, so one poster texted into a group chat can look like a dozen scans
   if these are counted as people. */

export async function GET(request: Request) {
  /* Which poster did this come from? The three QR codes carry ?p=figs|psu|pizza.
     Fire-and-forget on purpose, and wrapped: this page is what every printed QR
     code opens, so a Convex hiccup or a missing env var must never be able to
     turn a scan into an error page. Worst case we lose a count. */
  let poster: string | null = null;
  try {
    /* No ?p= means the 2,500 printed business cards, whose QR was made before any
       of this existed and points at the bare URL. Recorded as "card" rather than
       dropped — otherwise the single biggest run of printed material is the one
       thing invisible in the numbers. */
    poster = new URL(request.url).searchParams.get("p") ?? "card";
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      const bot = isBot(request.headers.get("user-agent"));
      const { ConvexHttpClient } = await import("convex/browser");
      const { api } = await import("../../../convex/_generated/api");
      void new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
        .mutation(api.posterScans.log, { poster, bot })
        .catch(() => {});
    }
  } catch {
    /* never block the render */
  }

  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      /* Every request MUST reach the origin or it does not get counted. Under a
         shared cache the CDN answers most scans itself and the totals flatten to
         roughly one per source per minute — which looks like real data rather
         than like a bug. That applies to the bare URL too now that it is counted
         as a card scan, so the short s-maxage this used to carry is gone. The page
         is a static string; regenerating it per request costs nothing. */
      "Cache-Control": "no-store",
    },
  });
}
