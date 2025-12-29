// Sync service for bidirectional Airtable synchronization

import { db, Song, Setlist } from './index';
import * as airtable from '../airtable';

// Track Airtable record IDs for local records
interface SyncMetadata {
  id?: number;
  tableName: 'songs' | 'setlists';
  localId: number;
  airtableId: string;
  lastSyncedAt: Date;
}

// Extend Dexie to include sync metadata table
class SyncDB {
  private static metadata: Map<string, SyncMetadata> = new Map();

  static getKey(tableName: string, localId: number): string {
    return `${tableName}:${localId}`;
  }

  static async getAirtableId(tableName: 'songs' | 'setlists', localId: number): Promise<string | null> {
    const key = this.getKey(tableName, localId);
    const meta = this.metadata.get(key);
    return meta?.airtableId || null;
  }

  static async setAirtableId(tableName: 'songs' | 'setlists', localId: number, airtableId: string): Promise<void> {
    const key = this.getKey(tableName, localId);
    this.metadata.set(key, {
      tableName,
      localId,
      airtableId,
      lastSyncedAt: new Date(),
    });
    // Also persist to localStorage for durability
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('airtable_sync_metadata') || '{}');
        stored[key] = { tableName, localId, airtableId, lastSyncedAt: new Date().toISOString() };
        localStorage.setItem('airtable_sync_metadata', JSON.stringify(stored));
      } catch (e) {
        console.warn('Failed to persist sync metadata:', e);
      }
    }
  }

  static async removeAirtableId(tableName: 'songs' | 'setlists', localId: number): Promise<void> {
    const key = this.getKey(tableName, localId);
    this.metadata.delete(key);
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('airtable_sync_metadata') || '{}');
        delete stored[key];
        localStorage.setItem('airtable_sync_metadata', JSON.stringify(stored));
      } catch (e) {
        console.warn('Failed to persist sync metadata:', e);
      }
    }
  }

  static loadFromStorage(): void {
    try {
      const stored = JSON.parse(localStorage.getItem('airtable_sync_metadata') || '{}');
      for (const [key, value] of Object.entries(stored)) {
        const meta = value as { tableName: 'songs' | 'setlists'; localId: number; airtableId: string; lastSyncedAt: string };
        this.metadata.set(key, {
          ...meta,
          lastSyncedAt: new Date(meta.lastSyncedAt),
        });
      }
    } catch (e) {
      console.warn('Failed to load sync metadata:', e);
    }
  }
}

// Initialize sync metadata from localStorage
if (typeof window !== 'undefined') {
  SyncDB.loadFromStorage();
}

// Convert local Song to Airtable format
function songToAirtable(song: Song): airtable.AirtableSong['fields'] {
  return {
    localId: song.id,
    title: song.title,
    artist: song.artist,
    key: song.key,
    sections: JSON.stringify(song.sections),
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
  };
}

// Convert Airtable song to local format
function airtableToSong(record: airtable.AirtableSong): Omit<Song, 'id'> & { id?: number } {
  return {
    id: record.fields.localId,
    title: record.fields.title,
    artist: record.fields.artist,
    key: record.fields.key,
    sections: JSON.parse(record.fields.sections || '[]'),
    createdAt: new Date(record.fields.createdAt),
    updatedAt: new Date(record.fields.updatedAt),
  };
}

// Convert local Setlist to Airtable format
function setlistToAirtable(setlist: Setlist): airtable.AirtableSetlist['fields'] {
  return {
    localId: setlist.id,
    name: setlist.name,
    date: setlist.date,
    time: setlist.time,
    location: setlist.location,
    songs: JSON.stringify(setlist.songs),
    createdAt: setlist.createdAt.toISOString(),
    updatedAt: setlist.updatedAt.toISOString(),
  };
}

