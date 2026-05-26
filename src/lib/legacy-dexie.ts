// Read-only access to the legacy IndexedDB (pre-Convex) data, used solely by the
// one-time migration page. Delete this file once everyone has migrated.
import Dexie, { type Table } from 'dexie';
import type { Section } from '@/lib/db';

export interface LegacySong {
  id?: number;
  title: string;
  artist: string;
  key: string;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LegacySetlistSong {
  songId: number;
  transposedKey?: string;
  order: number;
}

export interface LegacySetlist {
  id?: number;
  name: string;
  date: string;
  time: string;
  location: string;
  bibleVerse?: string;
  songs: LegacySetlistSong[];
  createdAt: Date;
  updatedAt: Date;
}

class LegacyDB extends Dexie {
  songs!: Table<LegacySong>;
  setlists!: Table<LegacySetlist>;

  constructor() {
    super('worship-charts');
    this.version(1).stores({
      songs: '++id, title, artist, key, createdAt',
      setlists: '++id, name, date, createdAt',
    });
  }
}

const legacyDb = new LegacyDB();

export async function getLegacySongs(): Promise<LegacySong[]> {
  return legacyDb.songs.toArray();
}

export async function getLegacySetlists(): Promise<LegacySetlist[]> {
  return legacyDb.setlists.toArray();
}
