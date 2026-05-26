import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const push = mutation({
  args: {
    name: v.string(),
    songs: v.array(v.object({
      title: v.string(),
      key:   v.optional(v.string()),
      slides: v.array(v.object({
        type:              v.string(),
        label:             v.string(),
        lyrics:            v.string(),
        chords:            v.string(),
        isSectionStart:    v.boolean(),
        slideInSection:    v.number(),
        sectionSlideCount: v.number(),
      }))
    }))
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('liveSetlist').first()
    if (existing) await ctx.db.delete(existing._id)
    return ctx.db.insert('liveSetlist', {
      name:     args.name,
      pushedAt: Date.now(),
      songs:    args.songs,
    })
  }
})

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('liveSetlist').first()
})
