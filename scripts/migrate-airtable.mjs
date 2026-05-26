// One-time migration: Airtable (Songs + Setlists) -> Convex.
// Run from repo root:  node scripts/migrate-airtable.mjs        (dry run / guarded)
//                      FORCE=1 node scripts/migrate-airtable.mjs  (write even if Convex has songs)
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local', quiet: true })
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL
const BASE = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
const KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
if (!CONVEX_URL || !BASE || !KEY) { console.error('Missing CONVEX_URL / Airtable env'); process.exit(1) }

const convex = new ConvexHttpClient(CONVEX_URL)

async function airtable(table, sortField, dir) {
  const all = []
  let offset
  do {
    const p = new URLSearchParams()
    if (offset) p.set('offset', offset)
    p.set('sort[0][field]', sortField)
    p.set('sort[0][direction]', dir)
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${p}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    })
    if (!res.ok) throw new Error(`Airtable ${table}: ${res.status} ${await res.text()}`)
    const json = await res.json()
    all.push(...json.records)
    offset = json.offset
  } while (offset)
  return all
}

async function main() {
  const existing = await convex.query(api.songs.list, {})
  if (existing.length > 0 && !process.env.FORCE) {
    console.error(`Convex already has ${existing.length} songs. Re-running would duplicate.`)
    console.error('If you intend to add anyway, run again with FORCE=1.')
    process.exit(1)
  }

  const songs = await airtable('Songs', 'title', 'asc')
  console.log(`Airtable: ${songs.length} songs`)
  const idMap = new Map() // localId -> Convex Id
  let songCount = 0, songSkipped = 0
  for (const rec of songs) {
    const f = rec.fields
    let sections
    try { sections = JSON.parse(f.sections || '[]') } catch { songSkipped++; console.warn(`  ! bad sections JSON: ${f.title}`); continue }
    const id = await convex.mutation(api.songs.create, {
      title: f.title || 'Untitled',
      artist: f.artist || '',
      key: f.key || 'C',
      sections,
    })
    if (f.localId !== undefined && f.localId !== null) idMap.set(Number(f.localId), id)
    songCount++
    process.stdout.write(`\r  songs: ${songCount}/${songs.length}`)
  }
  console.log('')

  const setlists = await airtable('Setlists', 'date', 'desc')
  console.log(`Airtable: ${setlists.length} setlists`)
  let setCount = 0, refSkipped = 0
  for (const rec of setlists) {
    const f = rec.fields
    let raw
    try { raw = JSON.parse(f.songs || '[]') } catch { console.warn(`  ! bad songs JSON: ${f.name}`); raw = [] }
    const mapped = []
    for (const s of raw) {
      const newId = idMap.get(Number(s.songId))
      if (!newId) { refSkipped++; continue }
      mapped.push({ songId: newId, transposedKey: s.transposedKey || undefined, order: s.order ?? mapped.length })
    }
    await convex.mutation(api.setlists.create, {
      name: f.name || 'Untitled',
      date: f.date || '',
      time: f.time || '',
      location: f.location || '',
      bibleVerse: f.bibleVerse || undefined,
      songs: mapped,
    })
    setCount++
    console.log(`  ✓ ${f.name} (${mapped.length} songs)`)
  }

  console.log(`\nDone. Migrated ${songCount} songs (${songSkipped} skipped) and ${setCount} setlists (${refSkipped} song refs skipped).`)
  process.exit(0)
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1) })
