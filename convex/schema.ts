import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  designs: defineTable({
    name: v.string(),
    description: v.string(),
    imageStorageId: v.id("_storage"),        // main / sticker image
    shapePath: v.optional(v.string()),        // SVG clip-path string
    category: v.optional(v.string()),
    active: v.boolean(),

    // Which product types are offered for this design
    stickerEnabled: v.optional(v.boolean()),
    patchEnabled: v.optional(v.boolean()),
    embroideryEnabled: v.optional(v.boolean()),

    // Prices (cents)
    stickerPrice: v.number(),
    patchPrice: v.number(),
    embroideryPriceLarge: v.number(),
    embroideryPriceSmall: v.number(),
    fixedSizeOnly: v.boolean(),

    // Per-type images (sticker falls back to imageStorageId)
    patchImageStorageId: v.optional(v.id("_storage")),
    embroideryImageStorageId: v.optional(v.id("_storage")),

    mockupStorageIds: v.optional(v.array(v.id("_storage"))), // hover slideshow photos

    // Legacy field — kept so existing documents don't fail validation
    embroideryStickerPrice: v.optional(v.number()),
  }).index("by_active", ["active"]),

  clothingItems: defineTable({
    name: v.string(),
    imageStorageId: v.id("_storage"),
    basePrice: v.number(), // cents
    placements: v.array(v.object({ id: v.string(), name: v.string() })),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  promptTemplates: defineTable({
    type: v.union(
      v.literal("sticker"),
      v.literal("sticker_embroidery"),
      v.literal("patch"),
      v.literal("embroidered"),
      v.literal("closeup"),
    ),
    name: v.string(),
    template: v.string(), // string with {variables}
    active: v.boolean(),
  }).index("by_type", ["type"]),

  standaloneProducts: defineTable({
    name: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    price: v.number(), // cents
    type: v.union(
      v.literal("premade"),
      v.literal("bundle"),
      v.literal("limited"),
    ),
    bundleContents: v.optional(v.array(v.string())),
    quantity: v.number(), // stock count
    active: v.boolean(),
  }).index("by_active", ["active"]),

  orders: defineTable({
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
    total: v.number(), // cents
    shippingCost: v.number(), // cents
    shippingMethod: v.string(),
    stripeSessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("fulfilled"),
      v.literal("cancelled"),
    ),
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
    createdAt: v.number(), // timestamp
  })
    .index("by_status", ["status"])
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_createdAt", ["createdAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
