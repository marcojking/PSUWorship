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

  it("clips sideways overflow on the root element, where iOS Safari honours it", () => {
    // The glow is 150vw wide. iOS can ignore overflow-x on body alone and let the page pan sideways.
    assert.match(renderListenPage({ source: "ig", tagged: true }), /html\{[^}]*overflow-x:clip/);
  });

  it("names the band's own domain as its address, which passes /listen through to this app", () => {
    const html = renderListenPage({ source: "ig", tagged: true });
    assert.ok(html.includes('<link rel="canonical" href="https://gentleandlowlyband.com/listen">'));
    assert.ok(html.includes('content="https://gentleandlowlyband.com/listen-art/og-gl-v1.png"'));
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
    assert.ok(!html.includes("Follow taps"));
    for (const t of TAGS) assert.ok(html.includes(`${ARTIST.path}/${t}<`), t);
  });

  it("hands out links on the band's own domain", () => {
    const html = renderStats(summarize([], NOW));
    assert.ok(html.includes("gentleandlowlyband.com/listen/ig<"));
    assert.ok(!html.includes("wmaac.org/listen/ig<"));
  });

  it("lists follow taps on their own, outside the tap rate", () => {
    const html = renderStats(
      summarize(
        [
          { kind: "visit", source: "ig", tagged: true, bot: false, at: NOW - 1000 },
          { kind: "click", source: "ig", service: "instagram", tagged: true, bot: false, at: NOW - 500 },
        ],
        NOW,
      ),
    );
    assert.ok(html.includes("Follow taps"));
    assert.ok(html.includes(">0%<")); // the tap-rate tile: no streaming taps
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
