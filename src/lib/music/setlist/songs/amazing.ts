import type { PracticeSong } from '../types';

// Chords/structure are ground truth from the SongSelect chart (Gb) transposed
// down a half step to F, cross-checked against the Ultimate Guitar chart
// (written in G shapes, down 2 semitones to F). Lyric fields hold short CUES
// only — enough to find your place — not the copyrighted lyric.
export const AMAZING: PracticeSong = {
  id: 'amazing',
  title: 'Amazing!',
  artist: 'ELEVATION RHYTHM & Josiah Queen',
  concertKey: 'F',
  tempo: 145,
  lead: 'Janae / Grant',
  sourceNote:
    'SongSelect chart in Gb transposed down a half step to F; section order and progressions verified against Ultimate Guitar (2026-09-01). ' +
    'Bridge bar 2 is F/A per SongSelect — UG plays Am there; either works.',
  lyricsNote: 'Chords and structure only — full lyrics are in the team Drive folder (SongSelect PDFs).',
  sections: [
    {
      type: 'intro',
      label: 'Intro',
      lines: [
        { lyrics: '', chords: [{ chord: 'F', position: 0 }, { chord: 'Fsus', position: 8 }] },
      ],
    },
    {
      type: 'chorus',
      label: 'Chorus A',
      lines: [
        { lyrics: 'I was stuck in my shame…', chords: [{ chord: 'F', position: 0 }, { chord: 'Fsus', position: 12 }] },
        { lyrics: 'I once was blind…', chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'I was headed for hell…', chords: [{ chord: 'Fsus', position: 0 }] },
        { lyrics: "Now heaven's my home…", chords: [{ chord: 'F', position: 0 }] },
      ],
    },
    {
      type: 'chorus',
      label: 'Chorus B (band in)',
      lines: [
        { lyrics: 'I was stuck in my shame…', chords: [{ chord: 'F', position: 0 }, { chord: 'Bb', position: 12 }] },
        { lyrics: 'I once was blind…', chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'I was headed for hell…', chords: [{ chord: 'Bb', position: 0 }] },
        { lyrics: "Now heaven's my home…", chords: [{ chord: 'Dm', position: 0 }] },
      ],
    },
    {
      type: 'verse',
      label: 'Verse',
      lines: [
        { lyrics: 'I believe He died…', chords: [{ chord: 'C', position: 0 }, { chord: 'Bb', position: 10 }] },
        { lyrics: 'He walked right out the grave…', chords: [{ chord: 'F', position: 0 }, { chord: 'Dm', position: 16 }] },
        { lyrics: 'I believe He cleared my name…', chords: [{ chord: 'C', position: 0 }, { chord: 'Bb', position: 15 }] },
        {
          lyrics: 'Full of life, dancing…',
          chords: [{ chord: 'F', position: 0 }, { chord: 'C/E', position: 8 }, { chord: 'Dm', position: 16 }],
        },
        { lyrics: "Isn't that amazing…", chords: [{ chord: 'C', position: 0 }, { chord: 'Bb', position: 10 }] },
        { lyrics: '', chords: [{ chord: 'F', position: 0 }, { chord: 'Dm', position: 8 }] },
        { lyrics: '', chords: [{ chord: 'C', position: 0 }, { chord: 'Bb', position: 8 }] },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge (×4)',
      lines: [
        { lyrics: 'Hallelujah to the man…', chords: [{ chord: 'F', position: 0 }, { chord: 'F/A', position: 12 }] },
        { lyrics: "He didn't owe the debt…", chords: [{ chord: 'Dm', position: 0 }, { chord: 'Bb', position: 12 }] },
        { lyrics: 'He rolled away the stone…', chords: [{ chord: 'F', position: 0 }, { chord: 'F/A', position: 13 }] },
        { lyrics: "I'm gettin' up…", chords: [{ chord: 'Dm', position: 0 }, { chord: 'Bb', position: 8 }] },
      ],
    },
    {
      type: 'tag',
      label: 'Tag',
      lines: [
        {
          lyrics: "I'm gettin' up…",
          chords: [{ chord: 'Gm', position: 0 }, { chord: 'F/A', position: 5 }, { chord: 'Bb', position: 10 }],
        },
        {
          lyrics: "I'm gettin' up…",
          chords: [{ chord: 'Dm', position: 0 }, { chord: 'C/E', position: 5 }, { chord: 'F', position: 10 }],
        },
      ],
    },
    {
      type: 'outro',
      label: 'Outro (same changes as Verse)',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'C', position: 0 },
            { chord: 'Bb', position: 8 },
            { chord: 'F', position: 16 },
            { chord: 'Dm', position: 24 },
          ],
        },
      ],
    },
  ],
};
