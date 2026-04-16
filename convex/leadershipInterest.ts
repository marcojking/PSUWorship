import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
