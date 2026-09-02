import type { PracticeSong } from '../types';

// Chords/structure are ground truth from the SongSelect chart (Gb) transposed
// down a half step to F; Ultimate Guitar confirms the form and progression but
// writes plain triads, so the richer SongSelect voicings win. Lyric fields hold
// short CUES only — enough to find your place — not the copyrighted lyric.
export const WASHED: PracticeSong = {
  id: 'washed',
  title: 'Washed',
  artist: 'Elevation Rhythm',
  concertKey: 'F',
  tempo: 139,
  lead: 'Marco',
  sourceNote:
    'SongSelect chart in Gb transposed down a half step to F; form and progressions verified against Ultimate Guitar (2026-09-01). ' +
    'UG writes plain triads (F Bb C Dm) — we keep the SongSelect voicings Bb2 / C(4) / Dm7 / Gm7(4).',
  lyricsNote: 'Chords and structure only — full lyrics are in the team Drive folder (SongSelect PDFs).',
  sections: [
    {
      type: 'chorus',
      label: 'Chorus (1st x a cappella)',
      lines: [
        { lyrics: "I've been washed in the water…", chords: [{ chord: 'F', position: 0 }, { chord: 'Bb2', position: 16 }] },
        { lyrics: "I'm as good as new…", chords: [{ chord: 'Dm7', position: 0 }, { chord: 'C', position: 11 }] },
        { lyrics: "I've been washed in the water…", chords: [{ chord: 'F', position: 0 }, { chord: 'Bb2', position: 16 }] },
        { lyrics: 'All because of You…', chords: [{ chord: 'Dm7', position: 0 }, { chord: 'C', position: 11 }] },
      ],
    },
    {
      type: 'instrumental',
      label: 'Turnaround',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
          ],
        },
        {
          lyrics: '',
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
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
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
          ],
        },
        { lyrics: 'Shame was running deep…', chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 12 }] },
        {
          lyrics: 'Love was spilled on Calvary…',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 8 },
            { chord: 'Gm7(4)', position: 16 },
            { chord: 'C7sus', position: 24 },
          ],
        },
        {
          lyrics: "I'm clean, God how can it be…",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
          ],
        },
        { lyrics: "I'm ransomed and redeemed…", chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 14 }] },
        {
          lyrics: 'Standing in Your victory…',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 8 },
            { chord: 'Gm7(4)', position: 16 },
            { chord: 'C7sus', position: 24 },
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
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
          ],
        },
        { lyrics: "But what You've done…", chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 12 }] },
        {
          lyrics: 'You paid it all upon that…',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 8 },
            { chord: 'Gm7(4)', position: 16 },
            { chord: 'C7sus', position: 24 },
          ],
        },
        {
          lyrics: "I'm clean, Your love has…",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 8 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 24 },
          ],
        },
        { lyrics: 'Your mercy is supreme…', chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 12 }] },
        {
          lyrics: "I'm dancing in Your victory…",
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 8 },
            { chord: 'Gm7(4)', position: 16 },
            { chord: 'C7sus', position: 24 },
          ],
        },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge (×4)',
      lines: [
        { lyrics: "'Cause You took away…", chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'And You nailed it…', chords: [{ chord: 'Bb2', position: 0 }] },
        { lyrics: 'You got me running…', chords: [{ chord: 'Dm7', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'Bb2', position: 0 }] },
      ],
    },
    {
      type: 'tag',
      label: 'Tag',
      lines: [
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'Bb2', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'Dm7', position: 0 }] },
        { lyrics: 'Hallelujah here I come…', chords: [{ chord: 'Bb2', position: 0 }] },
      ],
    },
  ],
};
