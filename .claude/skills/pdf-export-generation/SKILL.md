# PDF Export Generation

Expert knowledge of generating PDFs and print-ready output for chord charts in Next.js/React applications.

## Export Requirements

For a worship chord chart tool:
1. **Single song export** - Print one song
2. **Setlist export** - Multiple songs, page breaks between
3. **Three formats**: Lyrics only, with chords, with Nashville numbers
4. **Clean layout** - Professional, easy to read
5. **Consistent chord alignment** - Must match screen display

## Approach 1: CSS Print Styles (Simplest)

Use `@media print` for browser printing - no library needed.

### Print Stylesheet

```css
@media print {
  /* Hide non-essential elements */
  .navigation,
  .controls,
  .export-button,
  .auto-scroll,
  footer {
    display: none !important;
  }

  /* Reset backgrounds for printing */
  body {
    background: white;
    color: black;
  }

  /* Chord chart styling */
  .chord-chart {
    font-family: 'Courier New', monospace;
    font-size: 12pt;
    line-height: 1.6;
  }

  .chord {
    color: black;
    font-weight: bold;
  }

  /* Page breaks */
  .song {
    page-break-after: always;
  }

  .song:last-child {
    page-break-after: avoid;
  }

  /* Avoid breaking inside sections */
  .section {
    page-break-inside: avoid;
  }

  /* Song title at top of page */
  .song-header {
    page-break-after: avoid;
  }

  /* Page margins */
  @page {
    margin: 0.75in;
    size: letter;
  }

  /* Add song title to each page header */
  .song-title {
    position: running(songTitle);
  }

  @page {
    @top-center {
      content: element(songTitle);
    }
  }
}
```

### Print Button

```tsx
function PrintButton() {
  return (
    <button onClick={() => window.print()}>
      Print / Save PDF
    </button>
  );
}
```

## Approach 2: jsPDF (Client-Side PDF Generation)

Generate PDFs entirely in the browser.

```bash
npm install jspdf
```

### Basic Implementation

```typescript
import { jsPDF } from 'jspdf';

interface ExportOptions {
  format: 'lyrics' | 'chords' | 'nashville';
  includeKey: boolean;
  pageBreaks: boolean;
  fontSize: number;
}

function exportToPdf(songs: ParsedSong[], options: ExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  // Use monospace font for alignment
  doc.setFont('courier', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;

  let y = margin;

  songs.forEach((song, songIndex) => {
    // Page break between songs
    if (songIndex > 0 && options.pageBreaks) {
      doc.addPage();
      y = margin;
    }

    // Song title
    doc.setFontSize(16);
    doc.setFont('courier', 'bold');
    doc.text(song.title, margin, y);
    y += 20;

    // Key indicator
    if (options.includeKey) {
      doc.setFontSize(12);
      doc.setFont('courier', 'normal');
      doc.text(`Key: ${song.key}`, margin, y);
      y += 20;
    }

    y += 10; // Space before content

    // Song sections
    doc.setFontSize(options.fontSize);

    song.sections.forEach(section => {
      // Check if we need a new page
      if (y > pageHeight - margin - 100) {
        doc.addPage();
        y = margin;
      }

      // Section label
      doc.setFont('courier', 'bold');
      doc.text(section.label || section.type.toUpperCase(), margin, y);
      y += 18;
      doc.setFont('courier', 'normal');

      // Lines
      section.lines.forEach(line => {
        // Check for page break
        if (y > pageHeight - margin - 40) {
          doc.addPage();
          y = margin;
        }

        if (options.format !== 'lyrics') {
          // Chord line
          const chordLine = buildChordLine(line.chords, line.lyrics.length, options.format, song.key);
          doc.text(chordLine, margin, y);
          y += 14;
        }

        // Lyric line
        doc.text(line.lyrics, margin, y);
        y += 18;
      });

      y += 10; // Space between sections
    });
  });

  // Save or open
  doc.save(`${songs[0]?.title || 'setlist'}.pdf`);
}

function buildChordLine(
  chords: { chord: string; position: number }[],
  lineLength: number,
  format: 'chords' | 'nashville',
  key: string
): string {
  let line = ' '.repeat(lineLength);

  chords.forEach(({ chord, position }) => {
    const displayChord = format === 'nashville'
      ? chordToNashville(chord, key)
      : chord;

    // Insert chord at position
    const before = line.slice(0, position);
    const after = line.slice(position + displayChord.length);
    line = before + displayChord + after;
  });

  return line;
}
```

### Custom Fonts

```typescript
// Add custom font for better appearance
import { jsPDF } from 'jspdf';

// You need the font file as base64
import FiraCodeRegular from './fonts/FiraCode-Regular-base64';

const doc = new jsPDF();
doc.addFileToVFS('FiraCode-Regular.ttf', FiraCodeRegular);
doc.addFont('FiraCode-Regular.ttf', 'FiraCode', 'normal');
doc.setFont('FiraCode');
```

## Approach 3: react-pdf (Component-Based)

Build PDFs using React components.

