/* Visits to /listen and taps through to a streaming service, one row each.
 * summarize() in src/lib/listen/summary.ts adds them up and is unit tested.
 *
 * The whitelists come from src/lib/listen/catalog.ts, the same file the page
 * links from, so a direct call to log cannot store a key the page never offers. */

import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isSource, isTag, serviceByKey } from "../src/lib/listen/catalog";
import { summarize } from "../src/lib/listen/summary";

/** Ceiling on one summary read. Years of traffic for a band this size. */
const MAX_ROWS = 20000;

export const log = mutation({
  args: {
    kind: v.union(v.literal("visit"), v.literal("click")),
    source: v.string(),
    service: v.optional(v.string()),
    tagged: v.boolean(),
    bot: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    if (!isSource(a.source)) return null;
    if (a.kind === "click" && !(a.service && serviceByKey(a.service))) return null;
    if (a.kind === "visit" && a.service !== undefined) return null;
    // Only a tag we gave out can be "tagged"; a guessed source like direct or snap never is.
    await ctx.db.insert("listenEvents", { ...a, tagged: a.tagged && isTag(a.source), at: Date.now() });
    return null;
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("listenEvents").withIndex("by_at").order("desc").take(MAX_ROWS + 1);
    const truncated = rows.length > MAX_ROWS;
    return summarize(truncated ? rows.slice(0, MAX_ROWS) : rows, Date.now(), truncated);
  },
});

/* Clears the table, e.g. of rows left by an end-to-end check. Internal, so only
   the CLI or the dashboard can call it, never a browser. Batches of 4,000; run
   again until it returns 0. */
export const reset = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("listenEvents").withIndex("by_at").take(4000);
    for (const r of rows) await ctx.db.delete(r._id);
    return rows.length;
  },
});
