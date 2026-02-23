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
    frontImageStorageId: v.id("_storage"),
    backImageStorageId: v.id("_storage"),
    description: v.string(),
    basePrice: v.number(),
    availableSizes: v.array(v.string()),
    stock: v.any(),
    placements: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("main"), v.literal("logo")),
      view: v.string(),
      x: v.number(),
      y: v.number(),
      defaultSize: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clothingItems", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("clothingItems"),
    name: v.optional(v.string()),
    frontImageStorageId: v.optional(v.id("_storage")),
    backImageStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    availableSizes: v.optional(v.array(v.string())),
    stock: v.optional(v.any()),
    placements: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("main"), v.literal("logo")),
      view: v.string(),
      x: v.number(),
      y: v.number(),
      defaultSize: v.number(),
    }))),
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