```bash
npm install @react-pdf/renderer
```

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Courier',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  key: {
    fontSize: 12,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  chordLine: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  lyricLine: {
    fontSize: 11,
    marginBottom: 8,
    fontFamily: 'Courier',
  },
});

function ChordChartPdf({ songs, options }: { songs: ParsedSong[]; options: ExportOptions }) {
  return (
    <Document>
      {songs.map((song, i) => (
        <Page key={i} size="LETTER" style={styles.page}>
          <Text style={styles.title}>{song.title}</Text>
          {options.includeKey && (
            <Text style={styles.key}>Key: {song.key}</Text>
          )}

          {song.sections.map((section, j) => (
            <View key={j}>
              <Text style={styles.sectionLabel}>
                {section.label || section.type.toUpperCase()}
              </Text>

              {section.lines.map((line, k) => (
                <View key={k}>
                  {options.format !== 'lyrics' && (
                    <Text style={styles.chordLine}>
                      {buildChordLine(line.chords, line.lyrics.length, options.format, song.key)}
                    </Text>
                  )}
                  <Text style={styles.lyricLine}>{line.lyrics}</Text>
                </View>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}

// Generate and download
async function downloadPdf(songs: ParsedSong[], options: ExportOptions) {
  const blob = await pdf(<ChordChartPdf songs={songs} options={options} />).toBlob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${songs[0]?.title || 'setlist'}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}
```

## Approach 4: Server-Side with Puppeteer

Best quality, uses headless Chrome to render HTML to PDF.

```bash
npm install puppeteer
```

### API Route

```typescript
// app/api/export-pdf/route.ts
import puppeteer from 'puppeteer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { songs, options } = await request.json();

  // Generate HTML
  const html = generateHtml(songs, options);

  // Launch browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdf = await page.pdf({
    format: 'Letter',
    margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
    printBackground: true,
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="setlist.pdf"',
    },
  });
}

function generateHtml(songs: ParsedSong[], options: ExportOptions): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');

        body {
          font-family: 'Fira Code', monospace;
          font-size: 12pt;
          line-height: 1.6;
        }

        .song {
          page-break-after: always;
        }

        .song:last-child {
          page-break-after: avoid;
        }

        .title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 8pt;
        }

        .key {
          margin-bottom: 16pt;
        }

        .section-label {
          font-weight: bold;
          margin-top: 12pt;
        }

        .chord-line {
          font-weight: bold;
          white-space: pre;
        }

        .lyric-line {
          white-space: pre;
          margin-bottom: 8pt;
        }
      </style>
    </head>
    <body>
      ${songs.map(song => `
        <div class="song">
          <div class="title">${song.title}</div>
          ${options.includeKey ? `<div class="key">Key: ${song.key}</div>` : ''}
          ${song.sections.map(section => `
            <div class="section">
              <div class="section-label">${section.label || section.type.toUpperCase()}</div>
              ${section.lines.map(line => `
                ${options.format !== 'lyrics' ? `
                  <div class="chord-line">${buildChordLine(line.chords, line.lyrics.length, options.format, song.key)}</div>
                ` : ''}
                <div class="lyric-line">${escapeHtml(line.lyrics)}</div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;
}
```

## Batch Export

Export entire setlist as single document:

```typescript
async function exportSetlist(setlist: Setlist, options: ExportOptions) {
  const songs = await Promise.all(
    setlist.songIds.map(async (id, index) => {
      const song = await fetchSong(id);
      // Apply setlist-specific transposition
      const transposedKey = setlist.transpositions[id];
      if (transposedKey && transposedKey !== song.key) {
        return transposeSong(song, transposedKey);
      }
      return song;
    })
  );

  return exportToPdf(songs, options);
}
```

## Lyrics-Only Export

For congregation display:

```typescript
function generateLyricsOnlyPdf(songs: ParsedSong[]) {
  const doc = new jsPDF();

  songs.forEach((song, i) => {
    if (i > 0) doc.addPage();

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(song.title, 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');

    let y = 50;

    song.sections.forEach(section => {
      // Skip instrumental sections
      if (section.type === 'instrumental') return;

      section.lines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 30;
        }

        doc.text(line.lyrics, 105, y, { align: 'center' });
        y += 10;
      });

      y += 10; // Gap between sections
    });
  });

  doc.save('lyrics.pdf');
}
```

## Comparison

| Approach | Pros | Cons |
|----------|------|------|
| CSS Print | Simple, no deps, WYSIWYG | Less control, browser-dependent |
| jsPDF | Client-side, fast | Manual positioning, limited fonts |
| react-pdf | React components, clean API | Bundle size, learning curve |
| Puppeteer | Best quality, uses real CSS | Server-side only, slow |

## Recommendation

For **PSUWorship**:

1. **Primary**: CSS Print styles for quick printing
2. **Enhancement**: jsPDF for "Save as PDF" with custom formatting
3. **Future**: Puppeteer API route for pixel-perfect exports

Start with CSS print - it's free and covers 80% of use cases.
