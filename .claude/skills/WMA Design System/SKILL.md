---
name: wma-design
description: Use this skill to generate well-branded interfaces and assets for WM&A (Worship Music & Arts Club at Penn State) and its music sub-brand Gentle & Lowly. For production code or throwaway prototypes/mocks. Contains design guidelines, colors, type, fonts, assets, and UI kit components.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Two brands, one system

- **WM&A** — the club. Cream canvas, navy ink, rust (`#b45741`) accent. Confident, solid.
- **Gentle & Lowly** — the music sub-brand. Espresso canvas, cream ink, amber (`#c4793a`) accent. Whispered, spacious.
- Both share the same rule: uppercase Source Sans, tight/airy tracking, and the **`&` is always the hero** — one weight heavier, in the accent color.

## Key files
- `README.md` — voice, content fundamentals, visual foundations, iconography, full index
- `colors_and_type.css` — CSS variables for colors, type, spacing, radii, shadows, motion
- `preview/wordmark-wma-system.html` — **canonical WM&A lockups** (favicon → full editorial)
- `preview/wordmark-gentle-lowly.html` — **canonical G&L lockups**
- `assets/logos/` — mark assets. Wordmark-containing SVGs are still labeled "PSUWorship" and flagged for re-export; `notehead-ripples` marks remain valid.
- `assets/imagery/` — fabric texture (parallax hero), product shots, event photo
- `ui_kits/website/` — React recreation of the site (reflects old branding, pending codebase update)
- `preview/` — HTML cards for the design system review tab

## Core rules
- WM&A: cream (`#fff7eb`) backgrounds, navy (`#003049`) text, rust (`#b45741`) `&`.
- G&L: espresso (`#1a1714`) backgrounds, cream (`#f5ead6`) text, amber (`#c4793a`) `&`.
- Type pairs Cormorant Garamond italic (display, signage) with Source Sans 3 (body, wordmarks).
- No emoji. No AI gradients. Icons are hand-drawn line SVGs at 1.8–2px stroke.
- The `&` is identity, not punctuation — always emphasized (heavier weight + accent color).
- Tone is student-shaped, warm, direct, never corporate or overly religious.
