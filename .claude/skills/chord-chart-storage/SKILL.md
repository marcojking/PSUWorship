# Chord Chart Storage

Expert knowledge of data storage solutions for worship song chord charts, setlists, and user data.

## Storage Requirements

For a worship chord chart tool, we need to store:
1. **Songs**: Title, artist, key, lyrics with chord positions
2. **Setlists**: Collections of songs for specific services
3. **User preferences**: Default key, display options
4. **Edit history**: Track changes to songs

## Option 1: Airtable (Recommended for this project)

You already have Airtable MCP access. Great for:
- Quick setup, no backend code needed
- Rich field types (attachments, linked records)
- API access for CRUD operations
- Free tier: 1,200 records/base

### Schema Design

**Table: Songs**
| Field | Type | Description |
|-------|------|-------------|
| id | Auto | Primary key |
| title | Text | Song title |
| artist | Text | Artist/band |
| originalKey | Single Select | Original key (C, G, D, etc.) |
| tempo | Number | BPM |
| timeSignature | Text | 4/4, 3/4, 6/8 |
| ccliNumber | Text | CCLI license number |
| content | Long Text | ChordPro format content |
| tags | Multiple Select | Worship, Hymn, Fast, Slow |
| createdAt | Created Time | Auto |
| updatedAt | Last Modified | Auto |

**Table: Setlists**
| Field | Type | Description |
|-------|------|-------------|
| id | Auto | Primary key |
| name | Text | "Sunday Morning 12/29" |
| date | Date | Service date |
| songs | Linked Records | Links to Songs table |
| songOrder | Long Text | JSON array of song IDs in order |
| notes | Long Text | Service notes |

**Table: SetlistSongs** (Junction for ordering)
| Field | Type | Description |
|-------|------|-------------|
| setlist | Linked Record | Link to Setlists |
| song | Linked Record | Link to Songs |
| order | Number | Position in setlist |
| transposedKey | Single Select | Key for this performance |
| notes | Text | Song-specific notes |

### Airtable API Usage

```typescript
// Using the MCP tools available
// List all songs
const songs = await mcp__airtable__list_records({
  baseId: 'appXXXXXXXX',
  tableId: 'Songs',
  sort: [{ field: 'title', direction: 'asc' }],
});

// Search for a song
const results = await mcp__airtable__search_records({
  baseId: 'appXXXXXXXX',
  tableId: 'Songs',
  searchTerm: 'Amazing Grace',
});

// Create a new song
const newSong = await mcp__airtable__create_record({
  baseId: 'appXXXXXXXX',
  tableId: 'Songs',
  fields: {
    title: 'Amazing Grace',
    artist: 'Traditional',
    originalKey: 'G',
    content: '{title: Amazing Grace}\n{key: G}\n\nA[G]mazing...',
  },
});

// Update a song
await mcp__airtable__update_records({
  baseId: 'appXXXXXXXX',
  tableId: 'Songs',
  records: [{
    id: 'recXXXXXXXX',
    fields: { originalKey: 'D' },
  }],
});
```

### Rate Limits

- 5 requests/second
- 100 records per list request
- Use pagination for large datasets

## Option 2: Supabase

Full Postgres database with real-time subscriptions.

### Pros
- SQL queries, full relational DB
- Real-time subscriptions
- Built-in auth
- Generous free tier (500MB)

### Schema

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  original_key TEXT,
  tempo INTEGER,
  time_signature TEXT DEFAULT '4/4',
  ccli_number TEXT,
  content TEXT NOT NULL,  -- ChordPro format
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  transposed_key TEXT,
  notes TEXT,
  UNIQUE(setlist_id, position)
);

-- Index for fast lookups
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_setlist_songs_setlist ON setlist_songs(setlist_id);
```

### Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch songs
const { data: songs } = await supabase
  .from('songs')
  .select('*')
  .order('title');

// Search songs
const { data } = await supabase
  .from('songs')
  .select('*')
  .ilike('title', '%amazing%');

// Get setlist with songs
const { data: setlist } = await supabase
  .from('setlists')
  .select(`
    *,
    setlist_songs (
      position,
      transposed_key,
      songs (*)
    )
  `)
  .eq('id', setlistId)
  .single();
```

