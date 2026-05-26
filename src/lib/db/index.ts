// Shared data types. Convex is the source of truth — these mirror the Convex
// schema (convex/schema.ts). Songs/setlists are read/written via the Convex API
// (api.songs.* / api.setlists.*); there is no local database anymore.
import type { Doc, Id } from '../../../convex/_generated/dataModel';

export type { Id };

export type SectionType =
  | 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'tag' | 'pre-chorus';

export interface ChordPosition {
  chord: string;
  position: number; // character index in lyrics
}

export interface ChordLine {
  lyrics: string;
  chords: ChordPosition[];
}

export interface Section {
  type: string; // one of SectionType, kept as string to match the Convex-inferred shape
  label: string;
  lines: ChordLine[];
  slideBreaks?: number[];
}

export type Song = Doc<'songs'>;
export type Setlist = Doc<'setlists'>;

// Shape for creating a song (matches api.songs.create args).
export type NewSong = {
  title: string;
  artist: string;
  key: string;
  sections: Section[];
};

// A song as it appears inside a setlist (with the per-setlist key override merged in).
export type SongWithKey = Song & { transposedKey?: string };

// One entry in a setlist's song list.
export type SetlistSong = {
  songId: Id<'songs'>;
  transposedKey?: string;
  order: number;
};
