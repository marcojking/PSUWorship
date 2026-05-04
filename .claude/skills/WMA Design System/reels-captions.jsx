// SRT-driven captions. Reads the SRT file at runtime, groups adjacent lines
// into readable cards while preserving each line's exact timing for word
// reveal, and applies brand/emphasis styling.
//
// Output:
//   window.SRT_CARDS = [
//     {
//       start, end,                    // card window
//       label,                          // quick text preview (debug)
//       words: [
//         { start, end, text, em?, brand?, brandKey? }
//       ]
//     }
//   ]

const NAVY = "#003049";
const CREAM = "#fff7eb";
const RUST = "#b45741";
const BLUEGREY = "#7fa0af";

// ── Token classification ──────────────────────────────────────────────
// Given the running plain-text accumulated so far + a new chunk, decide
// which words inside the chunk should be emphasized or branded.
//
// Rules:
//   - Emphasized (Cormorant italic, rust): God, He, Him, His, He's, Christ, Jesus
//   - Branded (lockup): special multi-word phrases, recognized greedily
//
// We tag at the WORD level so that each word retains its own SRT timing.

const EMPHASIS_WORDS = new Set([
  "God", "He", "Him", "His", "He's", "Christ", "Jesus", "Lord",
]);

const BRAND_PHRASES = [
  // Multi-word brand lockups — matched as consecutive words across the timeline
  { match: ["Worship", "Music", "and", "Arts", "Club"], key: "WMA", display: "Worship Music & Arts Club" },
  { match: ["Worship", "Music", "and", "Arts", "Club."], key: "WMA", display: "Worship Music & Arts Club" },
  { match: ["PSU", "Worship"], key: "PSU", display: "PSU Worship" },
  { match: ["PSU", "Worship,"], key: "PSU", display: "PSU Worship" },
  { match: ["Gentle", "and", "Lowly"], key: "GL", display: "Gentle & Lowly" },
  { match: ["Pat", "Barrett"], key: "PAT", display: "Pat Barrett" },
  { match: ["Caleb", "King"], key: "CALEB", display: "Caleb King" },
  { match: ["Penn", "State"], key: "PSU2", display: "Penn State" },
  { match: ["Penn", "State."], key: "PSU2", display: "Penn State" },
];

// ── SRT parser ──────────────────────────────────────────────────────────
function parseTimecode(tc) {
  // "01:00:00,458" → seconds (subtract the 1-hour offset that's in the SRT)
  const [h, m, rest] = tc.split(":");
  const [s, ms] = rest.split(",");
  return (+h) * 3600 + (+m) * 60 + (+s) + (+ms) / 1000;
}

function parseSRT(srtText) {
  // Detect base offset (some files start at 01:00:00). Use first start.
  const blocks = srtText.replace(/\r/g, "").split(/\n\n+/).filter(b => b.trim());
  const entries = [];
  for (const b of blocks) {
    const lines = b.split("\n");
    if (lines.length < 3) continue;
    const tc = lines[1];
    const m = tc.match(/(\d\d:\d\d:\d\d,\d+)\s*-->\s*(\d\d:\d\d:\d\d,\d+)/);
    if (!m) continue;
    const start = parseTimecode(m[1]);
    const end = parseTimecode(m[2]);
    let text = lines.slice(2).join(" ").replace(/<[^>]+>/g, "").trim();
    entries.push({ start, end, text });
  }
  // Normalize: subtract first start
  if (entries.length === 0) return [];
  const offset = entries[0].start;
  for (const e of entries) {
    e.start -= offset;
    e.end -= offset;
  }
  return entries;
}

// ── Build cards from SRT entries ────────────────────────────────────────
// Cards are HAND-AUTHORED breath units that follow the meaning of the
// narration. Each card lists the exact words that should appear together,
// matched against the SRT word stream to inherit real per-word timings.
//
// Why hand-author? Auto-grouping by punctuation breaks up natural thoughts
// awkwardly. The cards below trace the flow of the script:
//
//   ORIGIN     ─ what we are, what changed
//   PURPOSE    ─ to worship God / to invite others
//   LINEUP     ─ artists coming next semester
//   THE BAND   ─ Gentle & Lowly EP
//   INVITATION ─ if you're a student, get involved
//   APPLY      ─ application is below
//   DOXOLOGY   ─ He doesn't need us / glory to Jesus

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

