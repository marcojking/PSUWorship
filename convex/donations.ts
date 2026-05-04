import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    amountCents: v.number(),
    mode: v.union(v.literal('once'), v.literal('monthly')),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('donations', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('donations')
      .withIndex('by_createdAt')
      .order('desc')
      .collect();
  },
});
