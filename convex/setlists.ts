import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const setlistSongsValidator = v.array(v.object({
  songId:        v.id('songs'),
  transposedKey: v.optional(v.string()),
  order:         v.number(),
}))

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('setlists').collect()
    return all.sort((a, b) => b.date.localeCompare(a.date))
  },
})

export const get = query({
  args: { id: v.id('setlists') },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

// Setlist plus its songs, ordered, with the per-setlist transposedKey merged in.
// Skips songs that no longer exist (parity with the old Dexie join).
export const getWithSongs = query({
  args: { id: v.id('setlists') },
  handler: async (ctx, args) => {
    const setlist = await ctx.db.get(args.id)
    if (!setlist) return null
    const ordered = [...setlist.songs].sort((a, b) => a.order - b.order)
    const songs = []
    for (const entry of ordered) {
      const song = await ctx.db.get(entry.songId)
      if (song) songs.push({ ...song, transposedKey: entry.transposedKey })
    }
    return { setlist, songs }
  },
})

export const create = mutation({
  args: {
    name:       v.string(),
    date:       v.string(),
    time:       v.string(),
    location:   v.string(),
    bibleVerse: v.optional(v.string()),
    songs:      setlistSongsValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return ctx.db.insert('setlists', { ...args, createdAt: now, updatedAt: now })
  },
})

export const update = mutation({
  args: {
    id:         v.id('setlists'),
    name:       v.optional(v.string()),
    date:       v.optional(v.string()),
    time:       v.optional(v.string()),
    location:   v.optional(v.string()),
    bibleVerse: v.optional(v.string()),
    songs:      v.optional(setlistSongsValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args
    const clean = Object.fromEntries(Object.entries(patch).filter(([, val]) => val !== undefined))
    await ctx.db.patch(id, { ...clean, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { id: v.id('setlists') },
  handler: async (ctx, args) => { await ctx.db.delete(args.id) },
})
