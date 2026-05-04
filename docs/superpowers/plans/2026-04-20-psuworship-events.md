# PSUWorship Events System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded event data with a Convex-backed system featuring per-event detail pages, an inline-editable UPAC gear library, and a real-time calendar merge.

**Architecture:** Four new Convex tables (`events`, `eventChecks`, `gearItems`, `eventGear`) serve as the single source of truth. The existing calendar page merges live Convex events with hardcoded non-worship items. Each PSUWorship event gets a dedicated `/admin/event/[slug]` page with fully inline-editable fields. A new `/admin/gear` page aggregates gear across all events for UPAC documentation.

**Tech Stack:** Next.js 16, React 19, Convex ^1.31.7, TypeScript, Tailwind CSS. Colors: cream `#fff7eb`, navy `#003049`, rust `#b45741`, blue-grey `#7fa0af`. No test framework — verification is TypeScript compilation + manual dev server checks.

---

## File Map

**New Convex files:**
- `convex/schema.ts` — modify: add 4 new tables
- `convex/events.ts` — create: list, getBySlug, create, update, remove
- `convex/eventChecks.ts` — create: listByEvent, create, update, toggleDone, remove
- `convex/gearItems.ts` — create: list, create, update, remove, generateUploadUrl, getScreenshotUrl
- `convex/eventGear.ts` — create: listByEvent, listAll, addToEvent, update, removeFromEvent

**New src files:**
- `src/components/admin/InlineEdit.tsx` — shared inline-edit primitive (text/textarea)
- `src/components/admin/EventCard.tsx` — event card used in both the calendar page and detail page event list
- `src/app/admin/event/[slug]/page.tsx` — event detail page
- `src/app/admin/event/[slug]/GearSearch.tsx` — searchable gear dropdown with create-new option
- `src/app/admin/gear/page.tsx` — master gear page

**Modified src files:**
- `src/app/admin/events/page.tsx` — remove hardcoded EVENTS array + worship CAL entries, add Convex merge + card grid + quick-add form

**New scripts:**
- `scripts/seed-events.ts` — one-time migration: hardcoded events → Convex

---

## Task 1: Extend Convex Schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the 4 new tables to schema.ts**

Replace the existing `export default defineSchema({` block — keep all existing tables, append the four new ones:

```typescript
// At the top, these imports are already there:
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Append inside defineSchema({ ... }) after the existing `settings` and `leadershipInterest` tables:

  events: defineTable({
    slug: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal('planning'), v.literal('confirmed'), v.literal('complete')),
    color: v.union(v.literal('navy'), v.literal('rust'), v.literal('blue')),
    startDate: v.number(),
    endDate: v.number(),
    days: v.optional(v.array(v.object({ date: v.number(), description: v.string() }))),
    schedule: v.optional(v.array(v.object({ time: v.string(), desc: v.string() }))),
    upacRows: v.optional(v.array(v.object({ key: v.string(), val: v.string(), urgent: v.optional(v.boolean()) }))),
    upacNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_startDate', ['startDate'])
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),

  eventChecks: defineTable({
    eventId: v.id('events'),
    tag: v.string(),
    tagColor: v.string(),
    text: v.string(),
    due: v.optional(v.string()),
    done: v.boolean(),
    order: v.number(),
  })
    .index('by_event', ['eventId']),

  gearItems: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    disposition: v.union(v.literal('buy'), v.literal('rent')),
    purchasePrice: v.optional(v.number()),
    rentalPricePerEvent: v.optional(v.number()),
    sourceName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceScreenshotStorageId: v.optional(v.id('_storage')),
  })
    .index('by_category', ['category']),

  eventGear: defineTable({
    eventId: v.id('events'),
    gearItemId: v.id('gearItems'),
    quantity: v.number(),
    notes: v.optional(v.string()),
  })
    .index('by_event', ['eventId'])
    .index('by_gear', ['gearItemId']),
```

- [ ] **Step 2: Verify schema compiles**

```bash
cd "C:\Users\marco\Desktop\ProjectOS\PROJECTS\PSUWorship\PSUWorship211227_PSUWORSHIP_Website\30_CODE\PSUWorship"
npx convex dev --once
```

Expected: Convex pushes schema with no errors. If there are errors, they will describe which field is invalid.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add events, eventChecks, gearItems, eventGear tables to Convex schema"
```

---

## Task 2: Convex Events Functions

**Files:**
- Create: `convex/events.ts`

- [ ] **Step 1: Create convex/events.ts**

```typescript
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('events').withIndex('by_startDate').order('asc').collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db.query('events').withIndex('by_slug', q => q.eq('slug', slug)).first();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    startDate: v.number(),
  },
  handler: async (ctx, { title, startDate }) => {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 2;
    while (await ctx.db.query('events').withIndex('by_slug', q => q.eq('slug', slug)).first()) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const now = Date.now();
    return ctx.db.insert('events', {
      slug,
      title,
      startDate,
      endDate: startDate,
      status: 'planning',
      color: 'navy',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('events'),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal('planning'), v.literal('confirmed'), v.literal('complete'))),
    color: v.optional(v.union(v.literal('navy'), v.literal('rust'), v.literal('blue'))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.array(v.object({ date: v.number(), description: v.string() }))),
    schedule: v.optional(v.array(v.object({ time: v.string(), desc: v.string() }))),
    upacRows: v.optional(v.array(v.object({ key: v.string(), val: v.string(), urgent: v.optional(v.boolean()) }))),
    upacNote: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('events') },
  handler: async (ctx, { id }) => {
    const checks = await ctx.db.query('eventChecks').withIndex('by_event', q => q.eq('eventId', id)).collect();
    for (const c of checks) await ctx.db.delete(c._id);
    const gear = await ctx.db.query('eventGear').withIndex('by_event', q => q.eq('eventId', id)).collect();
    for (const g of gear) await ctx.db.delete(g._id);
    await ctx.db.delete(id);
  },
});
```

- [ ] **Step 2: Push and verify**

```bash
npx convex dev --once
```

Expected: no errors. The `events` functions appear in the Convex dashboard.

- [ ] **Step 3: Commit**

```bash
git add convex/events.ts
git commit -m "feat: add Convex events CRUD (list, getBySlug, create, update, remove)"
```

---

## Task 3: Convex EventChecks Functions

**Files:**
- Create: `convex/eventChecks.ts`

- [ ] **Step 1: Create convex/eventChecks.ts**

```typescript
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const listByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return ctx.db
      .query('eventChecks')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect();
  },
});

export const create = mutation({
  args: {
    eventId: v.id('events'),
    tag: v.string(),
    tagColor: v.string(),
    text: v.string(),
    due: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('eventChecks', { ...args, done: false });
  },
});

