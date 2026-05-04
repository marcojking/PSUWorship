# WM&A Design System

> The design language for **Worship Music & Arts Club at Penn State** — a
> student-led performing arts organization — and its music sub-brand
> **Gentle & Lowly**. Two related identities, one system.

This is *not* a corporate system and *not* a church system. It is warm,
editorial, and handmade — the aesthetic of a student arts club that makes
real things (events, patches, worship nights, recordings) and takes its
craft seriously.

---

## Two brands, one system

### WM&A · the club
The primary, public-facing identity. Cream canvas, navy ink, rust accent.
The wordmark reads **`WM&A`** — uppercase Source Sans, tight tracking, with
the **`&`** colored **rust** and set one weight heavier than the letters
around it. That `&`-as-hero-glyph is the one brand move — it carries across
every variant from the 16px favicon to the hero print.

### Gentle & Lowly · the music
A related sub-brand for the band's recorded music. Lives on a **warm-dark
espresso canvas** with **amber** accents. Same typographic rule — uppercase
Source Sans, emphasized `&` — but **lighter weights (200–300)**, **airier
tracking (0.22–0.32em)**, and quieter scale. Where WM&A is *confident,
solid, club-banner*, G&L is *whispered, spacious, hymnal*.

The band appears under the WM&A umbrella at **`/GentleAndLowly`** on the
public site.

### The `&` is the identity
Both brands share one graphic convention: the ampersand is always
emphasized — heavier weight, accent color. Everything else about the
typography is restrained, same-case, same-height. This is the system's
one move.

---

## Sources used to build this

- **Codebase:** `PSUWorship/` (locally mounted, Next.js 16 + Tailwind v4 +
  Convex). Canonical color and type tokens live in
  `PSUWorship/src/app/globals.css`. The codebase predates the rename and
  will need updates — please hand off to Claude Code in terminal for that.
- **GitHub repo (reference, not imported):** `marcojking/PSUWorship`.
- **Product copy & voice:** read from `src/app/page.tsx`, `src/app/join/page.tsx`,
  `src/components/join/RoleSelection.tsx`, `src/components/merch/MerchShell.tsx`,
  and the `docs/` folder.

No Figma was attached. If Figma is authoritative for any element later,
those values should replace what's here.

---

## Content Fundamentals

### Voice
- **We, not us-vs-them.** The home copy reads *"Tools for worship teams"* —
  inclusive, practical, not ceremonial.
- **Direct and a little personal.** The Join page opens with: *"God is
  working at Penn State and music is playing a huge role. We're looking for
  people who want to be part of that."* — confident, present-tense,
  conversational. It names God plainly without hedging, but the tone stays
  warm rather than pious.
- **Student-shaped, not corporate.** Copy uses contractions (*"we're", "don't"*),
  casual fragments (*"Only 3 left"*, *"Sold Out"*), and asides in parentheses.
- **Not over-spiritualized.** Product copy on the merch store is craft-first
  (*"Patches, stickers, and custom embroidered gear"*). Scripture shows up
  subtly — a single line on a dark logo lockup (*Jeremiah 31:12*), never
  sermonizing.
- **Gentle & Lowly voice shifts quieter.** Where WM&A might write *"Fall
  Worship Night · 7pm · We'll see you there"*, G&L would write *"Side A ·
  recorded live"*. Less imperative, more lowercase-liner-note.

### Casing & grammar
- **Sentence case for body and UI.** "Recent setlists", "Song library",
  "Join the Team." Title case is reserved for page headings and product names.
- **ALL-CAPS is a design element, not a shout.** Reserved for tracked-out
  eyebrow labels (`WM&A CLUB`, `MERCH`, `TEAM POSITIONS`) at `0.65–0.7rem`
  with `letter-spacing: 0.2em` and color `var(--rust)` or `var(--fg-3)`.
  The wordmarks themselves are always uppercase.
- **Sentences end in periods** even in short UI copy when the tone is
  earnest (*"Join the Team."*). Buttons are verbs without periods
  (*"Continue"*, *"+ Import Song"*, *"+ New Setlist"*).
- **Arrows over icons for inline nav.** `→` and `←` are the house arrows.
  *"Back to Tools ←"*, *"Customize →"*.

### Numbers, units, microcopy
- Prices are `$6.00`, not `$6`. Dollar amounts right-align when listed.
- Counts are hand-tallied: *"94 Reviews"*, *"3 / 3 selected"*, *"Only 3 left"*.
- Non-binding fields are labeled as such: *"Non-binding — we just want to
  get a sense of your availability."*
- Placeholder text stays specific: *"What instrument(s) do you play or want
  to learn? (e.g. guitar, vocals, keys)"* — not generic "Enter text…".

