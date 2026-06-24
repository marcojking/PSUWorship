# Church Outreach Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a kanban board at `/admin/outreach` for tracking outreach to ~39 Penn State area churches, backed by a new Convex `churchOutreach` table, seeded once from the user's spreadsheet.

**Architecture:** Mirrors the existing `/admin/applications` kanban (`ApplicationsBoard`/`BoardColumn`/`ApplicantCard`, built on `@dnd-kit/core`) with a parallel, independent set of components and a new Convex table — no shared code with the applications board, since the two domains have different fields/lifecycles. No automated test framework exists in this repo (per `CLAUDE.md`), so verification is `npx tsc --noEmit` + `npm run lint` after each code task, and a full manual browser pass (Task 6) instead of unit/integration tests.

**Tech Stack:** Next.js (App Router) + Convex (`query`/`mutation`) + `@dnd-kit/core` (already installed) + inline `style={{}}` styling matching the cream/navy/rust palette (`#fff7eb`/`#003049`/`#b45741`).

**Spec:** `docs/superpowers/specs/2026-06-24-church-outreach-design.md`

---

## File Structure

| File | Purpose |
|---|---|
| `convex/schema.ts` | Modify — add `churchOutreach` table |
| `convex/churchOutreach.ts` | Create — `list`, `create`, `setStage`, `updateFollowUp` |
| `convex/_generated/api.d.ts` | Modify — manually add `churchOutreach` module entry (see note in Task 1) |
| `src/components/admin/ChurchCard.tsx` | Create — draggable card + shared `ChurchOutreach`/`ChurchStage` types |
| `src/components/admin/ChurchColumn.tsx` | Create — droppable column |
| `src/components/admin/ChurchDetailModal.tsx` | Create — read-only fields + editable follow-up notes/contact date |
| `src/components/admin/AddChurchModal.tsx` | Create — "add church" form |
| `src/components/admin/OutreachBoard.tsx` | Create — board container, drag orchestration |
| `src/app/admin/outreach/page.tsx` | Create — page shell |
| `src/app/admin/page.tsx` | Modify — add "Church Outreach" `NavCard` |

