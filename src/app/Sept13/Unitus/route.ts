const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WMA × UNITUS Sponsorship Proposal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#F7F3EC;
    --paper:#FDFBF7;
    --ink:#211C18;
    --muted:#6E665D;
    --line:#E3DACD;
    --accent:#B65B3C;
    --accent-soft:#EBD9CF;
    --sage:#5C6E5A;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{
    font-family:'Inter',system-ui,sans-serif;
    background:var(--cream);
    color:var(--ink);
    -webkit-font-smoothing:antialiased;
    line-height:1.55;
  }
  .serif{font-family:'Fraunces',Georgia,serif;}
  section{
    min-height:100vh;
    padding:9vh 8vw;
    display:flex;
    flex-direction:column;
    justify-content:center;
    border-bottom:1px solid var(--line);
    position:relative;
  }
  .eyebrow{
    font-size:.72rem;
    letter-spacing:.32em;
    text-transform:uppercase;
    color:var(--accent);
    font-weight:600;
    margin-bottom:1.4rem;
  }
  h1{font-family:'Fraunces',serif;font-weight:500;font-size:clamp(2.6rem,6vw,5rem);line-height:1.02;letter-spacing:-.01em;}
  h2{font-family:'Fraunces',serif;font-weight:500;font-size:clamp(2rem,4.2vw,3.2rem);line-height:1.05;letter-spacing:-.01em;margin-bottom:.4rem;}
  h3{font-family:'Fraunces',serif;font-weight:500;font-size:1.5rem;margin-bottom:.5rem;}
  p.lead{font-size:clamp(1.05rem,1.6vw,1.35rem);color:var(--muted);max-width:48ch;font-weight:300;}
  .max{max-width:1040px;width:100%;margin:0 auto;}

  /* COVER */
  .cover{background:var(--paper);}
  .cover .max{max-width:900px;}
  .logos{display:flex;align-items:center;gap:1.2rem;font-size:1rem;letter-spacing:.12em;text-transform:uppercase;font-weight:500;margin-bottom:3.5rem;color:var(--ink);}
  .logos .x{color:var(--accent);font-family:'Fraunces',serif;font-size:1.3rem;}
  .cover h1{margin:.6rem 0 1.8rem;}
  .cover .meta{display:flex;gap:2.5rem;flex-wrap:wrap;margin-top:2.6rem;padding-top:2rem;border-top:1px solid var(--line);}
  .cover .meta div span{display:block;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:.3rem;}
  .cover .meta div b{font-weight:500;font-size:1.05rem;}

  /* EVENT DETAILS */
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1.5rem;margin-top:3rem;}
  .card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:1.6rem 1.7rem;}
  .card .k{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:.6rem;}
  .card .v{font-family:'Fraunces',serif;font-size:1.45rem;font-weight:500;line-height:1.15;}
  .card .sub{color:var(--muted);font-size:.92rem;margin-top:.4rem;}
  .goal{margin-top:2.2rem;padding-left:1.4rem;border-left:3px solid var(--accent);max-width:60ch;}
  .goal .k{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:.5rem;}
  .goal p{font-family:'Fraunces',serif;font-size:clamp(1.1rem,1.8vw,1.4rem);font-weight:400;line-height:1.35;}

  /* BUDGET */
  .budget{background:var(--ink);color:var(--paper);border-bottom:none;}
  .budget .eyebrow{color:var(--accent-soft);}
  .budget h2{color:var(--paper);}
  .bnums{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:3rem;border:1px solid rgba(255,255,255,.14);border-radius:16px;overflow:hidden;}
  .bnum{padding:2.4rem 2rem;border-right:1px solid rgba(255,255,255,.14);}
  .bnum:last-child{border-right:none;}
  .bnum.hl{background:var(--accent);}
  .bnum .lab{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;opacity:.7;margin-bottom:1rem;font-weight:500;}
  .bnum.hl .lab{opacity:.95;}
  .bnum .amt{font-family:'Fraunces',serif;font-size:clamp(1.9rem,3.6vw,2.9rem);font-weight:500;line-height:1;}
  .bnum .pct{font-size:.9rem;opacity:.65;margin-top:.7rem;}
  .leverage{margin-top:2.6rem;font-family:'Fraunces',serif;font-size:clamp(1.15rem,2vw,1.55rem);font-weight:400;line-height:1.4;color:var(--accent-soft);max-width:62ch;}
  .leverage b{color:var(--paper);font-weight:600;}

  /* GAP BREAKDOWN */
  .split{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;margin-top:3rem;align-items:start;}
  .barrow{display:flex;justify-content:space-between;align-items:baseline;padding:1.1rem 0;border-bottom:1px solid var(--line);}
  .barrow:first-child{border-top:1px solid var(--line);}
  .barrow .n{font-weight:500;}
  .barrow .n small{display:block;color:var(--muted);font-weight:400;font-size:.85rem;margin-top:.15rem;}
  .barrow .amt{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:500;white-space:nowrap;padding-left:1.5rem;}
  .barrow.total{border-bottom:2px solid var(--ink);}
  .barrow.total .amt{color:var(--accent);}

  /* BENEFITS */
  .benefits{background:var(--paper);}
  .blist{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.6rem 2.4rem;margin-top:2.6rem;}
  .benefit{display:flex;gap:1.1rem;align-items:flex-start;}
  .benefit .num{font-family:'Fraunces',serif;color:var(--accent);font-size:1.1rem;font-weight:600;min-width:1.6rem;padding-top:.15rem;}
  .benefit h3{font-size:1.18rem;margin-bottom:.25rem;}
  .benefit p{color:var(--muted);font-size:.96rem;font-weight:300;}

  /* MERCH */
  .merch{background:var(--accent-soft);}
  .merch .max{max-width:780px;}
  .merch .pill{display:inline-block;background:var(--accent);color:var(--paper);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;padding:.45rem .9rem;border-radius:100px;font-weight:600;margin-bottom:1.6rem;}

  /* CLOSE */
  .close{background:var(--ink);color:var(--paper);border-bottom:none;}
  .close h2{color:var(--paper);max-width:20ch;}
  .close p.lead{color:#C9C1B7;}
  .contact{margin-top:3rem;display:flex;gap:3rem;flex-wrap:wrap;padding-top:2rem;border-top:1px solid rgba(255,255,255,.14);}
  .contact div span{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;opacity:.6;margin-bottom:.35rem;}
  .contact div b{font-weight:500;font-size:1.05rem;}

  .note{font-size:.8rem;color:var(--muted);margin-top:1.4rem;font-style:italic;}

  @media(max-width:760px){
    .bnums{grid-template-columns:1fr;}
    .bnum{border-right:none;border-bottom:1px solid rgba(255,255,255,.14);}
    .split{grid-template-columns:1fr;}
  }
  @media print{
    section{min-height:auto;page-break-after:always;padding:5vh 6vw;}
    body{background:#fff;}
  }
</style>
</head>
<body>

<!-- COVER -->
<section class="cover">
  <div class="max">
    <div class="logos"><span>WM&amp;A</span><span class="x">×</span><span>UNITUS</span></div>
    <div class="eyebrow">Sponsorship Proposal</div>
    <h1 class="serif">HUB Lawn<br>Worship Night</h1>
    <p class="lead">An outdoor live-music night on Penn State's campus, and an invitation for UNITUS to be part of it.</p>
    <div class="meta">
      <div><span>Date</span><b>September 13, 2026</b></div>
      <div><span>Location</span><b>HUB Lawn · Penn State, University Park</b></div>
      <div><span>Headliner</span><b>Pat Barrett</b></div>
      <div><span>Host</span><b>Worship Music &amp; Arts Club</b></div>
    </div>
  </div>
</section>

<!-- EVENT DETAILS -->
<section>
  <div class="max">
    <div class="eyebrow">The Event</div>
    <h2 class="serif">The night, in detail.</h2>
    <p class="lead">A free, open-air worship and music event on the HUB Lawn, the main lawn of Penn State campus, built around a nationally touring headliner and full festival-grade production.</p>
    <div class="goal">
      <div class="k">The Goal</div>
      <p>To connect interested students with local churches and campus ministries, and to unite students who are already believers.</p>
    </div>
    <div class="grid">
      <div class="card"><div class="k">Expected Attendance</div><div class="v">700 to 1,000</div><div class="sub">Penn State students, on the central campus lawn</div></div>
      <div class="card"><div class="k">Headline Artist</div><div class="v">Pat Barrett</div><div class="sub">Nationally touring worship artist</div></div>
      <div class="card"><div class="k">Production</div><div class="v">Festival-grade</div><div class="sub">JBL line-array PA, hydraulic stage, 20ft projection screen, festoon lighting</div></div>
      <div class="card"><div class="k">Format</div><div class="v">Free &amp; outdoor</div><div class="sub">No ticket barrier, maximum walk-up reach</div></div>
    </div>
  </div>
</section>

<!-- BUDGET -->
<section class="budget">
  <div class="max">
    <div class="eyebrow">The Numbers</div>
    <h2 class="serif">A $41,790 event, already 90% funded.</h2>
    <div class="bnums">
      <div class="bnum">
        <div class="lab">Total Event Budget</div>
        <div class="amt">$41,790.77</div>
        <div class="pct">Full cost of the night</div>
      </div>
      <div class="bnum">
        <div class="lab">Penn State Covers</div>
        <div class="amt">$37,606.86</div>
        <div class="pct">About 90%, via the Student Initiated Fee (UPAC)</div>
      </div>
      <div class="bnum hl">
        <div class="lab">Left to Fundraise</div>
        <div class="amt">$4,183.91</div>
        <div class="pct">About 10%</div>
      </div>
    </div>
    <p class="leverage">Penn State covers up to 90% of the event through its student activity fee. That leaves <b>$4,183.91</b> for us to raise, and it goes toward the two things university funding cannot cover.</p>
  </div>
</section>

<!-- GAP BREAKDOWN -->
<section>
  <div class="max">
    <div class="eyebrow">Where Your Support Goes</div>
    <h2 class="serif">The pieces Penn State can't fund.</h2>
    <div class="split">
      <div>
        <p class="lead">University funding can't cover food beyond a small cap, or any merchandise. That is the entire $4,183.91 we are raising, and exactly where a sponsor comes in.</p>
      </div>
      <div>
        <div class="barrow"><div class="n">Food for attendees<small>Pizza or pancakes for the crowd. University caps its support at $1,000.</small></div><div class="amt">$2,124.81</div></div>
        <div class="barrow"><div class="n">Merch &amp; staff apparel<small>Event shirts and staff hats</small></div><div class="amt">$2,059.10</div></div>
        <div class="barrow total"><div class="n">Total to fundraise</div><div class="amt">$4,183.91</div></div>
      </div>
    </div>
  </div>
</section>

<!-- BENEFITS -->
<section class="benefits">
  <div class="max">
    <div class="eyebrow">What UNITUS Gets</div>
    <h2 class="serif">What's in it for UNITUS.</h2>
    <div class="blist">
      <div class="benefit"><div class="num">01</div><div><h3>700 to 1,000 students, in person</h3><p>Direct, in-person exposure to your product with one of the most concentrated student audiences on campus all semester.</p></div></div>
      <div class="benefit"><div class="num">02</div><div><h3>Your own tent and table</h3><p>A dedicated 10×10 tent with a table and sides for sampling, product display, sign-ups, and face-to-face presence all night.</p></div></div>
      <div class="benefit"><div class="num">03</div><div><h3>Content creators on-site</h3><p>Student content creators will be filming and promoting the event, so your brand reaches well beyond the lawn across their channels.</p></div></div>
      <div class="benefit"><div class="num">04</div><div><h3>Penn State athletes present</h3><p>PSU athletes will be in attendance, an open door if UNITUS is interested in NIL or college-athlete partnerships.</p></div></div>
      <div class="benefit"><div class="num">05</div><div><h3>Logo on signage and screen</h3><p>Your logo on event signage and the 20ft stage screen, plus shout-outs from the stage during the night.</p></div></div>
      <div class="benefit"><div class="num">06</div><div><h3>Custom UNITUS merch</h3><p>An optional co-designed UNITUS piece for the event (see next page).</p></div></div>
    </div>
  </div>
</section>

<!-- MERCH COLLAB -->
<section class="merch">
  <div class="max">
    <span class="pill">Collaborative Merch</span>
    <h2 class="serif">Custom UNITUS merch for the event.</h2>
    <p class="lead" style="color:var(--muted);max-width:56ch;">If it's useful for the brand, we could produce custom UNITUS clothing for the night, design it together, put it on students, and split the profits from any we sell. The focus stays on UNITUS, not on our club.</p>
    <p class="note">Fully optional. We're already running our own event apparel either way, so this is purely a bonus if you want it.</p>
  </div>
</section>

<!-- CLOSE -->
<section class="close">
  <div class="max">
    <div class="eyebrow" style="color:var(--accent-soft);">In Short</div>
    <h2 class="serif">We'd love to have UNITUS involved.</h2>
    <p class="lead">$4,183.91 left to raise, a thousand students on the lawn, and plenty of ways to make it a fit for you. Happy to shape the details together.</p>
    <div class="contact">
      <div><span>Host Organization</span><b>Worship Music &amp; Arts Club at Penn State</b></div>
      <div><span>Event</span><b>HUB Lawn Worship Night · Sept 13, 2026</b></div>
      <div><span>Contact</span><b>marcojking@gmail.com</b></div>
    </div>
  </div>
</section>

</body>
</html>
`;

export async function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