### Emoji / special characters
- **No emoji in the product UI.** The codebase uses zero emoji.
- **The `&` is an identity glyph.** Always emphasized — rust (WM&A) or
  amber (Gentle & Lowly), always one weight heavier than surrounding letters.
- Unicode arrows (`→ ←`), bullets (`•`), and the ratings star (`★`) *are*
  part of the vocabulary.

### Examples from the product

> **Join page hero** — "WM&A" (eyebrow, rust) → "Join the Team."
> (Cormorant italic, 5xl, navy) → "God is working at Penn State and music is
> playing a huge role. We're looking for people who want to be part of that."
> (Source Sans light, navy/55%).

> **Home card subtitle** — "Patches, stickers, and custom embroidered gear".
> Three plain-spoken nouns. No adjectives.

> **Counter** — "0 / 3 selected" goes from navy/40% to rust when the user
> starts picking. The number itself is Cormorant italic — signage, not UI.

---

## Visual Foundations

### Color

**WM&A (primary brand):**
- **Backgrounds are cream (`#fff7eb`)**, not white. White is used only for
  elevated cards *on* cream. All text is navy-tinted; never pure black.
- **Navy (`#003049`) is the ink.** Default foreground, primary button fill,
  hairlines at low opacity.
- **Rust (`#b45741`) is the warm accent** — the WM&A `&`, eyebrows, small
  badges, hover states. Pairs with navy.
- **Blue-grey (`#7fa0af`) is the cool accent** — slider fills, focus rings,
  the "breathing glow" trailing the Join progress bar.

**Gentle & Lowly (sub-brand):**
- **Backgrounds are espresso (`#1a1714`)** with warm-dark cards (`#242019`)
  and warm-brown borders (`#3a3228`).
- **Cream (`#f5ead6`) is the ink** — slightly deeper than WM&A's cream.
- **Amber (`#c4793a`) is the accent** — the G&L `&`, hairlines, credit
  lines. Softer and duskier than WM&A's rust.
- **Rust `#d97757`** (slightly brightened) is the `&` color when WM&A marks
  appear on navy backgrounds — for contrast.

### Typography
- **Display** — Cormorant Garamond, weights 400/500/600, *italic is the
  canonical display cut.* This is the brand's singing voice — used for
  headlines ("Join the Team.") and small signage ("2 / 3 selected"). Upright
  Cormorant is reserved for pull-quotes, not UI headings.
- **Body** — Source Sans 3, weights 200/300/400/500/600/700/800. Extralight
  (200) and light (300) carry the Gentle & Lowly marks; 700 and 800 carry
  WM&A marks.
- **Wordmarks** — always uppercase Source Sans, the `&` one weight heavier
  and colored. See `preview/wordmark-wma-system.html` and
  `preview/wordmark-gentle-lowly.html` for the full system.
- **Mono** — Courier New / SF Mono. Functional contexts only (chord charts,
  size chips, tracked-out "MERCH" stamp).

### Backgrounds & Imagery
- **Cream is the default WM&A canvas.** Contained photography inside cards,
  almost never full-bleed.
- **Espresso is the default G&L canvas.** Imagery here leans warm low-light,
  grainy, analog.
- **Texture matters.** The merch and G&L surfaces use a real fabric-texture
  PNG that scrolls at 1.4× parallax speed — the page literally looks like
  cloth being pulled up. Cards layer a subtle fractalNoise SVG at 3% opacity
  as "paper grain". Not AI gradient; material.
- **Photography is warm and grainy.** Product shots on neutral paper,
  slightly desaturated. Event photos warm-toned, often low-light.
- **Patchwork / embroidery motif** lives on — the club's visual shorthand
  for handmade. The old PSU-era patchwork hero (`psuworship-patchwork.png`)
  needs to be re-stitched as WM&A; flagged below.
- **No AI gradients as hero backgrounds.** Gradients exist only as thin
  transparency fades (progress-bar glow, protection fades).

### Layout
- **Max-width 2xl (672px) to 6xl (1152px)** — most pages center a column
  and let cream breathe around it. Full-bleed is reserved for hero collages.
- **Generous vertical rhythm.** Sections separated by `gap-8` / `gap-12`.
  Never dense.
- **Grid of 2 on mobile, 3–4 on desktop** — RoleCards, ProductCards, tool
  tiles.
- **Sticky headers with backdrop-blur** (`bg-background/80 backdrop-blur-md`)
  on scrolling pages.

### Corner radii
- `6px` — small inputs, size chips, badges.
- `12px` — standard inputs, buttons.
- `16–24px` — cards (`rounded-2xl`).
- `9999px` — pill buttons (the primary CTA shape).
- Nothing is sharp-cornered.

### Borders
- Thin (`1px`) navy at low opacity on cream. Warm-brown (`#3a3228`) on
  espresso.
