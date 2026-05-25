import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const update = mutation({
  args: {
    currentSong:    v.number(),
    currentSection: v.number(),
    queuedSong:     v.number(),
    queuedSection:  v.number(),
    mode:           v.union(v.literal('song'), v.literal('section')),
    isBlackout:     v.boolean(),
    isLive:         v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('liveSession').first()
    if (existing) {
      return ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() })
    }
    return ctx.db.insert('liveSession', { ...args, updatedAt: Date.now() })
  }
})

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('liveSession').first()
})
