import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const listByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return ctx.db
      .query('eventChecks')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect();
  },
});

export const create = mutation({
  args: {
    eventId: v.id('events'),
    tag: v.string(),
    tagColor: v.string(),
    text: v.string(),
    due: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('eventChecks', { ...args, done: false });
  },
});

export const update = mutation({
  args: {
    id: v.id('eventChecks'),
    tag: v.optional(v.string()),
    tagColor: v.optional(v.string()),
    text: v.optional(v.string()),
    due: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const toggleDone = mutation({
  args: { id: v.id('eventChecks') },
  handler: async (ctx, { id }) => {
    const check = await ctx.db.get(id);
    if (!check) return;
    await ctx.db.patch(id, { done: !check.done });
  },
});

export const remove = mutation({
  args: { id: v.id('eventChecks') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
