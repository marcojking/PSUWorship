import { parseChord, getTranspositionInterval } from './transposition';

// Major scale intervals in semitones from root
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

// Roman numerals
const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

// Natural chord qualities for each scale degree in major key
// 1=Major, 2=minor, 3=minor, 4=Major, 5=Major, 6=minor, 7=diminished
const NATURAL_QUALITIES: ('major' | 'minor' | 'dim')[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'
];

// Determine if a chord quality is minor
function isMinorQuality(quality: string): boolean {
  return ['m', 'min', 'minor', '-'].includes(quality.toLowerCase());
}

// Determine if a chord quality is diminished
function isDimQuality(quality: string): boolean {
  return ['dim', '°', 'diminished'].includes(quality.toLowerCase());
}

// Determine if a chord quality is augmented
function isAugQuality(quality: string): boolean {
  return ['aug', '+', 'augmented'].includes(quality.toLowerCase());
}

// Convert a chord to Roman numeral notation
export function chordToRomanNumeral(chord: string, key: string): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord; // Return unchanged if can't parse

  // Get the interval from the key to the chord root
  const interval = getTranspositionInterval(key, parsed.root);

  // Find which scale degree this interval corresponds to
  let scaleDegree = MAJOR_SCALE.indexOf(interval);
  let accidental = '';

  if (scaleDegree === -1) {
    // Non-diatonic chord - find nearest scale degree and add accidental
    // Check for flat (one semitone below a scale degree)
    const flatInterval = (interval + 1) % 12;
    const flatDegree = MAJOR_SCALE.indexOf(flatInterval);
    if (flatDegree !== -1) {
      scaleDegree = flatDegree;
      accidental = 'b';
    } else {
      // Check for sharp (one semitone above a scale degree)
      const sharpInterval = (interval - 1 + 12) % 12;
      const sharpDegree = MAJOR_SCALE.indexOf(sharpInterval);
      if (sharpDegree !== -1) {
        scaleDegree = sharpDegree;
        accidental = '#';
      }
    }
  }

  if (scaleDegree === -1) return chord; // Couldn't map to scale degree

  // Determine if we should use uppercase (major) or lowercase (minor)
  const isMinor = isMinorQuality(parsed.quality);
  const isDim = isDimQuality(parsed.quality);
  const isAug = isAugQuality(parsed.quality);

  // Use uppercase for major/aug, lowercase for minor/dim
  const useUppercase = !isMinor && !isDim;
  const romanBase = useUppercase ? ROMAN_UPPER[scaleDegree] : ROMAN_LOWER[scaleDegree];

  // Build the suffix
  let suffix = '';

  // Add diminished or augmented symbol if needed
  if (isDim) suffix += '°';
  if (isAug) suffix += '+';

  // Add extension (7, 9, etc.)
  if (parsed.extension) {
    suffix += parsed.extension;
  }

  // Add other suffixes (sus4, add9, etc.)
  if (parsed.suffix) {
    suffix += parsed.suffix;
  }

  // Handle slash chords - convert bass note to roman numeral too
  let bassNumeral = '';
  if (parsed.bass) {
    const bassInterval = getTranspositionInterval(key, parsed.bass);
    const bassDegree = MAJOR_SCALE.indexOf(bassInterval);
    if (bassDegree !== -1) {
      // Bass notes are typically shown in uppercase
      bassNumeral = '/' + ROMAN_UPPER[bassDegree];
    } else {
      // Non-diatonic bass, keep as letter
      bassNumeral = '/' + parsed.bass;
    }
  }

  return accidental + romanBase + suffix + bassNumeral;
}

// Convert Roman numeral back to chord (given a key)
export function romanNumeralToChord(numeral: string, key: string): string {
  // This is more complex - for now, we'll keep it simple
  // Parse the roman numeral and convert back

  const match = numeral.match(/^([#b])?([IViv]+)(°|\+)?(\d+)?(sus[24]?|add[29])?(?:\/([IViv]+|[A-G][#b]?))?$/);
  if (!match) return numeral;

  const [, accidental, roman, dimAug, extension, suffix, bass] = match;

  // Determine scale degree from roman numeral
  const upperRoman = roman.toUpperCase();
  let scaleDegree = ROMAN_UPPER.indexOf(upperRoman);
  if (scaleDegree === -1) return numeral;

  // Determine if minor (lowercase roman)
  const isLowercase = roman === roman.toLowerCase();

  // Get semitones for this scale degree
  let semitones = MAJOR_SCALE[scaleDegree];

  // Apply accidental
  if (accidental === 'b') semitones = (semitones - 1 + 12) % 12;
  if (accidental === '#') semitones = (semitones + 1) % 12;

  // Get the note names
  const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const keyIndex = NOTES.indexOf(key);
  if (keyIndex === -1) return numeral;

  const rootIndex = (keyIndex + semitones) % 12;
  const root = NOTES[rootIndex];

  // Build the chord
  let chord = root;
  if (isLowercase) chord += 'm';
  if (dimAug) chord += dimAug === '°' ? 'dim' : 'aug';
  if (extension) chord += extension;
  if (suffix) chord += suffix;

  // Handle bass
  if (bass) {
    if (ROMAN_UPPER.includes(bass.toUpperCase())) {
      const bassDegree = ROMAN_UPPER.indexOf(bass.toUpperCase());
      const bassSemitones = MAJOR_SCALE[bassDegree];
      const bassIndex = (keyIndex + bassSemitones) % 12;
      chord += '/' + NOTES[bassIndex];
    } else {
      chord += '/' + bass;
    }
  }

  return chord;
}

// Convert an entire chord line to Roman numerals
export function convertLineToRomanNumerals(
  chords: { chord: string; position: number }[],
  key: string
): { chord: string; position: number }[] {
  return chords.map(({ chord, position }) => ({
    chord: chordToRomanNumeral(chord, key),
    position,
  }));
}
