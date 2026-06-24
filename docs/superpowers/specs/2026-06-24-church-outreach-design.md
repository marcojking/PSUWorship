# Church Outreach Board Design

## Goal

Add an admin kanban board for tracking outreach to ~39 Penn State area churches ahead of the event, so the team can see at a glance who's been contacted and where each relationship stands.

## Background

The user has a spreadsheet (`Penn_State_Area_Church_Outreach_List.xlsx`) listing churches with: Church Name, Denomination, Address, Phone, Email, Website, Pastor/Leader, Notes/Why Good Fit, Outreach Status, Contact Date, Follow-up Notes. Today the "Outreach Status" column only has two values across all 39 rows: 1 "Approved", 38 "Not contacted" — this is a one-off snapshot with no live tracking.

`/admin/applications` already has a kanban board (`ApplicationsBoard`/`BoardColumn`/`ApplicantCard`, built on `@dnd-kit/core`) for a different purpose (leadership role applications). This feature follows that same architecture pattern for a new, unrelated table — it does not modify or share code with the applications board, since the two domains (internal applicants vs. external church contacts) have different fields and lifecycles.

## Data Model

New Convex table `churchOutreach` in `convex/schema.ts`:

```ts
churchOutreach: defineTable({
  name: v.string(),
  denomination: v.optional(v.string()),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  website: v.optional(v.string()),
  pastorName: v.optional(v.string()),
  notes: v.optional(v.string()),           // imported "Notes / Why Good Fit"
  followUpNotes: v.optional(v.string()),   // editable in-app
  contactDate: v.optional(v.string()),     // editable in-app, free-text date
  stage: v.union(
    v.literal("unprocessed"),
    v.literal("approved"),
    v.literal("reached_out"),
    v.literal("supporting_involved"),
    v.literal("involved_not_supporting"),
    v.literal("non_involved"),
  ),
  createdAt: v.number(),
}).index("by_createdAt", ["createdAt"]),
```

Only `name` is required — manually-added churches may not have every field filled in. `stage` defaults to `"unprocessed"` for new churches.

### Stage funnel

`Unprocessed → Approved → Reached Out →` one of three terminal outcomes: `Supporting & Involved`, `Involved but Not Supporting`, `Non-Involved`. "Approved" is a vetting gate (an admin has confirmed this church is worth contacting), distinct from the outcome of actually contacting them. As a kanban, any card can be dragged to any column — the funnel order is a UI convention, not an enforced state machine.

## Convex Functions (`convex/churchOutreach.ts`)

- `list` (query) — returns all rows, no pagination needed at this volume.
- `create` (mutation) — args match the optional/required fields above; used both by the "+ Add church" UI and the one-time seed script. Sets `stage: "unprocessed"` and `createdAt: Date.now()` server-side (not passed by the caller).
- `setStage` (mutation) — `{ id, stage }`, patches `stage` only. Mirrors `leadershipInterest.setStage`.
- `updateFollowUp` (mutation) — `{ id, followUpNotes, contactDate }`, patches both fields together (modal has one Save button, not autosave-per-keystroke).

## UI

### `src/app/admin/outreach/page.tsx`

Same top-bar/heading layout as `/admin/applications`. Renders `<OutreachBoard />`.

### `src/components/admin/OutreachBoard.tsx`

- `useQuery(api.churchOutreach.list)` + `useMutation(api.churchOutreach.setStage)`, same `DndContext`/`PointerSensor` pattern as `ApplicationsBoard`.
- 6 columns, in funnel order. Six columns don't fit in the page's existing 1100px max-width without cramming, so the column row scrolls horizontally (`overflow-x: auto`) instead of shrinking column width — each column gets a fixed `min-width` (220px).
- An "+ Add church" button above the columns opens `AddChurchModal`.

### `src/components/admin/ChurchColumn.tsx`

Same shape as `BoardColumn` (droppable column, count badge, empty state) but typed for `ChurchOutreach` rows instead of `Submission` — not genericized/shared with `BoardColumn`, since the two boards have different ID types (`Id<'leadershipInterest'>` vs `Id<'churchOutreach'>`) and forcing a shared generic component isn't worth the abstraction for two call sites.

### `src/components/admin/ChurchCard.tsx`

Draggable card (same `useDraggable` pattern as `ApplicantCard`). Shows name, denomination, pastor name. Click opens `ChurchDetailModal`.

### `src/components/admin/ChurchDetailModal.tsx`

Shows all imported fields read-only (address, phone, email, website, pastor, denomination, notes). Two editable fields with their own Save button: **Follow-up Notes** (textarea) and **Contact Date** (text input). Saving calls `updateFollowUp`.

### `src/components/admin/AddChurchModal.tsx`

Form with `name` (required) + the rest of the fields (optional). Submits via `create`. New church lands in "Unprocessed".

### `/admin` dashboard

Add a "Church Outreach" `NavCard` pointing at `/admin/outreach`, alongside the existing Applications/Events/Donations cards.

## Seeding the 39 Churches

No spreadsheet-import UI — that's a one-time need, not a recurring workflow, so building an importer would be scope creep. Instead: a throwaway Node script (not committed, run once) using Convex's `ConvexHttpClient` pointed at `NEXT_PUBLIC_CONVEX_URL`, calling `create` once per row. Source data: already extracted from the spreadsheet into `/private/tmp/claude-501/-Users-marcoking/2d4f80ca-456f-4b84-9c2e-6a4293509d5c/scratchpad/churches.json` during this session (39 rows, fields mapped from the original column headers). The row currently marked "Approved" in the spreadsheet seeds with `stage: "approved"`; all other rows seed with `stage: "unprocessed"`.

## Explicitly Out of Scope

- No spreadsheet re-import UI (one-time seed script only).
- No email/call automation — this is a tracking board, not an outreach-sending tool.
- No authentication — matches the rest of `/admin`, which has no real login, just an "Internal use only" notice.
- No search/filter — 39 rows fit on screen without it.
- No editing of the imported reference fields (address/phone/email/website/pastor/denomination/notes) after seeding — only `followUpNotes`, `contactDate`, and `stage` are editable post-creation. If a typo in an imported field needs fixing, that's a manual Convex dashboard edit.

## Testing

No automated test framework is configured for this project (per `CLAUDE.md`). Verification is manual in the browser, same approach as the Roles Overview feature:
1. Run the seed script against the local dev server's Convex backend, confirm 39 churches appear across the right starting columns (38 Unprocessed, 1 Approved).
2. Drag a card through several stages, confirm it persists (Convex reactivity, no reload).
3. Open a card's detail modal, edit Follow-up Notes + Contact Date, save, reopen to confirm persistence.
4. Use "+ Add church" to create a new entry with just a name, confirm it appears in Unprocessed with all other fields blank.
5. Confirm the new "Church Outreach" nav card on `/admin` links correctly.
