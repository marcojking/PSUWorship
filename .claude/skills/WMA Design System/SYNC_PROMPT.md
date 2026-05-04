# WMA Design System — sync prompt for Claude Code

Hi Claude — I'm handing you a fresh export of the **WMA / PSU Worship Design System** as a zip. My local copy of this design system is out of date and I want you to bring it up to parity with the export.

## What you're getting

A zip containing the full design-system project. Notable folders:

- `colors_and_type.css` — root tokens
- `assets/` — logos, imagery, textures
- `preview/` — every component preview (the design system's reference UI):
  - `card-role.html` ← **changed** (number now anchored in a left-edge mono index column with hairline divider, replacing the floating top-right glyph)
  - `logos.html` ← **changed** (added a square G&L monogram cell on espresso, treated like the WM&A on-navy lockup)
  - `gl-monogram.html` ← **new** (standalone 1:1 G&L mark, no caption, for asset export)
  - plus `badges.html`, `buttons.html`, `card-tool.html`, `colors-*.html`, `iconography.html`, `imagery.html`, `inputs.html`, `logo-*.html`, etc.
- `README.md`, `SKILL.md` — design-system docs

## What to do

1. **Diff** the export against my local copy of the design system. Tell me which files differ before changing anything.

2. **Apply** the changes to my local copy. Specifically I expect updates to at least:
   - `preview/card-role.html` (role cards, new index column)
   - `preview/logos.html` (square G&L monogram cell added)
   - `preview/gl-monogram.html` (new file)

3. If my local repo has a build step (Vite, Astro, Next, plain HTML, whatever), make sure the changes flow through correctly — update any imports / asset paths that need adjusting.

4. **Don't touch** `colors_and_type.css`, the brand tokens, fonts, or anything in `assets/` unless the export shows a real change there. If anything in `assets/` looks different, ask me before overwriting — those may have been hand-tuned locally.

5. After syncing, run my dev server (or open the preview HTML) and verify the role cards now show:
   - A 40px-wide left column with `01`, `02`, `03` in mono type
   - A vertical hairline divider between the index and the body
   - Color-adapted index styling per state (muted default → rust on selected team → cream on selected leadership)

6. Verify the logos page now has 5 cells in a row, with the new square G&L monogram between the wordmark and the notehead-ripples mark.

Report back with: files changed, anything you skipped and why, and any conflicts you saw.
