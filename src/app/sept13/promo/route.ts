/* wmaac.org/sept13/promo — the download page for anyone helping promote the Sept 13
   HUB Lawn worship night. Not for attendees: /sept13 is their page, and it asks
   one thing of them. This one is a working list for the people posting flyers,
   texting friends and running a church's projector.

   A route handler for the same reason /sept13 is one — it renders full-bleed
   with no site chrome, ships as a string with no client bundle, and keeps the
   same visual language as the page and the printed card it all points at.

   The files themselves live in public/promo/ and are put there by
   scripts/stage-promo.py, which also writes manifest.ts. Nothing on this page
   names a file that the script did not copy, and nothing prints a byte count
   that it did not measure. */

import { ANIM, BYTES, THUMBS } from "./manifest";

const EVENT = {
  date: "Sunday, September 13",
  time: "6:30 PM",
  campus: "Penn State, University Park",
};

const LINK = "https://www.wmaac.org/sept13";

/* Every tracked value below is one the live recorder already accepts. It
   silently drops anything it does not know, so a value invented here would
   look like it worked and count nothing. The list is figs, psu, pizza, card,
   ig, igstory, tiktok, yt, fb, email, groupme, whatsapp, text, other.

   ref1/ref2/ref3 are also live and are deliberately absent: they are private
   codes belonging to three individuals, and this page is meant to be forwarded
   around. If they appeared here their counts would stop meaning anything. */
const tracked = (source: string) => `${LINK}?p=${source}`;

const kb = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

type Download = { file: string; kind: string };

type Asset = {
  /* Key into THUMBS and the filename in public/promo/t/. */
  thumb: string;
  title: string;
  note?: string;
  downloads: Download[];
  /* The exact URL to paste wherever this asset goes. Omitted where the artwork
     already carries a QR code and there is nothing for a person to paste. */
  link?: { url: string; label: string };
};

/* One row per asset: the picture on the left, what it is and where it goes on
   the right. Deliberately rows rather than a grid of cards — half of what makes
   an asset the right one is a sentence ("print, one cut down the middle"), and
   a card two-up on a phone has nowhere to put a sentence. */
function row(a: Asset): string {
  const [w, h] = THUMBS[a.thumb];
  const first = a.downloads[0].file;
  const dls = a.downloads
    .map(
      (d) =>
        `<a class="dl" href="/promo/${d.file}" download>${d.kind}<span class="sz">${kb(
          BYTES[d.file],
        )}</span></a>`,
    )
    .join("");
  /* The thumbnail links to the real file WITHOUT a download attribute, while
     the buttons below have one. That difference is the whole mobile story: on a
     phone the way you get a picture into your camera roll is to open it and
     press and hold, and a download attribute sends it to Files instead, where
     it is no use to anyone trying to text it. */
  const linkRow = a.link
    ? `<div class="lk">
         <code>${a.link.url}</code>
         <button class="cp" type="button" data-copy="${a.link.url}" aria-label="Copy the ${a.link.label} link">Copy</button>
       </div>
       <div class="lkw">${a.link.label}</div>`
    : "";
  return `<div class="row">
    <a class="thumb" href="/promo/${first}">
      <img src="/promo/t/${a.thumb}.${ANIM.includes(a.thumb) ? "webp" : "jpg"}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${a.title}">
    </a>
    <div class="meta">
      <div class="t">${a.title}</div>
      ${a.note ? `<div class="d">${a.note}</div>` : ""}
      <div class="dls">${dls}</div>
      ${linkRow}
    </div>
  </div>`;
}

const group = (title: string, blurb: string, assets: Asset[]) =>
  `<h3>${title}</h3>${blurb ? `<p class="gb">${blurb}</p>` : ""}<div class="rows">${assets
    .map(row)
    .join("")}</div>`;

const section = (id: string, kicker: string, lead: string, body: string) =>
  `<section class="sec" id="${id}">
     <div class="k">${kicker}</div>
     <p class="lead">${lead}</p>
     ${body}
   </section>`;

/* PRINT — three hooks, three formats. The hooks are explained once here rather
   than nine times below, because the choice is made once. */
