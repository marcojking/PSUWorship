import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('gearItems').withIndex('by_category').order('asc').collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    disposition: v.union(v.literal('buy'), v.literal('rent')),
    description: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    rentalPricePerEvent: v.optional(v.number()),
    sourceName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('gearItems', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('gearItems'),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    disposition: v.optional(v.union(v.literal('buy'), v.literal('rent'))),
    description: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    rentalPricePerEvent: v.optional(v.number()),
    sourceName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceScreenshotStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id('gearItems') },
  handler: async (ctx, { id }) => {
    const inUse = await ctx.db.query('eventGear').withIndex('by_gear', q => q.eq('gearItemId', id)).first();
    if (inUse) throw new Error('Cannot delete gear item that is in use by an event');
    const item = await ctx.db.get(id);
    if (item?.sourceScreenshotStorageId) {
      await ctx.storage.delete(item.sourceScreenshotStorageId);
    }
    await ctx.db.delete(id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const getScreenshotUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});
