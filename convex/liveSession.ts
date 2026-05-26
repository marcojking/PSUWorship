import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const update = mutation({
  args: {
    currentSong:  v.number(),
    currentSlide: v.number(),
    queuedSong:   v.number(),
    queuedSlide:  v.number(),
    mode:         v.union(v.literal('song'), v.literal('slide')),
    isBlackout:   v.boolean(),
    isLive:       v.boolean(),
  },
  handler: async (ctx, args) => {
    // Replace rather than patch so stale fields from older schemas never linger.
    const existing = await ctx.db.query('liveSession').first()
    if (existing) await ctx.db.delete(existing._id)
    return ctx.db.insert('liveSession', { ...args, updatedAt: Date.now() })
  }
})

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('liveSession').first()
})
