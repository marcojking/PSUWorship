# PSUWorship Events System — Design Spec
*Date: 2026-04-20*

## Overview

Replace the hardcoded events system in `src/app/admin/events/page.tsx` with a Convex-backed, fully editable event management system. Each PSUWorship event gets its own detail page. The calendar merges live Convex data with remaining hardcoded items (football, holidays, breaks). Everything is inline-editable with real-time two-way sync via Convex.

---

## Data Schema (4 new Convex tables)

### `events`
Single source of truth for each PSUWorship event.

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | URL key — auto-generated from title at creation, never mutated |
| `title` | `string` | Display name |
| `subtitle` | `string` | Short descriptor shown on cards and calendar hover |
| `description` | `string` | General overview paragraph |
| `location` | `string` | Venue / room |
| `status` | `'planning' \| 'confirmed' \| 'complete'` | Shown as badge on cards |
| `color` | `'navy' \| 'rust' \| 'blue'` | Accent color for detail page header |
| `startDate` | `number` | Unix timestamp (ms) |
| `endDate` | `number` | Unix timestamp (ms) — equals startDate for single-day events |
| `days` | `Array<{ date: number, description: string }>` | Per-day descriptions for multi-day events |
| `schedule` | `Array<{ time: string, desc: string }>` | Run-of-show rows |
| `upacRows` | `Array<{ key: string, val: string, urgent?: boolean }>` | UPAC budget table rows |
| `upacNote` | `string` | Optional note below UPAC table |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp — updated on every mutation |

Indexes: `by_startDate` (`startDate`), `by_slug` (`slug`), `by_status` (`status`)

### `eventChecks`
Pre-event to-do items, linked to a single event.

| Field | Type | Notes |
|---|---|---|
| `eventId` | `Id<'events'>` | Parent event |
| `tag` | `string` | Category label e.g. "Logistics", "Media", "UPAC" |
| `tagColor` | `string` | Color key: `muted \| purple \| navy \| gold \| green \| rust` |
| `text` | `string` | Task description |
| `due` | `string` | Human-readable due date e.g. "Aug 30" |
| `done` | `boolean` | Checked off state |
| `order` | `number` | Integer for display ordering |

Index: `by_event` (`eventId`)

### `gearItems`
Shared gear library. Items here are reusable across events and serve as the UPAC documentation record for each piece of gear.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | e.g. "Shure SM58", "DI Box" |
| `category` | `string` | e.g. "Microphones", "Cables", "Monitors", "Stands" |
| `description` | `string` | Optional notes |
| `disposition` | `'buy' \| 'rent'` | Whether PSUWorship intends to buy or rent this item |
| `purchasePrice` | `number` (optional) | Price in cents — for buy items |
| `rentalPricePerEvent` | `number` (optional) | Rental cost per event in cents — for rent items |
| `sourceName` | `string` | Retailer or rental company e.g. "Sweetwater", "B&H", "Guitar Center" |
| `sourceUrl` | `string` | Direct link to the item listing — required for UPAC proof of price |
| `sourceScreenshotStorageId` | `Id<'_storage'>` (optional) | Screenshot of the listing page uploaded to Convex storage |

The disposition decision is made at the item level (not per-event) since it reflects a club-wide ownership decision rather than an event-specific one. The rationale: a mic is either worth buying for the club or not -- that doesn't change event to event. Factors like storage feasibility, installation requirements, and frequency of use drive this decision, which is made manually.

### `eventGear`
Join table linking events to gear items. Tracks quantity and per-event notes.

| Field | Type | Notes |
|---|---|---|
| `eventId` | `Id<'events'>` | Parent event |
| `gearItemId` | `Id<'gearItems'>` | Gear library item |
| `quantity` | `number` | How many of this item needed for this event |
| `notes` | `string` | Optional per-event note (e.g. "needs XLR run from stage to FOH") |

Index: `by_event` (`eventId`), `by_gear` (`gearItemId`)

---

## Routes

| Route | Purpose |
|---|---|
| `/admin/events` | Calendar + event card grid + quick-add form |
| `/admin/event/[slug]` | Full editable event detail page |
| `/admin/gear` | Master gear library + per-event breakdown + totals |

---

## Page Designs

### `/admin/events`

**Calendar section (top):**
- Hardcoded `CAL` object keeps all non-PSUWorship items (football, holidays, breaks, deadlines, social)
- PSUWorship events fetched via `useQuery(api.events.list)` and merged into calendar at render time
- Worship-type dots on calendar days are links to `/admin/event/[slug]`
- Calendar hover popups show event title, subtitle, and per-day description (if multi-day and the hovered date is one of the days)
- Existing color/type system for non-worship items unchanged

**Event card grid (below calendar):**
- All Convex events sorted ascending by `startDate`
- Each card: title, date range, location, status badge, color accent
- Clicking a card navigates to `/admin/event/[slug]`

**Quick-add form (bottom of page):**
- Two fields only: Title (text input) + Date (date picker)
- Submit creates an event in Convex with `status: 'planning'`, auto-generates slug from title, sets `startDate = endDate = selected date`
- On success, redirects to `/admin/event/[new-slug]`

### `/admin/event/[slug]`

Page fetches three queries simultaneously:
- `api.events.getBySlug({ slug })`
- `api.eventChecks.listByEvent({ eventId })`
- `api.eventGear.listByEvent({ eventId })` (joined with gear item names/categories)