- **Dashed borders = placeholder.**

### Shadows
- **Cards on cream** — soft navy-tinted: `0 8px 24px rgba(0, 48, 73, 0.10)`.
- **Cards on espresso** — warm-black for tactile weight:
  `0 8px 32px rgba(0,0,0,0.7)`.
- No inner shadows, no neumorphism.

### Animation
- **Default ease:** `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Exits / fades:** `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Spring pop for badges:** `cubic-bezier(0.34, 1.56, 0.64, 1)`, 0.2s.
- **Durations:** 150ms UI, 200ms transitions, 300–500ms bigger moves. Never
  slower than 600ms.
- **Breathing loops** on the Join progress bar (3s opacity ease). Nothing
  aggressive.

### Hover / press states
- **Buttons:** navy → rust on hover, lift `-2px`, add shadow.
- **Links / subtle items:** opacity `60% → 100%`.
- **Press** is implicit; no deliberate scale-down.

### Transparency & blur
- Sticky nav uses `background: rgba(bg, 0.80) + backdrop-blur-md`.
- Overlay glass on card labels uses `bg-background/70 + backdrop-blur-md`.
- Focus rings are `ring-2 ring-accent/50`.

---

## Iconography

- **SVG line icons, stroke width 1.8–2**, rounded caps and joins, drawn
  inline. Hand-designed per page, not pulled from a library. See
  `src/app/page.tsx` for examples (harmony sound-bars, setlist document,
  merch tag, join person-plus).
- **Color:** `currentColor` — cream on navy tiles, navy on cream tiles.
- **Size:** `w-8 h-8` (32px) on mobile, `w-10 h-10` (40px) on desktop.
  Icon tile is `w-14 h-14 → w-16 h-16` with `rounded-xl`.
- **No emoji. No unicode icons as decoration.** Arrows `→ ←` are copy.
- If a CDN icon library is ever needed, the closest match for stroke and
  personality is **Lucide** at stroke-width 1.75 — but the repo currently
  rolls its own, and should keep doing so.

---

## ⚠️ Open items for Claude Code (codebase)

The design system artifacts here reflect the new **WM&A + Gentle & Lowly**
structure. The `PSUWorship/` codebase still uses the old name and
logos. Please hand off these changes to Claude Code in terminal:

1. **Rename the site.** Title, meta, wordmark component — `PSU Worship`
   becomes `WM&A`. The full name spells out as *Worship Music & Arts Club
   at Penn State.*
2. **Replace the wordmark component** with the new system. See
   `preview/wordmark-wma-system.html` for canonical lockups (favicon,
   nav, full stacked, wide editorial).
3. **Add `/GentleAndLowly` route** — a dark-themed page introducing the
   band sub-brand. See `preview/wordmark-gentle-lowly.html` for the
   wordmark options.
4. **Re-stitch the patchwork hero.** The existing
   `assets/logos/psuworship-patchwork.png` still says "PSUWorship".
   This is a photographed physical patch, so it needs a new patch
   embroidered & re-photographed. Flagged for design lead.
5. **Retire `psuworship-*` SVGs.** The `notehead-ripples` mark can stay
   (it's audio-native, brand-neutral), but all wordmark-containing SVGs
   need to be re-exported under the new name.

---

## Index

Root files:
- `README.md` — this file. The canonical prose guide.
- `SKILL.md` — Agent-Skill-compatible entry point.
- `colors_and_type.css` — CSS custom properties for colors, type, spacing,
  radii, shadows, motion. Plus semantic classes.
- `fonts/` — (Google Fonts at runtime; no local files. Substitution below.)
- `assets/logos/` — logo marks. **Most still say "PSUWorship" — flagged
  for re-export.** The `notehead-ripples*` marks remain valid.
- `assets/imagery/` — fabric texture, product shots, event photos.
- `preview/` — HTML cards powering the Design System review tab.
  - `wordmark-wma-system.html` — **canonical WM&A lockups**
  - `wordmark-gentle-lowly.html` — **canonical G&L lockups**
- `ui_kits/website/` — React+Tailwind recreation of the public site.
  **Still reflects the old PSUWorship branding.** Will be re-exported
  after Claude Code propagates the rename.

---

## Font substitution

**No local font files were attached.** The codebase uses Google Fonts via
Next.js's `next/font/google`:
- `Cormorant Garamond` (400 / 500 / 600, + italic)
- `Source Sans 3` (200 / 300 / 400 / 500 / 600 / 700 / 800 / 900)

`colors_and_type.css` pulls both from `fonts.googleapis.com` at runtime. If
offline-safe TTFs are needed, drop them into `fonts/` and we'll flip the
`@import` to local `@font-face` declarations. **Flagged for follow-up.**
