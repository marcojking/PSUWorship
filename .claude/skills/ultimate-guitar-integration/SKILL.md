# Ultimate Guitar Integration

Expert knowledge of integrating with Ultimate Guitar and alternative chord chart sources.

## Ultimate Guitar API Status

**No Official Public API** - Ultimate Guitar does not provide a public API for developers.

### Options for Integration

1. **Manual Entry** - User copies/pastes chord charts
2. **Third-party npm packages** - Community scrapers (use at own risk)
3. **Alternative sources** - APIs with official access

## Third-Party Packages

### ultimate-guitar-scraper

Community package for searching and fetching tabs.

```bash
npm install ultimate-guitar-scraper
```

```typescript
import ugs from 'ultimate-guitar-scraper';

// Search for songs
ugs.search({
  query: 'Amazing Grace',
  type: ['Chords'],
}, (error, tabs) => {
  if (error) {
    console.error(error);
    return;
  }

  // tabs = array of search results
  tabs.forEach(tab => {
    console.log({
      name: tab.name,
      artist: tab.artist,
      url: tab.url,
      rating: tab.rating,
    });
  });
});

// Get tab content
ugs.get(tabUrl, (error, tab) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log({
    name: tab.name,
    artist: tab.artist,
    content: tab.content.text, // Plain text with chords
  });
});
```

### Caveats

- **Terms of Service**: Scraping may violate UG's ToS
- **Rate Limiting**: UG blocks aggressive scraping
- **Reliability**: Structure changes break scrapers
- **Legal Risk**: For commercial use, consult legal advice

## Alternative Sources

### 1. CCLI SongSelect (Worship-Specific)

Official source for worship music with licensing.

- **Website**: songselect.ccli.com
- **API**: Available for licensed churches
- **Coverage**: Most worship songs
- **Licensing**: Requires CCLI license

### 2. Chordify

AI-powered chord detection from audio.

- **Website**: chordify.net
- **API**: No public API
- **Unique**: Creates chords from any song

### 3. Songsterr

Guitar tabs with playback.

- **Website**: songsterr.com
- **API**: Limited API available
- **Format**: Guitar Pro tabs

### 4. Open Song Database

Community chord databases:

- **OpenSong** - Open source worship software format
- **ChordWiki** - Community contributed
- **Hymnary.org** - Hymn texts and tunes

## ChordPro Import

Since UG doesn't have an API, best approach: **manual paste + parsing**.

### UG Text Format

Ultimate Guitar uses a simple text format:

```
[Verse 1]
G        G/B        C              G
Amazing grace, how sweet the sound
G        Em         D
That saved a wretch like me
```

### Parser for UG Format

```typescript
interface ParsedLine {
  lyrics: string;
  chords: { chord: string; position: number }[];
}

function parseUGFormat(text: string): ParsedLine[] {
  const lines = text.split('\n');
  const result: ParsedLine[] = [];

  let i = 0;
  while (i < lines.length) {
    const currentLine = lines[i]?.trim() || '';
    const nextLine = lines[i + 1]?.trim() || '';

    // Skip section labels like [Verse 1]
    if (currentLine.match(/^\[.+\]$/)) {
      i++;
      continue;
    }

    // Skip empty lines
    if (!currentLine) {
      i++;
      continue;
    }

    // Check if current line is all chords
    if (isChordLine(currentLine)) {
      // Current is chord line, next is lyrics
      if (nextLine && !isChordLine(nextLine)) {
        result.push({
          lyrics: nextLine,
          chords: extractChordPositions(currentLine),
        });
        i += 2;
      } else {
        // Chord-only line (instrumental)
        result.push({
          lyrics: '',
          chords: extractChordPositions(currentLine),
        });
        i++;
      }
    } else {
      // Lyric-only line
      result.push({
        lyrics: currentLine,
        chords: [],
      });
      i++;
    }
  }

  return result;
}

function isChordLine(line: string): boolean {
  // Split by whitespace and check if most tokens are chords
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordTokens = tokens.filter(t =>
    /^[A-G][#b]?(m|min|maj|dim|aug|sus[24]?|\+|°)?[0-9]*(add[29]|add11)?(\/[A-G][#b]?)?$/.test(t)
  );

  return chordTokens.length / tokens.length > 0.5;
}

function extractChordPositions(line: string): { chord: string; position: number }[] {
  const chords: { chord: string; position: number }[] = [];
  const regex = /[A-G][#b]?(?:m|min|maj|dim|aug|sus[24]?|\+|°)?[0-9]*(?:add[29]|add11)?(?:\/[A-G][#b]?)?/g;

  let match;
  while ((match = regex.exec(line)) !== null) {
    chords.push({
      chord: match[0],
      position: match.index,
    });
  }

  return chords;
}
```

