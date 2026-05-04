import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    args: { id: v.id("savedDesigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const saveDraft = mutation({
    args: {
        clothingItemId: v.optional(v.id("clothingItems")),
        selectedSize: v.optional(v.string()),
        isCustomClothing: v.boolean(),
        customViews: v.optional(v.array(v.object({
            label: v.string(),
            storageId: v.id("_storage"),
        }))),
        placements: v.array(v.object({
            designId: v.id("designs"),
            view: v.string(),
            x: v.number(), y: v.number(),
            width: v.number(), height: v.number(),
        })),
        logoVariantId: v.optional(v.id("logoVariants")),
        logoPlacement: v.optional(v.object({
            view: v.string(),
            x: v.number(), y: v.number(),
            width: v.number(), height: v.number(),
        })),
        aiMockupIds: v.optional(v.object({
            front: v.optional(v.id("_storage")),
            back: v.optional(v.id("_storage")),
        })),
        status: v.union(v.literal("draft"), v.literal("in_cart"), v.literal("ordered")),
        contactEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const draftId = await ctx.db.insert("savedDesigns", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return draftId;
    },
});

export const updateDraft = mutation({
    args: {
        id: v.id("savedDesigns"),
        clothingItemId: v.optional(v.id("clothingItems")),
        selectedSize: v.optional(v.string()),
        isCustomClothing: v.optional(v.boolean()),
        customViews: v.optional(v.array(v.object({
            label: v.string(),
            storageId: v.id("_storage"),
        }))),
        placements: v.optional(v.array(v.object({
            designId: v.id("designs"),
            view: v.string(),
            x: v.number(), y: v.number(),
            width: v.number(), height: v.number(),
        }))),
        logoVariantId: v.optional(v.id("logoVariants")),
        logoPlacement: v.optional(v.object({
            view: v.string(),
            x: v.number(), y: v.number(),
            width: v.number(), height: v.number(),
        })),
        aiMockupIds: v.optional(v.object({
            front: v.optional(v.id("_storage")),
            back: v.optional(v.id("_storage")),
        })),
        status: v.optional(v.union(v.literal("draft"), v.literal("in_cart"), v.literal("ordered"))),
        contactEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});
