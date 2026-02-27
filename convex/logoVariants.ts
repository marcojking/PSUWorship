import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("logoVariants").collect();
    },
});

export const get = query({
    args: { id: v.id("logoVariants") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        type: v.union(v.literal("satin_outline"), v.literal("filled"), v.literal("patch_backed")),
        name: v.string(),
        imageStorageId: v.id("_storage"),
        price: v.number(), // cents
        fixedSize: v.optional(v.number()), // % of clothing width
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("logoVariants", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("logoVariants"),
        type: v.optional(v.union(v.literal("satin_outline"), v.literal("filled"), v.literal("patch_backed"))),
        name: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        price: v.optional(v.number()), // cents
        fixedSize: v.optional(v.number()), // % of clothing width
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("logoVariants") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
