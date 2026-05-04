# Chord Chart UX

Expert knowledge of user experience patterns for chord chart editors, viewers, and worship setlist management.

## Core Principles

1. **Clarity over decoration** - Musicians need to read quickly
2. **Minimal interaction** - One tap to transpose, scroll, etc.
3. **Large touch targets** - Used on stage with one hand
4. **High contrast** - Readable in any lighting
5. **Responsive** - Works on phone, tablet, laptop

## Chord/Lyric Display

### Monospace vs Proportional Fonts

**Monospace (Recommended)**:
- Perfect chord alignment guaranteed
- Classic chord chart look
- Examples: `Fira Code`, `JetBrains Mono`, `Consolas`

```css
.chord-chart {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  line-height: 1.8;
}
```

**Proportional** (if you must):
- Requires careful position calculation
- Can look more "designed"
- Use `ch` units for chord positioning

### HTML Structure

```tsx
// Option 1: Two-line structure (chord line + lyric line)
<div className="chord-line">
  <div className="chords">
    <span style={{ left: '0ch' }}>G</span>
    <span style={{ left: '8ch' }}>G/B</span>
    <span style={{ left: '20ch' }}>C</span>
  </div>
  <div className="lyrics">
    Amazing grace, how sweet the sound
  </div>
</div>

// Option 2: Inline chords (ChordPro-style rendering)
<div className="lyric-line">
  <span className="chord-wrapper">
    <span className="chord">G</span>
    <span className="lyric">A</span>
  </span>
  <span className="lyric">mazing </span>
  <span className="chord-wrapper">
    <span className="chord">G/B</span>
    <span className="lyric">g</span>
  </span>
  <span className="lyric">race...</span>
</div>
```

### CSS for Chord Display

```css
/* Two-line approach */
.chord-line {
  position: relative;
  margin-bottom: 1.5em;
}

.chords {
  position: relative;
  height: 1.2em;
  color: #0066cc;
  font-weight: bold;
}

.chords span {
  position: absolute;
  white-space: nowrap;
}

.lyrics {
  white-space: pre;
}

/* Inline approach */
.chord-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  vertical-align: bottom;
}

.chord {
  color: #0066cc;
  font-weight: bold;
  font-size: 0.9em;
  height: 1.2em;
  min-width: 1ch;
}

.chord:empty::before {
  content: '\00a0'; /* Non-breaking space for empty chords */
}
```

## Section Labels

Clear visual hierarchy for song sections:

```tsx
const SECTION_STYLES = {
  verse: { bg: 'transparent', border: 'none' },
  chorus: { bg: '#f0f7ff', border: '2px solid #0066cc' },
  bridge: { bg: '#fff7e6', border: '2px solid #cc6600' },
  intro: { bg: '#f0fff0', border: '1px dashed #006600' },
  outro: { bg: '#f0fff0', border: '1px dashed #006600' },
  tag: { bg: '#fff0f0', border: '1px solid #cc0000' },
};

function SectionLabel({ type, label }: { type: string; label: string }) {
  const style = SECTION_STYLES[type] || SECTION_STYLES.verse;

  return (
    <div
      className="section-label"
      style={{
        backgroundColor: style.bg,
        borderLeft: style.border,
        padding: '4px 12px',
        fontWeight: 'bold',
        marginTop: '16px',
      }}
    >
      {label || type.toUpperCase()}
    </div>
  );
}
```

## Transposition UI

### Quick Transpose Buttons

```tsx
function TransposeControls({
  currentKey,
  onTranspose,
}: {
  currentKey: string;
  onTranspose: (semitones: number) => void;
}) {
  const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  return (
    <div className="transpose-controls">
      {/* Quick up/down */}
      <button onClick={() => onTranspose(-1)}>-1</button>
      <span className="current-key">{currentKey}</span>
      <button onClick={() => onTranspose(1)}>+1</button>

      {/* Or key selector */}
      <select
        value={currentKey}
        onChange={(e) => {
          const from = keys.indexOf(currentKey);
          const to = keys.indexOf(e.target.value);
          onTranspose((to - from + 12) % 12);
        }}
      >
        {keys.map(k => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>
  );
}
```

### Capo Indicator

```tsx
function CapoIndicator({ capo, soundingKey, shapesKey }) {
  if (!capo) return null;

  return (
    <div className="capo-badge">
      Capo {capo} (Playing {shapesKey} shapes, sounds {soundingKey})
    </div>
  );
}
```

## Editing Interface

### Inline Chord Editing

```tsx
function EditableChord({
  chord,
  onUpdate,
  onDelete,
}: {
  chord: string;
  onUpdate: (newChord: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(chord);

  if (!editing) {
    return (
      <span
        className="chord editable"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => e.key === 'Delete' && onDelete()}
        tabIndex={0}
      >
        {chord}
      </span>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        onUpdate(value);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onUpdate(value);
          setEditing(false);
        }
        if (e.key === 'Escape') {
          setValue(chord);
          setEditing(false);
        }
      }}
      autoFocus
      className="chord-input"
      style={{ width: `${Math.max(value.length, 2)}ch` }}
    />
  );
}
```