export const update = mutation({
  args: {
    id: v.id('eventChecks'),
    tag: v.optional(v.string()),
    tagColor: v.optional(v.string()),
    text: v.optional(v.string()),
    due: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const toggleDone = mutation({
  args: { id: v.id('eventChecks') },
  handler: async (ctx, { id }) => {
    const check = await ctx.db.get(id);
    if (!check) return;
    await ctx.db.patch(id, { done: !check.done });
  },
});

export const remove = mutation({
  args: { id: v.id('eventChecks') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
```

- [ ] **Step 2: Push and verify**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/eventChecks.ts
git commit -m "feat: add Convex eventChecks CRUD"
```

---

## Task 4: Convex GearItems Functions

**Files:**
- Create: `convex/gearItems.ts`

- [ ] **Step 1: Create convex/gearItems.ts**

```typescript
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('gearItems').collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    disposition: v.union(v.literal('buy'), v.literal('rent')),
    description: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    rentalPricePerEvent: v.optional(v.number()),
    sourceName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('gearItems', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('gearItems'),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    disposition: v.optional(v.union(v.literal('buy'), v.literal('rent'))),
    description: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    rentalPricePerEvent: v.optional(v.number()),
    sourceName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceScreenshotStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id('gearItems') },
  handler: async (ctx, { id }) => {
    const inUse = await ctx.db.query('eventGear').withIndex('by_gear', q => q.eq('gearItemId', id)).first();
    if (inUse) throw new Error('Cannot delete gear item that is in use by an event');
    await ctx.db.delete(id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const getScreenshotUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});
```

- [ ] **Step 2: Push and verify**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/gearItems.ts
git commit -m "feat: add Convex gearItems CRUD with screenshot upload support"
```

---

## Task 5: Convex EventGear Functions

**Files:**
- Create: `convex/eventGear.ts`

- [ ] **Step 1: Create convex/eventGear.ts**

```typescript
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const listByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const rows = await ctx.db.query('eventGear').withIndex('by_event', q => q.eq('eventId', eventId)).collect();
    return Promise.all(
      rows.map(async (row) => {
        const gear = await ctx.db.get(row.gearItemId);
        return { ...row, gear };
      })
    );
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('eventGear').collect();
    return Promise.all(
      rows.map(async (row) => {
        const gear = await ctx.db.get(row.gearItemId);
        const event = await ctx.db.get(row.eventId);
        return { ...row, gear, event };
      })
    );
  },
});

export const addToEvent = mutation({
  args: {
    eventId: v.id('events'),
    gearItemId: v.id('gearItems'),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('eventGear', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('eventGear'),
    quantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const removeFromEvent = mutation({
  args: { id: v.id('eventGear') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
```

- [ ] **Step 2: Push and verify**

```bash
npx convex dev --once
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/eventGear.ts
git commit -m "feat: add Convex eventGear CRUD with joined queries"
```

---

## Task 6: Shared Admin Components

**Files:**
- Create: `src/components/admin/InlineEdit.tsx`
- Create: `src/components/admin/EventCard.tsx`

- [ ] **Step 1: Create InlineEdit.tsx**

```tsx
'use client';
import { useState, useRef, useEffect } from 'react';

type Props = {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  displayClassName?: string;
};

export function InlineEdit({ value, onSave, multiline, className, placeholder, displayClassName }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(trimmed); } finally { setSaving(false); setEditing(false); }
  }

  const sharedInputClass = `bg-transparent border-b border-[#003049]/40 focus:border-[#003049] outline-none w-full resize-none ${className ?? ''}`;

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref}
        value={draft}
        rows={3}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={sharedInputClass}
      />
    ) : (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={sharedInputClass}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={e => { if (e.key === 'Enter') setEditing(true); }}
      className={`cursor-text ${saving ? 'opacity-40' : 'hover:opacity-70'} ${displayClassName ?? ''}`}
    >
      {value || <span className="opacity-30 italic">{placeholder ?? 'Click to edit'}</span>}
    </span>
  );
}
```

- [ ] **Step 2: Create EventCard.tsx**

```tsx
import Link from 'next/link';

type EventCardProps = {
  slug: string;
  title: string;
  subtitle?: string;
  location?: string;
  status: 'planning' | 'confirmed' | 'complete';
  color: 'navy' | 'rust' | 'blue';
  startDate: number;
  endDate: number;
  isActive?: boolean;
};

const STATUS_LABEL: Record<string, string> = { planning: 'Planning', confirmed: 'Confirmed', complete: 'Complete' };
const STATUS_COLOR: Record<string, string> = {
  planning: 'bg-[rgba(0,48,73,0.12)] text-[#003049]',
  confirmed: 'bg-[rgba(80,140,80,0.15)] text-[#2a6a2a]',
  complete: 'bg-[rgba(127,160,175,0.2)] text-[#2a5869]',
};
const ACCENT: Record<string, string> = { navy: '#003049', rust: '#b45741', blue: '#7fa0af' };

function fmt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function EventCard({ slug, title, subtitle, location, status, color, startDate, endDate, isActive }: EventCardProps) {
  const accentColor = ACCENT[color];
  const dateLabel = endDate > startDate ? `${fmt(startDate)} – ${fmt(endDate)}` : fmt(startDate);

  return (
    <Link
      href={`/admin/event/${slug}`}
      className={`block rounded-lg border p-4 transition-all hover:shadow-md ${isActive ? 'ring-2 ring-[#003049]' : ''}`}
      style={{ borderColor: `${accentColor}30`, borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#003049] truncate">{title}</p>
          {subtitle && <p className="text-sm text-[rgba(0,48,73,0.6)] truncate">{subtitle}</p>}
          <p className="text-xs text-[rgba(0,48,73,0.5)] mt-1">{dateLabel}{location ? ` · ${location}` : ''}</p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in the new files.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/InlineEdit.tsx src/components/admin/EventCard.tsx
git commit -m "feat: add InlineEdit and EventCard shared admin components"
```

---

## Task 7: Seed Script (Migration)

**Files:**
- Create: `scripts/seed-events.ts`

- [ ] **Step 1: Create scripts/seed-events.ts**

This script reads the hardcoded event data and creates Convex documents. Run it once after the Convex functions are deployed.

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper: date string like "2026-08-30" → UTC timestamp
function d(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00.000Z').getTime();
}

const SEED_EVENTS = [
  {
    slug: 'first-worship-night',
    title: 'First Worship Night',
    subtitle: 'Early semester worship · Aug 30, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-08-30'),
    endDate: d('2026-08-30'),
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve space via 25Live at semester start',                                        due: 'Aug 24', order: 0 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set and confirm who is leading and playing',                           due: 'Aug 30', order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm sound/tech team availability',                                              due: 'Aug 30', order: 2 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Promote on Instagram — target returning students and new freshmen finding community', due: 'Aug 30', order: 3 },
      { tag: 'Media',     tagColor: 'purple', text: 'Capture Stories and a short highlight Reel — first worship content of the fall',    due: 'Aug 30', order: 4 },
    ],
  },
  {
    slug: 'pat-barrett-concert',
    title: 'Pat Barrett Concert',
    subtitle: 'Fall Kickoff — HUB Lawn · September 13, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-13'),
    endDate: d('2026-09-13'),
    location: 'HUB Lawn — Alumni Stage',
    schedule: [
      { time: '12:00 PM', desc: 'On-site setup begins — HUB Lawn' },
      { time: '7:00 PM',  desc: 'Doors open. Student band opening performance.' },
      { time: '7:30 PM',  desc: 'Pat Barrett — main performance' },
      { time: '9:00 PM',  desc: 'Post-concert community hang' },
      { time: '11:00 PM', desc: 'Strike and load-out complete' },
    ],
    upacRows: [
      { key: 'UPAC Submission Deadline',      val: 'July 17, 2026', urgent: true },
      { key: 'Contract Deadline',             val: 'August 28, 2026' },
      { key: 'All-Inclusive Artist Quote',    val: '$15,000' },
      { key: 'UPAC Covers (90%)',             val: '$13,500' },
      { key: 'PSU Worship Covers (10%)',      val: '$1,500 from Source 30' },
      { key: 'Annual Domestic Performer Cap', val: '$25,000 (UPAC payout, org-wide)' },
      { key: 'Remaining UPAC Performer Budget', val: '$11,500 for Caleb King' },
      { key: 'UPAC Cannot Fund',              val: 'Religious ceremonies, photographers' },
    ],
    upacNote: 'All-inclusive contracts strongly recommended — the $25K cap covers performer fee + their travel + lodging combined. If UPAC funds flights, book within 6 academic days of allocation notification or your org covers any price increase. Pat Barrett must not have performed at University Park in the last 12 months.',
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve HUB Lawn via 25Live',                                                              due: 'Now',      order: 0 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Complete RSO Event Consultation (REC) meeting with Student Affairs',                       due: 'Jun 2026', order: 1 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Meet with HUB Event Management at least 15 academic days before event',                    due: 'Aug 20',   order: 2 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm naming: "PSU Worship at Penn State" — no Penn State trademarks/shields without Licensing Office authorization', due: 'Jul 17', order: 3 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Frame application as "concert / performing arts event" — not a worship service',           due: 'Jul 17',   order: 4 },
      { tag: 'Artist',    tagColor: 'rust',   text: "Check if Pat Barrett performed at University Park in the last 12 months",                  due: 'Jul 17',   order: 5 },
      { tag: 'ASA',       tagColor: 'blue',   text: "Confirm Source 30 balance covers PSU Worship's $1,500 minimum share",                     due: 'Jul 17',   order: 6 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit UPAC funding application by July 17, 2026',                                         due: 'Jul 17',   order: 7 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Ask UPAC: can PA/audio gear purchased for this event be filed under Equipment budget ($5K annual cap)?', due: 'Jul 17', order: 8 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Finalize signed contract with Pat Barrett / management',                                   due: 'Aug 28',   order: 9 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Confirm all-inclusive flat-rate contract (fee + travel + lodging in one number)',          due: 'Aug 28',   order: 10 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'If UPAC funds flights: book within 6 academic days of allocation notice',                  due: 'On Alloc.', order: 11 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Confirm rider requirements (hospitality, tech, sound, backline)',                          due: 'Aug 28',   order: 12 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Coordinate tent and Alumni Stage setup with HUB',                                          due: 'Aug 28',   order: 13 },
      { tag: 'ASA',       tagColor: 'blue',   text: 'Issue ASA Purchase Order to Pat Barrett / management before payment',                      due: 'Aug 28',   order: 14 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Design event flyer with UPAC logo included',                                               due: 'Aug 31',   order: 15 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Launch Instagram promotion campaign (4,600+ followers)',                                   due: 'Aug 31',   order: 16 },
      { tag: 'Media',     tagColor: 'purple', text: 'Recruit dedicated video + photo team — minimum 2 cameras',                                 due: 'Aug 20',   order: 17 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Set up attendance tracking (QR codes or ID scans) for reconciliation',                     due: 'Sept 13',  order: 18 },
      { tag: 'Media',     tagColor: 'purple', text: 'Produce 60–90s highlight Reel within 7 days',                                              due: 'Sept 20',  order: 19 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit reconciliation within 40 academic days post-event',                                 due: '40d Post', order: 20 },
    ],
  },
  {
    slug: 'jesus-revolution-watch-party',
    title: 'Jesus Revolution Watch Party',
    subtitle: 'Thomas 100 · September 20, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-20'),
    endDate: d('2026-09-20'),
    location: 'Thomas Building 100',
    schedule: [
      { time: '6:30 PM', desc: 'Doors open — Thomas 100' },
      { time: '7:00 PM', desc: 'Film begins — Jesus Revolution' },
      { time: '9:00 PM', desc: 'Post-film discussion / hang' },
    ],
    upacRows: [
      { key: 'UPAC Food Budget (eff. July 1)', val: '$1,000 per event', urgent: true },
      { key: 'UPAC Food Submission Deadline',  val: 'July 24, 2026' },
      { key: 'Venue', val: 'Thomas 100 (AV built-in, free to book)' },
      { key: 'Performer / Film License Fee',   val: 'None — free event' },
    ],
    upacNote: 'UPAC is adding a $1,000/event food line item effective July 1, 2026. If food is planned, submit a UPAC request specifically for the food budget by July 24.',
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve Thomas 100 via 25Live for Sept 20 evening',                                    due: 'Now',     order: 0 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit UPAC food budget request (~$1,000) — new $1K/event policy effective July 1',    due: 'Jul 24',  order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm AV setup — projection and sound system built into Thomas 100',                 due: 'Sept 14', order: 2 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Prepare post-film discussion questions or speaker',                                    due: 'Sept 14', order: 3 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Promote on Instagram — target Christian students and general campus',                   due: 'Sept 15', order: 4 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Set up attendance tracking — required for UPAC reconciliation',                        due: 'Sept 20', order: 5 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit reconciliation within 40 academic days post-event',                             due: '40d Post', order: 6 },
    ],
  },
  {
    slug: 'songwriting-workshop',
    title: 'Songwriting Workshop',
    subtitle: 'Songwriting Workshop · September 27, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-27'),
    endDate: d('2026-09-27'),
    checks: [],
  },
  {
    slug: 'fall-worship-night',
    title: 'Fall Worship Night',
    subtitle: 'Indoor worship · October 4, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-10-04'),
    endDate: d('2026-10-04'),
    schedule: [
      { time: '7:00 PM', desc: 'Doors open' },
      { time: '7:30 PM', desc: 'Worship set begins' },
      { time: '9:00 PM', desc: 'Close + community hang' },
    ],
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Decide on indoor venue — HUB Alumni Hall, Eisenhower, or Pasquerilla Spiritual Center', due: 'ASAP',    order: 0 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve venue via 25Live once decided',                                                  due: 'ASAP',    order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set and confirm band lineup',                                               due: 'Sept 14', order: 2 },
    ],
  },
  {
    slug: 'open-mic-night',
    title: 'Open Mic Night',
    subtitle: 'Open Mic Night · October 18, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-10-18'),
    endDate: d('2026-10-18'),
    checks: [],
  },
  {
    slug: 'caleb-king',
    title: 'Caleb King',
    subtitle: 'Songwriting Workshop + Concert · Oct 30 – Nov 2, 2026',
    status: 'planning' as const,
    color: 'rust' as const,
    startDate: d('2026-10-30'),
    endDate: d('2026-11-02'),
    days: [
      { date: d('2026-10-30'), description: 'Songwriting workshop day 1' },
      { date: d('2026-10-31'), description: 'Songwriting workshop day 2' },
      { date: d('2026-11-01'), description: 'Main Concert / Worship Night (7–9:30 PM)' },
      { date: d('2026-11-02'), description: 'Wrap and debrief' },
    ],
    schedule: [
      { time: 'Fri Oct 30 · TBD',          desc: 'Songwriting workshop begins' },
      { time: 'Sat Oct 31 · TBD',          desc: 'Songwriting workshop day 2' },
      { time: 'Sun Nov 1 · 7–9:30 PM',     desc: 'Main Worship Night / Concert' },
    ],
    checks: [],
  },
  {
    slug: 'nashville',
    title: 'Nashville Trip',
    subtitle: 'Industry trip · Nov 20–23, 2026',
    status: 'planning' as const,
    color: 'blue' as const,
    startDate: d('2026-11-20'),
    endDate: d('2026-11-23'),
    days: [
      { date: d('2026-11-20'), description: 'Depart for Nashville' },
      { date: d('2026-11-21'), description: 'Studio visits and industry meetings' },
      { date: d('2026-11-22'), description: 'Professional worship environment visits' },
      { date: d('2026-11-23'), description: 'Return to State College' },
    ],
    checks: [
      { tag: 'Industry', tagColor: 'rust',   text: 'Plan professional worship environment visits', due: 'Nov 1',  order: 0 },
      { tag: 'Media',    tagColor: 'purple', text: 'Assign team member to document the trip — studio visits, city footage, candid team moments', due: 'Nov 15', order: 1 },
    ],
  },
  {
    slug: 'pre-finals-worship',
    title: 'Pre-Finals Worship Night',
    subtitle: 'Worship before finals week · Dec 12, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-12-12'),
    endDate: d('2026-12-12'),
    checks: [
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set — songs that fit end-of-semester exhaustion and encouragement', due: 'Nov 30', order: 0 },
    ],
  },
];

async function main() {
  console.log('Seeding events...');
  for (const ev of SEED_EVENTS) {
    const { checks, ...eventFields } = ev;
    const eventId = await client.mutation(api.events.create, {
      title: eventFields.title,
      startDate: eventFields.startDate,
    });
    // Patch remaining fields
    await client.mutation(api.events.update, {
      id: eventId,
      subtitle: eventFields.subtitle,
      location: (eventFields as any).location,
      status: eventFields.status,
      color: eventFields.color,
      endDate: eventFields.endDate,
      days: (eventFields as any).days,
      schedule: (eventFields as any).schedule,
      upacRows: (eventFields as any).upacRows,
      upacNote: (eventFields as any).upacNote,
    });
    for (const check of checks) {
      await client.mutation(api.eventChecks.create, { eventId, ...check });
    }
    console.log(`  ✓ ${ev.title}`);
  }
  console.log('Done.');
}

main().catch(console.error);
```

- [ ] **Step 2: Run the seed script**

```bash
cd "C:\Users\marco\Desktop\ProjectOS\PROJECTS\PSUWorship\PSUWorship211227_PSUWORSHIP_Website\30_CODE\PSUWorship"
npx tsx scripts/seed-events.ts
```

Expected output:
```
Seeding events...
  ✓ First Worship Night
  ✓ Pat Barrett Concert
  ✓ Jesus Revolution Watch Party
  ✓ Songwriting Workshop
  ✓ Fall Worship Night
  ✓ Open Mic Night
  ✓ Caleb King
  ✓ Nashville Trip
  ✓ Pre-Finals Worship Night
Done.
```

Verify in the Convex dashboard that 9 events and their checks are created.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-events.ts
git commit -m "feat: add seed script for migrating hardcoded events to Convex"
```

---

## Task 8: Refactor /admin/events Page

**Files:**
- Modify: `src/app/admin/events/page.tsx`

This task removes the hardcoded `EVENTS` array and worship CAL entries, adds Convex live data, adds the event card grid, and adds the quick-add form.

- [ ] **Step 1: Add imports at the top of the file**

After the existing `import { useState, useEffect } from 'react';` line, add:

```tsx
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../convex/_generated/api';
import { EventCard } from '@/components/admin/EventCard';
```

- [ ] **Step 2: Remove hardcoded worship entries from the CAL object**

In the `CAL` constant, delete these lines (they will now come from Convex):

```
'2026-08-30': [{ label: 'Worship Night', type: 'worship', eventId: 'aug-worship' }],
'2026-09-13': [{ label: 'Pat Barrett', type: 'worship', eventId: 'pat-barrett' }],
'2026-09-20': [{ label: 'Jesus Revolution', type: 'worship', eventId: 'jesus-revolution' }],
'2026-09-27': [{ label: 'Songwriting Workshop', type: 'worship', eventId: 'songwriting-workshop' }],
'2026-10-04': [{ label: 'Worship Night', type: 'worship', eventId: 'fall-worship-night' }],
'2026-10-11': [{ label: 'Songwriting Feedback', type: 'worship' }],
'2026-10-18': [{ label: 'Open Mic Night', type: 'worship', eventId: 'open-mic' }],
'2026-10-31': ... (remove the worship entry, keep the football entry)
'2026-11-01': [{ label: 'Caleb King Concert', type: 'worship', eventId: 'caleb-king' }],
'2026-11-02': [{ label: 'Caleb King', type: 'worship', eventId: 'caleb-king' }],
'2026-11-20': [{ label: 'Nashville', type: 'worship', eventId: 'nashville' }],
'2026-11-21': ... (remove Nashville worship entry, keep football)
'2026-11-22': ... (remove Nashville worship entry, keep Break Begins)
'2026-11-23': ... (remove Nashville worship entry, keep Thanksgiving Break)
'2026-11-24': ... (remove Nashville worship entry, keep Thanksgiving Break)
'2026-12-12': [{ label: 'Pre-Finals Worship', type: 'worship', eventId: 'final-worship' }],
```

- [ ] **Step 3: Remove the entire EVENTS array**

Delete the entire `const EVENTS: Event[] = [ ... ]` block (lines ~152–630 in the original). Also delete the `type Event`, `type CheckItem`, `type ScheduleRow`, `type UpacRow` type definitions if they are no longer used (they are only used by the EVENTS array and the dropdown section).

- [ ] **Step 4: Add Convex data fetching and calendar merge in the main component**

Inside the main `export default function AdminEventsPage()` function, add:

```tsx
const router = useRouter();
const createEvent = useMutation(api.events.create);
const convexEvents = useQuery(api.events.list) ?? [];

// Merge Convex events into the calendar
const mergedCal = useMemo(() => {
  const cal: Record<string, CalEvent[]> = { ...CAL };
  for (const ev of convexEvents) {
    let cur = ev.startDate;
    while (cur <= ev.endDate) {
      const key = new Date(cur).toISOString().slice(0, 10);
      cal[key] = [...(cal[key] ?? []), { label: ev.title, type: 'worship', eventId: ev.slug }];
      cur += 86400000;
    }
  }
  return cal;
}, [convexEvents]);

// Quick-add form state
const [newTitle, setNewTitle] = useState('');
const [newDate, setNewDate] = useState('');
const [adding, setAdding] = useState(false);

async function handleAddEvent(e: React.FormEvent) {
  e.preventDefault();
  if (!newTitle.trim() || !newDate) return;
  setAdding(true);
  try {
    const slug = await createEvent({
      title: newTitle.trim(),
      startDate: new Date(newDate + 'T00:00:00.000Z').getTime(),
    });
    // createEvent returns the new event's _id, fetch slug separately
    router.push(`/admin/event/${newTitle.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')}`);
  } finally {
    setAdding(false);
  }
}
```

Add `import { useMemo } from 'react';` to the existing React import.

- [ ] **Step 5: Pass mergedCal to SemesterCalendar and update click handler**

Change:
```tsx
<SemesterCalendar checked={checked} onWorshipClick={handleWorshipClick} />
```

To:
```tsx
<SemesterCalendar cal={mergedCal} checked={checked} onWorshipClick={(slug) => router.push(`/admin/event/${slug}`)} />
```

Update `SemesterCalendar`'s props to accept `cal: Record<string, CalEvent[]>` and use it instead of the module-level `CAL`.

- [ ] **Step 6: Add event card grid below the calendar**

After the closing tag of the calendar section and before the existing event detail dropdowns (which should now be removed), add:

```tsx
{/* Event List */}
<div className="mt-12 px-4 max-w-5xl mx-auto">
  <h2 className="text-lg font-semibold text-[#003049] mb-4">All Events</h2>
  {convexEvents.length === 0 ? (
    <p className="text-sm text-[rgba(0,48,73,0.5)]">No events yet.</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {convexEvents.map(ev => (
        <EventCard
          key={ev._id}
          slug={ev.slug}
          title={ev.title}
          subtitle={ev.subtitle}
          location={ev.location}
          status={ev.status}
          color={ev.color}
          startDate={ev.startDate}
          endDate={ev.endDate}
        />
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 7: Add quick-add form at the bottom**

After the event card grid:

```tsx
{/* Quick Add */}
<div className="mt-10 px-4 max-w-5xl mx-auto pb-16">
  <h2 className="text-lg font-semibold text-[#003049] mb-3">Add Event</h2>
  <form onSubmit={handleAddEvent} className="flex flex-wrap gap-3 items-end">
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[rgba(0,48,73,0.6)]">Title</label>
      <input
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        placeholder="Event title"
        required
        className="border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 text-sm outline-none focus:border-[#003049] w-64"
      />
    </div>
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[rgba(0,48,73,0.6)]">Date</label>
      <input
        type="date"
        value={newDate}
        onChange={e => setNewDate(e.target.value)}
        required
        style={{ colorScheme: 'light' }}
        className="border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 text-sm outline-none focus:border-[#003049]"
      />
    </div>
    <button
      type="submit"
      disabled={adding}
      className="bg-[#003049] text-[#fff7eb] px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
    >
      {adding ? 'Creating…' : 'Create Event →'}
    </button>
  </form>
</div>
```

- [ ] **Step 8: Remove the old event dropdown section**

Delete the entire section of the page that renders the `EVENTS`-backed accordion/dropdown panels. This includes the `handleWorshipClick` state, the `selectedEvent` state, and the JSX block that maps over events.

- [ ] **Step 9: Run dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000/admin/events`. Verify:
- Calendar loads with Convex events shown as navy pills on the correct dates
- Multi-day events (Caleb King, Nashville) show on each day in their range
- Event card grid shows all 9 seeded events
- Quick-add form creates a new event and redirects

- [ ] **Step 10: Commit**

```bash
git add src/app/admin/events/page.tsx
git commit -m "feat: refactor events page to use Convex — calendar merge, event grid, quick-add form"
```

---

## Task 9: Event Detail Page — Scaffold + Header + Content Sections

**Files:**
- Create: `src/app/admin/event/[slug]/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/admin/event/[slug]"
```

- [ ] **Step 2: Create src/app/admin/event/[slug]/page.tsx**

```tsx
'use client';
import { use, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../../convex/_generated/api';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { EventCard } from '@/components/admin/EventCard';

const COLOR_ACCENT: Record<string, string> = { navy: '#003049', rust: '#b45741', blue: '#7fa0af' };
const COLOR_BG: Record<string, string>     = { navy: 'rgba(0,48,73,0.06)', rust: 'rgba(180,87,65,0.06)', blue: 'rgba(127,160,175,0.06)' };

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10); // 'YYYY-MM-DD' for date inputs
}

function fmtDisplay(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function getDaysBetween(startTs: number, endTs: number): number[] {
  const days: number[] = [];
  let cur = startTs;
  while (cur <= endTs) { days.push(cur); cur += 86400000; }
  return days;
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const event = useQuery(api.events.getBySlug, { slug });
  const allEvents = useQuery(api.events.list) ?? [];
  const updateEvent = useMutation(api.events.update);

  // Loading state
  if (event === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-[rgba(0,48,73,0.4)]">Loading…</div>;
  }
  if (event === null) {
    return <div className="min-h-screen flex items-center justify-center text-[rgba(0,48,73,0.4)]">Event not found.</div>;
  }

  const accent = COLOR_ACCENT[event.color];
  const accentBg = COLOR_BG[event.color];
  const isMultiDay = event.endDate > event.startDate;
  const days = isMultiDay ? getDaysBetween(event.startDate, event.endDate) : [];

  async function patchEvent(fields: Parameters<typeof updateEvent>[0]) {
    await updateEvent({ id: event!._id, ...fields });
  }

  // Per-day description helper
  const dayDescMap = Object.fromEntries((event.days ?? []).map(d => [d.date, d.description]));
  async function saveDayDesc(dateTs: number, description: string) {
    const current = event!.days ?? [];
    const next = current.some(d => d.date === dateTs)
      ? current.map(d => d.date === dateTs ? { ...d, description } : d)
      : [...current, { date: dateTs, description }];
    await patchEvent({ days: next });
  }

  // Schedule row helpers
  async function addScheduleRow() {
    await patchEvent({ schedule: [...(event!.schedule ?? []), { time: '', desc: '' }] });
  }
  async function updateScheduleRow(idx: number, field: 'time' | 'desc', value: string) {
    const next = (event!.schedule ?? []).map((r, i) => i === idx ? { ...r, [field]: value } : r);
    await patchEvent({ schedule: next });
  }
  async function removeScheduleRow(idx: number) {
    await patchEvent({ schedule: (event!.schedule ?? []).filter((_, i) => i !== idx) });
  }

  // UPAC row helpers
  async function addUpacRow() {
    await patchEvent({ upacRows: [...(event!.upacRows ?? []), { key: '', val: '' }] });
  }
  async function updateUpacRow(idx: number, field: 'key' | 'val' | 'urgent', value: string | boolean) {
    const next = (event!.upacRows ?? []).map((r, i) => i === idx ? { ...r, [field]: value } : r);
    await patchEvent({ upacRows: next });
  }
  async function removeUpacRow(idx: number) {
    await patchEvent({ upacRows: (event!.upacRows ?? []).filter((_, i) => i !== idx) });
  }

  return (
    <div className="min-h-screen bg-[#fff7eb]">
      {/* Back nav */}
      <div className="px-6 py-3 border-b border-[rgba(0,48,73,0.08)]">
        <button onClick={() => router.push('/admin/events')} className="text-sm text-[rgba(0,48,73,0.5)] hover:text-[#003049] transition-colors">
          ← All Events
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pt-8 pb-6" style={{ background: accentBg, borderBottom: `1px solid ${accent}20` }}>
        <div className="max-w-4xl mx-auto">
          {/* Status + Color */}
          <div className="flex items-center gap-3 mb-3">
            <select
              value={event.status}
              onChange={e => patchEvent({ status: e.target.value as 'planning' | 'confirmed' | 'complete' })}
              className="text-xs px-2 py-1 rounded-full border outline-none cursor-pointer"
              style={{ borderColor: `${accent}40`, color: accent, background: `${accent}10` }}
            >
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Complete</option>
            </select>
            <select
              value={event.color}
              onChange={e => patchEvent({ color: e.target.value as 'navy' | 'rust' | 'blue' })}
              className="text-xs px-2 py-1 rounded-full border outline-none cursor-pointer bg-transparent"
              style={{ borderColor: `${accent}40`, color: accent }}
            >
              <option value="navy">Navy</option>
              <option value="rust">Rust</option>
              <option value="blue">Blue</option>
            </select>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-semibold" style={{ color: accent }}>
            <InlineEdit
              value={event.title}
              onSave={v => patchEvent({ title: v })}
              placeholder="Event title"
              displayClassName="text-3xl font-semibold"
            />
          </h1>

          {/* Subtitle */}
          <div className="mt-1 text-base" style={{ color: `${accent}99` }}>
            <InlineEdit
              value={event.subtitle ?? ''}
              onSave={v => patchEvent({ subtitle: v })}
              placeholder="Add subtitle…"
            />
          </div>

          {/* Dates */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm" style={{ color: `${accent}bb` }}>
            <label className="flex items-center gap-2">
              Start:
              <input
                type="date"
                value={fmtDate(event.startDate)}
                onChange={e => patchEvent({ startDate: new Date(e.target.value + 'T00:00:00.000Z').getTime() })}
                style={{ colorScheme: 'light' }}
                className="border-b border-current bg-transparent outline-none text-sm cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2">
              End:
              <input
                type="date"
                value={fmtDate(event.endDate)}
                onChange={e => patchEvent({ endDate: new Date(e.target.value + 'T00:00:00.000Z').getTime() })}
                style={{ colorScheme: 'light' }}
                className="border-b border-current bg-transparent outline-none text-sm cursor-pointer"
              />
            </label>
            {isMultiDay && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${accent}15` }}>Multi-day</span>}
          </div>

          {/* Location */}
          <div className="mt-2 text-sm flex items-center gap-1" style={{ color: `${accent}99` }}>
            <span>📍</span>
            <InlineEdit
              value={event.location ?? ''}
              onSave={v => patchEvent({ location: v })}
              placeholder="Add location…"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* Description */}
        <section>
          <h2 className="section-heading" style={{ color: accent }}>Description</h2>
          <InlineEdit
            value={event.description ?? ''}
            onSave={v => patchEvent({ description: v })}
            multiline
            placeholder="Add event description…"
            displayClassName="text-sm text-[rgba(0,48,73,0.7)] leading-relaxed whitespace-pre-wrap"
          />
        </section>

        {/* Per-day descriptions (multi-day only) */}
        {isMultiDay && (
          <section>
            <h2 className="section-heading" style={{ color: accent }}>Day-by-Day</h2>
            <div className="space-y-4">
              {days.map(dayTs => (
                <div key={dayTs} className="border-l-2 pl-4" style={{ borderColor: `${accent}40` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: `${accent}99` }}>{fmtDisplay(dayTs)}</p>
                  <InlineEdit
                    value={dayDescMap[dayTs] ?? ''}
                    onSave={v => saveDayDesc(dayTs, v)}
                    multiline
                    placeholder="Describe this day…"
                    displayClassName="text-sm text-[rgba(0,48,73,0.7)] whitespace-pre-wrap"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading" style={{ color: accent }}>Schedule</h2>
            <button onClick={addScheduleRow} className="text-xs px-3 py-1 rounded border hover:opacity-80 transition-opacity" style={{ borderColor: `${accent}30`, color: accent }}>
              + Add row
            </button>
          </div>
          {(event.schedule ?? []).length === 0 ? (
            <p className="text-sm text-[rgba(0,48,73,0.4)]">No schedule rows yet.</p>
          ) : (
            <div className="divide-y divide-[rgba(0,48,73,0.06)]">
              {(event.schedule ?? []).map((row, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2">
                  <div className="w-28 shrink-0">
                    <InlineEdit value={row.time} onSave={v => updateScheduleRow(idx, 'time', v)} placeholder="Time" displayClassName="text-xs font-medium text-[rgba(0,48,73,0.6)]" />
                  </div>
                  <div className="flex-1">
                    <InlineEdit value={row.desc} onSave={v => updateScheduleRow(idx, 'desc', v)} placeholder="Description" displayClassName="text-sm text-[rgba(0,48,73,0.8)]" />
                  </div>
                  <button onClick={() => removeScheduleRow(idx)} className="text-[rgba(0,48,73,0.3)] hover:text-[#b45741] text-xs shrink-0 pt-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UPAC Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading" style={{ color: accent }}>UPAC</h2>
            <button onClick={addUpacRow} className="text-xs px-3 py-1 rounded border hover:opacity-80 transition-opacity" style={{ borderColor: `${accent}30`, color: accent }}>
              + Add row
            </button>
          </div>
          {(event.upacRows ?? []).length > 0 && (
            <div className="divide-y divide-[rgba(0,48,73,0.06)] mb-4">
              {(event.upacRows ?? []).map((row, idx) => (
                <div key={idx} className={`flex items-start gap-3 py-2 ${row.urgent ? 'bg-[rgba(180,87,65,0.04)]' : ''}`}>
                  <div className="w-52 shrink-0">
                    <InlineEdit value={row.key} onSave={v => updateUpacRow(idx, 'key', v)} placeholder="Key" displayClassName="text-xs font-medium text-[rgba(0,48,73,0.6)]" />
                  </div>
                  <div className="flex-1">
                    <InlineEdit value={row.val} onSave={v => updateUpacRow(idx, 'val', v)} placeholder="Value" displayClassName={`text-sm ${row.urgent ? 'text-[#b45741] font-medium' : 'text-[rgba(0,48,73,0.8)]'}`} />
                  </div>
                  <label className="flex items-center gap-1 text-xs text-[rgba(0,48,73,0.5)] shrink-0">
                    <input type="checkbox" checked={!!row.urgent} onChange={e => updateUpacRow(idx, 'urgent', e.target.checked)} className="accent-[#b45741]" />
                    urgent
                  </label>
                  <button onClick={() => removeUpacRow(idx)} className="text-[rgba(0,48,73,0.3)] hover:text-[#b45741] text-xs shrink-0 pt-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
          {/* UPAC note */}
          <div className="mt-2">
            <p className="text-xs text-[rgba(0,48,73,0.4)] mb-1">Note</p>
            <InlineEdit
              value={event.upacNote ?? ''}
              onSave={v => patchEvent({ upacNote: v })}
              multiline
              placeholder="Add UPAC notes…"
              displayClassName="text-xs text-[rgba(0,48,73,0.6)] leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </section>

        {/* Checklist — rendered in Task 10 */}
        <ChecklistSection eventId={event._id} accent={accent} />

        {/* Gear — rendered in Task 11 */}
        <GearSection eventId={event._id} accent={accent} />

        {/* All events list */}
        <section>
          <h2 className="section-heading mb-4" style={{ color: accent }}>All Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allEvents.map(ev => (
              <EventCard
                key={ev._id}
                slug={ev.slug}
                title={ev.title}
                subtitle={ev.subtitle}
                location={ev.location}
                status={ev.status}
                color={ev.color}
                startDate={ev.startDate}
                endDate={ev.endDate}
                isActive={ev.slug === slug}
              />
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        .section-heading { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }
      `}</style>
    </div>
  );
}

// Placeholder components — implemented in Tasks 10 and 11
function ChecklistSection({ eventId, accent }: { eventId: string; accent: string }) {
  return <section><h2 className="section-heading" style={{ color: accent }}>Checklist</h2><p className="text-sm text-[rgba(0,48,73,0.4)]">Coming in next task.</p></section>;
}
function GearSection({ eventId, accent }: { eventId: string; accent: string }) {
  return <section><h2 className="section-heading" style={{ color: accent }}>Gear</h2><p className="text-sm text-[rgba(0,48,73,0.4)]">Coming in next task.</p></section>;
}
```

- [ ] **Step 3: Run dev server and verify the page loads**

```bash
npm run dev
```

Open `http://localhost:3000/admin/event/first-worship-night`. Verify:
- Header renders with correct title, subtitle, dates
- Inline editing works — click a field, change it, blur, confirm it updates
- Multi-day events (e.g., `/admin/event/caleb-king`) show the Day-by-Day section
- Schedule and UPAC table show rows with add/remove/edit working
- All Events grid at the bottom shows all seeded events, current one highlighted

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/event/
git commit -m "feat: add event detail page with header, schedule, UPAC, and all-events list"
```

---

## Task 10: Event Detail — Checklist Section

**Files:**
- Modify: `src/app/admin/event/[slug]/page.tsx`

- [ ] **Step 1: Replace the ChecklistSection placeholder with the real implementation**

Replace the placeholder `ChecklistSection` function at the bottom of `page.tsx` with:

```tsx
const TAG_COLORS: Record<string, string> = {
  muted:  'bg-[rgba(0,48,73,0.08)] text-[rgba(0,48,73,0.6)]',
  purple: 'bg-[rgba(103,58,183,0.12)] text-[#5c35a8]',
  navy:   'bg-[rgba(0,48,73,0.15)] text-[#003049]',
  gold:   'bg-[rgba(196,145,58,0.18)] text-[#7a5010]',
  green:  'bg-[rgba(80,140,80,0.15)] text-[#2a6a2a]',
  rust:   'bg-[rgba(180,87,65,0.15)] text-[#b45741]',
  blue:   'bg-[rgba(127,160,175,0.18)] text-[#2a5869]',
};

const TAG_OPTIONS = ['Logistics', 'Venue', 'UPAC', 'Promo', 'Media', 'Artist', 'ASA', 'Industry'];
const TAG_COLOR_OPTIONS = ['muted', 'purple', 'navy', 'gold', 'green', 'rust', 'blue'];

function ChecklistSection({ eventId, accent }: { eventId: any; accent: string }) {
  const checks = useQuery(api.eventChecks.listByEvent, { eventId }) ?? [];
  const createCheck = useMutation(api.eventChecks.create);
  const updateCheck = useMutation(api.eventChecks.update);
  const toggleDone  = useMutation(api.eventChecks.toggleDone);
  const removeCheck = useMutation(api.eventChecks.remove);

  const [tag, setTag]       = useState('Logistics');
  const [tagColor, setTagColor] = useState('muted');
  const [text, setText]     = useState('');
  const [due, setDue]       = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    try {
      await createCheck({ eventId, tag, tagColor, text: text.trim(), due: due || undefined, order: checks.length });
      setText(''); setDue('');
    } finally { setAdding(false); }
  }

  const done   = checks.filter(c => c.done);
  const notDone = checks.filter(c => !c.done);

  return (
    <section>
      <h2 className="section-heading" style={{ color: accent }}>
        Checklist <span className="text-xs font-normal text-[rgba(0,48,73,0.4)] ml-2">{done.length}/{checks.length} done</span>
      </h2>

      <div className="space-y-1">
        {[...notDone, ...done].map(check => (
          <div key={check._id} className={`flex items-start gap-3 py-2 rounded px-2 ${check.done ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={check.done}
              onChange={() => toggleDone({ id: check._id })}
              className="mt-0.5 accent-[#003049] shrink-0"
            />
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TAG_COLORS[check.tagColor] ?? TAG_COLORS.muted}`}>
              {check.tag}
            </span>
            <div className="flex-1 min-w-0">
              <InlineEdit
                value={check.text}
                onSave={v => updateCheck({ id: check._id, text: v })}
                displayClassName={`text-sm ${check.done ? 'line-through' : 'text-[rgba(0,48,73,0.85)]'}`}
              />
            </div>
            {check.due && (
              <span className="text-xs text-[rgba(0,48,73,0.4)] shrink-0">
                <InlineEdit value={check.due} onSave={v => updateCheck({ id: check._id, due: v })} displayClassName="text-xs text-[rgba(0,48,73,0.4)]" />
              </span>
            )}
            <button onClick={() => removeCheck({ id: check._id })} className="text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2 items-end border-t border-[rgba(0,48,73,0.06)] pt-4">
        <select value={tag} onChange={e => setTag(e.target.value)} className="text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none">
          {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={tagColor} onChange={e => setTagColor(e.target.value)} className="text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none">
          {TAG_COLOR_OPTIONS.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Task description"
          className="flex-1 min-w-48 text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-1.5 outline-none focus:border-[#003049]"
        />
        <input
          value={due}
          onChange={e => setDue(e.target.value)}
          placeholder="Due (e.g. Aug 30)"
          className="w-32 text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none focus:border-[#003049]"
        />
        <button type="submit" disabled={adding} className="text-xs px-3 py-1.5 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
          {adding ? '…' : '+ Add'}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Verify dev server**

Open any event detail page. Verify:
- Checklist renders items from Convex
- Checking a box toggles `done` and moves item to bottom with strikethrough
- Add form creates a new check item that appears immediately (real-time)
- Delete button removes items
- Clicking the text of a check item allows inline editing

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/event/[slug]/page.tsx
git commit -m "feat: add checklist section to event detail page"
```

---

## Task 11: Event Detail — Gear Section

**Files:**
- Create: `src/app/admin/event/[slug]/GearSearch.tsx`
- Modify: `src/app/admin/event/[slug]/page.tsx`

- [ ] **Step 1: Create GearSearch.tsx**

```tsx
'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

type Props = {
  eventId: Id<'events'>;
  onAdded: () => void;
};

export function GearSearch({ eventId, onAdded }: Props) {
  const allGear = useQuery(api.gearItems.list) ?? [];
  const addToEvent = useMutation(api.eventGear.addToEvent);
  const createGear = useMutation(api.gearItems.create);

  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [creating, setCreating] = useState(false);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDisposition, setNewDisposition] = useState<'buy' | 'rent'>('buy');

  const filtered = allGear.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = allGear.find(g => g.name.toLowerCase() === query.toLowerCase());

  async function handleSelect(gearItemId: Id<'gearItems'>) {
    await addToEvent({ eventId, gearItemId, quantity });
    setQuery(''); setQuantity(1);
    onAdded();
  }

  async function handleCreateAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCategory.trim()) return;
    setCreating(true);
    try {
      const gearItemId = await createGear({ name: newName.trim(), category: newCategory.trim(), disposition: newDisposition });
      await addToEvent({ eventId, gearItemId, quantity });
      setQuery(''); setNewName(''); setNewCategory(''); setQuantity(1);
      onAdded();
    } finally { setCreating(false); }
  }

  return (
    <div className="mt-4 border-t border-[rgba(0,48,73,0.06)] pt-4">
      <div className="flex gap-2 items-center mb-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search gear library…"
          className="flex-1 text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-1.5 outline-none focus:border-[#003049]"
        />
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="w-16 text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none text-center"
        />
      </div>

      {/* Filtered results */}
      {query && (
        <ul className="border border-[rgba(0,48,73,0.12)] rounded divide-y divide-[rgba(0,48,73,0.06)] mb-2 max-h-48 overflow-y-auto">
          {filtered.map(g => (
            <li key={g._id}>
              <button
                onClick={() => handleSelect(g._id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(0,48,73,0.04)] flex items-center justify-between"
              >
                <span>{g.name}</span>
                <span className="text-xs text-[rgba(0,48,73,0.4)]">{g.category} · {g.disposition.toUpperCase()}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-xs text-[rgba(0,48,73,0.4)]">No matches — fill in below to create</li>
          )}
        </ul>
      )}

      {/* Create new item form — shown when no exact match */}
      {query && !exactMatch && (
        <form onSubmit={handleCreateAndAdd} className="bg-[rgba(0,48,73,0.03)] rounded p-3 space-y-2">
          <p className="text-xs text-[rgba(0,48,73,0.5)] font-medium">Create new gear item</p>
          <input
            value={newName || query}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none"
          />
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Category (e.g. Microphones)"
            className="w-full text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" value="buy" checked={newDisposition === 'buy'} onChange={() => setNewDisposition('buy')} /> Buy
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" value="rent" checked={newDisposition === 'rent'} onChange={() => setNewDisposition('rent')} /> Rent
            </label>
          </div>
          <button type="submit" disabled={creating} className="text-xs px-3 py-1.5 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
            {creating ? '…' : 'Create + Add to Event'}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the GearSection placeholder in page.tsx**

```tsx
function GearSection({ eventId, accent }: { eventId: any; accent: string }) {
  const rows = useQuery(api.eventGear.listByEvent, { eventId }) ?? [];
  const updateRow  = useMutation(api.eventGear.update);
  const removeRow  = useMutation(api.eventGear.removeFromEvent);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-heading" style={{ color: accent }}>Gear</h2>
        <a href="/admin/gear" className="text-xs underline" style={{ color: `${accent}80` }}>Manage library →</a>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[rgba(0,48,73,0.4)]">No gear added yet.</p>
      ) : (
        <div className="divide-y divide-[rgba(0,48,73,0.06)]">
          {rows.map(row => {
            if (!row.gear) return null;
            return (
              <div key={row._id} className="flex items-start gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgba(0,48,73,0.85)]">{row.gear.name}</p>
                  <p className="text-xs text-[rgba(0,48,73,0.4)]">{row.gear.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${row.gear.disposition === 'buy' ? 'bg-[rgba(80,140,80,0.12)] text-[#2a6a2a]' : 'bg-[rgba(196,145,58,0.15)] text-[#7a5010]'}`}>
                  {row.gear.disposition.toUpperCase()}
                </span>
                {/* Quantity */}
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={e => updateRow({ id: row._id, quantity: Number(e.target.value) })}
                  className="w-12 text-center text-sm border border-[rgba(0,48,73,0.2)] rounded px-1 py-0.5 outline-none"
                />
                {/* Notes */}
                <div className="w-32">
                  <InlineEdit
                    value={row.notes ?? ''}
                    onSave={v => updateRow({ id: row._id, notes: v })}
                    placeholder="Notes…"
                    displayClassName="text-xs text-[rgba(0,48,73,0.5)]"
                  />
                </div>
                <button onClick={() => removeRow({ id: row._id })} className="text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs shrink-0">✕</button>
              </div>
            );
          })}
        </div>
      )}

      <GearSearch eventId={eventId} onAdded={() => {}} />
    </section>
  );
}
```

Add `import { GearSearch } from './GearSearch';` to the top of `page.tsx`.

- [ ] **Step 3: Verify gear section**

Open an event detail page. Verify:
- Gear section shows (empty for seeded events)
- Searching in GearSearch filters the library
- Selecting a gear item adds it to the event
- Creating a new gear item from the search form works
- Quantity field is editable inline
- Remove button deletes the row

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/event/[slug]/GearSearch.tsx src/app/admin/event/[slug]/page.tsx
git commit -m "feat: add gear section and GearSearch component to event detail page"
```

---

## Task 12: Master Gear Page — Library Section

**Files:**
- Create: `src/app/admin/gear/page.tsx`

- [ ] **Step 1: Create src/app/admin/gear/page.tsx**

```tsx
'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { InlineEdit } from '@/components/admin/InlineEdit';

const ACCENT = '#003049';

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const CATEGORIES = ['Microphones', 'Cables', 'Monitors', 'Stands', 'PA / Speakers', 'Mixing', 'Lighting', 'Staging', 'Power', 'Recording', 'Other'];

export default function GearPage() {
  const allGear   = useQuery(api.gearItems.list) ?? [];
  const allRows   = useQuery(api.eventGear.listAll) ?? [];
  const createGear = useMutation(api.gearItems.create);
  const updateGear = useMutation(api.gearItems.update);
  const removeGear = useMutation(api.gearItems.remove);
  const genUploadUrl = useMutation(api.gearItems.generateUploadUrl);

  // New item form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Microphones');
  const [newDisposition, setNewDisposition] = useState<'buy' | 'rent'>('buy');
  const [newPrice, setNewPrice] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createGear({
        name: newName.trim(),
        category: newCategory,
        disposition: newDisposition,
        purchasePrice: newDisposition === 'buy' && newPrice ? Math.round(parseFloat(newPrice) * 100) : undefined,
        rentalPricePerEvent: newDisposition === 'rent' && newPrice ? Math.round(parseFloat(newPrice) * 100) : undefined,
        sourceName: newSourceName.trim() || undefined,
        sourceUrl: newSourceUrl.trim() || undefined,
      });
      setNewName(''); setNewPrice(''); setNewSourceName(''); setNewSourceUrl('');
      setShowAddForm(false);
    } finally { setAdding(false); }
  }

  async function handleScreenshotUpload(gearId: any, file: File) {
    const url = await genUploadUrl({});
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    await updateGear({ id: gearId, sourceScreenshotStorageId: storageId });
  }

  async function handleRemove(gearId: any, name: string) {
    try {
      await removeGear({ id: gearId });
    } catch {
      alert(`Cannot delete "${name}" — it is used by one or more events.`);
    }
  }

  // Group by category
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: allGear.filter(g => g.category === cat),
  })).filter(g => g.items.length > 0);

  // Uncategorized
  const knownCats = new Set(CATEGORIES);
  const other = allGear.filter(g => !knownCats.has(g.category));

  // Event usage map: gearItemId → eventGear rows
  const usageMap = new Map<string, typeof allRows>();
  for (const row of allRows) {
    if (!row.gear) continue;
    const key = row.gearItemId as string;
    usageMap.set(key, [...(usageMap.get(key) ?? []), row]);
  }

  return (
    <div className="min-h-screen bg-[#fff7eb]">
      <div className="px-6 py-3 border-b border-[rgba(0,48,73,0.08)]">
        <a href="/admin/events" className="text-sm text-[rgba(0,48,73,0.5)] hover:text-[#003049]">← Events</a>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#003049]">Gear Library</h1>
          <button
            onClick={() => setShowAddForm(s => !s)}
            className="text-sm px-4 py-2 rounded bg-[#003049] text-[#fff7eb] hover:opacity-90 transition-opacity"
          >
            {showAddForm ? 'Cancel' : '+ Add Gear Item'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-8 p-4 border border-[rgba(0,48,73,0.12)] rounded-lg bg-white space-y-3">
            <h3 className="text-sm font-semibold text-[#003049]">New Gear Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name *" required className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="buy" checked={newDisposition === 'buy'} onChange={() => setNewDisposition('buy')} /> Buy
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="rent" checked={newDisposition === 'rent'} onChange={() => setNewDisposition('rent')} /> Rent
                </label>
              </div>
              <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder={newDisposition === 'buy' ? 'Purchase price ($)' : 'Rental rate per event ($)'} type="number" step="0.01" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <input value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="Source name (e.g. Sweetwater)" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <input value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="Source URL (item listing)" type="url" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
            </div>
            <button type="submit" disabled={adding} className="text-sm px-4 py-2 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
              {adding ? 'Adding…' : 'Add to Library'}
            </button>
          </form>
        )}

        {/* Gear library grouped by category */}
        {[...grouped, ...(other.length > 0 ? [{ category: 'Other', items: other }] : [])].map(group => (
          <div key={group.category} className="mb-8">
            <h2 className="text-sm font-semibold text-[rgba(0,48,73,0.5)] uppercase tracking-wide mb-3">{group.category}</h2>
            <div className="divide-y divide-[rgba(0,48,73,0.06)] border border-[rgba(0,48,73,0.08)] rounded-lg overflow-hidden">
              {group.items.map(gear => {
                const usage = usageMap.get(gear._id as string) ?? [];
                return (
                  <div key={gear._id} className="p-4 bg-white hover:bg-[rgba(0,48,73,0.01)]">
                    <div className="flex items-start gap-4">
                      {/* Screenshot thumbnail */}
                      <div className="shrink-0 w-14 h-14 rounded border border-[rgba(0,48,73,0.1)] overflow-hidden bg-[rgba(0,48,73,0.03)] flex items-center justify-center">
                        {gear.sourceScreenshotStorageId ? (
                          <ScreenshotThumb storageId={gear.sourceScreenshotStorageId} />
                        ) : (
                          <label className="cursor-pointer text-center text-xs text-[rgba(0,48,73,0.3)] leading-tight p-1">
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleScreenshotUpload(gear._id, f); }} />
                            Add<br/>photo
                          </label>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Name */}
                        <div className="flex items-center gap-2">
                          <InlineEdit value={gear.name} onSave={v => updateGear({ id: gear._id, name: v })} displayClassName="font-medium text-[#003049]" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${gear.disposition === 'buy' ? 'bg-[rgba(80,140,80,0.12)] text-[#2a6a2a]' : 'bg-[rgba(196,145,58,0.15)] text-[#7a5010]'}`}>
                            {gear.disposition.toUpperCase()}
                          </span>
                          <select
                            value={gear.disposition}
                            onChange={e => updateGear({ id: gear._id, disposition: e.target.value as 'buy' | 'rent' })}
                            className="text-xs border-0 outline-none bg-transparent text-[rgba(0,48,73,0.4)] cursor-pointer"
                          >
                            <option value="buy">Buy</option>
                            <option value="rent">Rent</option>
                          </select>
                        </div>

                        {/* Price */}
                        <div className="text-xs text-[rgba(0,48,73,0.5)] flex items-center gap-1">
                          {gear.disposition === 'buy' ? (
                            <>Buy price: <InlineEdit value={gear.purchasePrice ? fmt(gear.purchasePrice) : ''} onSave={v => updateGear({ id: gear._id, purchasePrice: Math.round(parseFloat(v.replace('$','')) * 100) })} placeholder="Add price" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" /></>
                          ) : (
                            <>Rental/event: <InlineEdit value={gear.rentalPricePerEvent ? fmt(gear.rentalPricePerEvent) : ''} onSave={v => updateGear({ id: gear._id, rentalPricePerEvent: Math.round(parseFloat(v.replace('$','')) * 100) })} placeholder="Add price" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" /></>
                          )}
                        </div>

                        {/* Source */}
                        <div className="text-xs text-[rgba(0,48,73,0.5)] flex items-center gap-2">
                          <InlineEdit value={gear.sourceName ?? ''} onSave={v => updateGear({ id: gear._id, sourceName: v })} placeholder="Source name" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" />
                          {gear.sourceUrl && (
                            <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#003049]">View listing ↗</a>
                          )}
                          {!gear.sourceUrl && (
                            <InlineEdit value="" onSave={v => updateGear({ id: gear._id, sourceUrl: v })} placeholder="Add listing URL" displayClassName="text-xs text-[rgba(0,48,73,0.4)]" />
                          )}
                        </div>

                        {/* Used by events */}
                        {usage.length > 0 && (
                          <div className="text-xs text-[rgba(0,48,73,0.4)]">
                            Used in: {usage.map((u: any, i: number) => (
                              <span key={u._id}>
                                {i > 0 && ', '}
                                <a href={`/admin/event/${u.event?.slug}`} className="underline hover:text-[#003049]">{u.event?.title ?? '?'}</a>
                                {' '}(×{u.quantity})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => handleRemove(gear._id, gear.name)} className="shrink-0 text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs pt-1">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {allGear.length === 0 && (
          <p className="text-sm text-[rgba(0,48,73,0.4)]">No gear items yet. Add your first item above.</p>
        )}
      </div>
    </div>
  );
}

function ScreenshotThumb({ storageId }: { storageId: any }) {
  const url = useQuery(api.gearItems.getScreenshotUrl, { storageId });
  if (!url) return null;
  return <img src={url} alt="listing" className="w-full h-full object-cover" />;
}
```

- [ ] **Step 2: Verify gear library page**

```bash
npm run dev
```

Open `http://localhost:3000/admin/gear`. Verify:
- Page loads with empty library
- Add gear item form creates items and shows them grouped by category
- Inline editing works for name, price, source name, source URL
- Screenshot upload stores image and renders thumbnail
- Delete throws alert if item is in use
- "Used in" links appear for gear attached to events

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/gear/page.tsx
git commit -m "feat: add gear library page with inline editing and screenshot upload"
```

---

## Task 13: Gear Page — Per-Event Breakdown + Buy/Rent Summaries

**Files:**
- Modify: `src/app/admin/gear/page.tsx`

- [ ] **Step 1: Add the buy summary, rent summary, and grand total sections below the library**

After the closing `</div>` of the library section (after the `allGear.length === 0` paragraph) and before the closing `</div>` of `max-w-5xl`, add:

```tsx
{/* Spacer */}
<div className="my-12 border-t border-[rgba(0,48,73,0.08)]" />

{/* Buy Summary */}
{(() => {
  const buyItems = allGear.filter(g => g.disposition === 'buy');
  if (buyItems.length === 0) return null;

  let total = 0;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[#003049] mb-4">Buy Summary</h2>
      <p className="text-xs text-[rgba(0,48,73,0.4)] mb-3">Quantity = max needed simultaneously across all events (buy once, use repeatedly).</p>
      <div className="border border-[rgba(0,48,73,0.1)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[rgba(0,48,73,0.04)]">
            <tr>
              <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Item</th>
              <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Category</th>
              <th className="text-center px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Qty</th>
              <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Unit Price</th>
              <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Total</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,48,73,0.06)]">
            {buyItems.map(gear => {
              const usage = usageMap.get(gear._id as string) ?? [];
              const maxQty = usage.length > 0 ? Math.max(...usage.map((u: any) => u.quantity)) : 1;
              const unitPrice = gear.purchasePrice ?? 0;
              const rowTotal = unitPrice * maxQty;
              total += rowTotal;
              return (
                <tr key={gear._id} className="bg-white">
                  <td className="px-4 py-2 text-[#003049] font-medium">{gear.name}</td>
                  <td className="px-4 py-2 text-[rgba(0,48,73,0.5)]">{gear.category}</td>
                  <td className="px-4 py-2 text-center text-[rgba(0,48,73,0.7)]">{maxQty}</td>
                  <td className="px-4 py-2 text-right text-[rgba(0,48,73,0.7)]">{unitPrice ? fmt(unitPrice) : '—'}</td>
                  <td className="px-4 py-2 text-right font-medium text-[#003049]">{rowTotal ? fmt(rowTotal) : '—'}</td>
                  <td className="px-4 py-2">
                    {gear.sourceUrl && <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[rgba(0,48,73,0.4)] hover:text-[#003049]">↗</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[rgba(0,48,73,0.04)]">
            <tr>
              <td colSpan={4} className="px-4 py-2 text-sm font-semibold text-[#003049] text-right">Buy Total</td>
              <td className="px-4 py-2 text-right font-bold text-[#003049]">{fmt(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
})()}

{/* Rent Summary */}
{(() => {
  const rentItems = allGear.filter(g => g.disposition === 'rent');
  if (rentItems.length === 0) return null;

  let total = 0;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[#003049] mb-4">Rent Summary</h2>
      <div className="border border-[rgba(0,48,73,0.1)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[rgba(0,48,73,0.04)]">
            <tr>
              <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Item</th>
              <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Events</th>
              <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Rate/Event</th>
              <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Total</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,48,73,0.06)]">
            {rentItems.map(gear => {
              const usage = usageMap.get(gear._id as string) ?? [];
              const rate = gear.rentalPricePerEvent ?? 0;
              const rowTotal = rate * usage.length;
              total += rowTotal;
              return (
                <tr key={gear._id} className="bg-white">
                  <td className="px-4 py-2 text-[#003049] font-medium">{gear.name}</td>
                  <td className="px-4 py-2 text-[rgba(0,48,73,0.5)] text-xs">
                    {usage.length === 0 ? '—' : usage.map((u: any, i: number) => (
                      <span key={u._id}>{i > 0 && ', '}{u.event?.title ?? '?'} ×{u.quantity}</span>
                    ))}
                  </td>
                  <td className="px-4 py-2 text-right text-[rgba(0,48,73,0.7)]">{rate ? fmt(rate) : '—'}</td>
                  <td className="px-4 py-2 text-right font-medium text-[#003049]">{rowTotal ? fmt(rowTotal) : '—'}</td>
                  <td className="px-4 py-2">
                    {gear.sourceUrl && <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[rgba(0,48,73,0.4)] hover:text-[#003049]">↗</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[rgba(0,48,73,0.04)]">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-[#003049] text-right">Rent Total</td>
              <td className="px-4 py-2 text-right font-bold text-[#003049]">{fmt(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
})()}

{/* Grand Total */}
{allGear.length > 0 && (() => {
  const buyTotal = allGear.filter(g => g.disposition === 'buy').reduce((acc, gear) => {
    const usage = usageMap.get(gear._id as string) ?? [];
    const maxQty = usage.length > 0 ? Math.max(...usage.map((u: any) => u.quantity)) : 1;
    return acc + (gear.purchasePrice ?? 0) * maxQty;
  }, 0);
  const rentTotal = allGear.filter(g => g.disposition === 'rent').reduce((acc, gear) => {
    const usage = usageMap.get(gear._id as string) ?? [];
    return acc + (gear.rentalPricePerEvent ?? 0) * usage.length;
  }, 0);
  const grand = buyTotal + rentTotal;
  return (
    <div className="rounded-lg border border-[rgba(0,48,73,0.15)] bg-[rgba(0,48,73,0.04)] px-6 py-4 flex items-center justify-between mb-16">
      <div>
        <p className="text-sm font-semibold text-[#003049]">UPAC Gear Request — Grand Total</p>
        <p className="text-xs text-[rgba(0,48,73,0.5)] mt-0.5">Buy {fmt(buyTotal)} + Rent {fmt(rentTotal)}</p>
      </div>
      <p className="text-2xl font-bold text-[#003049]">{fmt(grand)}</p>
    </div>
  );
})()}
```

- [ ] **Step 2: Verify the full gear page**

Open `http://localhost:3000/admin/gear`. Add a few gear items with prices and attach them to events. Verify:
- Buy summary table shows correct max quantities and totals
- Rent summary table shows which events each item is used in and total rental cost
- Grand total updates as items are added/changed
- Source URL links open in new tab
- Screenshot thumbnails show

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/gear/page.tsx
git commit -m "feat: add buy/rent summaries and grand total to gear page"
```

---

## Self-Review Checklist

- [x] **Schema coverage:** All 4 tables defined with correct indexes
- [x] **Convex functions:** list, getBySlug, create, update, remove for events; listByEvent, create, update, toggleDone, remove for checks; list, create, update, remove, generateUploadUrl, getScreenshotUrl for gear; listByEvent, listAll, addToEvent, update, removeFromEvent for eventGear
- [x] **Calendar merge:** mergedCal computed from Convex events, multi-day events added to each date in range
- [x] **Quick-add form:** title + date, creates event, redirects to slug URL
- [x] **Event detail sections:** header, description, days (multi-day), schedule, UPAC, checklist, gear, event list
- [x] **Inline editing:** InlineEdit component handles single-line and multiline, saves on blur/Enter, cancels on Escape
- [x] **Gear search:** filters library, shows create-new form when no match
- [x] **Gear page library:** grouped by category, inline editing, screenshot upload, delete guard
- [x] **Buy summary:** max quantity logic (owns once)
- [x] **Rent summary:** per-event breakdown with totals
- [x] **Grand total:** combined buy + rent
- [x] **Seed script:** all 9 hardcoded events with their checks
- [x] **Type consistency:** `Id<'events'>`, `Id<'gearItems'>`, `Id<'eventChecks'>`, `Id<'eventGear'>` used consistently throughout
- [x] **No placeholders:** all code is complete and runnable
