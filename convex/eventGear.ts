import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const listByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const rows = await ctx.db.query('eventGear').withIndex('by_event', q => q.eq('eventId', eventId)).collect();
    return Promise.all(
      rows.map(async (row) => {
        const gear = await ctx.db.get(row.gearItemId);
        return { ...row, gear };
      })
    );
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('eventGear').collect();
    return Promise.all(
      rows.map(async (row) => {
        const gear = await ctx.db.get(row.gearItemId);
        const event = await ctx.db.get(row.eventId);
        return { ...row, gear, event };
      })
    );
  },
});

export const addToEvent = mutation({
  args: {
    eventId: v.id('events'),
    gearItemId: v.id('gearItems'),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('eventGear')
      .withIndex('by_event', q => q.eq('eventId', args.eventId))
      .filter(q => q.eq(q.field('gearItemId'), args.gearItemId))
      .first();
    if (existing) throw new Error('Gear item already added to this event');
    return ctx.db.insert('eventGear', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('eventGear'),
    quantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removeFromEvent = mutation({
  args: { id: v.id('eventGear') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