// Convert Airtable setlist to local format
function airtableToSetlist(record: airtable.AirtableSetlist): Omit<Setlist, 'id'> & { id?: number } {
  return {
    id: record.fields.localId,
    name: record.fields.name,
    date: record.fields.date,
    time: record.fields.time,
    location: record.fields.location,
    songs: JSON.parse(record.fields.songs || '[]'),
    createdAt: new Date(record.fields.createdAt),
    updatedAt: new Date(record.fields.updatedAt),
  };
}

// Sync a single song to Airtable
export async function syncSongToAirtable(song: Song): Promise<void> {
  if (!airtable.isAirtableConfigured() || !song.id) return;

  try {
    const airtableId = await SyncDB.getAirtableId('songs', song.id);

    if (airtableId) {
      // Update existing record
      await airtable.updateSong(airtableId, songToAirtable(song));
    } else {
      // Create new record
      const created = await airtable.createSong(songToAirtable(song));
      if (created.id) {
        await SyncDB.setAirtableId('songs', song.id, created.id);
      }
    }
  } catch (error) {
    console.error('Failed to sync song to Airtable:', error);
    throw error;
  }
}

// Sync a single setlist to Airtable
export async function syncSetlistToAirtable(setlist: Setlist): Promise<void> {
  if (!airtable.isAirtableConfigured() || !setlist.id) return;

  try {
    const airtableId = await SyncDB.getAirtableId('setlists', setlist.id);

    if (airtableId) {
      // Update existing record
      await airtable.updateSetlist(airtableId, setlistToAirtable(setlist));
    } else {
      // Create new record
      const created = await airtable.createSetlist(setlistToAirtable(setlist));
      if (created.id) {
        await SyncDB.setAirtableId('setlists', setlist.id, created.id);
      }
    }
  } catch (error) {
    console.error('Failed to sync setlist to Airtable:', error);
    throw error;
  }
}

// Delete a song from Airtable
export async function deleteSongFromAirtable(localId: number): Promise<void> {
  if (!airtable.isAirtableConfigured()) return;

  try {
    const airtableId = await SyncDB.getAirtableId('songs', localId);
    if (airtableId) {
      await airtable.deleteSong(airtableId);
      await SyncDB.removeAirtableId('songs', localId);
    }
  } catch (error) {
    console.error('Failed to delete song from Airtable:', error);
    throw error;
  }
}

// Delete a setlist from Airtable
export async function deleteSetlistFromAirtable(localId: number): Promise<void> {
  if (!airtable.isAirtableConfigured()) return;

  try {
    const airtableId = await SyncDB.getAirtableId('setlists', localId);
    if (airtableId) {
      await airtable.deleteSetlist(airtableId);
      await SyncDB.removeAirtableId('setlists', localId);
    }
  } catch (error) {
    console.error('Failed to delete setlist from Airtable:', error);
    throw error;
  }
}

// Pull all songs from Airtable and update local database
export async function pullSongsFromAirtable(): Promise<{ added: number; updated: number }> {
  if (!airtable.isAirtableConfigured()) {
    return { added: 0, updated: 0 };
  }

  let added = 0;
  let updated = 0;

  try {
    const remoteSongs = await airtable.fetchAllSongs();

    for (const remoteSong of remoteSongs) {
      const localSong = airtableToSong(remoteSong);

      if (localSong.id) {
        // Check if exists locally
        const existing = await db.songs.get(localSong.id);
        if (existing) {
          // Update if remote is newer
          if (localSong.updatedAt > existing.updatedAt) {
            await db.songs.update(localSong.id, localSong);
            updated++;
          }
        } else {
          // Add locally with the same ID
          await db.songs.put(localSong as Song);
          added++;
        }
        // Ensure sync metadata is set
        if (remoteSong.id) {
          await SyncDB.setAirtableId('songs', localSong.id, remoteSong.id);
        }
      } else {
        // No localId - this is a new record from Airtable
        const id = await db.songs.add({
          ...localSong,
          createdAt: localSong.createdAt || new Date(),
          updatedAt: localSong.updatedAt || new Date(),
        } as Song);
        if (remoteSong.id) {
          await SyncDB.setAirtableId('songs', id, remoteSong.id);
          // Update Airtable with the local ID
          await airtable.updateSong(remoteSong.id, { localId: id });
        }
        added++;
      }
    }
  } catch (error) {
    console.error('Failed to pull songs from Airtable:', error);
    throw error;
  }

  return { added, updated };
}

