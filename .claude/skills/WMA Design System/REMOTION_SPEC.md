# WM&A Reels Captions — Remotion Spec

A handoff doc for re-implementing the animated subtitle reel in **Remotion** so it can render to MP4 / transparent WebM cleanly.

---

## 1. Project basics

| Setting | Value |
|---|---|
| Composition ID | `WMAReelsCaptions` |
| Dimensions | **1080 × 1920** (9:16 vertical) |
| Frame rate | **30 fps** |
| Duration | Driven by `audio.wav` length (~67.5s → ~2025 frames). Add a 0.5s tail. |
| Background | **Fully transparent** (`<Composition>` with no bg, render with `--codec=vp9` + `--pixel-format=yuva420p` for alpha, or flatten over a custom bg in a parent comp). |

Inputs the composition needs:
- `public/audio.wav` — the narration
- `public/subtitles.srt` — source of truth for word timings

Use `staticFile("audio.wav")` and `staticFile("subtitles.srt")`. Load and parse the SRT in `getInputProps` or via `calculateMetadata` so the parsed cards are passed to the component as props.

---

## 2. Fonts

Load via `@remotion/google-fonts`:

```ts
import { loadFont as loadSourceSans } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";

loadSourceSans();   // weights 200, 300, 400, 500, 600, 700, 800
loadCormorant();    // weights 400, 500, 600 + italic
```

- **Body / captions** — Source Sans 3, weight **700**, slight negative letter-spacing (`-0.005em`)
- **Emphasis words** — Cormorant Garamond, **italic 600**, ~1.12× the base size, color rust

---

## 3. Color palette

```ts
const NAVY  = "#003049";  // primary ink
const CREAM = "#fff7eb";  // (used in chips only, not background)
const RUST  = "#b45741";  // accent + ampersand color
```

Background of the composition itself = **transparent** (`backgroundColor: "transparent"`).

---

## 4. Layout

The whole composition is one absolutely-positioned layer:

```
1080 × 1920
└─ Caption band
     position: absolute
     left: 0; right: 0; bottom: 280px
     min-height: 480px
     display: flex
     align-items: flex-end
     justify-content: center
     text-align: center
     padding: 0 60px
     fontSize: 76 (default), line-height: 1.18, color: NAVY
```

That's it. No top wordmark, no progress bar, no chrome — the user does compositing in their editor.

---

## 5. SRT parsing → cards

### 5a. Parse the SRT
- Each block: `index \n HH:MM:SS,mmm --> HH:MM:SS,mmm \n text...`
- Subtract the first entry's start so timeline starts at `0`.
- Strip `<b>` tags from text.

Result: `entries: { start: number, end: number, text: string }[]` (seconds).

### 5b. Distribute SRT line times across words
The SRT is roughly 1–3 words per entry; slice each entry's duration across its words **proportional to character count**:

```ts
for (entry) {
  const words = entry.text.split(/\s+/).filter(Boolean);
  const totalChars = words.reduce((n, w) => n + w.length, 0);
  let cursor = entry.start;
  for (word of words) {
    const slice = (word.length / totalChars) * (entry.end - entry.start);
    push({ start: cursor, end: cursor + slice, text: word });
    cursor += slice;
  }
}
```

Result: `allWords: { start, end, text }[]`.

### 5c. Group into hand-authored cards (breath units)

Cards are NOT auto-grouped by punctuation. They are hand-authored to follow the meaning of the script. Use this exact list:

```ts
const CARD_PHRASES = [
  // ORIGIN
  "So we started Worship Music and Arts Club,",
  "formerly PSU Worship,",
  // PURPOSE
  "to give students a space to worship God",
  "and to invite others in to the beauty and joy of who He is.",
  // LINEUP
  "Next semester, we're talking with artists like Pat Barrett and Caleb King",
  "about coming here to our campus",
  "to worship together, encourage each other,",
  "and just build up the body of Christ here at Penn State.",
  // THE BAND
  "Our student band Gentle and Lowly",
  "is about to release our first three-song EP.",
  "It's fully written and recorded by students here.",
  "And we plan to continue to write, record, and release music together",
  "in the following semesters.",
  // INVITATION
  "Man, God is just doing so much here through music.",
  "And if you're a student here and want to be a part of that,",
  "we'd encourage you to think and pray",
  "about becoming involved in Worship Music and Arts Club.",
  // APPLY
  "We have a leadership and team application at the end of this video.",
  // DOXOLOGY
  "We've just been so encouraged",
  "by what God is doing here at Penn State.",
  "And we know that He doesn't need us,",
  "but He wants us to be a part of what He's doing.",
  "So let's all just lean into that together",
  "and just continue to bring all the glory to Jesus.",
];
```