### Convert to ChordPro

```typescript
function ugToChordPro(title: string, artist: string, key: string, parsedLines: ParsedLine[]): string {
  let result = '';

  result += `{title: ${title}}\n`;
  result += `{artist: ${artist}}\n`;
  result += `{key: ${key}}\n\n`;

  parsedLines.forEach(line => {
    if (line.chords.length === 0) {
      result += line.lyrics + '\n';
    } else {
      // Build ChordPro inline format
      let chordProLine = '';
      let lastPos = 0;

      line.chords.forEach(({ chord, position }) => {
        // Add lyrics before this chord
        chordProLine += line.lyrics.slice(lastPos, position);
        // Add chord
        chordProLine += `[${chord}]`;
        lastPos = position;
      });

      // Add remaining lyrics
      chordProLine += line.lyrics.slice(lastPos);
      result += chordProLine + '\n';
    }
  });

  return result;
}
```

## Recommended Workflow

For **PSUWorship**, the best approach:

### 1. Primary: PDF Upload
- User uploads chord chart PDFs they already have
- Parse with pdf.js

### 2. Secondary: Paste from UG
- User finds song on Ultimate Guitar
- Copy/paste the chord chart text
- Parse with UG format parser

### 3. Future: Manual Entry
- Full ChordPro editor
- User types/edits directly

## UI for Import

```tsx
function ImportSong() {
  const [importType, setImportType] = useState<'pdf' | 'paste' | 'manual'>('paste');

  return (
    <div className="import-modal">
      <div className="import-tabs">
        <button
          className={importType === 'paste' ? 'active' : ''}
          onClick={() => setImportType('paste')}
        >
          Paste from Web
        </button>
        <button
          className={importType === 'pdf' ? 'active' : ''}
          onClick={() => setImportType('pdf')}
        >
          Upload PDF
        </button>
        <button
          className={importType === 'manual' ? 'active' : ''}
          onClick={() => setImportType('manual')}
        >
          Manual Entry
        </button>
      </div>

      {importType === 'paste' && <PasteImport />}
      {importType === 'pdf' && <PdfUpload />}
      {importType === 'manual' && <ManualEditor />}
    </div>
  );
}

function PasteImport() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('G');

  const handleParse = () => {
    const parsedLines = parseUGFormat(text);
    const chordPro = ugToChordPro(title, artist, key, parsedLines);
    // Save to storage...
  };

  return (
    <div className="paste-import">
      <input
        placeholder="Song Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        placeholder="Artist"
        value={artist}
        onChange={e => setArtist(e.target.value)}
      />
      <select value={key} onChange={e => setKey(e.target.value)}>
        {['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'].map(k =>
          <option key={k} value={k}>{k}</option>
        )}
      </select>

      <textarea
        placeholder="Paste chord chart here (from Ultimate Guitar, etc.)"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={15}
      />

      <button onClick={handleParse}>Import Song</button>
    </div>
  );
}
```

## Legal Considerations

1. **Personal Use**: Parsing pasted content for personal use is generally acceptable
2. **Caching**: Don't cache/store copyrighted lyrics permanently without license
3. **CCLI**: Churches should have CCLI license for worship song lyrics
4. **Public Domain**: Hymns and older songs may be public domain
5. **Original Content**: Users entering their own songs = no issue

## Summary

| Method | Effort | Legal Risk | UX |
|--------|--------|-----------|-----|
| PDF Upload | Medium | Low | Good |
| Paste from UG | Low | Low | Great |
| UG Scraper | High | Medium | Good |
| Manual Entry | Low | None | OK |
| CCLI API | High | None | Best |

**Recommendation**: Start with paste import + PDF upload. No legal concerns, covers most use cases.
