# Ultimate Guitar Chord Sheet Parsing

## Overview

This skill covers parsing chord sheets from Ultimate Guitar (UG), understanding their various formats, and converting them to a structured format for display and manipulation.

## Ultimate Guitar Content Formats

### 1. API/Web Format (what we receive from scraping)

When fetching from Ultimate Guitar's web pages, chord data is stored in a JSON blob within a `data-content` attribute on a `.js-store` element. The content uses these conventions:

#### Chord Markers
```
[ch]G[/ch]    [ch]C[/ch]    [ch]Em7[/ch]    [ch]D/F#[/ch]
```
- All chords are wrapped in `[ch]...[/ch]` tags
- Supports slash chords: `[ch]G/B[/ch]`
- Supports extended chords: `[ch]Cmaj7[/ch]`, `[ch]Am7[/ch]`, `[ch]Gsus4[/ch]`

#### Section Labels
```
[Intro]
[Verse 1]
[Pre-Chorus]
[Chorus]
[Bridge]
[Instrumental]
[Outro]
[Tag]
[Interlude]
```
- Section names in square brackets
- May include numbers: `[Verse 2]`, `[Chorus 1]`
- Case-insensitive matching recommended

#### Tab Blocks
```
[tab]
... content here ...
[/tab]
```
- Content may be wrapped in `[tab]...[/tab]` tags
- Should be removed during parsing

#### HTML Entities
Common entities that must be decoded:
- `&rsquo;` → `'` (right single quote - apostrophes)
- `&lsquo;` → `'` (left single quote)
- `&rdquo;` → `"` (right double quote)
- `&ldquo;` → `"` (left double quote)
- `&amp;` → `&`
- `&nbsp;` → ` ` (non-breaking space)
- `&#39;` → `'`
- `&quot;` → `"`
- `&mdash;` → `—`
- `&ndash;` → `–`

#### Metadata Lines (to skip)
These appear at the top of content and should be filtered out:
```
Artist: Cody Carnes
Song: Firm Foundation (He Won't)
Key: Bb | Capo: 3rd fret (no capo = transpose +3 this tab)
Tuning: E A D G B E
Tempo: 150 BPM
```
Patterns to skip:
- Lines starting with `Artist:`, `Song:`, `Key:`, `Capo:`, `Tuning:`, `Tempo:`, `BPM:`, `Time:`
- Lines starting with `(no capo`, `transpose`
- Lines that are just separators: `- - -`, `|`, `---`

### 2. Tabdown Format (Official UG Markup)

Ultimate Guitar's official open markup language uses different conventions:

#### Chords
```
[Am] [F] [C] [G]
```
- Chords in single brackets (no closing tag)
- Inline with lyrics: `[Am]Amazing [G]grace how [D]sweet`

#### Sections
```
# Verse
# Chorus
```
- Hash symbol followed by section name

#### Metadata
```
% tuning: E A D G B E
% capo: 2
```
- Percent sign prefix with key-value pairs

### 3. Two-Line Format (Display Format)

How chords appear visually on Ultimate Guitar:
```
       Am         C/G        F          C
Let it be, let it be, let it be, let it be
```
- Chord line positioned above lyric line
- Chords aligned to syllables/words
- Spacing indicates timing/position

## Parsing Strategy

### Step 1: Extract Raw Content
```javascript
// Find the js-store element
const storeMatch = html.match(/class="js-store"\s+data-content="([^"]+)"/);
// Decode HTML entities in JSON
const jsonStr = storeMatch[1]
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&');
const data = JSON.parse(jsonStr);
// Navigate to content
const content = data.store.page.data.tab_view.wiki_tab.content;
```

### Step 2: Clean Content
```javascript
// Remove tab wrappers
content = content.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '');
// Decode HTML entities
content = decodeHtmlEntities(content);
```

### Step 3: Parse Line by Line
```javascript
for (const line of lines) {
  // Check for section label
  if (/^\s*\[(Intro|Verse|Chorus|...)\s*\d*\]\s*$/i.test(line)) {
    // Start new section
  }

  // Check for chord line (contains [ch] markers)
  if (line.includes('[ch]')) {
    // Extract chords and positions
    // Check if next line is lyrics
  }

  // Skip metadata lines
  if (isMetadataLine(line)) continue;

  // Otherwise treat as lyrics
}
```

### Step 4: Extract Chord Positions
```javascript
function parseChordLine(line) {
  const chords = [];
  let position = 0;
  let i = 0;

  while (i < line.length) {
    if (line.slice(i, i + 4) === '[ch]') {
      const endIdx = line.indexOf('[/ch]', i + 4);
      if (endIdx !== -1) {
        const chord = line.slice(i + 4, endIdx).trim();
        if (isValidChord(chord)) {
          chords.push({ chord, position });
        }
        i = endIdx + 5;
        continue;
      }
    }
    position++;
    i++;
  }

  return chords;
}
```

## Common Edge Cases

### 1. Chord-Only Lines (Intros/Outros)
```
[ch]G[/ch]  [ch]C[/ch]  [ch]G[/ch]  [ch]C[/ch]
```
- No lyrics following
- Store as line with empty lyrics

### 2. Inline Performance Notes
```
(repeat x2)
(softly)
(build)
```
- Usually in parentheses
- Can keep as part of lyrics or filter

### 3. Rhythm/Timing Markers
```
[ch]G[/ch]  -  -  -  [ch]C[/ch]  -  -  -
```
- Dashes indicate sustained chord or rhythm
- Should NOT be parsed as chords

### 4. Multi-Chord Same Position
```
[ch]G[/ch][ch]C[/ch]
```
- Chords immediately adjacent
- Both apply to same beat/word

### 5. Slash Chords vs Chord Sequences
```
[ch]D/F#[/ch]    vs    [ch]D[/ch] / [ch]F#[/ch]
```
- First is a slash chord (bass note)
- Second is two separate chords

### 6. Alternate Section Names
- `[Pre-Chorus]` or `[PreChorus]` or `[Pre Chorus]`
- `[Inst]` or `[Instrumental]` or `[Interlude]`
- `[Ending]` or `[Outro]` or `[Tag]`

## Metadata Extraction

From the JSON response, extract:
```javascript
const tab = data.store.page.data.tab;
const tabView = data.store.page.data.tab_view;

const metadata = {
  title: tab.song_name,
  artist: tab.artist_name,
  key: tabView.meta?.tonality || 'C',
  capo: tabView.meta?.capo || 0,
  tuning: tabView.meta?.tuning?.name || 'Standard',
  difficulty: tab.difficulty,
};
```

## Output Structure

```typescript
interface ParsedSong {
  title: string;
  artist: string;
  key: string;
  sections: Section[];
}

interface Section {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'instrumental' | 'tag';
  label: string;  // "Verse 1", "Chorus", etc.
  lines: ChordLine[];
}

interface ChordLine {
  lyrics: string;
  chords: ChordPosition[];
}

interface ChordPosition {
  chord: string;   // "G", "Am7", "D/F#"
  position: number; // Character position in lyrics
}
```

## Related Resources

- [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) - JavaScript library with UltimateGuitarParser
- [Tabdown](https://github.com/ultimate-guitar/Tabdown) - Official UG markup language
- [ultimate-to-chordpro](https://ultimate.ftes.de/) - Converter tool
