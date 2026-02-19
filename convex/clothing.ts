import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("clothingItems").withIndex("by_active", (q) => q.eq("active", true)).collect();
    }
    return await ctx.db.query("clothingItems").collect();
  },
});

export const get = query({
  args: { id: v.id("clothingItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    imageStorageId: v.id("_storage"),
    basePrice: v.number(),
    placements: v.array(v.object({ id: v.string(), name: v.string() })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clothingItems", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("clothingItems"),
    name: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    basePrice: v.optional(v.number()),
    placements: v.optional(v.array(v.object({ id: v.string(), name: v.string() }))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("clothingItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
