# Applicant Kanban Board — Design

## Problem

`/admin/applications` currently lists all leadership applicants as an expandable flat list. There's no way to track where each applicant is in the review process (reviewing → reached out → approved) or which position you think they'd be good for. Without that, drafting personalized follow-up emails to a batch of applicants means re-reading every application from scratch.

## Goal

Turn the "Full Applications" section of `/admin/applications` into a drag-and-drop kanban board with three columns (Reviewing, Reached Out, Approved) and a per-applicant role-assignment dropdown, so the data needed to draft personalized emails (name, email, assigned role, stage) is organized and persisted. Actually drafting/sending the emails happens separately, outside the app, using Gmail tooling in conversation with Claude once roles are assigned — this project only covers organizing the data.

## Non-goals

- No "Declined" column or rejection workflow.
- No email generation, AI drafting, or Gmail integration built into the app itself.
- No authentication/login gate on `/admin` (matches existing pages — out of scope).
- No automated test suite (matches existing convention for this subsystem — manual verification only).
- No changes to the "Call Requests" section of the page.

## Data Model

Extend `leadershipInterest` in `convex/schema.ts` with two new optional fields:

```ts
leadershipInterest: defineTable({
  // ...existing fields unchanged...
  stage: v.optional(v.union(
    v.literal("reviewing"),
    v.literal("reached_out"),
    v.literal("approved"),
  )),
  assignedRole: v.optional(v.string()),
})
```

Existing rows have no `stage` until touched; the UI treats a missing `stage` as `"reviewing"`. No backfill migration needed — this is purely additive and doesn't affect the public `/join` form's `submit` mutation or any existing reads.

`assignedRole` holds one of the 15 canonical role/team names (see below). No "Other"/free-text option — confirmed scope is the fixed list only.

### Shared role list

The 15 role names currently live only inside `src/components/join/RoleSelection.tsx` as two local arrays (`LEADERSHIP_ROLES`, `TEAM_ROLES`) used for the public application form's role-picker. Extract the title strings into a new shared file:

`src/lib/roles.ts`:
```ts
export const TEAM_ROLES = [
  "Media & Social Team",
  "Events & Hospitality Team",
  "Graphics / Art Team",
  "Sound & Tech Team",
];

export const LEADERSHIP_ROLES = [
  "Vice President",
  "Music Director",
  "Treasurer",
  "Secretary",
  "Event Coordinator",
  "Hospitality Lead",
  "Social Media Lead",
  "Media Lead",
  "Tech/Production Lead",
  "Graphics / Art Lead",
  "Prayer Lead",
];

export const ALL_ROLES = [...LEADERSHIP_ROLES, ...TEAM_ROLES];
```

`RoleSelection.tsx` is refactored to import `LEADERSHIP_ROLES`/`TEAM_ROLES` from this file instead of declaring its own copies (the `description` text for each role stays colocated in `RoleSelection.tsx`, only the title strings move). This guarantees the admin role dropdown and the public form's options can never drift apart.

## Components & Files

**New:**
- `src/lib/roles.ts` — shared role name constants (above)
- `src/components/admin/ApplicationsBoard.tsx` — fetches applicants via `api.leadershipInterest.list`, groups into the 3 columns by `stage` (missing → `"reviewing"`), wraps everything in dnd-kit's `DndContext`, calls `setStage` on drag-end. Within a column, cards keep the same order the existing query already returns them in (most recently submitted first, per the table's `by_submittedAt` index) — no manual reordering within a column.
- `src/components/admin/BoardColumn.tsx` — one droppable column: title, count, list of cards
- `src/components/admin/ApplicantCard.tsx` — compact card: name, grad year, hours/week, a small drag-handle icon (dnd-kit listeners attach only to the handle, not the whole card, so the role `<select>` and the card body's click-to-expand don't conflict with drag gestures), and the role dropdown which calls `setAssignedRole` directly on change
- `src/components/admin/ApplicantDetailModal.tsx` — opened by clicking a card's body (not the handle or dropdown); shows everything the current expandable row shows (instruments, worship-team interest, video link, self-selected roles) plus an "Email" mailto link

**Modified:**
- `convex/leadershipInterest.ts` — add `setStage` and `setAssignedRole` mutations (single-document `ctx.db.patch` calls, no special validation beyond the schema's own union/string types)
- `src/app/admin/applications/page.tsx` — "Call Requests" section unchanged; "Full Applications" list section replaced with `<ApplicationsBoard />`
- `src/components/join/RoleSelection.tsx` — imports role names from `src/lib/roles.ts`

Each piece has one job: the board owns layout/grouping/drag handling and is the only component that queries; the column is a dumb droppable container; the card is a dumb draggable item that also owns the two mutations (move and role-assign); the modal is read-only detail with no mutations of its own.

## Data Flow & Error Handling

**Drag-and-drop:** `ApplicationsBoard` holds the live query result (real-time via Convex subscription) and buckets rows into columns purely by reading `stage`. On `onDragEnd`, if the card was dropped on a different column than its current stage, call `setStage({ id, stage })`. To avoid a visible flicker during the round-trip, the board keeps a small local `pendingMoves: Record<Id, Stage>` map that overrides the rendered column immediately on drop and clears once the live query reflects the same value.

**Role assignment:** the `<select>` calls `setAssignedRole({ id, assignedRole })` directly on change. No local override needed — the dropdown's own value already reflects the selection instantly.

**Errors:** both mutations are simple single-document patches; the only realistic failure is a dropped connection. If a mutation throws, revert the optimistic `pendingMoves` entry (or the dropdown's value) and show a small inline "Couldn't save, try again" message. No retry queue or offline support — this is an internal tool on a normal connection, not something that needs resilience engineering.

## Testing & Rollout

There is no separate staging Convex deployment for this project — the personal dev deployment (`fearless-dotterel-730`, aka `dev/marco-king`) is the one actually serving live data to wmaac.org, and there's no checked-in `.env.local` (gitignored, managed by the Convex CLI). Any `npx convex dev`/`deploy` run pushes schema/function changes to that same live backend immediately.

This is acceptable because every backend change here is additive (two new optional fields, two new mutations) — nothing existing is modified or removed, so the public `/join` form and the current admin list view keep working unaffected throughout.

Verification plan:
1. Add the schema fields + mutations, deploy (safe/additive).
2. Run `npm run dev` locally against that same backend.
3. Create 1-2 throwaway test applications through the real `/join` flow (clearly named, e.g. "ZZ Test") to exercise drag-between-columns, role assignment, and the detail modal.
4. Delete the throwaway records via a temporary one-off internal mutation (same pattern used for the earlier application-cleanup task), then remove that mutation again — no standing delete capability left on the live backend.
5. Confirm "Call Requests" and the rest of `/admin` are visually untouched.
6. Push the branch. Per the current Vercel setup, this does not go live to wmaac.org until manually promoted, so real visitors are unaffected until that promotion happens.

No automated test suite exists for the admin pages today; this matches that existing convention.
