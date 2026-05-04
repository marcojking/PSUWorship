# PDF Chord Extraction

Expert knowledge of extracting chord charts from PDFs with positional data for lyrics/chord alignment.

## Overview

Extracting chord charts from PDFs requires:
1. Extracting text with X/Y coordinates
2. Identifying which text items are chords vs lyrics
3. Associating chords with the lyrics below them
4. Preserving the spatial relationship for display

## Libraries

### pdfjs-dist (Mozilla's PDF.js)

The gold standard for browser-based PDF parsing.

```bash
npm install pdfjs-dist
```

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Set worker path for Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TextItem {
  str: string;           // The text content
  transform: number[];   // [scaleX, skewX, skewY, scaleY, x, y]
  width: number;
  height: number;
  fontName: string;
}

async function extractTextWithPositions(pdfUrl: string): Promise<TextItem[][]> {
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const pages: TextItem[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item: any) => ({
      str: item.str,
      transform: item.transform,
      width: item.width,
      height: item.height,
      fontName: item.fontName,
      // Extract X, Y from transform matrix
      x: item.transform[4],
      y: item.transform[5],
    }));

    pages.push(items);
  }

  return pages;
}
```

### pdf.js-extract (Node.js wrapper)

Simpler API, good for server-side:

```bash
npm install pdf.js-extract
```

```typescript
import { PDFExtract } from 'pdf.js-extract';

const pdfExtract = new PDFExtract();

async function extractPdf(filePath: string) {
  const data = await pdfExtract.extract(filePath, {});

  // Each page has content array with items
  data.pages.forEach(page => {
    page.content.forEach(item => {
      console.log({
        text: item.str,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      });
    });
  });
}
```

### unpdf (Edge/Serverless Compatible)

Works in Vercel Edge, Cloudflare Workers:

```bash
npm install unpdf
```

```typescript
import { extractText } from 'unpdf';

const { text, pages } = await extractText(pdfBuffer);
```

## Chord Detection

### Regex Pattern

```typescript
const CHORD_PATTERN = /^[A-G][#b]?(m|min|maj|dim|aug|sus[24]?|\+|°|ø)?(2|4|5|6|7|9|11|13)?(add[29]|add11)?(\/[A-G][#b]?)?$/;

function isChord(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 12) return false;
  return CHORD_PATTERN.test(trimmed);
}

// Test cases
isChord('Am');     // true
isChord('G7');     // true
isChord('F#m7');   // true
isChord('Cmaj7');  // true
isChord('D/F#');   // true
isChord('the');    // false
isChord('Amazing'); // false
```

### Heuristics for Chord Lines

```typescript
function isChordLine(items: TextItem[]): boolean {
  const text = items.map(i => i.str.trim()).filter(Boolean);
  if (text.length === 0) return false;

  // Count how many items are chords
  const chordCount = text.filter(isChord).length;
  const chordRatio = chordCount / text.length;

  // If >50% are chords, it's a chord line
  return chordRatio > 0.5;
}
```

## Associating Chords with Lyrics

### Algorithm

1. Group text items by Y-coordinate (same line)
2. Sort lines by Y (top to bottom)
3. Identify chord lines vs lyric lines
4. For each chord, find the lyric character directly below it

```typescript
interface ChordPosition {
  chord: string;
  characterIndex: number;  // Position in lyric line
}

interface LyricLine {
  text: string;
  chords: ChordPosition[];
}

function associateChordsWithLyrics(items: TextItem[]): LyricLine[] {
  // Group by Y coordinate (allow 2px tolerance)
  const lines = groupByY(items, 2);

  // Sort by Y descending (PDF coordinates: 0,0 is bottom-left)
  lines.sort((a, b) => b[0].y - a[0].y);

  const result: LyricLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];

    if (isChordLine(currentLine)) {
      // Find the lyric line below (next line with lower Y)
      const lyricLine = lines[i + 1];
      if (!lyricLine || isChordLine(lyricLine)) continue;

      // Associate each chord with character position
      const lyricText = lyricLine.map(item => item.str).join('');
      const chords: ChordPosition[] = [];

      currentLine.forEach(chordItem => {
        if (!isChord(chordItem.str.trim())) return;

        // Find which character in lyric line is below this chord
        const charIndex = findCharacterAtX(lyricLine, chordItem.x);

        chords.push({
          chord: chordItem.str.trim(),
          characterIndex: charIndex,
        });
      });

      result.push({
        text: lyricText,
        chords: chords.sort((a, b) => a.characterIndex - b.characterIndex),
      });

      i++; // Skip the lyric line we just processed
    } else {
      // Pure lyric line (no chords above)
      result.push({
        text: currentLine.map(item => item.str).join(''),
        chords: [],
      });
    }
  }

  return result;
}

