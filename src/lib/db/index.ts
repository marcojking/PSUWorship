import Dexie, { type Table } from 'dexie';

// Import sync functions (lazy loaded to avoid circular dependencies)
let syncModule: typeof import('./sync') | null = null;
async function getSyncModule() {
  if (!syncModule) {
    syncModule = await import('./sync');
  }
  return syncModule;
}

// Types for our data models
export interface Song {
  id?: number;
  title: string;
  artist: string;
  key: string;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'tag' | 'pre-chorus';
  label: string;
  lines: ChordLine[];
}

export interface ChordLine {
  lyrics: string;
  chords: ChordPosition[];
}

export interface ChordPosition {
  chord: string;
  position: number; // character index in lyrics
}

export interface Setlist {
  id?: number;
  name: string;
  date: string;
  time: string;
  location: string;
  bibleVerse?: string; // For pamphlet back cover
  songs: SetlistSong[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SetlistSong {
  songId: number;
  transposedKey?: string; // If different from original
  order: number;
}

// Database class
class WorshipDB extends Dexie {
  songs!: Table<Song>;
  setlists!: Table<Setlist>;

  constructor() {
    super('worship-charts');
    this.version(1).stores({
      songs: '++id, title, artist, key, createdAt',
      setlists: '++id, name, date, createdAt',
    });
  }
}

export const db = new WorshipDB();

// Helper functions
export async function getAllSongs(): Promise<Song[]> {
  return db.songs.orderBy('title').toArray();
}

export async function getSong(id: number): Promise<Song | undefined> {
  return db.songs.get(id);
}

export async function addSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  const id = await db.songs.add({
    ...song,
    createdAt: now,
    updatedAt: now,
  });

  // Sync to Airtable in background
  const newSong = await db.songs.get(id);
  if (newSong) {
    getSyncModule().then(sync => sync.syncSongToAirtable(newSong)).catch(console.error);
  }

  return id;
}

export async function updateSong(id: number, updates: Partial<Song>): Promise<void> {
  await db.songs.update(id, {
    ...updates,
    updatedAt: new Date(),
  });

  // Sync to Airtable in background
  const updatedSong = await db.songs.get(id);
  if (updatedSong) {
    getSyncModule().then(sync => sync.syncSongToAirtable(updatedSong)).catch(console.error);
  }
}

export async function deleteSong(id: number): Promise<void> {
  await db.songs.delete(id);

  // Delete from Airtable in background
  getSyncModule().then(sync => sync.deleteSongFromAirtable(id)).catch(console.error);
}

export async function getAllSetlists(): Promise<Setlist[]> {
  return db.setlists.orderBy('date').reverse().toArray();
}

export async function getSetlist(id: number): Promise<Setlist | undefined> {
  return db.setlists.get(id);
}

export async function addSetlist(setlist: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  const id = await db.setlists.add({
    ...setlist,
    createdAt: now,
    updatedAt: now,
  });

  // Sync to Airtable in background
  const newSetlist = await db.setlists.get(id);
  if (newSetlist) {
    getSyncModule().then(sync => sync.syncSetlistToAirtable(newSetlist)).catch(console.error);
  }

  return id;
}

export async function updateSetlist(id: number, updates: Partial<Setlist>): Promise<void> {
  await db.setlists.update(id, {
    ...updates,
    updatedAt: new Date(),
  });

  // Sync to Airtable in background
  const updatedSetlist = await db.setlists.get(id);
  if (updatedSetlist) {
    getSyncModule().then(sync => sync.syncSetlistToAirtable(updatedSetlist)).catch(console.error);
  }
}

export async function deleteSetlist(id: number): Promise<void> {
  await db.setlists.delete(id);

  // Delete from Airtable in background
  getSyncModule().then(sync => sync.deleteSetlistFromAirtable(id)).catch(console.error);
}

// Get songs for a setlist with full data
export async function getSetlistWithSongs(id: number): Promise<{ setlist: Setlist; songs: (Song & { transposedKey?: string })[] } | null> {
  const setlist = await getSetlist(id);
  if (!setlist) return null;

  const songs: (Song & { transposedKey?: string })[] = [];
  for (const setlistSong of setlist.songs.sort((a, b) => a.order - b.order)) {
    const song = await getSong(setlistSong.songId);
    if (song) {
      songs.push({
        ...song,
        transposedKey: setlistSong.transposedKey,
      });
    }
  }

  return { setlist, songs };
}
