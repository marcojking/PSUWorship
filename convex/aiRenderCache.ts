import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByHash = query({
    args: { configHash: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("aiRenderCache")
            .withIndex("by_hash", (q) => q.eq("configHash", args.configHash))
            .first();
    },
});

export const store = mutation({
    args: {
        configHash: v.string(),
        imageStorageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        // Check if this hash already exists
        const existing = await ctx.db
            .query("aiRenderCache")
            .withIndex("by_hash", (q) => q.eq("configHash", args.configHash))
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("aiRenderCache", {
            configHash: args.configHash,
            imageStorageId: args.imageStorageId,
            createdAt: Date.now(),
        });
    },
});
