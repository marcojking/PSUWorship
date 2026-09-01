// Types for fixed, pre-written vocal arrangements.
//
// These are distinct from `melodyGenerator.ts`, which produces notes
// procedurally for the pitch-detection trainer. An Arrangement is a real
// piece of music, transcribed once and stored as data so that the player
// never needs to know which song it is playing.

export type PartId = 'soprano' | 'alto' | 'tenor' | 'bass';

export const PART_IDS: readonly PartId[] = ['soprano', 'alto', 'tenor', 'bass'];

export const PART_LABELS: Record<PartId, string> = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Tenor',
  bass: 'Bass',
};

export interface ArrangedNote {
  /** Absolute MIDI pitch. 60 = middle C. */
  midi: number;
  /** Beats from the start of the piece. The pickup, if any, starts at 0. */
  startBeat: number;
  /** Duration in beats. */
  beats: number;
  /** Syllable sung on this note, where the part carries text. */
  lyric?: string;
}

export interface Phrase {
  id: string;
  /** The line of text. Shown on hover, too long for a button. */
  label: string;
  /**
   * Button label in the loop selector. Required rather than derived from the
   * phrase's position, because not every phrase is a numbered line of text —
   * an Amen is not "Line 5".
   */
  short: string;
  startBeat: number;
  /** Exclusive. A note at exactly `endBeat` belongs to the next phrase. */
  endBeat: number;
}

export interface Arrangement {
  id: string;
  title: string;
  /** Concert key, for display only. Pitches above are absolute. */
  key: string;
  beatsPerBar: number;
  defaultBpm: number;
  /** Total length in beats, including any final held chord. */
  totalBeats: number;
  parts: Record<PartId, ArrangedNote[]>;
  phrases: Phrase[];

  // Provenance. Required, not optional: an arrangement should not exist
  // in this codebase without a citation for where its notes came from and
  // what they were independently checked against.
  source: string;
  verifiedAgainst: string;
  license: string;
}

/** Notes sounding within [fromBeat, toBeat). */
export function notesInRange(
  notes: ArrangedNote[],
  fromBeat: number,
  toBeat: number,
): ArrangedNote[] {
  return notes.filter((n) => n.startBeat >= fromBeat && n.startBeat < toBeat);
}

/** The first note of a part at or after `fromBeat`, for the starting-pitch button. */
export function firstNoteFrom(
  notes: ArrangedNote[],
  fromBeat: number,
): ArrangedNote | undefined {
  return notes.find((n) => n.startBeat >= fromBeat);
}