### 5d. Align cards to word stream
For each phrase, walk the `allWords` cursor and consume matching words (case-insensitive, strip trailing punctuation for matching). Allow up to 6 words of skip tolerance — if a phrase word can't be found nearby, **still consume the next SRT word and append it** so no audio is left uncaptioned. Any tail words after the last phrase: append to the last card.

Result: `cards: { start, end, words: Word[] }[]`.

### 5e. Extend display windows
Each card stays on screen until the next card starts:

```ts
for (let i = 0; i < cards.length; i++) {
  cards[i].end = i + 1 < cards.length ? cards[i + 1].start - 0.04 : cards[i].end + 0.6;
}
```

---

## 6. Word tagging (emphasis + brand)

After cards are built, for each card's word list:

### 6a. Brand tagging (multi-word merge)
Greedy match these phrases (case-insensitive, trailing-punctuation-tolerant). When matched, **collapse the matched words into a single "brand" word** whose `start = first.start`, `end = last.end`, and which carries any trailing punctuation from the last source word:

| Match (sequence of words) | Brand key | Display |
|---|---|---|
| Worship · Music · and · Arts · Club | `WMA` | Worship Music & Arts Club |
| PSU · Worship | `PSU` | PSU Worship |
| Gentle · and · Lowly | `GL` | Gentle & Lowly |
| Pat · Barrett | `PAT` | Pat Barrett |
| Caleb · King | `CALEB` | Caleb King |
| Penn · State | `PSU2` | Penn State |

### 6b. Emphasis tagging (single words)
On non-brand words, mark `em: true` if the bare word (trailing punctuation stripped) is one of:
`God, He, Him, His, He's, Christ, Jesus, Lord`.

---

## 7. Animation

### 7a. Card-level fade in/out

For each card, given the current global time `t` (seconds = `frame / fps`):
- `sinceStart = t - card.start`
- `untilEnd = card.end - t`
- `inDur = 0.16`, `outDur = 0.22`
- Opacity: `min(sinceStart/inDur, untilEnd/outDur, 1)`, clamped to `[0, 1]`

Only render the card whose window contains `t`. If `t` falls between cards (inter-card pause < 40ms), keep the previous card visible.

### 7b. Word-level reveal (inside an active card)

Each word reveals at its own `word.start`, NOT at card start:
- `k = clamp((t - word.start) / 0.18, 0, 1)`
- `eased = 1 - (1 - k)^3` (easeOutCubic)
- `opacity = eased`
- `translateY = (1 - eased) * 14px` (rises into place)
- `marginRight: "0.25em"` between words

This is the critical detail that makes captions feel synced to speech — words pop in as they're spoken.

---

## 8. Word rendering

Three render modes:

### 8a. Plain word (default)
```tsx
<span style={{
  display: "inline-block",
  fontFamily: "'Source Sans 3', sans-serif",
  fontWeight: 700,
  color: NAVY,
  fontSize: 76,
  letterSpacing: "-0.005em",
  marginRight: "0.25em",
  opacity, transform: `translateY(${ty}px)`,
}}>{word.text}</span>
```

### 8b. Emphasized word (em: true)
Strip trailing punctuation; render the bare word in Cormorant italic / rust / bigger; render any punctuation back in the default plain-word style so the trailing comma doesn't get italicized:

```tsx
<span style={{ display: "inline-block", marginRight: "0.25em", opacity, transform }}>
  <span style={{
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontStyle: "italic",
    fontWeight: 600,
    color: RUST,
    fontSize: 76 * 1.12,
    letterSpacing: "-0.01em",
  }}>{bare}</span>
  {punct && <span style={{ /* default plain style */ }}>{punct}</span>}
</span>
```

