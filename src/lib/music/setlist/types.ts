import type { Section } from '@/lib/db';

export interface PracticeSong {
  id: string;
  title: string;
  artist: string;
  concertKey: string;   // key the band sounds in
  tempo?: number;
  lead?: string;        // e.g. 'Janae / Grant'
  sourceNote?: string;  // provenance, e.g. 'From SongSelect chart, verified vs UG'
  lyricsNote?: string;  // shown when the chart carries lyric cues instead of full lyrics
  sections: Section[];  // chords stored in concertKey
}

export type SetEntry =
  | { kind: 'link'; title: string; keyLabel: string; lead: string; href: string; note: string }
  | { kind: 'mashup'; title: string; songs: PracticeSong[]; note?: string }
  | { kind: 'song'; song: PracticeSong }
  | { kind: 'placeholder'; title: string; artist?: string; note: string };

export interface TransitionNote {
  afterIndex: number; // render after entries[afterIndex]
  text: string;
}

export interface PlayerView {
  id: string;          // 'everyone' | 'marco' | 'grant' | 'clair'
  name: string;
  instrument: 'concert' | 'acoustic' | 'piano';
  // concert key -> default capo for this player; keys not listed default to 0
  capoByKey: Record<string, number>;
  hint?: string;       // shown under the picker when selected
}
