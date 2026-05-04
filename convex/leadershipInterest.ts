import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("leadershipInterest")
      .withIndex("by_submittedAt")
      .order("desc")
      .collect();
    return await Promise.all(
      rows.map(async (r) => ({
        ...r,
        videoUrl: await ctx.storage.getUrl(r.videoStorageId),
      }))
    );
  },
});

export const listCallRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("callRequests")
      .withIndex("by_submittedAt")
      .order("desc")
      .collect();
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    gradYear: v.number(),
    weeklyHours: v.number(),
    roles: v.array(v.string()),
    worshipTeam: v.boolean(),
    instruments: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadershipInterest", {
      ...args,
      submittedAt: Date.now(),
    });
  },
});

export const requestCall = mutation({
  args: {
    name: v.string(),
    contact: v.string(),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("callRequests", {
      ...args,
      submittedAt: Date.now(),
    });
  },
});
