import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';

/* Which poster did this scan come from?
 *
 * Three versions of the Sept 13 poster went up, each with its own QR code:
 * The Figs, PSU Football, Free Pizza. All three open /sept13, but each carries a
 * different ?p= value, and that is the only signal telling us which poster is
 * actually pulling people in. Anyone TYPING wmaac.org/sept13 off the poster has
 * no param and is deliberately not counted — a typed visit cannot be attributed
 * to one poster anyway.
 */

/* 'card' is the 2,500 printed business cards. Their QR was printed before any of
   this existed and points at the bare /sept13 with no ?p= at all, so a visit with
   no param is recorded as a card scan. That bucket is not purely cards — someone
   typing the URL off a poster, or opening a shared link, lands there too — but
   the cards outnumber both by orders of magnitude, so it is the honest label. */
const POSTERS = ['figs', 'psu', 'pizza', 'card'] as const;

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
    // Ignore anything not one of ours so a stray or guessed ?p= cannot pollute
    // the counts, or grow the table unboundedly if someone finds the param.
    if (!(POSTERS as readonly string[]).includes(args.poster)) return null;
    await ctx.db.insert('posterScans', {
      poster: args.poster,
      bot: args.bot,
      at: Date.now(),
    });
    return null;
  },
});

const COUNTS = v.object({
  figs: v.number(),
  psu: v.number(),
  pizza: v.number(),
  card: v.number(),
});

export const summary = query({
  args: {},
  returns: v.object({
    totals: COUNTS,
    bots: COUNTS,
    total: v.number(),
    botTotal: v.number(),
    truncated: v.boolean(),
    days: v.array(
      v.object({
        day: v.string(),
        figs: v.number(),
        psu: v.number(),
        pizza: v.number(),
        card: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('posterScans')
      .withIndex('by_at')
      .order('desc')
      .take(MAX_ROWS);

    const totals = { figs: 0, psu: 0, pizza: 0, card: 0 };
    const bots = { figs: 0, psu: 0, pizza: 0, card: 0 };
    const byDay: Record<string, { figs: number; psu: number; pizza: number; card: number }> = {};
    let botTotal = 0;

    for (const r of rows) {
      const key = r.poster as keyof typeof totals;
      if (!(key in totals)) continue;

      // Link-preview fetches are counted separately rather than thrown away: if
      // one gets texted into a group chat, the bot number is what explains a
      // sudden spike that no human caused.
      if (r.bot) {
        bots[key] += 1;
        botTotal += 1;
        continue;
      }
      totals[key] += 1;

      // Event is in Pennsylvania; bucket by Eastern date so "Tuesday" means the
      // day the posters were actually walked past, not a UTC day boundary.
      const day = new Date(r.at).toLocaleDateString('en-CA', {
        timeZone: 'America/New_York',
      });
      byDay[day] = byDay[day] ?? { figs: 0, psu: 0, pizza: 0, card: 0 };
      byDay[day][key] += 1;
    }

    return {
      totals,
      bots,
      total: totals.figs + totals.psu + totals.pizza + totals.card,
      botTotal,
      truncated: rows.length >= MAX_ROWS,
      days: Object.keys(byDay)
        .sort()
        .map((d) => ({ day: d, ...byDay[d] })),
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
