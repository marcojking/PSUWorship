import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('events').withIndex('by_startDate').order('asc').collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db.query('events').withIndex('by_slug', q => q.eq('slug', slug)).first();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    startDate: v.number(),
  },
  handler: async (ctx, { title, startDate }) => {
    if (!title.trim()) throw new Error('Event title cannot be empty');
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 2;
    while (await ctx.db.query('events').withIndex('by_slug', q => q.eq('slug', slug)).first()) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const now = Date.now();
    await ctx.db.insert('events', {
      slug,
      title,
      startDate,
      endDate: startDate,
      status: 'planning',
      color: 'navy',
      createdAt: now,
      updatedAt: now,
    });
    return slug;
  },
});

export const update = mutation({
  args: {
    id: v.id('events'),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal('planning'), v.literal('confirmed'), v.literal('complete'))),
    color: v.optional(v.union(v.literal('navy'), v.literal('rust'), v.literal('blue'))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.array(v.object({ date: v.number(), description: v.string() }))),
    schedule: v.optional(v.array(v.object({ time: v.string(), desc: v.string() }))),
    upacRows: v.optional(v.array(v.object({ key: v.string(), val: v.string(), urgent: v.optional(v.boolean()) }))),
    upacNote: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('events') },
  handler: async (ctx, { id }) => {
    const checks = await ctx.db.query('eventChecks').withIndex('by_event', q => q.eq('eventId', id)).collect();
    for (const c of checks) await ctx.db.delete(c._id);
    const gear = await ctx.db.query('eventGear').withIndex('by_event', q => q.eq('eventId', id)).collect();
    for (const g of gear) await ctx.db.delete(g._id);
    await ctx.db.delete(id);
  },
});
