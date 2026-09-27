/* Adds up listenEvents rows for the stats page. Pure, so it is tested without
 * a database; convex/listen.ts calls it inside the summary query.
 *
 * Counts are page loads and taps, not people. One person opening the page
 * twice is two visits. Taps on the follow icons are kept apart from taps on a
 * streaming service, so "where they went" is only about listening. */

import { serviceByKey } from "./catalog";

export interface EventRow {
  kind: "visit" | "click";
  source: string;
  service?: string;
  tagged: boolean;
  bot: boolean;
  at: number;
}

export interface SourceRow { source: string; visits: number; tagged: number; clicks: number }
export interface ServiceRow { service: string; clicks: number }
export interface Cell { source: string; service: string; clicks: number }
export interface DayRow { day: string; visits: number; clicks: number }

export interface Summary {
  visits: number;
  /** Taps to a streaming service. Follow taps are not in here. */
  clicks: number;
  /** Taps on the follow icons, by account, most first. */
  follows: ServiceRow[];
  bots: number;
  /** Sorted by visits, most first. */
  sources: SourceRow[];
  /** Sorted by clicks, most first. */
  services: ServiceRow[];
  cells: Cell[];
  /** The last DAYS Eastern days, oldest first, zero days included. */
  days: DayRow[];
  truncated: boolean;
  /** Time of the oldest row read, or null with no rows. */
  since: number | null;
}

export const DAYS = 30;

/* Built once: toLocaleDateString makes a new formatter on every call, which is about half a
   second across the 20,000 rows summary reads. */
const EASTERN = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

/** Eastern calendar date, YYYY-MM-DD. The audience is in Pennsylvania, so a day means their day. */
export function easternDay(at: number): string {
  return EASTERN.format(new Date(at));
}

/** The last `n` Eastern days ending today, oldest first. Calendar arithmetic rather than
 *  subtracting 24 hours, so a clock change can't skip or repeat a day. */
export function lastDays(now: number, n: number = DAYS): string[] {
  const [y, m, d] = easternDay(now).split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return out;
}

const byCount = (m: Map<string, number>): ServiceRow[] =>
  [...m]
    .map(([service, n]) => ({ service, clicks: n }))
    .sort((a, b) => b.clicks - a.clicks || a.service.localeCompare(b.service));

export function summarize(rows: readonly EventRow[], now: number, truncated = false): Summary {
  const sources = new Map<string, SourceRow>();
  const services = new Map<string, number>();
  const follows = new Map<string, number>();
  const cells = new Map<string, Cell>();
  const days = new Map<string, DayRow>(lastDays(now).map((day) => [day, { day, visits: 0, clicks: 0 }]));
  let visits = 0;
  let clicks = 0;
  let bots = 0;
  let since: number | null = null;

  for (const r of rows) {
    since = since === null ? r.at : Math.min(since, r.at);
    if (r.bot) {
      bots++;
      continue;
    }
    if (r.kind === "click" && r.service && serviceByKey(r.service)?.kind === "follow") {
      follows.set(r.service, (follows.get(r.service) ?? 0) + 1);
      continue;
    }
    let s = sources.get(r.source);
    if (!s) {
      s = { source: r.source, visits: 0, tagged: 0, clicks: 0 };
      sources.set(r.source, s);
    }
    const day = days.get(easternDay(r.at));
    if (r.kind === "visit") {
      visits++;
      s.visits++;
      if (r.tagged) s.tagged++;
      if (day) day.visits++;
    } else {
      const service = r.service ?? "unknown";
      clicks++;
      s.clicks++;
      services.set(service, (services.get(service) ?? 0) + 1);
      const key = `${r.source} ${service}`;
      const c = cells.get(key) ?? { source: r.source, service, clicks: 0 };
      c.clicks++;
      cells.set(key, c);
      if (day) day.clicks++;
    }
  }

  return {
    visits,
    clicks,
    follows: byCount(follows),
    bots,
    sources: [...sources.values()].sort(
      (a, b) => b.visits - a.visits || b.clicks - a.clicks || a.source.localeCompare(b.source),
    ),
    services: byCount(services),
    cells: [...cells.values()],
    days: [...days.values()],
    truncated,
    since,
  };
}