**Important — Convex deployment caveat (read before Task 1):** This checkout's Convex CLI is not linked to a deployment (`npx convex dev` drops into an interactive "What would you like to configure?" prompt, confirmed by running it with `< /dev/null` — it cannot proceed non-interactively). That means:
- `convex/_generated/api.d.ts`/`api.js` cannot be auto-regenerated here — Task 1 hand-edits `api.d.ts` directly (safe: `api.js` just exports `anyApi`, a runtime proxy that resolves any path regardless of what's declared in `.d.ts`, so only the TypeScript types file needs the manual patch).
- New functions in `convex/churchOutreach.ts` will **not** be live on the actual Convex backend just from writing the file — they only go live once something pushes them (either the user's own `npx convex dev` running in a separate terminal in watch mode, which is the standard Convex dev workflow and may already be running, or a one-time interactive `npx convex dev`/`npx convex deploy` run by the user).
- **Coordinator action (not an engineer task step):** after Task 1 is implemented and committed, stop and ask the user whether `npx convex dev` is already running (in which case it will have auto-pushed within seconds of the commit) or whether they need to run it themselves once. Do not attempt Task 5 (seeding) or Task 6 (manual verification) until the user confirms the functions are live — calling `api.churchOutreach.list`/`create` against a backend that doesn't have them yet will fail with a "function not found" error.

---

### Task 1: Convex schema + functions

**Files:**
- Modify: `convex/schema.ts:242` (insert new table between the `callRequests` and `events` tables)
- Create: `convex/churchOutreach.ts`
- Modify: `convex/_generated/api.d.ts`

- [ ] **Step 1: Add the `churchOutreach` table to `convex/schema.ts`**

Insert this block immediately after the `callRequests` table (which ends at line 247 with `}).index("by_submittedAt", ["submittedAt"]),`) and before `events: defineTable({` (line 249):

```ts
  churchOutreach: defineTable({
    name: v.string(),
    denomination: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    pastorName: v.optional(v.string()),
    notes: v.optional(v.string()),
    followUpNotes: v.optional(v.string()),
    contactDate: v.optional(v.string()),
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

- [ ] **Step 2: Create `convex/churchOutreach.ts`**

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const stageValidator = v.union(
  v.literal("unprocessed"),
  v.literal("approved"),
  v.literal("reached_out"),
  v.literal("supporting_involved"),
  v.literal("involved_not_supporting"),
  v.literal("non_involved"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("churchOutreach")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    denomination: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    pastorName: v.optional(v.string()),
    notes: v.optional(v.string()),
    stage: v.optional(stageValidator),
  },
  handler: async (ctx, args) => {
    const { stage, ...rest } = args;
    return await ctx.db.insert("churchOutreach", {
      ...rest,
      stage: stage ?? "unprocessed",
      createdAt: Date.now(),
    });
  },
});

export const setStage = mutation({
  args: {
    id: v.id("churchOutreach"),
    stage: stageValidator,
  },
  handler: async (ctx, { id, stage }) => {
    await ctx.db.patch(id, { stage });
  },
});

export const updateFollowUp = mutation({
  args: {
    id: v.id("churchOutreach"),
    followUpNotes: v.optional(v.string()),
    contactDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, followUpNotes, contactDate }) => {
    await ctx.db.patch(id, { followUpNotes, contactDate });
  },
});
```

- [ ] **Step 3: Hand-patch `convex/_generated/api.d.ts`**

This file is normally regenerated by `npx convex dev`, which can't run non-interactively in this checkout (see the caveat above the tasks). Add the new module by hand, in the same alphabetical position `npx convex dev` would use.

In the import block (currently lines 11-31), change:

```ts
import type * as aiRenderCache from "../aiRenderCache.js";
import type * as carts from "../carts.js";
import type * as clothing from "../clothing.js";
```

to:

```ts
import type * as aiRenderCache from "../aiRenderCache.js";
import type * as carts from "../carts.js";
import type * as churchOutreach from "../churchOutreach.js";
import type * as clothing from "../clothing.js";
```

In the `fullApi` object (currently lines 39-61), change:

```ts
declare const fullApi: ApiFromModules<{
  aiRenderCache: typeof aiRenderCache;
  carts: typeof carts;
  clothing: typeof clothing;
```

to:

```ts
declare const fullApi: ApiFromModules<{
  aiRenderCache: typeof aiRenderCache;
  carts: typeof carts;
  churchOutreach: typeof churchOutreach;
  clothing: typeof clothing;
```

Leave `convex/_generated/api.js` and `convex/_generated/dataModel.d.ts` untouched — `api.js` just exports `anyApi` (a runtime proxy that works for any function path regardless of this file), and `dataModel.d.ts` derives `DataModel` directly from `import schema from "../schema.js"`, so it picks up the new table automatically once Step 1 is done.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `churchOutreach`, `schema.ts`, or `api.d.ts`.

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts convex/churchOutreach.ts convex/_generated/api.d.ts
git commit -m "feat: add churchOutreach Convex table and functions"
```

---

### Task 2: Kanban board (read + drag + detail view)

**Files:**
- Create: `src/components/admin/ChurchCard.tsx`
- Create: `src/components/admin/ChurchColumn.tsx`
- Create: `src/components/admin/ChurchDetailModal.tsx`
- Create: `src/components/admin/OutreachBoard.tsx`
- Create: `src/app/admin/outreach/page.tsx`

- [ ] **Step 1: Create `src/components/admin/ChurchCard.tsx`**

```tsx
'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Id } from '../../../convex/_generated/dataModel';

export type ChurchStage =
  | 'unprocessed'
  | 'approved'
  | 'reached_out'
  | 'supporting_involved'
  | 'involved_not_supporting'
  | 'non_involved';

export type ChurchOutreach = {
  _id: Id<'churchOutreach'>;
  name: string;
  denomination?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  notes?: string;
  followUpNotes?: string;
  contactDate?: string;
  stage: ChurchStage;
  createdAt: number;
};

interface ChurchCardProps {
  church: ChurchOutreach;
  onOpenDetail: (id: Id<'churchOutreach'>) => void;
}

export function ChurchCard({ church, onOpenDetail }: ChurchCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: church._id,
    data: { stage: church.stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 14,
        border: '1px solid rgba(0,48,73,0.1)',
        background: '#fff',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 2px rgba(0,48,73,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to move"
          style={{ flexShrink: 0, marginTop: 2, cursor: 'grab', background: 'none', border: 'none', padding: 2, color: 'rgba(0,48,73,0.3)', touchAction: 'none' }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
          </svg>
        </button>
        <button
          onClick={() => onOpenDetail(church._id)}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <p className="font-cormorant" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{church.name}</p>
          {church.denomination && (
            <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 2 }}>{church.denomination}</p>
          )}
          {church.pastorName && (
            <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>{church.pastorName}</p>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/ChurchColumn.tsx`**

```tsx
'use client';
import { useDroppable } from '@dnd-kit/core';
import { ChurchCard, type ChurchOutreach } from './ChurchCard';
import { Id } from '../../../convex/_generated/dataModel';

interface ChurchColumnProps {
  id: string;
  title: string;
  churches: ChurchOutreach[];
  onOpenDetail: (id: Id<'churchOutreach'>) => void;
}

export function ChurchColumn({ id, title, churches, onOpenDetail }: ChurchColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div style={{ flex: '0 0 220px', minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <h3 className="font-cormorant" style={{ fontSize: '1rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>{title}</h3>
        <span style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>{churches.length}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 120,
          padding: 8,
          borderRadius: 14,
          background: isOver ? 'rgba(180,87,65,0.06)' : 'rgba(0,48,73,0.02)',
          border: `1px dashed ${isOver ? 'rgba(180,87,65,0.3)' : 'rgba(0,48,73,0.08)'}`,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {churches.length === 0 ? (
          <p style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.25)', textAlign: 'center', padding: '20px 0' }}>No churches</p>
        ) : (
          churches.map((c) => (
            <ChurchCard key={c._id} church={c} onOpenDetail={onOpenDetail} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/admin/ChurchDetailModal.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { ChurchOutreach } from './ChurchCard';

interface ChurchDetailModalProps {
  church: ChurchOutreach;
  onClose: () => void;
}

export function ChurchDetailModal({ church, onClose }: ChurchDetailModalProps) {
  const updateFollowUp = useMutation(api.churchOutreach.updateFollowUp);
  const [followUpNotes, setFollowUpNotes] = useState(church.followUpNotes ?? '');
  const [contactDate, setContactDate] = useState(church.contactDate ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateFollowUp({
        id: church._id,
        followUpNotes: followUpNotes.trim() || undefined,
        contactDate: contactDate.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,48,73,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff7eb', borderRadius: 20, maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{church.name}</p>
            {church.denomination && (
              <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{church.denomination}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        {church.address && <Field label="Address" value={church.address} />}
        {church.phone && <Field label="Phone" value={church.phone} />}
        {church.email && <Field label="Email" value={church.email} />}
        {church.website && <Field label="Website" value={church.website} />}
        {church.pastorName && <Field label="Pastor / Leader" value={church.pastorName} />}
        {church.notes && <Field label="Notes / Why Good Fit" value={church.notes} />}

        <div style={{ marginBottom: 20 }}>
          <Label>Contact Date</Label>
          <input
            value={contactDate}
            onChange={(e) => setContactDate(e.target.value)}
            placeholder="e.g. June 12"
            style={{ marginTop: 6, width: '100%', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label>Follow-up Notes</Label>
          <textarea
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            rows={4}
            style={{ marginTop: 6, width: '100%', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff', resize: 'vertical' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4 }}>{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)' }}>{children}</p>;
}
```

- [ ] **Step 4: Create `src/components/admin/OutreachBoard.tsx`**

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ChurchColumn } from './ChurchColumn';
import { ChurchDetailModal } from './ChurchDetailModal';
import type { ChurchOutreach, ChurchStage } from './ChurchCard';

const COLUMNS: { id: ChurchStage; title: string }[] = [
  { id: 'unprocessed', title: 'Unprocessed' },
  { id: 'approved', title: 'Approved' },
  { id: 'reached_out', title: 'Reached Out' },
  { id: 'supporting_involved', title: 'Supporting & Involved' },
  { id: 'involved_not_supporting', title: 'Involved, Not Supporting' },
  { id: 'non_involved', title: 'Non-Involved' },
];

export function OutreachBoard() {
  const churches = useQuery(api.churchOutreach.list, {}) as ChurchOutreach[] | undefined;
  const setStage = useMutation(api.churchOutreach.setStage);
  const [pendingMoves, setPendingMoves] = useState<Record<string, ChurchStage>>({});
  const [detailId, setDetailId] = useState<Id<'churchOutreach'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const result: Record<ChurchStage, ChurchOutreach[]> = {
      unprocessed: [], approved: [], reached_out: [],
      supporting_involved: [], involved_not_supporting: [], non_involved: [],
    };
    for (const c of churches ?? []) {
      const effectiveStage = pendingMoves[c._id] ?? c.stage;
      result[effectiveStage].push(c);
    }
    return result;
  }, [churches, pendingMoves]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as Id<'churchOutreach'>;
    const newStage = over.id as ChurchStage;
    const currentStage = (active.data.current?.stage as ChurchStage) ?? 'unprocessed';
    if (newStage === currentStage) return;

    setPendingMoves((prev) => ({ ...prev, [id]: newStage }));
    try {
      await setStage({ id, stage: newStage });
    } catch {
      setError("Couldn't save, try again");
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingMoves((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const detailChurch = churches?.find((c) => c._id === detailId) ?? null;

  if (churches === undefined) {
    return <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)', padding: '32px 0' }}>Loading…</p>;
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(180,87,65,0.1)', color: '#b45741', fontSize: '0.78rem' }}>
          {error}
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 12 }}>
          {COLUMNS.map((col) => (
            <ChurchColumn
              key={col.id}
              id={col.id}
              title={col.title}
              churches={grouped[col.id]}
              onOpenDetail={setDetailId}
            />
          ))}
        </div>
      </DndContext>

      {detailChurch && (
        <ChurchDetailModal church={detailChurch} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/outreach/page.tsx`**

```tsx
'use client';
import { OutreachBoard } from '@/components/admin/OutreachBoard';

export default function OutreachPage() {
  return (
    <div className="admin-page min-h-screen" style={{ background: '#fff7eb' }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: '1px solid rgba(0,48,73,0.08)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/admin" style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(180,87,65,0.75)', textDecoration: 'none' }}>
          ← Admin
        </a>
        <span style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>Internal use only</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px' }}>

        {/* ── Heading ── */}
        <div style={{ marginBottom: 56 }}>
          <h1 className="font-cormorant" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 600, lineHeight: 1, color: '#003049', letterSpacing: '-0.01em' }}>
            Church Outreach
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>
            Fall 2026 · Penn State Area Churches
          </p>
        </div>

        <OutreachBoard />

      </div>
    </div>
  );
}
```

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/ChurchCard.tsx src/components/admin/ChurchColumn.tsx src/components/admin/ChurchDetailModal.tsx src/components/admin/OutreachBoard.tsx src/app/admin/outreach/page.tsx
git commit -m "feat: add outreach kanban board UI"
```

---

### Task 3: Add Church modal

**Files:**
- Create: `src/components/admin/AddChurchModal.tsx`
- Modify: `src/components/admin/OutreachBoard.tsx`

- [ ] **Step 1: Create `src/components/admin/AddChurchModal.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AddChurchModalProps {
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,48,73,0.15)',
  color: '#003049',
  background: '#fff',
  width: '100%',
};

export function AddChurchModal({ onClose }: AddChurchModalProps) {
  const createChurch = useMutation(api.churchOutreach.create);
  const [name, setName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createChurch({
        name: name.trim(),
        denomination: denomination.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        pastorName: pastorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,48,73,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ background: '#fff7eb', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <p className="font-cormorant" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#003049' }}>Add Church</p>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Church name *" required style={inputStyle} />
        <input value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="Denomination" style={inputStyle} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" style={inputStyle} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" style={inputStyle} />
        <input value={pastorName} onChange={(e) => setPastorName(e.target.value)} placeholder="Pastor / Leader" style={inputStyle} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes / Why good fit" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.5 : 1, marginTop: 8 }}
        >
          {saving ? 'Adding…' : 'Add Church'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Wire the modal into `src/components/admin/OutreachBoard.tsx`**

Add the import (alongside the existing `ChurchDetailModal` import):

```ts
import { ChurchDetailModal } from './ChurchDetailModal';
import { AddChurchModal } from './AddChurchModal';
```

Add a `showAddModal` state next to the existing `error` state:

```ts
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
```

Replace the returned JSX's opening `<div>` block — change:

```tsx
  return (
    <div>
      {error && (
```

to:

```tsx
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer' }}
        >
          + Add Church
        </button>
      </div>

      {error && (
```

And change the closing block — currently:

```tsx
      {detailChurch && (
        <ChurchDetailModal church={detailChurch} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
```

to:

```tsx
      {detailChurch && (
        <ChurchDetailModal church={detailChurch} onClose={() => setDetailId(null)} />
      )}
      {showAddModal && (
        <AddChurchModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AddChurchModal.tsx src/components/admin/OutreachBoard.tsx
git commit -m "feat: add AddChurchModal and wire it into OutreachBoard"
```

---

### Task 4: Nav card on /admin dashboard

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add the new `NavCard`**

In `src/app/admin/page.tsx`, change:

```tsx
          <NavCard
            href="/admin/donations"
            label="Donations"
            sub="gifts submitted through give page"
          />
        </div>
```

to:

```tsx
          <NavCard
            href="/admin/donations"
            label="Donations"
            sub="gifts submitted through give page"
          />
          <NavCard
            href="/admin/outreach"
            label="Church Outreach"
            sub="church partnership tracking"
          />
        </div>
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add Church Outreach nav card to admin dashboard"
```

---

### Task 5: Seed the 39 churches

**Files:**
- Create (scratchpad only, NOT committed to git): `/private/tmp/claude-501/-Users-marcoking/2d4f80ca-456f-4b84-9c2e-6a4293509d5c/scratchpad/seedChurches.js`

**Before this task:** confirm with the user that the Task 1 Convex functions are live on the backend (see the coordinator note above the task list). If unconfirmed, stop and ask before running this script — it will fail with a "function not found" error against a backend that doesn't have `churchOutreach` yet.

- [ ] **Step 1: Write the seed script**

Create `/private/tmp/claude-501/-Users-marcoking/2d4f80ca-456f-4b84-9c2e-6a4293509d5c/scratchpad/seedChurches.js`:

```js
require("dotenv").config({ path: "/Users/marcoking/Projects/PSUWorship/.env.local" });
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("/Users/marcoking/Projects/PSUWorship/convex/_generated/api.js");

const CHURCHES = [
  { name: "Calvary Church", denomination: "Nondenominational/Evangelical", address: "130 W. College Ave (downtown) & 150 Harvest Fields Dr, Boalsburg, PA", phone: "(814) 238-0822", email: "info@calvarysc.org / dan@calvarysc.org", website: "www.calvarysc.org", pastorName: "Dan Nold (Lead Pastor)", notes: "Large, very active congregation with strong student ministry presence; downtown campus is steps from University Park", stage: "approved" },
  { name: "Blue Course Community Church", denomination: "Nondenominational", address: "1243 Blue Course Drive, State College, PA 16801", phone: "(814) 237-8020", email: "church@scefc.org", website: "bluecoursecommunity.church", pastorName: "(staff - confirm via site)", notes: "Established DCF partner church, used to working with PSU students", stage: "unprocessed" },
  { name: "State College Alliance Church", denomination: "Christian & Missionary Alliance", address: "1221 W. Whitehall Rd, State College, PA 16801", phone: "(814) 237-7991", email: "office@scalliancechurch.com", website: "www.scalliancechurch.com", pastorName: "(staff - confirm via site)", notes: "Close to campus, active student ministry", stage: "unprocessed" },
  { name: "Grace Fellowship Church", denomination: "Nondenominational", address: "1107 William Street, State College, PA 16803", phone: "(814) 808-5850", email: "info@gfcsc.org", website: "www.gfcsc.org", pastorName: "(staff - confirm via site)", notes: "Active in student outreach", stage: "unprocessed" },
  { name: "Faith Baptist Church", denomination: "Baptist", address: "647 Valley Vista Dr, State College, PA 16803", phone: "(814) 234-1176", email: "officeassistantfbc@gmail.com", website: "www.growingatfaith.org", pastorName: "(staff - confirm via site)", notes: "Established student ride/connection program", stage: "unprocessed" },
  { name: "Park Forest Baptist Church", denomination: "Baptist", address: "3030 Carnegie Dr, State College, PA 16803", phone: "(814) 234-1900", email: "info@parkforestbaptist.org", website: "www.parkforestbaptist.org", pastorName: "(staff - confirm via site)", notes: "Active community/student engagement", stage: "unprocessed" },
  { name: "Good Shepherd Lutheran Church (LCMS)", denomination: "Lutheran (LCMS)", address: "851 Science Park Road, State College, PA 16803", phone: "(814) 234-8177", email: "parishadmin@goodshepherdsc.org", website: "www.goodshepherdsc.org", pastorName: "(staff - confirm via site)", notes: "Active congregation near campus", stage: "unprocessed" },
  { name: "Bellefonte Presbyterian Church", denomination: "Presbyterian", address: "203 N Spring St, Bellefonte, PA 16823", phone: "(814) 424-9233", email: "church@scefc.org", website: "bellefontepca.org", pastorName: "(staff - confirm via site)", notes: "A bit further out (Bellefonte) but engaged with DCF rides program", stage: "unprocessed" },
  { name: "Grays Woods Church", denomination: "Nondenominational", address: "939 Grays Woods Blvd, Port Matilda, PA 16870", phone: "(814) 630-6113", email: "info@grayswoodschurch.com", website: "grayswoodschurch.com", pastorName: "(staff - confirm via site)", notes: "Further from campus (Port Matilda) but active in DCF network", stage: "unprocessed" },
  { name: "University Baptist & Brethren Church", denomination: "Baptist/Brethren (Welcoming & Affirming)", address: "411 S. Burrowes St, State College, PA 16801", phone: "(814) 237-3023 (verify)", email: "(see ubbcwelcome.org/contact-us)", website: "www.ubbcwelcome.org", pastorName: "Rev. Jeremy Richards (Pastor)", notes: "One of the closest churches to campus geographically; progressive/welcoming congregation", stage: "unprocessed" },
  { name: "Trailblazers Church of State College (Vineyard)", denomination: "Vineyard/Nondenominational", address: "Meets at 300 Pollock Rd, State College, PA 16801 (on PSU campus)", phone: "(814) 826-4801", email: "vineyardtrailblazers@outlook.com", website: "www.tblz.org", pastorName: "Robbie & Autumn Parks (Co-Senior Pastors)", notes: "Literally meets on campus - extremely high-fit for student event partnership", stage: "unprocessed" },
  { name: "Good Shepherd Catholic Church", denomination: "Catholic", address: "867 Grays Woods Blvd, Port Matilda, PA 16870", phone: "(814) 238-2110", email: "t.ferguson@gs-cc.org", website: "www.gs-cc.org", pastorName: "Fr. Tom Ferguson (Pastor)", notes: "One of the largest Catholic parishes in the region", stage: "unprocessed" },
  { name: "Our Lady of Victory Catholic Church", denomination: "Catholic", address: "Downtown State College, PA 16801", phone: "(814) 237-7832", email: "gjakopac@dioceseaj.org", website: "www.ourladyofvictory.com", pastorName: "Fr. George Jakopac (Pastor)", notes: "Major Catholic presence right in town", stage: "unprocessed" },
  { name: "Penn State Catholic Campus Ministry (Nittany Catholic)", denomination: "Catholic - Campus Ministry", address: "205A-D Pasquerilla Spiritual Center, University Park, PA 16802", phone: "(see psucatholic.org)", email: "(see psucatholic.org)", website: "www.psucatholic.org", pastorName: "Campus ministry staff - confirm via site", notes: "Direct campus ministry org rather than a parish - ideal first call for Catholic student outreach", stage: "unprocessed" },
  { name: "St. Paul's United Methodist Church", denomination: "United Methodist", address: "250 E. College Avenue, State College, PA 16801", phone: "(814) 237-2163", email: "stpauls@stpaulsc.org", website: "www.stpaulsc.org", pastorName: "Rev. Greg Milinovich (Senior Pastor)", notes: "Downtown location and existing Wesley Foundation student ministry make this a strong partner", stage: "unprocessed" },
  { name: "State College Presbyterian Church", denomination: "Presbyterian (PCUSA)", address: "132 W Beaver Ave, State College, PA 16801", phone: "(814) 238-2422", email: "officescpc@gmail.com", website: "www.scpresby.org", pastorName: "(Pastor & Associate Pastor - confirm via site)", notes: "Established downtown congregation", stage: "unprocessed" },
  { name: "St. Andrew's Episcopal Church", denomination: "Episcopal", address: "208 W. Foster Avenue, State College, PA 16801", phone: "(see standrewsc.org/contact-us)", email: "(see standrewsc.org/contact-us)", website: "standrewsc.org", pastorName: "(confirm current rector via site)", notes: "Small but established Episcopal presence downtown", stage: "unprocessed" },
  { name: "Grace Lutheran Church", denomination: "Lutheran (ELCA)", address: "S. Garner Street, State College, PA 16801", phone: "(see glcpa.org)", email: "(see glcpa.org)", website: "www.glcpa.org", pastorName: "(confirm via site)", notes: "Direct partner of Lutheran Campus Ministry at Penn State", stage: "unprocessed" },
  { name: "Lutheran Campus Ministry at Penn State (LuMin)", denomination: "Lutheran - Campus Ministry", address: "Worship at Pasquerilla Spiritual Center & Grace Lutheran Church", phone: "(see lutheranpennstate.org)", email: "(see lutheranpennstate.org)", website: "www.lutheranpennstate.org", pastorName: "Alicia Anderson (Campus Minister)", notes: "Best first contact for Lutheran student-facing partnership", stage: "unprocessed" },
  { name: "Christ Community Church of State College", denomination: "Nondenominational/Charismatic", address: "1606 Norma Street, State College, PA 16801", phone: "(814) 234-0711", email: "(see cccsc.org)", website: "www.cccsc.org", pastorName: "(confirm via site)", notes: "Charismatic, community-focused congregation", stage: "unprocessed" },
  { name: "University Mennonite Church", denomination: "Mennonite", address: "1606 Norma Street, State College, PA 16801", phone: "(814) 234-2039", email: "(see church site)", website: "universitymennonite.org", pastorName: "(confirm via site)", notes: "Known for social-justice and service orientation - good fit for community-service angle", stage: "unprocessed" },
  { name: "State College Access Church", denomination: "Nondenominational", address: "210 W. Hamilton Avenue, State College, PA 16801", phone: "(814) 571-1659", email: "(see church site)", website: "scaccesschurch.com", pastorName: "(confirm via site)", notes: "Newer downtown congregation", stage: "unprocessed" },
  { name: "Faith United Church of Christ", denomination: "United Church of Christ", address: "State College, PA", phone: "(814) 237-3904", email: "(see church site)", website: "faithinstatecollege.org", pastorName: "(confirm via site)", notes: "Progressive denomination, community-oriented", stage: "unprocessed" },
  { name: "Resurrection Orthodox Presbyterian Church", denomination: "Presbyterian (OPC)", address: "Meets at State College Friends School, 1900 University Drive, State College, PA 16801", phone: "(814) 206-0186", email: "(see resurrectionopc.org)", website: "resurrectionopc.org", pastorName: "(confirm via site)", notes: "Smaller but growing congregation", stage: "unprocessed" },
  { name: "Holy Trinity Orthodox Church", denomination: "Eastern Orthodox", address: "119 South Sparks Street, State College, PA 16801", phone: "(814) 231-2855", email: "(see church site)", website: "holytrinity-oca.org", pastorName: "(confirm via site)", notes: "Only Orthodox Christian option directly downtown - good for diversity of outreach", stage: "unprocessed" },
  { name: "Cedar Heights Church", denomination: "Nondenominational", address: "850 Stratford Drive, State College, PA 16803", phone: "(814) 826-2971", email: "(see cedarheights.net)", website: "www.cedarheights.net", pastorName: "Dan (Lead Pastor/Founder)", notes: "Casual/contemporary worship style - good cultural fit for a concert-style event", stage: "unprocessed" },
  { name: "New Hope Church (Brethren Church plant)", denomination: "Brethren", address: "Meets at Mount Nittany Elementary, 700 Brandywine Dr; mailing P.O. Box 194, State College, PA 16804", phone: "814-880-3049", email: "benorshannon@gmail.com", website: "www.newhopesc.org", pastorName: "Pastor Ben Frank", notes: "Mission is literally PSU outreach - very high-fit, ask first", stage: "unprocessed" },
  { name: "Oakwood Presbyterian Church", denomination: "Presbyterian (PCA)", address: "1865 Waddle Road, State College, PA 16803", phone: "(814) 238-5442", email: "churchoffice@oakwoodpca.org", website: "www.oakwoodpca.org", pastorName: "Pastor Dan Kiehl", notes: "Has a dedicated 11:15 AM contemporary worship service - band/instruments already part of culture", stage: "unprocessed" },
  { name: "State College Assembly of God", denomination: "Assembly of God (Pentecostal)", address: "2201 University Drive Extension, State College, PA", phone: "(814) 238-3800", email: "scassembly@aol.com", website: "www.scassembly.org", pastorName: "(confirm via church)", notes: "Strong cultural fit for a worship concert; Pentecostal/charismatic churches usually embrace concert-style worship", stage: "unprocessed" },
  { name: "State College Christian Church", denomination: "Christian Church (Restoration Movement)", address: "Meets at Easterly Parkway Elementary, 234 Easterly Parkway (6 blocks from campus)", phone: "814-238-5913", email: "info@scccweb.com", website: "www.scccweb.com", pastorName: "Contact: Vince Smith", notes: "Walkable distance makes logistics easy", stage: "unprocessed" },
  { name: "Episcopal Student Ministry", denomination: "Episcopal - Campus Ministry", address: "Meets in Eisenhower Chapel & Pasquerilla Spiritual Center, University Park, PA", phone: "(see contact)", email: "amb5444@psu.edu", website: "www.episcopalatpennstate.com", pastorName: "Adam Burkett (student leader contact)", notes: "Best first call for Episcopal student-facing partnership, on-campus", stage: "unprocessed" },
  { name: "Grace Presbyterian Church", denomination: "Presbyterian (Reformed)", address: "370 Airport Rd, State College, PA 16801", phone: "814-237-2637", email: "davidhanson@gracerpc.org", website: "gracerpc.org", pastorName: "Pastor David Hanson", notes: "Smaller reformed congregation, worth a call for diversity of denominational outreach", stage: "unprocessed" },
  { name: "New Covenant Baptist Church", denomination: "Baptist", address: "1524 University Drive, State College, PA 16801", phone: "(814) 237-6301", email: "ncbcstatecollege@gmail.com", website: "www.ncbc-statecollege.org", pastorName: "Pastor Greg Allen", notes: "Good geographic fit", stage: "unprocessed" },
  { name: "Nittany Baptist Church", denomination: "Baptist", address: "3939 S. Atherton St, State College, PA 16801", phone: "(814) 466-6064", email: "nitbapt@juno.com", website: "www.nittanybaptist.org", pastorName: "Contact: J.C. Reese", notes: "Explicitly positions itself as student-accessible", stage: "unprocessed" },
  { name: "Mt. Nittany United Methodist Church", denomination: "United Methodist", address: "1500 E. Branch Road, State College, PA 16801", phone: "(814) 237-3549", email: "mtnittanyumc@comcast.net", website: "mtnittanyumc.org", pastorName: "Rev. Howard T. Woodruff", notes: "Established UMC congregation", stage: "unprocessed" },
  { name: "Unity Church of Jesus Christ", denomination: "Unity", address: "145 N. Gill St, State College, PA 16801", phone: "814-238-6489", email: "ucjc.admin@gmail.com", website: "www.ucjc.org", pastorName: "Contact: Kathy Ressler", notes: "Smaller congregation, metaphysical/New Thought Christian tradition", stage: "unprocessed" },
  { name: "Wellspring Church", denomination: "Nondenominational", address: "Meets at Radio Park Elementary, 800 W Cherry Ln, State College, PA 16803", phone: "814-343-0473", email: "(via wellspringchurch.co/contact)", website: "wellspringchurch.co", pastorName: "Contact: Matt Toms", notes: "Newer church plant, worth checking culture/fit", stage: "unprocessed" },
  { name: "Keystone Church and Ministries", denomination: "Nondenominational - Campus-adjacent", address: "Meets at SOZO, 256 E. Beaver Ave (downtown, very close to campus)", phone: "814-234-3231", email: "info@keychurch.net", website: "www.keychurch.net", pastorName: "(confirm via church)", notes: "Very close geographically; worth a look at worship style", stage: "unprocessed" },
  { name: "Radiant Life Worship Center", denomination: "Pentecostal/Charismatic", address: "2820 E. College Ave, State College, PA 16801", phone: "(582) 322-0195", email: "admin@radiantlifeministries.com", website: "radiantlifeministries.com", pastorName: "Contact: Craig Miller", notes: "Name and tradition suggest strong alignment with a worship concert event", stage: "unprocessed" },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  const client = new ConvexHttpClient(url);

  let ok = 0;
  for (const church of CHURCHES) {
    await client.mutation(api.churchOutreach.create, church);
    ok++;
    console.log(`Seeded: ${church.name}`);
  }
  console.log(`Done. Seeded ${ok}/${CHURCHES.length} churches.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run it**

Run: `node /private/tmp/claude-501/-Users-marcoking/2d4f80ca-456f-4b84-9c2e-6a4293509d5c/scratchpad/seedChurches.js`
Expected: 39 lines of `Seeded: <name>`, ending with `Done. Seeded 39/39 churches.`

- [ ] **Step 3: No commit**

This script is a one-time throwaway and lives outside the repo already (scratchpad path) — there is nothing to add/commit for this task.

---

### Task 6: Manual browser verification

No automated test framework exists in this repo. Verify directly in the browser, mirroring the spec's Testing section.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running)

- [ ] **Step 2: Verify seeded data**

Navigate to `http://localhost:3000/admin/outreach`. Confirm: 38 churches in "Unprocessed", 1 church ("Calvary Church") in "Approved", all other columns empty.

- [ ] **Step 3: Verify drag-and-drop persistence**

Drag a card from "Unprocessed" to "Reached Out". Reload the page. Confirm the card is still in "Reached Out".

- [ ] **Step 4: Verify detail modal edit/save persistence**

Click a card to open its detail modal. Type into "Contact Date" and "Follow-up Notes", click "Save". Close the modal, reopen the same card. Confirm both fields show the saved values.

- [ ] **Step 5: Verify "+ Add Church"**

Click "+ Add Church" in the top-right of the board. Type only a name (leave every other field blank), submit. Confirm a new card appears in "Unprocessed" with just that name (no denomination/pastor line shown on the card).

- [ ] **Step 6: Verify the admin nav card**

Navigate to `http://localhost:3000/admin`. Confirm a "Church Outreach" card appears in the grid and clicking it navigates to `/admin/outreach`.

---

### Task 7: Push branch (stop before merging to main)

**This task ends with a checkpoint — do not merge to `main` or push to `main` without the user's explicit go-ahead, since `main` auto-deploys to the live production site on every push.**

- [ ] **Step 1: Push the feature branch**

```bash
git push -u origin feature/church-outreach
```

- [ ] **Step 2: Stop and ask the user**

Tell the user the branch is pushed and ask whether to merge `feature/church-outreach` into `main` now (which will trigger a production deploy), or whether they want to review first (e.g. via a PR).

---

## Self-Review

**Spec coverage:**
- Data model (`churchOutreach` table, all fields, 6-literal stage union) → Task 1, Step 1. ✓
- `list`/`create`/`setStage`/`updateFollowUp` functions, `create`'s optional-`stage`-defaults-to-`unprocessed` behavior → Task 1, Step 2. ✓
- `/admin/outreach/page.tsx` → Task 2, Step 5. ✓
- `OutreachBoard` (6 columns in funnel order, horizontal scroll, dnd-kit) → Task 2, Step 4. ✓
- `ChurchColumn` → Task 2, Step 2. ✓
- `ChurchCard` (name/denomination/pastor, drag handle, click-to-detail) → Task 2, Step 1. ✓
- `ChurchDetailModal` (read-only imported fields + editable follow-up notes/contact date) → Task 2, Step 3. ✓
- `AddChurchModal` (name required, rest optional, lands in Unprocessed) → Task 3. ✓
- `/admin` nav card → Task 4. ✓
- One-time seed script for all 39 rows, Calvary Church seeded as `"approved"` → Task 5. ✓
- Manual testing steps (1-5 from spec) → Task 6, Steps 2-6. ✓
- Out-of-scope items (no re-import UI, no email automation, no auth, no search/filter, no post-seed editing of imported fields) — none of these were added anywhere in the plan. ✓

**Placeholder scan:** No "TBD"/"TODO"/"add appropriate X" phrasing anywhere in the task steps above; every code block is complete and copy-pasteable; the seed script contains the full 39-row array, not a reference to an external file.

**Type consistency:** `ChurchStage` (6 literals) and `ChurchOutreach` type are defined once in `ChurchCard.tsx` and imported everywhere else (`ChurchColumn`, `ChurchDetailModal`, `OutreachBoard`) — no redefinition or naming drift. Convex function names (`list`, `create`, `setStage`, `updateFollowUp`) match between Task 1's `churchOutreach.ts` and every `api.churchOutreach.*` call site in Tasks 2-3. `Id<'churchOutreach'>` used consistently for all id-typed props.
