import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status as "pending" | "paid" | "fulfilled" | "cancelled"))
        .collect();
    }
    return await ctx.db.query("orders").withIndex("by_createdAt").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByStripeSession = query({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_stripeSession", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    items: v.array(
      v.object({
        type: v.string(),
        designId: v.optional(v.id("designs")),
        clothingItemId: v.optional(v.id("clothingItems")),
        standaloneProductId: v.optional(v.id("standaloneProducts")),
        name: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        size: v.optional(v.string()),
        placements: v.optional(
          v.array(v.object({ designId: v.id("designs"), size: v.string(), position: v.string() })),
        ),
      }),
    ),
    total: v.number(),
    shippingCost: v.number(),
    shippingMethod: v.string(),
    stripeSessionId: v.string(),
    deliveryType: v.union(v.literal("shipping"), v.literal("local_pickup")),
    shippingAddress: v.optional(
      v.object({
        name: v.string(),
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("fulfilled"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
