import type { PracticeSong } from '../types';

// Chords/structure are ground truth from the SongSelect chart (Gb) transposed
// down 2 semitones to E; Ultimate Guitar confirms the form and progression but
// writes plain triads, so the richer SongSelect voicings win. Lyric fields hold
// short CUES only — enough to find your place — not the copyrighted lyric.
export const WASHED: PracticeSong = {
  id: 'washed',
  title: 'Washed',
  artist: 'Elevation Rhythm',
  concertKey: 'E',
  tempo: 139,
  lead: 'Marco',
  sourceNote:
    'SongSelect chart in Gb transposed to E; form and progressions verified against Ultimate Guitar (2026-09-01). ' +
    'UG writes plain triads (E A B C#m) — we keep the SongSelect voicings A2 / B(4) / C#m7 / F#m7(4).',
  lyricsNote: 'Chords and structure only — full lyrics are in the team Drive folder (SongSelect PDFs).',
  sections: [
    {
      type: 'chorus',
      label: 'Chorus (1st x a cappella)',
      lines: [
        { lyrics: "I've been washed in the water…", chords: [{ chord: 'E', position: 0 }, { chord: 'A2', position: 16 }] },
        { lyrics: "I'm as good as new…", chords: [{ chord: 'C#m7', position: 0 }, { chord: 'B7sus', position: 11 }] },
        { lyrics: "I've been washed in the water…", chords: [{ chord: 'E', position: 0 }, { chord: 'A2', position: 16 }] },
        { lyrics: 'All because of You…', chords: [{ chord: 'C#m7', position: 0 }, { chord: 'B7sus', position: 11 }] },
      ],
    },
    {
      type: 'instrumental',
      label: 'Turnaround',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
        {
          lyrics: '',
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 1',
      lines: [
        {
          lyrics: "I'm clean, sin was stained…",
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
        { lyrics: 'Shame was running deep…', chords: [{ chord: 'E/G#', position: 0 }, { chord: 'A2', position: 12 }] },
        {
          lyrics: 'Love was spilled on Calvary…',
          chords: [
            { chord: 'B(4)', position: 0 },
            { chord: 'C#m7', position: 8 },
            { chord: 'F#m7(4)', position: 16 },
            { chord: 'B7sus', position: 24 },
          ],
        },
        {
          lyrics: "I'm clean, God how can it be…",
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
        { lyrics: "I'm ransomed and redeemed…", chords: [{ chord: 'E/G#', position: 0 }, { chord: 'A2', position: 14 }] },
        {
          lyrics: 'Standing in Your victory…',
          chords: [
            { chord: 'B(4)', position: 0 },
            { chord: 'C#m7', position: 8 },
            { chord: 'F#m7(4)', position: 16 },
            { chord: 'B7sus', position: 24 },
          ],
        },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 2',
      lines: [
        {
          lyrics: "I'm clean, it's not what I…",
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
        { lyrics: "But what You've done…", chords: [{ chord: 'E/G#', position: 0 }, { chord: 'A2', position: 12 }] },
        {
          lyrics: 'You paid it all upon that…',
          chords: [
            { chord: 'B(4)', position: 0 },
            { chord: 'C#m7', position: 8 },
            { chord: 'F#m7(4)', position: 16 },
            { chord: 'B7sus', position: 24 },
          ],
        },
        {
          lyrics: "I'm clean, Your love has…",
          chords: [
            { chord: 'E/G#', position: 0 },
            { chord: 'A2', position: 8 },
            { chord: 'B(4)', position: 16 },
            { chord: 'C#m7', position: 24 },
          ],
        },
        { lyrics: 'Your mercy is supreme…', chords: [{ chord: 'E/G#', position: 0 }, { chord: 'A2', position: 12 }] },
        {
          lyrics: "I'm dancing in Your victory…",
          chords: [
            { chord: 'B(4)', position: 0 },
            { chord: 'C#m7', position: 8 },
            { chord: 'F#m7(4)', position: 16 },
            { chord: 'B7sus', position: 24 },
          ],
        },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge (×4)',
      lines: [
        { lyrics: "'Cause You took away…", chords: [{ chord: 'E', position: 0 }] },
        { lyrics: 'And You nailed it…', chords: [{ chord: 'A2', position: 0 }] },
        { lyrics: 'You got me running…', chords: [{ chord: 'C#m7', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'A2', position: 0 }] },
      ],
    },
    {
      type: 'tag',
      label: 'Tag',
      lines: [
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'E', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'A2', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'C#m7', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'A2', position: 0 }] },
      ],
    },
  ],
};
