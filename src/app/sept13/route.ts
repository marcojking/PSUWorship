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

/* thefigsband.com does not resolve (verified Aug 2026 — connection times out), so
   The Figs point at Instagram, which is live and is where they actually post. */
const LINKS = {
  figs: "https://www.instagram.com/the.figs.official/",
  /* Verified artist, not guessed: 1.5M monthly listeners, releases match
     (LEMONADE 2025, How Did We Get Here? 2026). A second Spotify artist is also
     called "The Figs" — a 1990s duo who became Pandora's Vox. Wrong band. */
  figsSpotify: "https://open.spotify.com/artist/0guOtxDAwFFEGGCxrbW5KF",
  /* Spotify rather than gentleandlowlyband.com: that domain was unreachable when
     this shipped. Verified artist — "gentle & lowly", releases "Your Son before me"
     and "peace like a river" (2026). The ?si= share tracker is stripped on purpose;
     it identifies whoever shared the link and does not belong on a public page. */
  gentleAndLowly: "https://open.spotify.com/artist/2rE4LSwX4hBzbu424HqILy",
  unitus: UNITUS_URL,
};

// Google Calendar expects UTC. Sept 13 2026 is EDT (UTC-4), so 6:30 PM ET = 22:30Z.
const GCAL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("The Figs — Live on HUB Lawn") +
  "&dates=20260913T223000Z/20260914T023000Z" +
  "&location=" + encodeURIComponent("HUB Lawn, Penn State, University Park, PA") +
  "&details=" + encodeURIComponent("Free and open to everyone. wmaac.org/sept13");

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
<meta property="og:title" content="The Figs — Live on HUB Lawn">
<meta property="og:description" content="${EVENT.date} · ${EVENT.time} · Free and open to everyone. ${EVENT.campus}.">
<meta property="og:url" content="https://www.wmaac.org/sept13">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Figs — Live on HUB Lawn">
<meta name="twitter:description" content="${EVENT.date} · ${EVENT.time} · Free and open to everyone.">
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
  .bill{display:grid;gap:1.05rem;text-align:left}
  .bill .row{display:grid;grid-template-columns:auto 1fr;gap:.85rem;align-items:start}
  .bill .dot{width:5px;height:5px;border-radius:50%;background:var(--figs);margin-top:.55rem}
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
  .bill .lst::after{content:" \\2197"}
  .bill .lst:hover,.bill .lst:focus-visible{color:var(--white);border-color:var(--white)}
  /* Spotify's own green, but only on hover and only where it IS Spotify. */
  .bill .lst.sp:hover,.bill .lst.sp:focus-visible{color:#1db954;border-color:#1db954}

  /* LINKS */
  .links{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}
  .links a{
    display:inline-block;padding:.6rem 1.1rem;border:1px solid var(--line);
    color:var(--dim);text-decoration:none;font-size:.68rem;letter-spacing:.16em;
    text-transform:uppercase;transition:border-color .18s ease,color .18s ease;
  }
  .links a:hover,.links a:focus-visible{border-color:var(--white);color:var(--white)}

  /* VOLUNTEER — collapsed behind the Volunteer button so a normal attendee never
     has to scroll past a form they don't want. Hidden via the [hidden] attribute
     set by JS on load, NOT in CSS: if scripting fails the section stays visible
     and reachable rather than becoming permanently invisible. */
  .vol[hidden]{display:none}
  .vol .rl{margin:0;font-size:.85rem;letter-spacing:0;text-transform:none;color:var(--dim)}
  .vol{
    margin-top:clamp(2.5rem,9vw,3.25rem);
    padding-top:clamp(1.5rem,6vw,2rem);
    border-top:1px solid var(--line);
    text-align:left;
  }
  .vol .k{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);text-align:center}
  .vol h3{
    font-family:'Oswald',sans-serif;font-weight:500;text-transform:uppercase;
    letter-spacing:.1em;font-size:clamp(1.05rem,4.4vw,1.35rem);
    margin:.7rem 0 .5rem;text-align:center;
  }
  .vol .blurb{color:var(--dim);font-size:.9rem;font-weight:300;text-align:center;margin-bottom:1.6rem}
  .vol label{display:block;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);margin:.9rem 0 .35rem}
  .vol input[type=text],.vol input[type=email],.vol input[type=tel],.vol textarea{
    width:100%;background:#131313;border:1px solid var(--line);border-radius:6px;
    color:var(--white);font:inherit;font-size:.95rem;padding:.7rem .8rem;
  }
  .vol textarea{resize:vertical;min-height:4.5rem}
  .vol input:focus,.vol textarea:focus{outline:none;border-color:#5a5a5a}
  .roles{display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem .9rem;margin-top:.35rem}
  .roles span{display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--dim);font-weight:300}
  .roles input{accent-color:var(--figs);width:1rem;height:1rem;flex:0 0 auto}
  .vol .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
  .vol button{
    margin-top:1.4rem;width:100%;padding:.95rem 1rem;border:1px solid var(--white);
    background:var(--white);color:var(--black);font:inherit;font-size:.72rem;
    letter-spacing:.22em;text-transform:uppercase;font-weight:600;cursor:pointer;
    border-radius:0;transition:opacity .18s ease;
  }
  .vol button:hover{opacity:.85}
  .vol button[disabled]{opacity:.5;cursor:default}
  .vol .msg{margin-top:.9rem;font-size:.85rem;text-align:center;min-height:1.2em}
  .vol .msg.err{color:#ff9b9b}
  .vol .msg.ok{color:var(--figs)}
  .vol .done{text-align:center;color:var(--white);font-size:1rem;padding:1.5rem 0}
  .vol .done b{color:var(--figs)}
  @media(max-width:420px){.roles{grid-template-columns:1fr}}

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
    <h1>${EVENT.artist}</h1>
    <div class="rule"></div>
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
          <div class="t">The Figs, live<a class="lst sp" href="${LINKS.figsSpotify}" target="_blank" rel="noopener">Spotify</a></div>
          <div class="d">A folk band playing a full set on the lawn.</div>
        </div></div>
        <div class="row"><span class="dot"></span><div>
          <div class="t">Penn State football players</div>
          <div class="d">Athletes from the team sharing their own stories and what faith
            has meant to them.</div>
        </div></div>
        <div class="row"><span class="dot"></span><div>
          <div class="t">Worship &mdash; gentle &amp; lowly<a class="lst sp" href="${LINKS.gentleAndLowly}" target="_blank" rel="noopener">Spotify</a></div>
        </div></div>
      </div>
    </section>

    <div class="actions">
      ${rsvpButton}
      <a class="btn${RSVP_URL ? "" : " primary"}" href="${GCAL}" target="_blank" rel="noopener">Add to Calendar</a>
      <a class="btn" href="#volunteer" id="volBtn" aria-expanded="false" aria-controls="volunteer">Volunteer</a>
    </div>

    <section class="sec">
      <div class="k">Who's involved</div>
      <div class="links">
        <a href="${LINKS.figs}" target="_blank" rel="noopener">The Figs</a>
        <a href="${LINKS.gentleAndLowly}" target="_blank" rel="noopener">gentle &amp; lowly</a>
        <a href="${LINKS.unitus}" target="_blank" rel="noopener">Unitus</a>
      </div>
    </section>

    <section class="vol" id="volunteer">
      <div class="k">Get involved</div>
      <h3>Volunteer with us</h3>
      <p class="blurb">This night exists so students hear about Jesus and find a church that
        will keep walking with them afterwards. We're looking for Christians who'll help
        welcome people onto the lawn, sit with them, pray with them, and share the love of
        Christ — the work is far more about the person in front of you than the task.
        Students, local churches and campus ministries all welcome.</p>

      <form id="volForm" novalidate>
        <label for="v-name">Name</label>
        <input id="v-name" name="name" type="text" autocomplete="name" required>

        <label for="v-email">Email</label>
        <input id="v-email" name="email" type="email" autocomplete="email" required>

        <label for="v-phone">Phone <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
        <input id="v-phone" name="phone" type="tel" autocomplete="tel">

        <label for="v-church">Church or ministry <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
        <input id="v-church" name="church" type="text">

        <label>Where you'd like to help</label>
        <div class="roles">
          <span><input type="checkbox" name="roles" value="hospitality" id="r1"><label for="r1" class="rl">Hospitality</label></span>
          <span><input type="checkbox" name="roles" value="media" id="r2"><label for="r2" class="rl">Media (photo / video)</label></span>
        </div>

        <!-- Only shown once media is ticked. Free text on purpose: "just my phone"
             and "Sony A7III" are both useful and mean very different things. -->
        <div id="camWrap" hidden>
          <label for="v-camera">Do you have a camera you could bring?
            <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
          <input id="v-camera" name="camera" type="text" placeholder="e.g. Sony A7 III, or just my phone">
        </div>

        <label for="v-notes">Anything else <span style="text-transform:none;letter-spacing:0">(optional)</span></label>
        <textarea id="v-notes" name="notes"></textarea>

        <!-- Honeypot: hidden from people, irresistible to bots. -->
        <div class="hp" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>

        <button type="submit">Sign me up</button>
        <p class="msg" id="volMsg" role="status" aria-live="polite"></p>
      </form>
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
  var form = document.getElementById('volForm');
  var msg  = document.getElementById('volMsg');
  var sec  = document.getElementById('volunteer');
  var btn  = document.getElementById('volBtn');
  if (!form) return;

  // Collapse from JS, not CSS, so a scripting failure leaves the form reachable.
  if (sec && btn) {
    sec.hidden = true;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var opening = sec.hidden;
      sec.hidden = !opening;
      btn.setAttribute('aria-expanded', String(opening));
      if (opening) {
        sec.scrollIntoView({behavior:'smooth', block:'start'});
        var first = document.getElementById('v-name');
        if (first) setTimeout(function(){ first.focus({preventScroll:true}); }, 350);
      }
    });
  }

  // The camera question only makes sense if they picked media.
  var media = document.getElementById('r2');
  var camWrap = document.getElementById('camWrap');
  if (media && camWrap) {
    media.addEventListener('change', function(){
      camWrap.hidden = !media.checked;
      if (!media.checked) {
        var c = document.getElementById('v-camera');
        if (c) c.value = '';
      }
    });
  }
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    var fd  = new FormData(form);
    var payload = {
      name:    (fd.get('name')    || '').toString(),
      email:   (fd.get('email')   || '').toString(),
      phone:   (fd.get('phone')   || '').toString(),
      church:  (fd.get('church')  || '').toString(),
      camera:  (fd.get('camera')  || '').toString(),
      notes:   (fd.get('notes')   || '').toString(),
      website: (fd.get('website') || '').toString(),
      roles:   fd.getAll('roles').map(String)
    };
    if (!payload.name.trim() || !payload.email.trim()) {
      msg.className = 'msg err';
      msg.textContent = 'Please add your name and email.';
      return;
    }
    btn.disabled = true;
    msg.className = 'msg';
    msg.textContent = 'Sending…';
    try {
      var res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify(payload)
      });
      var data = await res.json().catch(function(){ return {}; });
      if (res.ok && data.ok) {
        // Replace the form outright — leaving a filled-in form on screen invites
        // a double submission and reads as though nothing happened.
        form.outerHTML =
          '<p class="done">Thank you, <b>' +
          payload.name.trim().split(' ')[0].replace(/[<>&"]/g, '') +
          '</b>.<br>We\\'ll be in touch before September 13.</p>';
        return;
      }
      msg.className = 'msg err';
      msg.textContent = data.error || 'Something went wrong. Please try again.';
      btn.disabled = false;
    } catch (err) {
      msg.className = 'msg err';
      msg.textContent = 'Network problem — please try again.';
      btn.disabled = false;
    }
  });
})();
</script>
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
