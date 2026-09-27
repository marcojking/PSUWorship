import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { GUESSES, SERVICES, SOURCE_LABELS, SOURCES, TAGS, TAG_INFO, serviceByKey } from "./catalog";
import { ICONS } from "./icons";

describe("catalog", () => {
  it("has unique, URL-safe service keys", () => {
    const keys = SERVICES.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const k of keys) assert.match(k, /^[a-z0-9]+$/);
  });

  it("links only to clean https URLs", () => {
    for (const s of SERVICES) {
      assert.match(s.url, /^https:\/\/[^\s?#]+$/, `${s.key}: ${s.url}`);
    }
  });

  it("has an icon for every service", () => {
    for (const s of SERVICES) assert.ok(ICONS[s.icon], `no icon ${s.icon} for ${s.key}`);
  });

  it("leads with Spotify, then Apple Music", () => {
    const streams = SERVICES.filter((s) => s.kind === "stream").map((s) => s.key);
    assert.deepEqual(streams.slice(0, 2), ["spotify", "apple"]);
  });

  it("has URL-safe tags that can't shadow the go or stats routes", () => {
    for (const t of TAGS) {
      assert.match(t, /^[a-z0-9]+$/);
      assert.ok(!["go", "stats"].includes(t));
      assert.ok(TAG_INFO[t]);
    }
  });

  it("labels every source, tagged or guessed", () => {
    for (const s of [...TAGS, ...GUESSES]) assert.ok(SOURCES.includes(s));
    for (const s of SOURCES) assert.ok(SOURCE_LABELS[s], `no label for ${s}`);
  });

  it("finds services by key", () => {
    assert.equal(serviceByKey("spotify")?.label, "Spotify");
    assert.equal(serviceByKey("nope"), undefined);
  });
});