### Adding Chords

Click on a lyric position to add a chord:

```tsx
function EditableLyricLine({ line, onAddChord, onUpdateChord }) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const charWidth = rect.width / line.lyrics.length;
    const position = Math.floor(x / charWidth);

    // Check if chord exists at position
    const existingChord = line.chords.find(c => c.position === position);

    if (!existingChord) {
      const newChord = prompt('Enter chord:');
      if (newChord) {
        onAddChord({ chord: newChord, position });
      }
    }
  };

  return (
    <div className="lyric-line" onClick={handleClick}>
      {/* Render line with chords */}
    </div>
  );
}
```

## Setlist Management

### Drag-and-Drop Reordering

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function SetlistEditor({ songs, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = songs.findIndex(s => s.id === active.id);
      const newIndex = songs.findIndex(s => s.id === over.id);
      onReorder(arrayMove(songs, oldIndex, newIndex));
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={songs} strategy={verticalListSortingStrategy}>
        {songs.map((song, index) => (
          <SortableSongItem
            key={song.id}
            song={song}
            index={index}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Song Card

```tsx
function SongCard({ song, index, onRemove, onTranspose }) {
  return (
    <div className="song-card">
      <div className="song-number">{index + 1}</div>
      <div className="song-info">
        <h3>{song.title}</h3>
        <span className="song-artist">{song.artist}</span>
      </div>
      <div className="song-key">
        <TransposeControls
          currentKey={song.transposedKey || song.originalKey}
          onTranspose={onTranspose}
        />
      </div>
      <button className="remove-btn" onClick={onRemove}>×</button>
    </div>
  );
}
```

## Export Options Modal

```tsx
function ExportModal({ setlist, onExport }) {
  const [format, setFormat] = useState<'lyrics' | 'chords' | 'nashville'>('chords');
  const [includeKeys, setIncludeKeys] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(true);

  return (
    <div className="modal">
      <h2>Export Setlist</h2>

      <div className="export-options">
        <label>
          <input
            type="radio"
            value="lyrics"
            checked={format === 'lyrics'}
            onChange={() => setFormat('lyrics')}
          />
          Lyrics Only (for congregation)
        </label>

        <label>
          <input
            type="radio"
            value="chords"
            checked={format === 'chords'}
            onChange={() => setFormat('chords')}
          />
          Lyrics + Letter Chords
        </label>

        <label>
          <input
            type="radio"
            value="nashville"
            checked={format === 'nashville'}
            onChange={() => setFormat('nashville')}
          />
          Lyrics + Nashville Numbers
        </label>
      </div>

      <div className="export-settings">
        <label>
          <input
            type="checkbox"
            checked={includeKeys}
            onChange={() => setIncludeKeys(!includeKeys)}
          />
          Show key at top of each song
        </label>

        <label>
          <input
            type="checkbox"
            checked={pageBreaks}
            onChange={() => setPageBreaks(!pageBreaks)}
          />
          Page break between songs
        </label>
      </div>

      <div className="export-actions">
        <button onClick={() => onExport({ format, includeKeys, pageBreaks })}>
          Export PDF
        </button>
        <button onClick={() => window.print()}>
          Print
        </button>
      </div>
    </div>
  );
}
```

## Auto-Scroll (Performance Mode)

```tsx
function useAutoScroll(enabled: boolean, speed: number) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      window.scrollBy({ top: speed, behavior: 'smooth' });
    }, 100);

    return () => clearInterval(interval);
  }, [enabled, speed]);
}

function PerformanceView({ song }) {
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);

  useAutoScroll(autoScroll, scrollSpeed);

  return (
    <div className="performance-view">
      <div className="scroll-controls">
        <button onClick={() => setAutoScroll(!autoScroll)}>
          {autoScroll ? 'Stop' : 'Auto-Scroll'}
        </button>
        <input
          type="range"
          min={1}
          max={10}
          value={scrollSpeed}
          onChange={(e) => setScrollSpeed(Number(e.target.value))}
        />
      </div>
      <ChordChart song={song} />
    </div>
  );
}
```

## Mobile Considerations

```css
/* Touch-friendly targets */
.chord, .section-label, button {
  min-height: 44px;
  min-width: 44px;
}

/* Larger text on mobile */
@media (max-width: 768px) {
  .chord-chart {
    font-size: 18px;
  }

  .chord {
    font-size: 20px;
  }
}

/* Prevent zoom on input focus */
input, select {
  font-size: 16px;
}

/* Safe area for notched phones */
.controls-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Dark Mode

```css
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
  --chord: #0066cc;
  --section-bg: #f0f7ff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e0e0e0;
    --chord: #66b3ff;
    --section-bg: #2a3a4a;
  }
}

.chord-chart {
  background: var(--bg);
  color: var(--text);
}

.chord {
  color: var(--chord);
}
```

## Reference Apps

Study these for UX patterns:
- **Planning Center Services** - Industry standard for worship planning
- **SongSelect (CCLI)** - Clean chord chart display
- **OnSong** - iPad-first chord chart app
- **Ultimate Guitar** - Mobile chord viewing
- **Worship Extreme** - Real-time worship collaboration