### 8c. Brand lockup (brand: true)
One renderer per brand key. All wrapped in `<span style={{ display: "inline-block", marginRight: "0.25em", opacity, transform }}>` so they animate as one unit.

**WMA** — splits into two spans so it can wrap mid-line on tight stages:
```tsx
<span style={{ letterSpacing: "0.02em" }}>
  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>WORSHIP MUSIC</span>{" "}
  <span style={{ whiteSpace: "nowrap" }}>
    <span style={{ color: RUST, fontWeight: 800, margin: "0 0.08em" }}>&</span>
    <span style={{ fontWeight: 700 }}>ARTS CLUB</span>{trailingPunct}
  </span>
</span>
```

**PSU** — struck-through (this is the *old* name):
```tsx
<span style={{
  position: "relative", display: "inline-block",
  color: "rgba(0, 48, 73, 0.55)", letterSpacing: "0.02em",
}}>
  <span style={{ fontWeight: 200 }}>PSU</span>
  <span style={{ fontWeight: 800, marginLeft: 6 }}>WORSHIP</span>
  <span style={{
    position: "absolute", left: -4, right: -4, top: "55%",
    height: 3, background: RUST, borderRadius: 2,
    transform: "rotate(-2deg)",
  }} />
  {trailingPunct}
</span>
```

**GL** — wide-letter-spaced editorial:
```tsx
<span style={{ whiteSpace: "nowrap", letterSpacing: "0.18em", fontWeight: 300 }}>
  GENTLE
  <span style={{ color: RUST, fontWeight: 700, margin: "0 0.18em", letterSpacing: 0 }}>&</span>
  LOWLY{trailingPunct}
</span>
```

**PSU2 (Penn State)**:
```tsx
<span style={{ whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em" }}>
  PENN STATE{trailingPunct}
</span>
```

**PAT / CALEB**:
```tsx
<span style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{display}{trailingPunct}</span>
```

All brand tokens inherit the active card's font size (76px) — there's no separate sizing.

---

## 9. Audio

```tsx
import { Audio, staticFile } from "remotion";

<Audio src={staticFile("audio.wav")} />
```

The composition's frame is the timeline driver — Remotion handles audio sync automatically. Don't compute time from an `<audio>` element.

Convert frames to seconds: `t = frame / fps` (use `useCurrentFrame()` and `useVideoConfig()`).

---

## 10. Render commands

```bash
# Transparent WebM (VP9 + alpha) — for compositing in Premiere / DaVinci / CapCut
npx remotion render WMAReelsCaptions out/reels.webm \
  --codec=vp9 \
  --pixel-format=yuva420p

# Flat MP4 (cream background) for direct TikTok/Reels upload
# Wrap the comp in a parent <Composition> that adds <AbsoluteFill style={{background:"#fff7eb"}} />
npx remotion render WMAReelsCaptionsCream out/reels.mp4 --codec=h264
```

---

## 11. File layout

```
my-remotion-project/
├─ public/
│  ├─ audio.wav
│  └─ subtitles.srt
├─ src/
│  ├─ Root.tsx                  // registers compositions
│  ├─ Composition.tsx           // <WMAReelsCaptions>
│  ├─ srt.ts                    // parseSRT, buildCards, tagWords
│  ├─ Card.tsx                  // renders an active card
│  └─ Brand.tsx                 // BrandToken { brandKey, display, trailingPunct }
└─ remotion.config.ts
```

`calculateMetadata` should:
1. Read `subtitles.srt` via `staticFile`
2. Parse + build cards
3. Return `{ durationInFrames: Math.ceil((lastEnd + 0.5) * fps), props: { cards } }`

---

## 12. Sanity-check timings

After parsing, the first few cards should land roughly at:
- Card 1 ("So we started Worship Music & Arts Club,") — `~0.0s → ~2.6s`
- Card 2 ("formerly PSU Worship,") — `~2.6s → ~5.0s`
- Card 3 ("to give students a space to worship God") — `~5.0s → ~7.0s`

Total duration: ~67.5s.

If your alignment is off by more than ±0.15s on these, the SRT offset normalization or the per-word char-proportional slicing is wrong.