// Pull all setlists from Airtable and update local database
export async function pullSetlistsFromAirtable(): Promise<{ added: number; updated: number }> {
  if (!airtable.isAirtableConfigured()) {
    return { added: 0, updated: 0 };
  }

  let added = 0;
  let updated = 0;

  try {
    const remoteSetlists = await airtable.fetchAllSetlists();

    for (const remoteSetlist of remoteSetlists) {
      const localSetlist = airtableToSetlist(remoteSetlist);

      if (localSetlist.id) {
        // Check if exists locally
        const existing = await db.setlists.get(localSetlist.id);
        if (existing) {
          // Update if remote is newer
          if (localSetlist.updatedAt > existing.updatedAt) {
            await db.setlists.update(localSetlist.id, localSetlist);
            updated++;
          }
        } else {
          // Add locally with the same ID
          await db.setlists.put(localSetlist as Setlist);
          added++;
        }
        // Ensure sync metadata is set
        if (remoteSetlist.id) {
          await SyncDB.setAirtableId('setlists', localSetlist.id, remoteSetlist.id);
        }
      } else {
        // No localId - this is a new record from Airtable
        const id = await db.setlists.add({
          ...localSetlist,
          createdAt: localSetlist.createdAt || new Date(),
          updatedAt: localSetlist.updatedAt || new Date(),
        } as Setlist);
        if (remoteSetlist.id) {
          await SyncDB.setAirtableId('setlists', id, remoteSetlist.id);
          // Update Airtable with the local ID
          await airtable.updateSetlist(remoteSetlist.id, { localId: id });
        }
        added++;
      }
    }
  } catch (error) {
    console.error('Failed to pull setlists from Airtable:', error);
    throw error;
  }

  return { added, updated };
}

// Push all local songs to Airtable
export async function pushAllSongsToAirtable(): Promise<{ synced: number }> {
  if (!airtable.isAirtableConfigured()) {
    return { synced: 0 };
  }

  let synced = 0;

  try {
    const localSongs = await db.songs.toArray();

    for (const song of localSongs) {
      await syncSongToAirtable(song);
      synced++;
    }
  } catch (error) {
    console.error('Failed to push songs to Airtable:', error);
    throw error;
  }

  return { synced };
}

// Push all local setlists to Airtable
export async function pushAllSetlistsToAirtable(): Promise<{ synced: number }> {
  if (!airtable.isAirtableConfigured()) {
    return { synced: 0 };
  }

  let synced = 0;

  try {
    const localSetlists = await db.setlists.toArray();

    for (const setlist of localSetlists) {
      await syncSetlistToAirtable(setlist);
      synced++;
    }
  } catch (error) {
    console.error('Failed to push setlists to Airtable:', error);
    throw error;
  }

  return { synced };
}

// Full sync - pull then push
export async function fullSync(): Promise<{
  songs: { added: number; updated: number; pushed: number };
  setlists: { added: number; updated: number; pushed: number };
}> {
  if (!airtable.isAirtableConfigured()) {
    return {
      songs: { added: 0, updated: 0, pushed: 0 },
      setlists: { added: 0, updated: 0, pushed: 0 },
    };
  }

  // Pull first to get any remote changes
  const songsPull = await pullSongsFromAirtable();
  const setlistsPull = await pullSetlistsFromAirtable();

  // Then push local changes
  const songsPush = await pushAllSongsToAirtable();
  const setlistsPush = await pushAllSetlistsToAirtable();

  return {
    songs: { ...songsPull, pushed: songsPush.synced },
    setlists: { ...setlistsPull, pushed: setlistsPush.synced },
  };
}

// Export for use
export { airtable };
