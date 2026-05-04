import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getCart = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query("carts").withIndex("by_token", (q) => q.eq("token", args.token)).first();
    },
});

export const createCart = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("carts", {
            token: args.token,
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateCart = mutation({
    args: {
        cartId: v.id("carts"),
        items: v.array(v.object({
            type: v.union(v.literal("custom"), v.literal("standalone")),
            savedDesignId: v.optional(v.id("savedDesigns")),
            standaloneProductId: v.optional(v.id("standaloneProducts")),
            quantity: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.cartId, {
            items: args.items,
            updatedAt: Date.now(),
        });
    },
});

export const clearCart = mutation({
    args: { cartId: v.id("carts") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.cartId, {
            items: [],
            updatedAt: Date.now(),
        });
    }
});
