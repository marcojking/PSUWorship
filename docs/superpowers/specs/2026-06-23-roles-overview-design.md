# Roles Overview Design

## Goal

On `/admin/applications`, replace the "Call Requests" section with a compact visualization of which of the 15 leadership/team roles are filled, tentatively assigned, or still open. This gives an at-a-glance read on staffing status without opening the kanban board.

## Background

`ApplicantCard` already lets an admin set a single `assignedRole` (string, optional) per submission via a dropdown sourced from `ALL_ROLES` (`src/lib/roles.ts` — 11 `LEADERSHIP_ROLES` + 4 `TEAM_ROLES`). Submissions also carry a `stage` (`reviewing` | `reached_out` | `approved`). There is currently no aggregate view of role coverage — you'd have to scan every card.

The "Call Requests" section on the same page displays entries from the `callRequests` Convex table, populated by the "request a call" option on `/join`. It currently has zero real usage value to the admin workflow and is being removed from this page.

## Components

### `RolesOverview` (new — `src/components/admin/RolesOverview.tsx`)

- Calls `useQuery(api.leadershipInterest.list, {})`, same query `ApplicationsBoard` already uses. Convex shares/dedupes identical query subscriptions across components, so this adds no new network or backend cost.
- For each role in `ALL_ROLES`, derives a status by scanning all submissions where `assignedRole === role`:
  - **`open`** — no submission has this `assignedRole`.
  - **`tentative`** — at least one submission has this `assignedRole`, but none of those submissions have `stage === 'approved'`.
  - **`filled`** — at least one submission with this `assignedRole` has `stage === 'approved'`.
- Renders two groups, in this order: **Leadership** (`LEADERSHIP_ROLES`, 11 roles) and **Teams** (`TEAM_ROLES`, 4 roles), each as a heading + a flex-wrap row of role chips.
- Chip styling (matching the existing cream/navy/rust theme):
  - `open`: `background: rgba(0,48,73,0.04)`, `border: 1px solid rgba(0,48,73,0.1)`, text `rgba(0,48,73,0.5)`.
  - `tentative`: transparent/light fill, `border: 1px dashed` a green tone, text in that green tone.
  - `filled`: solid green `background`, white/cream text.
- No props needed — fully self-contained, no loading-state UI beyond returning `null` while `submissions === undefined` (the board below already shows its own loading state, so this avoids a duplicate "Loading…" flash).

### `src/app/admin/applications/page.tsx` (modified)

- Remove the entire "Call Requests" block (heading, divider, count, loading/empty states, and the list of `callRequests` cards).
- Remove the `callRequests` query call and the local `CallRequest` type (both become unused once the section is gone).
- Render `<RolesOverview />` in the vacated spot — directly below the "Applications" page heading, above the "Full Applications" heading and `<ApplicationsBoard />`.

## Explicitly out of scope

- No Convex schema, query, or mutation changes. `requestCall`, `listCallRequests`, and the `callRequests` table are left exactly as they are — `/join`'s "request a call" flow keeps working; nothing reads `listCallRequests` anymore, but the query is harmless to leave in place in case a view is added back later.
- No change to how `assignedRole` is set (still the existing single-select dropdown on `ApplicantCard`, one role per submission).
- No support for a submission holding multiple roles, or for surfacing assignee names in the overview — confirmed scope is status-only (open/tentative/filled), no names.

## Testing

No automated test framework is configured for this project (per `CLAUDE.md`). Verification is manual in the browser:
1. With no submissions assigned to a role → chip shows `open`.
2. Assign a role to a submission still in `reviewing` or `reached_out` → chip shows `tentative`.
3. Move that submission to `approved` → chip flips to `filled`.
4. Confirm the "Call Requests" section no longer renders, and `/join`'s "request a call" path still submits successfully.
