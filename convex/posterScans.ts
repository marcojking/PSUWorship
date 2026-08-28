import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';

/* Where did this visit to /sept13 come from?
 *
 * Every link we control carries ?p=<source>. Each poster's QR code has its own
 * value; each place we post the link online gets its own too.
 *
 * 'card' is the 2,500 printed business cards. Their QR was made before any of
 * this existed and points at the bare /sept13 with no parameter, so a visit with
 * no ?p= is recorded as a card scan. That bucket is not purely cards — someone
 * typing the URL, or opening a link a friend forwarded, lands there too — but the
 * cards outnumber both by orders of magnitude, so it is the honest default.
 *
 * Anything not on this list is dropped rather than stored, so a stray or guessed
 * ?p= cannot pollute the counts or grow the table without bound.
 */
const SOURCES = [
  'figs',
  'psu',
  'pizza',
  'card',
  'ig',
  'igstory',
  'tiktok',
  'yt',
  'fb',
  'email',
  'groupme',
  'whatsapp',
  'text',
  /* Hand-out links for individual people sharing the event with their own
   * network. Deliberately opaque: whoever receives the link sees the code, not
   * whose list they are on. Who is who is kept off the site — the mapping lives
   * in the promo folder's social/LINKS.txt. Add ref3, ref4… as more are given out. */
  'ref1',
  'ref2',
  'ref3',
  /* Not a page visit: someone pressed "Add to Calendar" on /sept13 and was
   * redirected through /sept13/cal. Counted here so it shares one table and one
   * whitelist, but the stats page holds it out of the visit total — it is an
   * action taken ON the page, not an arrival at it. */
  'cal',
  /* University placements, each submitted separately and each taking the same
   * 16:9 graphic. Split so we can learn which captive-audience channel actually
   * works rather than lumping them under 'other' and never finding out.
   *   hub   — HUB-Robeson digital signage
   *   tpep  — The Toilet Paper / The Elevator Pitch (HUB stalls + elevators)
   *   stall — Residence Life Stall Stories
   *   disc  — the Discover / Penn State GO event listing
   *   press — a link printed in a story we did not place ourselves */
  'hub',
  'tpep',
  'stall',
  'disc',
  'press',
  'other',
] as const;

/** Hard ceiling on a summary read. Far above anything this event can produce,
 *  but it keeps one query from ever loading an unbounded table. */
const MAX_ROWS = 20000;

export const log = mutation({
  args: {
    poster: v.string(),
    bot: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(SOURCES as readonly string[]).includes(args.poster)) return null;
    await ctx.db.insert('posterScans', {
      poster: args.poster,
      bot: args.bot,
      at: Date.now(),
    });
    return null;
  },
});

const ROW = v.object({ source: v.string(), count: v.number() });

export const summary = query({
  args: {},
  returns: v.object({
    /* Arrays rather than a fixed-key object, so adding a channel is a one-line
       change to SOURCES and no validator anywhere needs updating to match. */
    totals: v.array(ROW),
    bots: v.array(ROW),
    total: v.number(),
    botTotal: v.number(),
    truncated: v.boolean(),
    days: v.array(
      v.object({
        day: v.string(),
        total: v.number(),
        counts: v.array(ROW),
      }),
    ),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('posterScans')
      .withIndex('by_at')
      .order('desc')
      .take(MAX_ROWS);

    const totals: Record<string, number> = {};
    const bots: Record<string, number> = {};
    const byDay: Record<string, Record<string, number>> = {};
    let total = 0;
    let botTotal = 0;

    for (const r of rows) {
      if (!(SOURCES as readonly string[]).includes(r.poster)) continue;

      // Link-preview fetches are held apart rather than discarded: if one gets
      // pasted into a group chat, the bot number is what explains a spike that
      // no human caused.
      if (r.bot) {
        bots[r.poster] = (bots[r.poster] ?? 0) + 1;
        botTotal += 1;
        continue;
      }
      totals[r.poster] = (totals[r.poster] ?? 0) + 1;
      total += 1;

      // Event is in Pennsylvania; bucket by Eastern date so a day means the day
      // people were actually walking past the posters, not a UTC boundary.
      const day = new Date(r.at).toLocaleDateString('en-CA', {
        timeZone: 'America/New_York',
      });
      byDay[day] = byDay[day] ?? {};
      byDay[day][r.poster] = (byDay[day][r.poster] ?? 0) + 1;
    }

    const asRows = (m: Record<string, number>) =>
      SOURCES.map((s) => ({ source: s as string, count: m[s] ?? 0 }));

    return {
      totals: asRows(totals),
      bots: asRows(bots),
      total,
      botTotal,
      truncated: rows.length >= MAX_ROWS,
      days: Object.keys(byDay)
        .sort()
        .map((d) => ({
          day: d,
          total: Object.values(byDay[d]).reduce((a, b) => a + b, 0),
          counts: asRows(byDay[d]),
        })),
    };
  },
});

/* Wipe the counts. internalMutation, so it is reachable only from the CLI or the
   dashboard and never from a browser. Exists because the table gets seeded with
   test rows while verifying the pipeline, and real numbers have to start at zero
   before the posters go up. */
export const reset = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rows = await ctx.db.query('posterScans').withIndex('by_at').take(20000);
    for (const r of rows) await ctx.db.delete(r._id);
    return rows.length;
  },
});
