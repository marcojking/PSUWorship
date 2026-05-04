# Font audit prompt for Claude Code

Hi Claude — I'm working on the **PSU Worship / WM&A Design System** and I need you to help me identify exactly which font files are missing so I can hand them off.

## What to do

1. **Read** `colors_and_type.css` and `README.md` at the project root to find every font family the design system declares (look for `--font-*` CSS variables, `@font-face` blocks, and any prose that names a typeface).

2. **Search** every HTML / CSS / JSX file in the project for `font-family:` declarations and `@import` / `<link>` Google Fonts URLs. Aggregate the full list of families actually being used.

3. **Cross-reference** that list against:
   - Any local font files in `assets/`, `fonts/`, or `public/` (`.woff`, `.woff2`, `.ttf`, `.otf`)
   - The Google Fonts CDN imports (those don't need files — note them as "loaded via CDN, OK")

4. **Produce a checklist** in this format:

   ```
   ## Fonts in use
   - [Family Name] — used in: [file1.css, file2.html, ...]
     - Weights/styles needed: 400, 600 italic, 700, ...
     - Source: [Google Fonts CDN ✓ | Local file present ✓ | MISSING ✗]
     - If MISSING: link to the foundry/Google Fonts page + which file extensions to provide

   ## Action items for the user
   - Please provide the following font files (drop into `assets/fonts/`):
     - FamilyName-Regular.woff2
     - FamilyName-SemiBold.woff2
     - FamilyName-BoldItalic.woff2
     - ...
   ```

5. **Also flag** any font that's referenced in CSS via `var(--font-display)` etc. but where the variable's value is a font that is neither loaded locally nor via CDN — these are silent fallbacks to system fonts and the user almost certainly wants the real thing.

6. If a family looks like it might be a **paid/licensed font** (Klim, Commercial Type, Pangram Pangram, Dinamo, etc.), call that out separately so I know I need a license, not just a download.

Don't change any code — just produce the audit report.