function buildCards(entries) {
  // Flatten SRT entries → per-word timings (proportional to char count).
  const allWords = [];
  for (const e of entries) {
    const tokens = e.text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const totalChars = tokens.reduce((n, t) => n + t.length, 0) || 1;
    let cursor = e.start;
    const span = e.end - e.start;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const slice = (t.length / totalChars) * span;
      allWords.push({ start: cursor, end: cursor + slice, text: t });
      cursor += slice;
    }
  }

  // Helper: strip trailing punctuation for matching
  const norm = (s) => s.replace(/[.,;:!?"']+$/g, "").toLowerCase();

  // Walk the word stream; for each card phrase, consume that many matching
  // words from the head of the stream.
  const cards = [];
  let i = 0;
  for (const phrase of CARD_PHRASES) {
    const phraseWords = phrase.split(/\s+/).filter(Boolean);
    // Find best alignment starting near i. We expect them to match in order;
    // skip ahead a few tokens if the SRT has slight extras (e.g. "of/&").
    let matchStart = i;
    let matched = [];
    let cursor = i;
    let scanned = 0;
    const MAX_SCAN = 6; // tolerance for skipping words
    for (let p = 0; p < phraseWords.length; p++) {
      const target = norm(phraseWords[p]);
      // Find next word from cursor that matches target (within MAX_SCAN)
      let found = -1;
      for (let k = 0; k < MAX_SCAN && cursor + k < allWords.length; k++) {
        if (norm(allWords[cursor + k].text) === target) { found = cursor + k; break; }
      }
      if (found < 0) {
        // No match within tolerance — fall back: take next word as-is so we
        // never lose audio coverage (every SRT word stays on screen).
        if (cursor < allWords.length) {
          matched.push(allWords[cursor]);
          cursor += 1;
        }
        continue;
      }
      // Pick up any skipped words too (so we don't drop SRT content)
      for (let s = cursor; s < found; s++) matched.push(allWords[s]);
      matched.push(allWords[found]);
      cursor = found + 1;
    }
    if (matched.length === 0) continue;
    cards.push({
      start: matched[0].start,
      end: matched[matched.length - 1].end,
      words: matched,
    });
    i = cursor;
  }

  // Append any unmatched trailing words to the last card so the audio is
  // always covered visually.
  if (i < allWords.length && cards.length) {
    const tail = allWords.slice(i);
    cards[cards.length - 1].words.push(...tail);
    cards[cards.length - 1].end = tail[tail.length - 1].end;
  }

  // Extend each card's display window to butt against the next card's start.
  for (let c = 0; c < cards.length; c++) {
    const next = cards[c + 1];
    cards[c].end = next ? next.start - 0.04 : cards[c].end + 0.6;
  }

  for (const card of cards) tagCardWords(card.words);
  return cards;
}

// Tag words in-place with em/brand markers. Brand phrases consume multiple
// words and are merged into a single "brand" entry whose start/end span
// the original words.
function tagCardWords(words) {
  // Greedy brand matching
  for (let i = 0; i < words.length; i++) {
    for (const phrase of BRAND_PHRASES) {
      const m = phrase.match;
      if (i + m.length > words.length) continue;
      let ok = true;
      for (let j = 0; j < m.length; j++) {
        // Compare with light normalization (strip trailing punctuation in SRT)
        const wt = words[i + j].text;
        if (wt !== m[j] && wt.replace(/[.,;:]$/, "") !== m[j].replace(/[.,;:]$/, "")) {
          ok = false; break;
        }
      }
      if (!ok) continue;
      // Collapse the matched range into a single "brand" entry
      const span = words.slice(i, i + m.length);
      const merged = {
        start: span[0].start,
        end: span[span.length - 1].end,
        text: phrase.display,
        brand: true,
        brandKey: phrase.key,
        // Preserve trailing punctuation from the last word ("Penn State.")
        trailingPunct: (span[span.length - 1].text.match(/[.,;:!?]+$/) || [""])[0],
      };
      words.splice(i, m.length, merged);
      break;
    }
  }
  // Emphasis tagging on remaining single words
  for (const w of words) {
    if (w.brand) continue;
    const bare = w.text.replace(/[.,;:!?]+$/, "");
    if (EMPHASIS_WORDS.has(bare)) w.em = true;
  }
}

// ── Brand renderer ─────────────────────────────────────────────────────
function BrandToken({ brandKey, display, trailingPunct }) {
  if (brandKey === "WMA") {
    return (
      <span style={{ letterSpacing: "0.02em" }}>
        <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>WORSHIP MUSIC</span>{" "}
        <span style={{ whiteSpace: "nowrap" }}>
          <span style={{ color: RUST, fontWeight: 800, margin: "0 0.08em" }}>&amp;</span>
          <span style={{ fontWeight: 700 }}>ARTS CLUB</span>{trailingPunct}
        </span>
      </span>
    );
  }
  if (brandKey === "PSU") {
    return (
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
    );
  }
  if (brandKey === "GL") {
    return (
      <span style={{ whiteSpace: "nowrap", letterSpacing: "0.18em", fontWeight: 300 }}>
        GENTLE
        <span style={{ color: RUST, fontWeight: 700, margin: "0 0.18em", letterSpacing: 0 }}>&amp;</span>
        LOWLY
        {trailingPunct}
      </span>
    );
  }
  if (brandKey === "PSU2") {
    return (
      <span style={{ whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.05em" }}>
        PENN STATE{trailingPunct}
      </span>
    );
  }
  if (brandKey === "PAT" || brandKey === "CALEB") {
    return (
      <span style={{ whiteSpace: "nowrap", fontWeight: 700 }}>
        {display}{trailingPunct}
      </span>
    );
  }
  return <span style={{ fontWeight: 700 }}>{display}{trailingPunct}</span>;
}

// ── Per-card phrase renderer with WORD-PRECISE reveal ───────────────────
function Card({ card, time, fontSize = 78 }) {
  // Each word reveals when time >= word.start. Smooth pop-in over 180ms.
  // Cards exit with a fade in their last 250ms (driven by parent crossfade).
  return (
    <div style={{
      fontFamily: "'Source Sans 3', sans-serif",
      color: NAVY,
      fontSize,
      fontWeight: 700,
      letterSpacing: "-0.005em",
      lineHeight: 1.18,
      textAlign: "center",
      padding: "0 60px",
      textWrap: "balance",
    }}>
      {card.words.map((w, i) => {
        const k = Math.max(0, Math.min(1, (time - w.start) / 0.18));
        const eased = 1 - Math.pow(1 - k, 3);
        const opacity = eased;
        const ty = (1 - eased) * 14;

        const baseStyle = {
          display: "inline-block",
          opacity,
          transform: `translateY(${ty}px)`,
          willChange: "transform, opacity",
          marginRight: "0.25em",
        };

        if (w.brand) {
          return (
            <span key={i} style={baseStyle}>
              <BrandToken brandKey={w.brandKey} display={w.text} trailingPunct={w.trailingPunct} />
            </span>
          );
        }
        if (w.em) {
          // Emphasized: Cormorant italic, rust, slightly bigger
          // Strip trailing punct so we can render it in default style
          const punct = (w.text.match(/[.,;:!?]+$/) || [""])[0];
          const bare = w.text.slice(0, w.text.length - punct.length);
          return (
            <span key={i} style={{
              ...baseStyle,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 600,
              color: RUST,
              fontSize: fontSize * 1.12,
              letterSpacing: "-0.01em",
              padding: "0 2px",
            }}>
              {bare}{punct && <span style={{ color: NAVY, fontFamily: "'Source Sans 3', sans-serif", fontStyle: "normal", fontWeight: 700, fontSize: fontSize }}>{punct}</span>}
            </span>
          );
        }
        return <span key={i} style={baseStyle}>{w.text}</span>;
      })}
    </div>
  );
}

window.SRTCaptions = { parseSRT, buildCards, Card, BrandToken,
  COLORS: { NAVY, CREAM, RUST, BLUEGREY }};
