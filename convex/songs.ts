import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const sectionsValidator = v.array(v.object({
  type:  v.string(),
  label: v.string(),
  lines: v.array(v.object({
    lyrics: v.string(),
    chords: v.array(v.object({ chord: v.string(), position: v.number() })),
  })),
  slideBreaks: v.optional(v.array(v.number())),
}))

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query('songs').withIndex('by_title').collect(),
})

export const get = query({
  args: { id: v.id('songs') },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

export const create = mutation({
  args: {
    title:    v.string(),
    artist:   v.string(),
    key:      v.string(),
    sections: sectionsValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return ctx.db.insert('songs', { ...args, createdAt: now, updatedAt: now })
  },
})

export const update = mutation({
  args: {
    id:       v.id('songs'),
    title:    v.optional(v.string()),
    artist:   v.optional(v.string()),
    key:      v.optional(v.string()),
    sections: v.optional(sectionsValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args
    const clean = Object.fromEntries(Object.entries(patch).filter(([, val]) => val !== undefined))
    await ctx.db.patch(id, { ...clean, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { id: v.id('songs') },
  handler: async (ctx, args) => { await ctx.db.delete(args.id) },
})