function findCharacterAtX(lyricItems: TextItem[], chordX: number): number {
  let charCount = 0;

  for (const item of lyricItems) {
    const itemEnd = item.x + item.width;

    // If chord X falls within this item
    if (chordX >= item.x && chordX <= itemEnd) {
      // Estimate character position within item
      const ratio = (chordX - item.x) / item.width;
      const charInItem = Math.floor(ratio * item.str.length);
      return charCount + charInItem;
    }

    charCount += item.str.length;
  }

  return charCount; // Chord is at end
}

function groupByY(items: TextItem[], tolerance: number): TextItem[][] {
  const groups: Map<number, TextItem[]> = new Map();

  items.forEach(item => {
    // Round Y to tolerance
    const roundedY = Math.round(item.y / tolerance) * tolerance;

    if (!groups.has(roundedY)) {
      groups.set(roundedY, []);
    }
    groups.get(roundedY)!.push(item);
  });

  // Sort items within each line by X
  groups.forEach(group => group.sort((a, b) => a.x - b.x));

  return Array.from(groups.values());
}
```

## ChordPro Format

Industry-standard format for chord charts:

```
{title: Amazing Grace}
{key: G}

A[G]mazing [G/B]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
```

### ChordSheetJS Library

Parse and format ChordPro:

```bash
npm install chordsheetjs
```

```typescript
import ChordSheetJS from 'chordsheetjs';

// Parse ChordPro format
const parser = new ChordSheetJS.ChordProParser();
const song = parser.parse(chordProString);

// Convert to HTML
const formatter = new ChordSheetJS.HtmlDivFormatter();
const html = formatter.format(song);

// Convert to plain text with chords above
const textFormatter = new ChordSheetJS.TextFormatter();
const text = textFormatter.format(song);

// Transpose
const transposedSong = song.transpose(2); // Up 2 semitones
```

## Data Structure for Storage

```typescript
interface ChordChart {
  id: string;
  title: string;
  artist?: string;
  key: string;
  tempo?: number;
  timeSignature?: string;

  sections: Section[];
}

interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'instrumental';
  label?: string;  // "Verse 1", "Chorus 2"
  lines: ChordLine[];
}

interface ChordLine {
  lyrics: string;
  chords: {
    chord: string;
    position: number;  // Character index
  }[];
}

// Example
const song: ChordChart = {
  id: 'amazing-grace-1',
  title: 'Amazing Grace',
  key: 'G',
  sections: [
    {
      type: 'verse',
      label: 'Verse 1',
      lines: [
        {
          lyrics: 'Amazing grace, how sweet the sound',
          chords: [
            { chord: 'G', position: 0 },
            { chord: 'G/B', position: 8 },
            { chord: 'C', position: 20 },
            { chord: 'G', position: 31 },
          ],
        },
      ],
    },
  ],
};
```

## Next.js Implementation

### API Route for PDF Upload

```typescript
// app/api/parse-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  // Extract and process...
  const chordChart = await extractChordChart(pdf);

  return NextResponse.json(chordChart);
}
```

### Client-Side Upload Component

```tsx
function PdfUploader({ onParsed }: { onParsed: (chart: ChordChart) => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    const chart = await response.json();
    onParsed(chart);
    setLoading(false);
  };

  return (
    <input
      type="file"
      accept=".pdf"
      onChange={handleUpload}
      disabled={loading}
    />
  );
}
```

## Challenges & Solutions

### 1. Font Encoding Issues
Some PDFs use non-standard encoding. Use `normalizeWhitespace` option.

### 2. Scanned PDFs
Need OCR - consider Tesseract.js or cloud OCR APIs.

### 3. Complex Layouts
Multi-column layouts need column detection before line grouping.

### 4. Chord Symbols in Special Fonts
Music fonts may encode chords as symbols. Check fontName and handle specially.

### 5. Inconsistent Spacing
Normalize spaces in lyrics, recalculate chord positions proportionally.
