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
  sections: [
    {
      type: 'chorus',
      label: 'Chorus (1st x a cappella)',
      lines: [
        { lyrics: "I've been washed in the water, washed in the blood", chords: [{ chord: 'F', position: 0 }, { chord: 'Bb2', position: 31 }] },
        { lyrics: "I'm as good as new, oh hallelujah", chords: [{ chord: 'Dm7', position: 0 }, { chord: 'C', position: 20 }] },
        { lyrics: "I've been washed in the water, washed in the blood", chords: [{ chord: 'F', position: 0 }, { chord: 'Bb2', position: 31 }] },
        { lyrics: 'All because of You, oh hallelujah', chords: [{ chord: 'Dm7', position: 0 }, { chord: 'C', position: 20 }] },
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
          lyrics: "I'm clean, sin was stained on me",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 11 },
            { chord: 'C(4)', position: 19 },
            { chord: 'Dm7', position: 27 },
          ],
        },
        { lyrics: 'Shame was running deep', chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 12 }] },
        {
          lyrics: 'Love was spilled on Calvary, oh hallelujah',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 9 },
            { chord: 'Gm7(4)', position: 20 },
            { chord: 'C7sus', position: 29 },
          ],
        },
        {
          lyrics: "I'm clean, God how can it be?",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 11 },
            { chord: 'C(4)', position: 19 },
            { chord: 'Dm7', position: 23 },
          ],
        },
        { lyrics: "I'm ransomed and redeemed", chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 14 }] },
        {
          lyrics: 'Standing in Your victory, oh hallelujah',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 9 },
            { chord: 'Gm7(4)', position: 17 },
            { chord: 'C7sus', position: 26 },
          ],
        },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 2',
      lines: [
        {
          lyrics: "I'm clean, not what I have done",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 11 },
            { chord: 'C(4)', position: 15 },
            { chord: 'Dm7', position: 22 },
          ],
        },
        { lyrics: "But what You've done for me", chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 16 }] },
        {
          lyrics: 'You paid it all up on that tree, oh hallelujah',
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 12 },
            { chord: 'Gm7(4)', position: 22 },
            { chord: 'C7sus', position: 33 },
          ],
        },
        {
          lyrics: "I'm clean, Your love has overcome",
          chords: [
            { chord: 'F/A', position: 0 },
            { chord: 'Bb2', position: 11 },
            { chord: 'C(4)', position: 16 },
            { chord: 'Dm7', position: 25 },
          ],
        },
        { lyrics: 'Your mercy is supreme', chords: [{ chord: 'F/A', position: 0 }, { chord: 'Bb2', position: 12 }] },
        {
          lyrics: "I'm dancing in Your victory, oh hallelujah",
          chords: [
            { chord: 'C(4)', position: 0 },
            { chord: 'Dm7', position: 12 },
            { chord: 'Gm7(4)', position: 20 },
            { chord: 'C7sus', position: 29 },
          ],
        },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge (×4)',
      lines: [
        { lyrics: "'Cause You took away my shame", chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'And You nailed it to the cross', chords: [{ chord: 'Bb2', position: 0 }] },
        { lyrics: 'You got me running out the grave', chords: [{ chord: 'Dm7', position: 0 }] },
        { lyrics: 'Hallelujah here I come', chords: [{ chord: 'Bb2', position: 0 }] },
      ],
    },
    {
      type: 'tag',
      label: 'Tag',
      lines: [
        { lyrics: 'Hallelujah here I come', chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'Hallelujah here I come', chords: [{ chord: 'Bb2', position: 0 }] },
        { lyrics: 'Hallelujah here I come', chords: [{ chord: 'Dm7', position: 0 }] },
        { lyrics: 'Hallelujah here I come', chords: [{ chord: 'Bb2', position: 0 }] },
      ],
    },
  ],
};
