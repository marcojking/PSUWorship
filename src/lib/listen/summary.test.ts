import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { DAYS, easternDay, lastDays, summarize, type EventRow } from "./summary";

const NOW = Date.parse("2026-09-27T16:00:00Z"); // noon Eastern, Sun 9/27
const at = (iso: string) => Date.parse(iso);
const visit = (source: string, iso: string, extra: Partial<EventRow> = {}): EventRow => ({
  kind: "visit", source, tagged: false, bot: false, at: at(iso), ...extra,
});
const click = (source: string, service: string, iso: string, extra: Partial<EventRow> = {}): EventRow => ({
  kind: "click", source, service, tagged: false, bot: false, at: at(iso), ...extra,
});

describe("easternDay", () => {
  it("uses the Eastern calendar day, not UTC", () => {
    assert.equal(easternDay(at("2026-09-27T03:30:00Z")), "2026-09-26");
    assert.equal(easternDay(at("2026-09-27T04:30:00Z")), "2026-09-27");
  });
});

describe("lastDays", () => {
  it("returns DAYS consecutive days ending today, oldest first", () => {
    const d = lastDays(NOW);
    assert.equal(d.length, DAYS);
    assert.equal(d[d.length - 1], "2026-09-27");
    assert.equal(d[0], "2026-08-29");
  });

  it("neither skips nor repeats a day across the November clock change", () => {
    const d = lastDays(at("2026-11-02T17:00:00Z"));
    assert.equal(new Set(d).size, DAYS);
    assert.ok(d.includes("2026-11-01"));
    assert.equal(d[d.length - 1], "2026-11-02");
  });
});

describe("summarize", () => {
  it("is all zeros with no rows", () => {
    const s = summarize([], NOW);
    assert.equal(s.visits, 0);
    assert.equal(s.clicks, 0);
    assert.equal(s.bots, 0);
    assert.deepEqual(s.sources, []);
    assert.deepEqual(s.services, []);
    assert.deepEqual(s.follows, []);
    assert.equal(s.days.length, DAYS);
    assert.ok(s.days.every((d) => d.visits === 0 && d.clicks === 0));
    assert.equal(s.since, null);
    assert.equal(s.truncated, false);
  });

  it("counts visits, clicks and tagged visits per source", () => {
    const s = summarize(
      [
        visit("ig", "2026-09-27T15:00:00Z", { tagged: true }),
        visit("ig", "2026-09-27T15:01:00Z"),
        visit("tt", "2026-09-27T15:02:00Z", { tagged: true }),
        click("ig", "spotify", "2026-09-27T15:03:00Z", { tagged: true }),
        click("ig", "apple", "2026-09-27T15:04:00Z"),
        click("tt", "spotify", "2026-09-27T15:05:00Z"),
      ],
      NOW,
    );
    assert.equal(s.visits, 3);
    assert.equal(s.clicks, 3);
    assert.deepEqual(s.sources[0], { source: "ig", visits: 2, tagged: 1, clicks: 2 });
    assert.deepEqual(s.sources[1], { source: "tt", visits: 1, tagged: 1, clicks: 1 });
    assert.deepEqual(s.services, [
      { service: "spotify", clicks: 2 },
      { service: "apple", clicks: 1 },
    ]);
    const cell = (so: string, se: string) => s.cells.find((c) => c.source === so && c.service === se)?.clicks;
    assert.equal(cell("ig", "spotify"), 1);
    assert.equal(cell("ig", "apple"), 1);
    assert.equal(cell("tt", "spotify"), 1);
    assert.equal(cell("tt", "apple"), undefined);
  });

  it("counts follow taps apart from streaming taps", () => {
    const s = summarize(
      [
        visit("ig", "2026-09-27T15:00:00Z"),
        click("ig", "spotify", "2026-09-27T15:01:00Z"),
        click("ig", "instagram", "2026-09-27T15:02:00Z"),
        click("tt", "instagram", "2026-09-27T15:03:00Z"),
      ],
      NOW,
    );
    assert.equal(s.clicks, 1);
    assert.deepEqual(s.services, [{ service: "spotify", clicks: 1 }]);
    assert.deepEqual(s.follows, [{ service: "instagram", clicks: 2 }]);
    assert.deepEqual(s.sources, [{ source: "ig", visits: 1, tagged: 0, clicks: 1 }]);
    assert.equal(s.cells.length, 1);
    assert.equal(s.days.find((d) => d.day === "2026-09-27")?.clicks, 1);
  });

  it("keeps bots out of every count but their own", () => {
    const s = summarize(
      [visit("ig", "2026-09-27T15:00:00Z", { bot: true }), click("ig", "spotify", "2026-09-27T15:00:00Z", { bot: true })],
      NOW,
    );
    assert.equal(s.bots, 2);
    assert.equal(s.visits, 0);
    assert.equal(s.clicks, 0);
    assert.deepEqual(s.sources, []);
    assert.ok(s.days.every((d) => d.visits === 0 && d.clicks === 0));
  });

  it("puts events on their Eastern day and counts old ones in totals only", () => {
    const s = summarize(
      [
        visit("ig", "2026-09-27T03:30:00Z"), // 9/26, 11:30 PM Eastern
        click("ig", "spotify", "2026-09-27T14:00:00Z"),
        visit("yt", "2026-07-01T12:00:00Z"), // outside the 30-day window
      ],
      NOW,
    );
    const day = (d: string) => s.days.find((x) => x.day === d);
    assert.equal(day("2026-09-26")?.visits, 1);
    assert.equal(day("2026-09-27")?.clicks, 1);
    assert.equal(s.visits, 2);
    assert.equal(s.since, at("2026-07-01T12:00:00Z"));
  });

  it("adds up 20,000 rows, the most the query reads, well inside Convex's one-second budget", () => {
    const rows: EventRow[] = [];
    for (let i = 0; i < 20_000; i++) {
      const iso = new Date(NOW - i * 5 * 60_000).toISOString(); // one every 5 minutes, about 69 days back
      rows.push(i % 3 ? visit("ig", iso) : click("ig", "spotify", iso));
    }
    const t0 = performance.now();
    const s = summarize(rows, NOW);
    const ms = performance.now() - t0;
    assert.equal(s.visits + s.clicks, 20_000);
    assert.ok(ms < 150, `took ${Math.round(ms)} ms`);
  });

  it("passes truncated through", () => {
    assert.equal(summarize([], NOW, true).truncated, true);
  });
});
