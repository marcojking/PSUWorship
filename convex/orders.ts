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
    contactPhone: v.optional(v.string()),
    savedDesignSnapshot: v.optional(v.any()),
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
        frontMockupId: v.optional(v.id("_storage")),
        backMockupId: v.optional(v.id("_storage")),
        frontPreviewId: v.optional(v.id("_storage")),
        backPreviewId: v.optional(v.id("_storage")),
        customNotes: v.optional(v.string()),
      }),
    ),
    total: v.number(),
    shippingCost: v.number(),
    shippingMethod: v.string(),
    deliveryType: v.union(v.literal("shipping"), v.literal("local_pickup")),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    adminNote: v.optional(v.string()),
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
      v.literal("abandoned"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("paid"),
      v.literal("fulfilled"),
      v.literal("cancelled"),
    ),
    adminNote: v.optional(v.string()),
    stripeReceiptUrl: v.optional(v.string()), // Added
    stripePaymentIntentId: v.optional(v.string()), // Added
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Called when user cancels or abandons checkout.
// If they entered contact info, mark as abandoned.
// If they're completely anonymous, delete the order.
export const cleanupAbandoned = mutation({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripeSession", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();

    if (!order) return null;

    // NEVER touch an order that has been paid/approved/fulfilled etc.
    const safeStatuses = ["pending", "abandoned"];
    if (!safeStatuses.includes(order.status)) return null;

    // If they provided contact info, keep the order but mark it abandoned
    if (order.email) {
      await ctx.db.patch(order._id, { status: "abandoned" });
      return "abandoned";
    }

    // Otherwise silently delete it
    await ctx.db.delete(order._id);
    return "deleted";
  },
});
