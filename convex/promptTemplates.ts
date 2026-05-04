import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("promptTemplates")
        .withIndex("by_type", (q) =>
          q.eq("type", args.type as "sticker" | "sticker_embroidery" | "patch" | "embroidered" | "closeup"),
        )
        .collect();
    }
    return await ctx.db.query("promptTemplates").collect();
  },
});

export const get = query({
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getActiveByType = query({
  args: {
    type: v.union(
      v.literal("sticker"),
      v.literal("sticker_embroidery"),
      v.literal("patch"),
      v.literal("embroidered"),
      v.literal("closeup"),
    ),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("promptTemplates")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    return templates.find((t) => t.active) ?? templates[0] ?? null;
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("sticker"),
      v.literal("sticker_embroidery"),
      v.literal("patch"),
      v.literal("embroidered"),
      v.literal("closeup"),
    ),
    name: v.string(),
    template: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("promptTemplates", { ...args, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("promptTemplates"),
    name: v.optional(v.string()),
    template: v.optional(v.string()),
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
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