const PRINT = section(
  "print",
  "Print",
  `Three different flyers. Put them next to each other, or target specific places.`,
  group(
    "Full page &middot; 8.5&times;11",
    "For a board you are allowed to own. Reads from down the hallway.",
    [
      {
        thumb: "flyer_figs",
        title: "The Figs",
        note: "The default flyer. Leads with the band.",
        downloads: [
          { file: "TheFigs_HUBLawn_Flyer_8.5x11.pdf", kind: "PDF" },
          { file: "TheFigs_HUBLawn_Flyer_8.5x11.png", kind: "PNG" },
        ],
      },
      {
        thumb: "flyer_psu",
        title: "PSU Football",
        note: "For athletic buildings, the IM, gyms.",
        downloads: [
          { file: "PSUFootball_HUBLawn_Flyer_8.5x11.pdf", kind: "PDF" },
          { file: "PSUFootball_HUBLawn_Flyer_8.5x11.png", kind: "PNG" },
        ],
      },
      {
        thumb: "flyer_pizza",
        title: "Free Pizza",
        note: "Broadest hook. Dining halls, dorm boards.",
        downloads: [
          { file: "FreePizza_HUBLawn_Flyer_8.5x11.pdf", kind: "PDF" },
          { file: "FreePizza_HUBLawn_Flyer_8.5x11.png", kind: "PNG" },
        ],
      },
    ],
  ) +
    group(
      "Half page &middot; 5.5&times;8.5",
      `For crowded boards, or handing to a person. Printing them yourself? See below.`,
      [
        {
          thumb: "half_figs",
          title: "The Figs",
          downloads: [
            { file: "TheFigs_HUBLawn_HalfPage_5.5x8.5.pdf", kind: "PDF" },
            { file: "TheFigs_HUBLawn_HalfPage_5.5x8.5.png", kind: "PNG" },
          ],
        },
        {
          thumb: "half_psu",
          title: "PSU Football",
          downloads: [
            { file: "PSUFootball_HUBLawn_HalfPage_5.5x8.5.pdf", kind: "PDF" },
            { file: "PSUFootball_HUBLawn_HalfPage_5.5x8.5.png", kind: "PNG" },
          ],
        },
        {
          thumb: "half_pizza",
          title: "Free Pizza",
          downloads: [
            { file: "FreePizza_HUBLawn_HalfPage_5.5x8.5.pdf", kind: "PDF" },
            { file: "FreePizza_HUBLawn_HalfPage_5.5x8.5.png", kind: "PNG" },
          ],
        },
      ],
    ) +
    group(
      "Two-up letter sheet &middot; print then cut",
      `Two half pages on one letter sheet. Print, then <b>one cut down the middle at
       5.5&nbsp;in</b>.`,
      [
        {
          thumb: "2up_figs",
          title: "The Figs",
          downloads: [{ file: "TheFigs_HUBLawn_HalfPage_2up_Letter.pdf", kind: "PDF" }],
        },
        {
          thumb: "2up_psu",
          title: "PSU Football",
          downloads: [{ file: "PSUFootball_HUBLawn_HalfPage_2up_Letter.pdf", kind: "PDF" }],
        },
        {
          thumb: "2up_pizza",
          title: "Free Pizza",
          downloads: [{ file: "FreePizza_HUBLawn_HalfPage_2up_Letter.pdf", kind: "PDF" }],
        },
      ],
    ) +
    group(
      "Printing it yourself? Take these instead",
      `Everything above bleeds black to the edge, which an office printer can't always do
       well &mdash; it can leave a ragged white edge. These put the black on a white sheet
       on purpose, so the border is even. Going to a print shop? Use the ones above.
       Two-up is still one cut down the middle at 5.5&nbsp;in.`,
      [
        {
          thumb: "full_office_figs",
          title: "Full page &middot; The Figs",
          downloads: [{ file: "TheFigs_HUBLawn_Flyer_8.5x11_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "full_office_psu",
          title: "Full page &middot; PSU Football",
          downloads: [{ file: "PSUFootball_HUBLawn_Flyer_8.5x11_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "full_office_pizza",
          title: "Full page &middot; Free Pizza",
          downloads: [{ file: "FreePizza_HUBLawn_Flyer_8.5x11_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "half_office_figs",
          title: "Half page &middot; The Figs",
          downloads: [{ file: "TheFigs_HUBLawn_HalfPage_5.5x8.5_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "half_office_psu",
          title: "Half page &middot; PSU Football",
          downloads: [{ file: "PSUFootball_HUBLawn_HalfPage_5.5x8.5_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "half_office_pizza",
          title: "Half page &middot; Free Pizza",
          downloads: [{ file: "FreePizza_HUBLawn_HalfPage_5.5x8.5_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "2up_office_figs",
          title: "Two-up &middot; The Figs",
          downloads: [{ file: "TheFigs_HUBLawn_HalfPage_2up_Letter_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "2up_office_psu",
          title: "Two-up &middot; PSU Football",
          downloads: [{ file: "PSUFootball_HUBLawn_HalfPage_2up_Letter_OfficePrinter.pdf", kind: "PDF" }],
        },
        {
          thumb: "2up_office_pizza",
          title: "Two-up &middot; Free Pizza",
          downloads: [{ file: "FreePizza_HUBLawn_HalfPage_2up_Letter_OfficePrinter.pdf", kind: "PDF" }],
        },
      ],
    ) +
    `<p class="warn"><b>PDF is the one to print.</b> PNG is for dropping into a slide,
     a post or a message.</p>`,
);

/* PHONE — the section most people arriving from a text message will stop at. */
const PHONE = section(
  "phone",
  "Share on your phone",
  `Tap a thumbnail, press and hold to save it, then send it and <b>paste the link
   underneath</b>.`,
  group("", "", [
    {
      thumb: "s_textduo",
      title: "Text image &middot; The Figs",
      note: "The one to send if you are only sending one.",
      downloads: [{ file: "text_duo_1080x1350.png", kind: "PNG" }],
      link: { url: tracked("text"), label: "Paste under the image" },
    },
    {
      thumb: "s_textduopsu",
      title: "Text image &middot; PSU Football",
      note: "Same lockup with the football line leading. For football-side group chats.",
      downloads: [{ file: "text_duo_psu_1080x1350.png", kind: "PNG" }],
      link: { url: tracked("text"), label: "Paste under the image" },
    },
    {
      thumb: "s_text",
      title: "iMessage &middot; animated square",
      note: "The headline cycles. GIF plays inline in Messages; PNG if you would rather it held still.",
      downloads: [
        { file: "text_1080.gif", kind: "GIF" },
        { file: "text_1080.png", kind: "PNG" },
      ],
      link: { url: tracked("text"), label: "Paste under the image" },
    },
    {
      thumb: "s_whatsapp",
      title: "WhatsApp",
      note: "Send the MP4. WhatsApp converts GIFs to video anyway, and does it worse.",
      downloads: [
        { file: "whatsapp_1080.mp4", kind: "MP4" },
        { file: "whatsapp_1080.gif", kind: "GIF" },
        { file: "whatsapp_1080.png", kind: "PNG" },
      ],
      link: { url: tracked("whatsapp"), label: "Paste under the image" },
    },
    {
      thumb: "s_groupme",
      title: "GroupMe",
      note: "GIFs play inline in GroupMe.",
      downloads: [
        { file: "groupme_1080.gif", kind: "GIF" },
        { file: "groupme_1080.png", kind: "PNG" },
      ],
      link: { url: tracked("groupme"), label: "Paste under the image" },
    },
  ]),
);

/* CHURCHES — a different job from social. Someone here is handing a file to an
   AV volunteer or a bulletin editor, usually days ahead, and needs to know
   which format the booth will actually take. */
const CHURCH = section(
  "churches",
  "For churches &amp; campus ministries",
  `Students are far more likely to come if their own church tells them to. If you can get
   this in front of a congregation, this is what to hand the AV desk and the office.`,
  group("", "", [
    {
      thumb: "s_signage",
      title: "Projector slide &middot; 16:9",
      note: `For a pre-service loop. PNG for any system; MP4 if the booth takes video.
             The QR is already on it.`,
      downloads: [
        { file: "hub_signage_1920x1080.png", kind: "PNG" },
        { file: "hub_signage_1920x1080.mp4", kind: "MP4" },
      ],
    },
    {
      thumb: "s_textduo",
      title: "Textable image",
      note: "For a ministry group chat, a small group thread, or a leader forwarding it on.",
      downloads: [{ file: "text_duo_1080x1350.png", kind: "PNG" }],
      link: { url: tracked("text"), label: "Paste under the image" },
    },
    {
      thumb: "emailad",
      title: "Newsletter / bulletin ad",
      note: `Tappable buttons instead of a QR &mdash; it is read on a device. PDF to attach,
             PNG for a bulletin layout.`,
      downloads: [
        { file: "TheFigs_Sept13_Email_Ad.pdf", kind: "PDF" },
        { file: "TheFigs_Sept13_Email_Ad.png", kind: "PNG" },
      ],
      link: { url: tracked("email"), label: "Link the image to" },
    },
  ]) +
    `<p class="gb">For a welcome desk or foyer table, the
     <a href="#print">half-page flyers</a> are sized for it.</p>`,
);

/* SOCIAL — one asset per posting place, because the crop and the call to action
   are different on every one and a "just resize it" instruction gets ignored. */
const SOCIAL = section(
  "social",
  "Social",
  `One file per place, already the right shape. Each platform has its own link.`,
  group("Instagram", "", [
    {
      thumb: "s_igfeed",
      title: "Feed post &middot; 4:5 video",
      note: "Also works as slide 1 of a carousel.",
      downloads: [
        { file: "instagram_feed_1080x1350.mp4", kind: "MP4" },
        { file: "instagram_feed_1080x1350.png", kind: "PNG" },
      ],
      link: { url: tracked("ig"), label: "Put in the bio" },
    },
    {
      thumb: "s_igcarousel2",
      title: "Carousel slide 2",
      note: "The run of show &mdash; pizza, the band, the football players, the student band.",
      downloads: [{ file: "instagram_carousel_2_1080x1350.png", kind: "PNG" }],
      link: { url: tracked("ig"), label: "Put in the bio" },
    },
    {
      thumb: "s_igstory",
      title: "Story",
      note: `The artwork says &ldquo;tap the link&rdquo;, so it needs a link sticker to tap.
             Add one with the URL below.`,
      downloads: [
        { file: "instagram_story_1080x1920.mp4", kind: "MP4" },
        { file: "instagram_story_1080x1920.png", kind: "PNG" },
      ],
      link: { url: tracked("igstory"), label: "Link sticker URL" },
    },
    {
      thumb: "s_igreel",
      title: "Reel",
      note: "Shares the feed's bio link.",
      downloads: [{ file: "instagram_reel_1080x1920.mp4", kind: "MP4" }],
      link: { url: tracked("ig"), label: "Put in the bio" },
    },
  ]) +
    group("TikTok", "", [
      {
        thumb: "s_tiktok",
        title: "TikTok",
        downloads: [{ file: "tiktok_1080x1920.mp4", kind: "MP4" }],
        link: { url: tracked("tiktok"), label: "Put in the bio" },
      },
    ]) +
    group("YouTube", "", [
      {
        thumb: "s_yt",
        title: "Shorts",
        downloads: [{ file: "youtube_short_1080x1920.mp4", kind: "MP4" }],
        link: { url: tracked("yt"), label: "Put in the description" },
      },
    ]) +
    group("Facebook", "", [
      {
        thumb: "s_facebook",
        title: "Facebook post",
        note: "No GIF here: Facebook posts an uploaded GIF as a still image.",
        downloads: [
          { file: "facebook_1200x630.mp4", kind: "MP4" },
          { file: "facebook_1200x630.png", kind: "PNG" },
        ],
        link: { url: tracked("fb"), label: "Put in the post text" },
      },
    ]) +
    group("Email", "", [
      {
        thumb: "s_email",
        title: "Email banner",
        note: `Frame 1 of the GIF is the finished design on purpose, because Outlook on Windows
               shows only the first frame. Use the PNG if you would rather not find out.`,
        downloads: [
          { file: "email_1200x630.gif", kind: "GIF" },
          { file: "email_1200x630.png", kind: "PNG" },
        ],
        link: { url: tracked("email"), label: "Link the image to" },
      },
    ]),
);

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Promo kit — HUB Lawn, Sept 13</title>
<meta name="description" content="Flyers, social posts and church slides for the Sept 13 HUB Lawn worship night. Free to use.">
<!-- Unlisted, the same way /sept13/stats is. Nothing here is secret, but this page
     should never outrank the event page itself for someone searching for the night. -->
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#0a0a0a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --black:#0a0a0a;
    --white:#fff;
    --dim:#919191;
    --faint:#6a6a6a;
    /* A shade lighter than the rule on /sept13. That page has four rules on it;
       this one is a long list and needs its dividers to survive being skimmed. */
    --line:#3a3a3a;
    --figs:#d4a3c7;
  }
  html{-webkit-text-size-adjust:100%}
  body{
    background:var(--black);
    color:var(--white);
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    -webkit-font-smoothing:antialiased;
    padding:clamp(2rem,7vw,3.5rem) 1.15rem clamp(3rem,10vw,5rem);
    line-height:1.5;
  }
  /* Nothing may exceed the viewport. Most of this page is a list of rows with a
     fixed picture column, which is safe, but the tracked URLs are long single
     tokens and would push the page sideways on a phone if left alone. */
  .wrap{width:100%;max-width:640px;margin:0 auto}

  h1{
    font-family:'Oswald',Impact,sans-serif;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.02em;
    font-size:clamp(2.6rem,13vw,4rem);
    line-height:.94;
    color:var(--figs);
    text-align:center;
  }
  /* The same chalk rule /sept13 draws under its headline, so someone who came
     from that page recognises where they are. Held still here: that page animates
     it because it is the one thing on screen, and this page is a list to work
     down, not a hero to look at. */
  .rule{display:block;width:min(200px,55%);height:22px;margin:clamp(.4rem,2vw,.7rem) auto;overflow:visible}
  .rule .ink{stroke:#d8d8d8;opacity:.62}
  .rule .dust{stroke:#d8d8d8;opacity:.20}

  h2{
    font-family:'Oswald',sans-serif;font-weight:400;text-transform:uppercase;
    letter-spacing:.14em;font-size:clamp(.8rem,3.4vw,.95rem);
    text-align:center;line-height:1.4;
  }
  .when{
    text-align:center;color:var(--dim);font-weight:300;letter-spacing:.05em;
    font-size:.88rem;margin-top:.45rem;
  }
  .intro{
    color:var(--dim);font-weight:300;font-size:.95rem;line-height:1.65;
    margin:clamp(1.6rem,6vw,2.2rem) auto 0;max-width:46ch;text-align:center;
  }
  .intro b{color:var(--white);font-weight:500}

  /* THE LINK — pulled out of the flow at the top because it is the one thing on
     this page that is wrong if you get it slightly wrong. */
  .hero-link{
    margin-top:clamp(1.5rem,5vw,2rem);
    border:1px solid var(--line);border-radius:14px;
    padding:1.1rem 1.15rem;text-align:center;
  }
  .hero-link .k{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);margin-bottom:.7rem}
  .hero-link .u{
    font-family:'Oswald',sans-serif;font-size:clamp(1.05rem,5vw,1.4rem);
    letter-spacing:.03em;overflow-wrap:anywhere;
  }

  .sec{margin-top:clamp(2.6rem,9vw,3.6rem);padding-top:clamp(1.5rem,5vw,2rem);border-top:1px solid var(--line)}
  .sec > .k{
    font-family:'Oswald',sans-serif;font-size:.72rem;letter-spacing:.2em;
    text-transform:uppercase;color:var(--white);margin-bottom:.8rem;
  }
  .lead,.gb{color:var(--dim);font-size:.9rem;font-weight:300;line-height:1.65}
  .lead b,.gb b{color:var(--white);font-weight:500}
  .lead{max-width:52ch}
  .gb{margin:.35rem 0 1rem;max-width:52ch;font-size:.85rem}
  .gb a{color:var(--dim);text-decoration:underline;text-underline-offset:2px}
  .gb a:hover,.gb a:focus-visible{color:var(--white)}
  h3{
    font-family:'Oswald',sans-serif;font-weight:500;text-transform:uppercase;
    letter-spacing:.12em;font-size:.72rem;color:var(--dim);
    margin:1.9rem 0 .55rem;
  }
  /* An h3 immediately after the section lead has no group blurb to separate it
     from the rows, so it does not need the extra air the later ones do. */
  .sec > .lead + .rows{margin-top:1.2rem}

  .rows{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .row{
    background:var(--black);padding:.85rem .85rem;
    display:grid;grid-template-columns:clamp(84px,24vw,116px) 1fr;gap:.95rem;align-items:start;
  }
  /* Every thumbnail sits in an identically shaped box and letterboxes inside it,
     whatever its own aspect ratio. Left to size themselves, a 1080x1920 story
     preview would stand three times taller than a 1200x630 banner and the list
     would read as a series of unrelated blocks rather than one list. */
  .thumb{
    display:block;aspect-ratio:4/5;background:#151515;border-radius:6px;
    overflow:hidden;line-height:0;
  }
  .thumb img{width:100%;height:100%;object-fit:contain;display:block}
  .thumb:hover img,.thumb:focus-visible img{opacity:.82;transition:opacity .18s ease}
  .meta{min-width:0}
  .t{font-family:'Oswald',sans-serif;font-size:.95rem;text-transform:uppercase;letter-spacing:.06em;font-weight:500;line-height:1.25}
  .d{color:var(--dim);font-size:.82rem;font-weight:300;margin-top:.3rem;line-height:1.55}
  .d b{color:var(--white);font-weight:500}

  .dls{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem}
  .dl{
    display:inline-flex;align-items:baseline;gap:.45rem;
    border:1px solid var(--line);border-radius:999px;padding:.32rem .7rem;
    color:var(--dim);text-decoration:none;
    font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;
    transition:color .18s ease,border-color .18s ease;
  }
  .dl:hover,.dl:focus-visible{color:var(--white);border-color:var(--white)}
  .dl .sz{letter-spacing:.04em;color:var(--faint);font-weight:400}
  .dl:hover .sz,.dl:focus-visible .sz{color:var(--dim)}

  .lk{display:flex;align-items:center;gap:.5rem;margin-top:.65rem;min-width:0}
  .lk code{
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:.7rem;color:var(--dim);
    /* The URL is one long unbroken token. Without this it is the single thing on
       the page capable of making a phone scroll sideways. */
    overflow-wrap:anywhere;min-width:0;
  }
  .cp{
    flex:none;background:none;border:1px solid var(--line);border-radius:999px;
    color:var(--faint);font-family:inherit;font-size:.58rem;letter-spacing:.14em;
    text-transform:uppercase;font-weight:500;padding:.28rem .6rem;cursor:pointer;
    transition:color .18s ease,border-color .18s ease;
  }
  .cp:hover,.cp:focus-visible{color:var(--white);border-color:var(--white)}
  .lkw{color:var(--faint);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;margin-top:.35rem}

  .warn{
    color:var(--dim);font-size:.85rem;font-weight:300;line-height:1.65;
    margin-top:1.3rem;padding:.85rem 1rem;border:1px solid var(--line);
    border-left:2px solid #e2a75c;border-radius:0 10px 10px 0;max-width:52ch;
  }
  .warn b{color:var(--white);font-weight:500}

  footer{
    margin-top:clamp(3rem,10vw,4rem);padding-top:clamp(1.5rem,5vw,2rem);
    border-top:1px solid var(--line);text-align:center;
  }
  footer .back{
    display:inline-block;border:1px solid var(--line);border-radius:999px;
    padding:.7rem 1.5rem;color:var(--dim);text-decoration:none;
    font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500;
    transition:color .18s ease,border-color .18s ease;
  }
  footer .back:hover,footer .back:focus-visible{color:var(--white);border-color:var(--white)}
  /* The credit line the UPAC allocation letter requires on promotional material.
     Same wording and same placement as /sept13. */
  footer .credit{
    margin-top:clamp(1.6rem,6vw,2.2rem);color:var(--faint);font-size:.6rem;
    letter-spacing:.16em;text-transform:uppercase;line-height:1.9;
  }

  @media(prefers-reduced-motion:reduce){.dl,.cp,.thumb img,footer .back{transition:none}}
</style>
</head>
<body>
  <main class="wrap">
    <h1>Promo kit</h1>
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
    <h2>HUB Lawn Worship Night</h2>
    <p class="when">${EVENT.date} &nbsp;&middot;&nbsp; ${EVENT.time}</p>

    <div class="hero-link">
      <div class="k">Everything points here</div>
      <div class="u">wmaac.org/sept13</div>
    </div>

    ${PRINT}
    ${PHONE}
    ${CHURCH}
    ${SOCIAL}

    <footer>
      <a class="back" href="/sept13">See the event page</a>
      <div class="credit">
        ${EVENT.campus}<br>
        Funded by the Student Initiated Fee
      </div>
    </footer>
  </main>

<script>
/* Copy-to-clipboard on the tracked links. The URL is always visible as selectable
   text, so this is a convenience and never the only way to get it: where the
   clipboard API is missing or refused (an insecure origin, an in-app browser
   that blocks it) the button says so rather than lying with a tick. */
(function(){
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.cp');
    if (!b) return;
    var done = function(msg){
      var was = b.textContent;
      b.textContent = msg;
      setTimeout(function(){ b.textContent = was; }, 1600);
    };
    if (!navigator.clipboard) return done('Select it');
    navigator.clipboard.writeText(b.dataset.copy).then(
      function(){ done('Copied'); },
      function(){ done('Select it'); }
    );
  });
})();
</script>
</body>
</html>
`;

export async function GET(): Promise<Response> {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      /* Unlike /sept13 this page counts nothing, so it is free to be cached.
         Ten minutes at the edge keeps it instant for a group of people opening
         the same texted link at once, and still picks up an edit the same
         session someone makes one. */
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
