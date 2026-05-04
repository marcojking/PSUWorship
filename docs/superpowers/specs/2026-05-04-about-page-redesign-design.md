# About Page Redesign — Design Spec
_WM&A Website · 2026-05-04_

---

## Overview

A full rebuild of `/about` to lock in WM&A's mission, voice, and visual identity. The page needs to feel alive — real people, real footage, real purpose — while staying on the clean editorial standard of the design system. The primary addition is a full-width infinite-scroll media marquee placed high on the page, plus strategic photo/video placement within content sections.

---

## Section Order & Content

### 1. Nav
Unchanged from current: WM&A wordmark (left), "Apply →" rust link (right), bottom border hairline.

### 2. Hero
- **Eyebrow:** `WORSHIP MUSIC & ARTS CLUB AT PENN STATE` (rust, tracked out, Source Sans 700)
- **Headline:** *About WM&A* (Cormorant italic, large — keep current)
- **Body:** Official mission statement:
  > "Worship Music and Arts Club exists to give Penn State students a space to use their gifts to worship God, and invite others in to the beauty and joy of who He is."
- No photo in the hero — let the text land before the visual hit below.

### 3. Media Marquee (full-width)
Infinite horizontal scroll loop, left-to-right, auto-playing. Positioned immediately after the hero — the first visual moment on the page.

**Layout:** A single horizontal strip, ~320–380px tall. Items are a mix of `<img>` and `<video>` elements side by side with a small gap. The strip duplicates itself to create the seamless loop.

**Media items (in order, then repeated):**
1. `BandPhoto_OG.jpg` — wide band photo, landscape crop
2. Video clip: `251011-PSUWorship-ColinCas-LivingroomWorship-ShortForm.mp4` — muted, autoplay, loop
3. `DSC09113.jpg` — EP art (flowers in water)
4. Video clip: `260118_PSUWorship_WorshipNight_07.mov` — muted, autoplay, loop
5. `BandPhoto_1X1.jpg` — square crop of band
6. Video clip: `251026-PSUWorship-Group-DelWorship_Gratitude_SF.mp4` — muted, autoplay, loop
7. `DSC09144.jpg` — EP art (water texture)
8. Video clip: `GodImJustGreatful.mp4` — muted, autoplay, loop

**Parallax:** The marquee wrapper translates on scroll — moves ~0.15× slower than the page (CSS `transform: translateY` driven by a scroll listener). Creates a subtle depth effect without being disorienting.

**Animation:** CSS `@keyframes marquee` — `transform: translateX(0)` → `transform: translateX(-50%)` over ~40s, `linear`, `infinite`. Pauses on `hover` (`animation-play-state: paused`).

**Container:** Full viewport width, `overflow: hidden`. No border radius. A soft navy-to-transparent fade mask on the left and right edges (via `mask-image: linear-gradient`).

**Media files to copy:** All source files live outside the Next.js project. They need to be copied into `public/about/` before implementation:
- Photos from `GeneralMedia/BandPhoto/` and `260122_WMA_EP/40_OUTPUT/40_PHOTO/`
- Videos from `260429_WMA_LeadershipInterestVideo/02_MEDIA/`

### 4. Mission / Values
- **Section label:** `WHO WE ARE`
- Keep the current two-paragraph "Who We Are" text, updated to reflect the official mission statement above
- Add 3 value statements below as a simple horizontal or stacked list — short, declarative:
  1. *We use our gifts for something bigger than ourselves.*
  2. *We believe a college campus is one of the most fertile places in the world for music to matter.*
  3. *We welcome anyone who is creative, curious, or just wants to belong.*

### 5. What We Do
**Section label:** `WHAT WE DO`

Three pillars (replacing the current four):
1. **Write & produce original music** — through Gentle & Lowly, we write, arrange, and record worship music entirely by Penn State students.
2. **Produce events** — from intimate living room sessions to large campus worship nights with guest artists.
3. **Learn together** — weekly time with each other and occasional guest speakers covering worship theology and the craft of leading music.

Display as the current grid card style (bordered cells), updated copy.

### 6. Events
**Section label:** `EVENTS & COMMUNITY`

Keep current card layout (title, detail, badge pill). Updated events list:
- Pat Barrett — Worship Night · Fall 2026 · Penn State Campus · badge: `Tentative`
- Caleb King — Worship Night · Fall 2026 · Penn State Campus · badge: `Tentative`
- Songwriting Workshops · Ongoing · Open to all members · badge: `Recurring`
- HUB Lawn Concert · Outdoor worship for the whole campus · badge: `Annual`

Badge color for `Tentative`: navy at lower opacity (vs rust for Upcoming), to visually signal uncertainty.

No links. Info only.

### 7. Gentle & Lowly
**Section label:** `FEATURED PROJECT`

