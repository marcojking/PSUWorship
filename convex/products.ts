import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("standaloneProducts").withIndex("by_active", (q) => q.eq("active", true)).collect();
    }
    return await ctx.db.query("standaloneProducts").collect();
  },
});

export const get = query({
  args: { id: v.id("standaloneProducts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    price: v.number(),
    type: v.union(v.literal("premade"), v.literal("bundle"), v.literal("limited")),
    bundleContents: v.optional(v.array(v.string())),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("standaloneProducts", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("standaloneProducts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    price: v.optional(v.number()),
    type: v.optional(v.union(v.literal("premade"), v.literal("bundle"), v.literal("limited"))),
    bundleContents: v.optional(v.array(v.string())),
    quantity: v.optional(v.number()),
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
  args: { id: v.id("standaloneProducts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
