import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const stageValidator = v.union(
  v.literal("unprocessed"),
  v.literal("approved"),
  v.literal("reached_out"),
  v.literal("supporting_involved"),
  v.literal("involved_not_supporting"),
  v.literal("non_involved"),
);

const typeValidator = v.union(v.literal("church"), v.literal("campus_ministry"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("churchOutreach")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.optional(typeValidator),
    denomination: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    pastorName: v.optional(v.string()),
    notes: v.optional(v.string()),
    stage: v.optional(stageValidator),
  },
  handler: async (ctx, args) => {
    const { stage, ...rest } = args;
    return await ctx.db.insert("churchOutreach", {
      ...rest,
      stage: stage ?? "unprocessed",
      createdAt: Date.now(),
    });
  },
});

export const setStage = mutation({
  args: {
    id: v.id("churchOutreach"),
    stage: stageValidator,
  },
  handler: async (ctx, { id, stage }) => {
    await ctx.db.patch(id, { stage });
  },
});

export const updateFollowUp = mutation({
  args: {
    id: v.id("churchOutreach"),
    followUpNotes: v.optional(v.string()),
    contactDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, followUpNotes, contactDate }) => {
    await ctx.db.patch(id, { followUpNotes, contactDate });
  },
});

export const setType = mutation({
  args: {
    id: v.id("churchOutreach"),
    type: typeValidator,
  },
  handler: async (ctx, { id, type }) => {
    await ctx.db.patch(id, { type });
  },
});

export const remove = mutation({
  args: { id: v.id("churchOutreach") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