Redesigned to include media:
- The existing dark card (`#1a1714` background) stays as the container
- **Band photo** (`BandPhoto_OG.jpg`) displayed as a full-width image inside the card, above the text — 100% card width, ~200px tall, `object-fit: cover`, slight rounded top corners to match the card
- **EP art** (`DSC09113.jpg`) — displayed as a small square accent (80×80px) floated to the right of the text block, subtle amber border
- Text and "Visit Gentle & Lowly →" link unchanged
- The G&L brand palette applies inside this card (espresso bg, cream text, amber `&`)

### 8. Leadership
**Section label:** `JOIN THE TEAM`

Replace named avatar circles with open-position pills. Layout: a `flex-wrap` row of pill chips.

Each pill: `border: 1px solid rgba(0,48,73,0.18)`, `border-radius: 9999px`, `padding: 0.5rem 1.1rem`, Source Sans 600, ~0.85rem. On hover: background shifts to `rgba(180,87,65,0.08)`, border rust-tinted.

Below the pills: a single line — *"All positions open for applications."* — and a button linking to `/join`.

Positions to list (from existing FAQ copy):
- Vice President
- Music Director
- Media Lead
- Graphic Design
- Secretary
- Event Coordinator
- Tech Lead
- Prayer Lead

### 9. FAQ
Unchanged. Six questions, accordion style, current implementation stays.

### 10. CTA
Unchanged. "Apply to Join" (navy fill) + "Give" (outlined), centered.

### 11. Footer
Unchanged.

---

## Media Files — Copy Plan

All media must be copied to `public/about/` in the Next.js project. Source paths:

| Filename | Source |
|---|---|
| `BandPhoto_OG.jpg` | `GeneralMedia/BandPhoto/BandPhoto_OG.jpg` |
| `BandPhoto_1X1.jpg` | `GeneralMedia/BandPhoto/BandPhoto_1X1.jpg` |
| `DSC09113.jpg` | `260122_WMA_EP/40_OUTPUT/40_PHOTO/DSC09113.jpg` |
| `DSC09144.jpg` | `260122_WMA_EP/40_OUTPUT/40_PHOTO/DSC09144.jpg` |
| `251011-ShortForm.mp4` | `260429_WMA_LeadershipInterestVideo/02_MEDIA/251011-PSUWorship-ColinCas-LivingroomWorship-ShortForm.mp4` |
| `260118-WorshipNight.mov` | `260429_WMA_LeadershipInterestVideo/02_MEDIA/260118_PSUWorship_WorshipNight_07.mov` |
| `251026-Gratitude.mp4` | `260429_WMA_LeadershipInterestVideo/02_MEDIA/251026-PSUWorship-Group-DelWorship_Gratitude_SF.mp4` |
| `GodImJustGrateful.mp4` | `260429_WMA_LeadershipInterestVideo/02_MEDIA/GodImJustGreatful.mp4` |

---

## Design System Compliance

- **Backgrounds:** cream `#fff7eb` for page; espresso `#1a1714` for G&L card only
- **Text:** navy `#003049` throughout; never pure black
- **Accent:** rust `#b45741` for eyebrows, badges, `&` glyphs, hover states
- **Typography:** Cormorant Garamond italic for hero headline; Source Sans 3 for all body/labels/wordmarks
- **Section labels:** Source Sans 700, `0.58rem`, `letter-spacing: 0.26em`, uppercase, rust at 80% opacity
- **No emoji.** Arrows use `→`. Section dividers are 1px navy at 10% opacity.
- **The `&` is always rust** (`#b45741`) and one weight heavier than surrounding text — applies in wordmark, hero headline, G&L card
- **Corner radii:** pills at `9999px`; cards at `14–16px`; images inside cards match card radius
- **Marquee fade masks:** `mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent)` — soft edge, not a hard cut

---

## Technical Notes

- Page must have `className="about-page"` on root div (already added) to enable scrolling via `globals.css`
- Marquee uses pure CSS animation — no library needed
- Parallax on the marquee container uses a `useEffect` scroll listener with `requestAnimationFrame` — lightweight, no deps
- All `<video>` elements: `autoPlay muted loop playsInline` — required for autoplay on iOS Safari
- Images use Next.js `<Image>` with `unoptimized` for the marquee (to avoid layout shift from dynamic sizing) or standard `<Image>` with explicit dimensions for section placements
- The `.mov` files need to be tested — browsers handle `.mov` inconsistently. May need to fall back to `<video>` with `<source>` tags or convert to `.mp4` if they don't play

---

## Out of Scope

- Event detail pages (events display info only, no links)
- Photo lightbox / gallery
- Audio playback for EP
- Mobile-specific marquee speed adjustments (handled by same CSS, acceptable)