## Option 3: Local Storage + IndexedDB

Offline-first, no server needed.

### Pros
- Works offline
- No account needed
- Fast, no network latency
- Free

### Cons
- Data on single device only
- No sync between devices
- Storage limits (typically 50-100MB)

### Implementation with Dexie.js

```bash
npm install dexie
```

```typescript
import Dexie, { Table } from 'dexie';

interface Song {
  id?: number;
  title: string;
  artist?: string;
  key: string;
  content: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Setlist {
  id?: number;
  name: string;
  date?: Date;
  songIds: number[];
  transpositions: Record<number, string>; // songId -> key
}

class WorshipDB extends Dexie {
  songs!: Table<Song>;
  setlists!: Table<Setlist>;

  constructor() {
    super('worship-charts');
    this.version(1).stores({
      songs: '++id, title, artist, *tags',
      setlists: '++id, name, date',
    });
  }
}

const db = new WorshipDB();

// Add song
const songId = await db.songs.add({
  title: 'Amazing Grace',
  key: 'G',
  content: '...',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Search songs
const matches = await db.songs
  .where('title')
  .startsWithIgnoreCase('amazing')
  .toArray();

// Get all songs with tag
const worshipSongs = await db.songs
  .where('tags')
  .equals('worship')
  .toArray();
```

## Option 4: Hybrid Approach

Best of both worlds: local-first with optional cloud sync.

```typescript
// Store locally first
await db.songs.add(song);

// Optionally sync to Airtable/Supabase in background
if (navigator.onLine && userWantsSync) {
  await syncToCloud(song);
}

// On app load, sync from cloud
async function syncFromCloud() {
  const cloudSongs = await fetchFromAirtable();
  for (const song of cloudSongs) {
    await db.songs.put(song); // Upsert
  }
}
```

## ChordPro Format for Storage

Store songs in ChordPro format - industry standard, easy to parse:

```
{title: Amazing Grace}
{artist: Traditional}
{key: G}
{tempo: 72}
{time: 4/4}

{comment: Verse 1}
A[G]mazing [G/B]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G/B]lost but [C]now am [G]found
Was [G]blind but [D]now I [G]see

{comment: Verse 2}
'Twas [G]grace that [G/B]taught my [C]heart to [G]fear
...
```

### Parsing/Serialization

```typescript
function parseChordPro(content: string): ParsedSong {
  const lines = content.split('\n');
  const metadata: Record<string, string> = {};
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const line of lines) {
    // Metadata directive
    const metaMatch = line.match(/^\{(\w+):\s*(.+)\}$/);
    if (metaMatch) {
      const [, key, value] = metaMatch;
      if (key === 'comment' || key === 'c') {
        currentSection = { type: inferSectionType(value), label: value, lines: [] };
        sections.push(currentSection);
      } else {
        metadata[key] = value;
      }
      continue;
    }

    // Chord/lyric line
    if (line.trim() && currentSection) {
      currentSection.lines.push(parseChordLine(line));
    }
  }

  return { metadata, sections };
}

function parseChordLine(line: string): ChordLine {
  const chords: { chord: string; position: number }[] = [];
  let lyrics = '';
  let position = 0;

  const regex = /\[([^\]]+)\]|([^\[]+)/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match[1]) {
      // Chord
      chords.push({ chord: match[1], position });
    } else if (match[2]) {
      // Lyrics
      lyrics += match[2];
      position += match[2].length;
    }
  }

  return { lyrics, chords };
}
```

## Recommendation

For **PSUWorship**, I recommend:

1. **Primary**: Airtable (you already have MCP access)
   - Quick to set up
   - Works across devices
   - Good for small-medium scale

2. **Enhancement**: Add IndexedDB caching
   - Offline support
   - Faster reads
   - Sync to Airtable when online

This gives you cloud storage with offline capability.
