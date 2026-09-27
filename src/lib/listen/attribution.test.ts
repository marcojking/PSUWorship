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
