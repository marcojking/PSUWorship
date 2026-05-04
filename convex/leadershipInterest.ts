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
    requestsCall: v.boolean(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadershipInterest", {
      ...args,
      submittedAt: Date.now(),
    });
  },
});
