import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("designs").withIndex("by_active", (q) => q.eq("active", true)).collect();
    }
    return await ctx.db.query("designs").collect();
  },
});

export const get = query({
  args: { id: v.id("designs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    imageStorageId: v.id("_storage"),
    shapePath: v.optional(v.string()),
    category: v.optional(v.string()),
    stickerEnabled: v.optional(v.boolean()),
    patchEnabled: v.optional(v.boolean()),
    embroideryEnabled: v.optional(v.boolean()),
    stickerPrice: v.number(),
    patchPrice: v.number(),
    embroideryPriceLarge: v.number(),
    embroideryPriceSmall: v.number(),
    fixedSizeOnly: v.boolean(),
    patchImageStorageId: v.optional(v.id("_storage")),
    embroideryImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Spread only defined optional fields so Convex doesn't receive undefined values
    return await ctx.db.insert("designs", {
      name: args.name,
      description: args.description,
      imageStorageId: args.imageStorageId,
      stickerPrice: args.stickerPrice,
      patchPrice: args.patchPrice,
      embroideryPriceLarge: args.embroideryPriceLarge,
      embroideryPriceSmall: args.embroideryPriceSmall,
      fixedSizeOnly: args.fixedSizeOnly,
      active: true,
      ...(args.shapePath !== undefined ? { shapePath: args.shapePath } : {}),
      ...(args.category !== undefined ? { category: args.category } : {}),
      ...(args.stickerEnabled !== undefined ? { stickerEnabled: args.stickerEnabled } : {}),
      ...(args.patchEnabled !== undefined ? { patchEnabled: args.patchEnabled } : {}),
      ...(args.embroideryEnabled !== undefined ? { embroideryEnabled: args.embroideryEnabled } : {}),
      ...(args.patchImageStorageId !== undefined ? { patchImageStorageId: args.patchImageStorageId } : {}),
      ...(args.embroideryImageStorageId !== undefined ? { embroideryImageStorageId: args.embroideryImageStorageId } : {}),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("designs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    shapePath: v.optional(v.string()),
    category: v.optional(v.string()),
    active: v.optional(v.boolean()),
    stickerEnabled: v.optional(v.boolean()),
    patchEnabled: v.optional(v.boolean()),
    embroideryEnabled: v.optional(v.boolean()),
    stickerPrice: v.optional(v.number()),
    patchPrice: v.optional(v.number()),
    embroideryPriceLarge: v.optional(v.number()),
    embroideryPriceSmall: v.optional(v.number()),
    fixedSizeOnly: v.optional(v.boolean()),
    patchImageStorageId: v.optional(v.id("_storage")),
    embroideryImageStorageId: v.optional(v.id("_storage")),
    mockupStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...(fields.name !== undefined ? { name: fields.name } : {}),
      ...(fields.description !== undefined ? { description: fields.description } : {}),
      ...(fields.imageStorageId !== undefined ? { imageStorageId: fields.imageStorageId } : {}),
      ...(fields.shapePath !== undefined ? { shapePath: fields.shapePath } : {}),
      ...(fields.category !== undefined ? { category: fields.category } : {}),
      ...(fields.active !== undefined ? { active: fields.active } : {}),
      ...(fields.stickerEnabled !== undefined ? { stickerEnabled: fields.stickerEnabled } : {}),
      ...(fields.patchEnabled !== undefined ? { patchEnabled: fields.patchEnabled } : {}),
      ...(fields.embroideryEnabled !== undefined ? { embroideryEnabled: fields.embroideryEnabled } : {}),
      ...(fields.stickerPrice !== undefined ? { stickerPrice: fields.stickerPrice } : {}),
      ...(fields.patchPrice !== undefined ? { patchPrice: fields.patchPrice } : {}),
      ...(fields.embroideryPriceLarge !== undefined ? { embroideryPriceLarge: fields.embroideryPriceLarge } : {}),
      ...(fields.embroideryPriceSmall !== undefined ? { embroideryPriceSmall: fields.embroideryPriceSmall } : {}),
      ...(fields.fixedSizeOnly !== undefined ? { fixedSizeOnly: fields.fixedSizeOnly } : {}),
      ...(fields.patchImageStorageId !== undefined ? { patchImageStorageId: fields.patchImageStorageId } : {}),
      ...(fields.embroideryImageStorageId !== undefined ? { embroideryImageStorageId: fields.embroideryImageStorageId } : {}),
      ...(fields.mockupStorageIds !== undefined ? { mockupStorageIds: fields.mockupStorageIds } : {}),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("designs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