**Header section:**
- Color-accented banner with event title (inline editable), subtitle (inline editable), status badge (dropdown), date range (date pickers), location (inline editable)
- If `endDate > startDate`, a "multi-day" indicator appears

**Per-day descriptions (multi-day events only):**
- Automatically generated from date range
- One textarea per day, labeled by day name + date
- Edits save on blur

**Description:**
- Full-width textarea, saves on blur

**Schedule:**
- Table of time + description rows
- Add row button, delete row button per row, inline editable cells

**UPAC table:**
- Same structure as schedule -- key/value rows, urgent toggle per row, note field below

**Checklist:**
- Each item: checkbox (toggles `done`), tag pill, text (inline editable), due date (inline editable), delete button
- Done items visually struck through but not hidden
- Add item form at bottom: tag dropdown, tag color picker, text, due date
- Items ordered by `order` field

**Gear section:**
- Each row: gear item name (linked to `/admin/gear`), category, disposition badge (BUY/RENT -- from the item, not editable here), quantity (inline number input), notes (inline editable), remove button
- Add gear: searchable dropdown across all `gearItems` (type to filter, or "Create new item" option)
  - Creating new from here: prompts for name, category, disposition, price, source URL — saves to `gearItems` then adds to event
- Link to `/admin/gear` at bottom of section for full library management

**Event list (bottom of page):**
- Same card grid as the calendar page
- Current event highlighted

### `/admin/gear`

This page serves two purposes simultaneously: a working planning tool and a live UPAC documentation record. All data stored here feeds the eventual UPAC funding request.

**Gear library:**
- Full list of all `gearItems`, grouped by category (Microphones, Cables, Monitors, Stands, etc.)
- Each item displays: name, category, disposition badge (BUY / RENT), price, source name + linked URL, screenshot thumbnail if uploaded
- Each item is fully inline-editable
- Clicking the source URL opens the listing in a new tab
- Screenshot: click to upload a listing screenshot (stored in Convex storage), thumbnail shown inline. Click thumbnail to view full size.
- Add new gear item: form with name, category, disposition toggle, price, source name, source URL, screenshot upload
- Delete only allowed if item has zero `eventGear` references — otherwise show which events use it

**Per-event breakdown:**
- Below the library, a section showing each gear item alongside every event that needs it
- For each item: list of event names + quantity needed per event
- Helps visualize frequency of use to inform the buy vs. rent decision

**Buy summary:**
- All items marked `disposition: 'buy'`
- Columns: item name, category, quantity to purchase (max quantity needed across all events that use it — since you own it, you only buy once), unit price, total cost, source link
- Running total at the bottom

**Rent summary:**
- All items marked `disposition: 'rent'`
- Columns: item name, category, events it appears in (with quantity per event), rental rate per event, total estimated rental cost across all events, source link
- Running total at the bottom

**Grand total:**
- Combined buy total + rent total
- This is the number that goes into the UPAC gear request line item

---

## Inline Editing Pattern

All inline editable fields follow this pattern:
- Display as styled text normally
- On click, swap to a matching-sized input or textarea
- On `blur` or `Enter` (for single-line), fire the relevant `useMutation`
- On `Escape`, cancel and revert to previous value
- Show a subtle loading state while mutation is in flight
- Convex's real-time subscriptions update all open tabs instantly

No explicit "Save" buttons anywhere on the detail page.

---

## Calendar Integration Detail

```ts
// Pseudocode for merging in the calendar component
const convexEvents = useQuery(api.events.list) ?? [];

const mergedCal = { ...CAL }; // hardcoded items preserved

for (const event of convexEvents) {
  const dateKey = formatDateKey(event.startDate); // 'YYYY-MM-DD'
  mergedCal[dateKey] = [
    ...(mergedCal[dateKey] ?? []),
    { label: event.title, type: 'worship', eventId: event.slug }
  ];
  // For multi-day events, add to each subsequent date too
}
```

The existing `handleWorshipClick` function becomes a router push to `/admin/event/[slug]`.

---

## Migration

A one-time seed script (`scripts/seed-events.ts`) reads the hardcoded event objects from the current `page.tsx` and creates corresponding Convex documents:
- Each `Event` object → one `events` document
- Each `checks` array item → one `eventChecks` document linked to the parent event
- Gear sections are empty initially (no gear was hardcoded)

After the seed script runs successfully, the hardcoded `EVENTS` array is removed from `page.tsx`. The hardcoded `CAL` entries for worship events are also removed since Convex provides them.

Seed script is run once manually with `npx tsx scripts/seed-events.ts` from the project root.

---

## File Structure

```
convex/
  schema.ts              — add 4 new tables
  events.ts              — CRUD queries + mutations
  eventChecks.ts         — CRUD for checklist items
  gearItems.ts           — CRUD for gear library
  eventGear.ts           — CRUD for event-gear join

src/app/admin/
  events/
    page.tsx             — calendar + card grid + quick-add (refactored)
  event/
    [slug]/
      page.tsx           — event detail page
  gear/
    page.tsx             — master gear page

scripts/
  seed-events.ts         — one-time migration script
```

---

## Out of Scope

- Auth / access control (deferred)
- Drag-to-reorder checklist items (order field exists for future use)
- Public-facing event pages
- Email notifications or reminders
