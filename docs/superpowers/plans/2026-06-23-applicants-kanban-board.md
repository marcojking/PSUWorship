# Applicant Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat "Full Applications" list on `/admin/applications` with a 3-column drag-and-drop kanban board (Reviewing / Reached Out / Approved) plus a per-applicant role-assignment dropdown, backed by two new optional fields on the existing `leadershipInterest` Convex table.

**Architecture:** `ApplicationsBoard` queries `leadershipInterest` and groups rows into columns client-side by a `stage` field (missing = "reviewing"). `@dnd-kit/core` handles drag-between-columns; dropping a card calls a `setStage` mutation. A role `<select>` on each card calls a `setAssignedRole` mutation directly. A modal shows full applicant detail (video, instruments, etc.) on click. The 15 role names are extracted from `RoleSelection.tsx` into a shared `src/lib/roles.ts` so the public `/join` form and the new admin dropdown share one source of truth.

**Tech Stack:** Next.js 16 / React 19 App Router, Convex (queries/mutations, schema), `@dnd-kit/core` (already a dependency, currently unused anywhere in the repo).

**Testing approach:** This repo has no automated test framework (`package.json` only defines `dev`/`build`/`start`/`lint` scripts — no Jest/Vitest/RTL). Per the existing convention for this admin subsystem, "testing" steps below are `npx tsc --noEmit` + `npm run lint` for static checks, and manual verification against the live dev backend for behavior — not new automated tests. Adding a test framework would be an unrelated, out-of-scope restructuring.

**Environment note:** This project has no separate staging Convex deployment — the personal dev deployment (`dev/marco-king`, currently named `fearless-dotterel-730`) is the same one serving live data to wmaac.org. `npx convex dev --once` pushes schema/function changes there immediately. This is safe for Task 1 because both changes are purely additive (new optional fields, new mutations) — nothing existing is modified.

---

### Task 0: Set up the worktree

**Files:** none (environment setup only)

- [ ] **Step 1: Install dependencies**

This worktree was just created via `git worktree add` and has no `node_modules` (git worktrees don't share installed packages).

Run: `npm install`
Expected: completes with no errors (warnings about peer deps are fine).

- [ ] **Step 2: Confirm Convex CLI auth**

Run: `npx convex dev --once`
Expected: pushes the current (unmodified) schema/functions successfully and exits, e.g. ends with `✔ Convex functions ready!`. If it instead prompts for login, run `npx convex login --device-name plan-exec --login-flow poll --no-open`, open the printed `https://auth.convex.dev/device?user_code=...` URL in a browser and confirm, then re-run `npx convex dev --once`.

No commit for this task (no files changed).

---

### Task 1: Schema fields + mutations

**Files:**
- Modify: `convex/schema.ts` (the `leadershipInterest` table, currently lines 220-233)
- Modify: `convex/leadershipInterest.ts` (append two mutations after the existing `requestCall` mutation, currently ending at line 67)

- [ ] **Step 1: Add the two new fields to the schema**

In `convex/schema.ts`, replace:

```ts
  leadershipInterest: defineTable({
    name: v.string(),
    email: v.string(),
    gradYear: v.number(),
    weeklyHours: v.number(),
    roles: v.array(v.string()),
    worshipTeam: v.boolean(),
    instruments: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
    submittedAt: v.number(),
    // Legacy fields from old schema — kept for existing documents
    requestsCall: v.optional(v.boolean()),
    phone: v.optional(v.string()),
  }).index("by_submittedAt", ["submittedAt"]),
```

with:

```ts
  leadershipInterest: defineTable({
    name: v.string(),
    email: v.string(),
    gradYear: v.number(),
    weeklyHours: v.number(),
    roles: v.array(v.string()),
    worshipTeam: v.boolean(),
    instruments: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
    submittedAt: v.number(),
    // Legacy fields from old schema — kept for existing documents
    requestsCall: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    // Kanban board: missing stage is treated as "reviewing" by the UI
    stage: v.optional(v.union(
      v.literal("reviewing"),
      v.literal("reached_out"),
      v.literal("approved"),
    )),
    assignedRole: v.optional(v.string()),
  }).index("by_submittedAt", ["submittedAt"]),
```

- [ ] **Step 2: Add `setStage` and `setAssignedRole` mutations**

In `convex/leadershipInterest.ts`, append at the end of the file (after the existing `requestCall` mutation):

```ts

export const setStage = mutation({
  args: {
    id: v.id("leadershipInterest"),
    stage: v.union(
      v.literal("reviewing"),
      v.literal("reached_out"),
      v.literal("approved"),
    ),
  },
  handler: async (ctx, { id, stage }) => {
    await ctx.db.patch(id, { stage });
  },
});

export const setAssignedRole = mutation({
  args: {
    id: v.id("leadershipInterest"),
    assignedRole: v.optional(v.string()),
  },
  handler: async (ctx, { id, assignedRole }) => {
    await ctx.db.patch(id, { assignedRole });
  },
});
```

- [ ] **Step 3: Deploy and verify**

Run: `npx convex dev --once`
Expected: succeeds, ends with `✔ Convex functions ready!`. This pushes the new schema fields and the two new mutations live (additive only — existing data and functions are unaffected).

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/leadershipInterest.ts
git commit -m "feat: add stage/assignedRole fields and mutations for applicant kanban board"
```

---

### Task 2: Shared role list

**Files:**
- Create: `src/lib/roles.ts`
- Modify: `src/components/join/RoleSelection.tsx` (lines 1-24, and the two `.map()` blocks at lines ~88-104 and ~112-127)

- [ ] **Step 1: Create the shared roles file**

Create `src/lib/roles.ts`:

```ts
export const TEAM_ROLES = [
  'Media & Social Team',
  'Events & Hospitality Team',
  'Graphics / Art Team',
  'Sound & Tech Team',
];

export const LEADERSHIP_ROLES = [
  'Vice President',
  'Music Director',
  'Treasurer',
  'Secretary',
  'Event Coordinator',
  'Hospitality Lead',
  'Social Media Lead',
  'Media Lead',
  'Tech/Production Lead',
  'Graphics / Art Lead',
  'Prayer Lead',
];

export const ALL_ROLES = [...LEADERSHIP_ROLES, ...TEAM_ROLES];
```

- [ ] **Step 2: Refactor `RoleSelection.tsx` to import from the shared file**

Replace lines 1-24 of `src/components/join/RoleSelection.tsx`:

```tsx
'use client';
import { useState } from 'react';
import RoleCard from './RoleCard';

const LEADERSHIP_ROLES = [
  { title: 'Vice President', description: 'Assist the President, step in when needed, and help coordinate across all teams.' },
  { title: 'Music Director', description: 'Lead musical direction for worship nights and recordings — keys, arrangements, rehearsals.' },
  { title: 'Treasurer', description: 'Manage club finances, track expenses, and handle UPAC funding requests.' },
  { title: 'Secretary', description: 'Manage communications and keep the team organized.' },
  { title: 'Event Coordinator', description: 'Plan and execute worship nights and events. Co-leads the Events & Hospitality team.' },
  { title: 'Hospitality Lead', description: 'Create a welcoming environment at every event. Co-leads the Events & Hospitality team.' },
  { title: 'Social Media Lead', description: 'Shape the creative voice of our social channels — visual storytelling, content strategy, and building our online presence.' },
  { title: 'Media Lead', description: 'Direct photo and video coverage of events and manage content production. Training provided.' },
  { title: 'Tech/Production Lead', description: 'Run live sound and lighting at events, oversee studio sessions. Training provided.' },
  { title: 'Graphics / Art Lead', description: 'Design merch, album covers, visual assets, promotional materials, and maintain brand consistency.' },
  { title: 'Prayer Lead', description: 'Organize and lead prayer for the club — before events, during meetings, and beyond.' },
];

const TEAM_ROLES = [
  { title: 'Media & Social Team', description: 'Help capture events on camera, edit content, and manage social posts.' },
  { title: 'Events & Hospitality Team', description: 'Help set up events, greet guests, and support the event planning process.' },
  { title: 'Graphics / Art Team', description: 'Design flyers, visual assets, and album covers and artwork for our music releases.' },
  { title: 'Sound & Tech Team', description: 'Run sound and gear at events — typically once a month or less.' },
];
```

with:

```tsx
'use client';
import { useState } from 'react';
import RoleCard from './RoleCard';
import { LEADERSHIP_ROLES, TEAM_ROLES } from '@/lib/roles';

const LEADERSHIP_DESCRIPTIONS: Record<string, string> = {
  'Vice President': 'Assist the President, step in when needed, and help coordinate across all teams.',
  'Music Director': 'Lead musical direction for worship nights and recordings — keys, arrangements, rehearsals.',
  'Treasurer': 'Manage club finances, track expenses, and handle UPAC funding requests.',
  'Secretary': 'Manage communications and keep the team organized.',
  'Event Coordinator': 'Plan and execute worship nights and events. Co-leads the Events & Hospitality team.',
  'Hospitality Lead': 'Create a welcoming environment at every event. Co-leads the Events & Hospitality team.',
  'Social Media Lead': 'Shape the creative voice of our social channels — visual storytelling, content strategy, and building our online presence.',
  'Media Lead': 'Direct photo and video coverage of events and manage content production. Training provided.',
  'Tech/Production Lead': 'Run live sound and lighting at events, oversee studio sessions. Training provided.',
  'Graphics / Art Lead': 'Design merch, album covers, visual assets, promotional materials, and maintain brand consistency.',
  'Prayer Lead': 'Organize and lead prayer for the club — before events, during meetings, and beyond.',
};

const TEAM_DESCRIPTIONS: Record<string, string> = {
  'Media & Social Team': 'Help capture events on camera, edit content, and manage social posts.',
  'Events & Hospitality Team': 'Help set up events, greet guests, and support the event planning process.',
  'Graphics / Art Team': 'Design flyers, visual assets, and album covers and artwork for our music releases.',
  'Sound & Tech Team': 'Run sound and gear at events — typically once a month or less.',
};
```

Then update the two `.map()` blocks. Replace:

```tsx
          {TEAM_ROLES.map((role) => {
            const selNum = selected.indexOf(role.title);
            return (
              <RoleCard
                key={role.title}
                title={role.title}
                description={role.description}
                variant="team"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(role.title)}
                onToggle={() => toggleRole(role.title)}
              />
            );
          })}
```

with:

```tsx
          {TEAM_ROLES.map((title) => {
            const selNum = selected.indexOf(title);
            return (
              <RoleCard
                key={title}
                title={title}
                description={TEAM_DESCRIPTIONS[title]}
                variant="team"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(title)}
                onToggle={() => toggleRole(title)}
              />
            );
          })}
```

And replace:

```tsx
          {LEADERSHIP_ROLES.map((role) => {
            const selNum = selected.indexOf(role.title);
            return (
              <RoleCard
                key={role.title}
                title={role.title}
                description={role.description}
                variant="leadership"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(role.title)}
                onToggle={() => toggleRole(role.title)}
              />
            );
          })}
```

with:

```tsx
          {LEADERSHIP_ROLES.map((title) => {
            const selNum = selected.indexOf(title);
            return (
              <RoleCard
                key={title}
                title={title}
                description={LEADERSHIP_DESCRIPTIONS[title]}
                variant="leadership"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(title)}
                onToggle={() => toggleRole(title)}
              />
            );
          })}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/roles.ts src/components/join/RoleSelection.tsx
git commit -m "refactor: extract shared role list from RoleSelection into src/lib/roles"
```

---

### Task 3: `ApplicantCard` component

**Files:**
- Create: `src/components/admin/ApplicantCard.tsx`

This depends on the `Submission`/`Stage` types that `ApplicationsBoard.tsx` will export in Task 6. To keep this task self-contained and buildable on its own, define those types here and have `ApplicationsBoard.tsx` import them from this file in Task 6 (the card is the most fundamental unit, so it owns the type).

- [ ] **Step 1: Create the component**

Create `src/components/admin/ApplicantCard.tsx`:

```tsx
'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ALL_ROLES } from '@/lib/roles';

export type Stage = 'reviewing' | 'reached_out' | 'approved';

export type Submission = {
  _id: Id<'leadershipInterest'>;
  name: string;
  email: string;
  gradYear: number;
  weeklyHours: number;
  roles: string[];
  worshipTeam: boolean;
  instruments?: string;
  videoUrl: string | null;
  submittedAt: number;
  stage?: Stage;
  assignedRole?: string;
};

interface ApplicantCardProps {
  submission: Submission;
  onOpenDetail: (id: Id<'leadershipInterest'>) => void;
}

export function ApplicantCard({ submission, onOpenDetail }: ApplicantCardProps) {
  const setAssignedRole = useMutation(api.leadershipInterest.setAssignedRole);
  const stage = submission.stage ?? 'reviewing';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: submission._id,
    data: { stage },
  });

  const dateStr = new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
        gap: 10,
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
          onClick={() => onOpenDetail(submission._id)}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <p className="font-cormorant" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{submission.name}</p>
          <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 2 }}>{submission.email}</p>
          <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>{dateStr} · {submission.weeklyHours} hrs/wk</p>
        </button>
      </div>

      <select
        value={submission.assignedRole ?? ''}
        onChange={(e) => setAssignedRole({ id: submission._id, assignedRole: e.target.value || undefined })}
        style={{ fontSize: '0.72rem', padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff7eb' }}
      >
        <option value="">Assign role…</option>
        {ALL_ROLES.map((role) => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors related to `ApplicantCard.tsx` (errors in other not-yet-created files referencing it, if any, are addressed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ApplicantCard.tsx
git commit -m "feat: add ApplicantCard component for kanban board"
```

---

### Task 4: `BoardColumn` component

**Files:**
- Create: `src/components/admin/BoardColumn.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/BoardColumn.tsx`:

```tsx
'use client';
import { useDroppable } from '@dnd-kit/core';
import { ApplicantCard, type Submission } from './ApplicantCard';
import { Id } from '../../../convex/_generated/dataModel';

interface BoardColumnProps {
  id: string;
  title: string;
  submissions: Submission[];
  onOpenDetail: (id: Id<'leadershipInterest'>) => void;
}

export function BoardColumn({ id, title, submissions, onOpenDetail }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <h3 className="font-cormorant" style={{ fontSize: '1.1rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>{title}</h3>
        <span style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>{submissions.length}</span>
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
        {submissions.length === 0 ? (
          <p style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.25)', textAlign: 'center', padding: '20px 0' }}>No applicants</p>
        ) : (
          submissions.map((s) => (
            <ApplicantCard key={s._id} submission={s} onOpenDetail={onOpenDetail} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors related to `BoardColumn.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/BoardColumn.tsx
git commit -m "feat: add BoardColumn droppable component for kanban board"
```

---

### Task 5: `ApplicantDetailModal` component

**Files:**
- Create: `src/components/admin/ApplicantDetailModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/ApplicantDetailModal.tsx`:

```tsx
'use client';
import type { Submission } from './ApplicantCard';

interface ApplicantDetailModalProps {
  submission: Submission;
  onClose: () => void;
}

export function ApplicantDetailModal({ submission, onClose }: ApplicantDetailModalProps) {
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
            <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{submission.name}</p>
            <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{submission.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {submission.roles.map((r) => (
            <span key={r} style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,73,0.07)', color: '#003049' }}>{r}</span>
          ))}
          {submission.worshipTeam && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(180,87,65,0.1)', color: '#b45741' }}>Worship Team</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
          <Stat label="Grad Year" value={String(submission.gradYear)} />
          <Stat label="Hrs / Week" value={String(submission.weeklyHours)} />
        </div>

        {submission.worshipTeam && submission.instruments && (
          <div style={{ marginBottom: 20 }}>
            <Label>Instruments</Label>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4 }}>{submission.instruments}</p>
          </div>
        )}

        {submission.videoUrl && (
          <div style={{ marginBottom: 20 }}>
            <Label>Video</Label>
            <video src={submission.videoUrl} controls style={{ marginTop: 10, width: '100%', borderRadius: 12, maxHeight: 300, background: 'rgba(0,48,73,0.04)' }} />
          </div>
        )}

        <a href={`mailto:${submission.email}`} style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', textDecoration: 'none', display: 'inline-block' }}>
          Email {submission.name.split(' ')[0]}
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)', marginBottom: 3 }}>{label}</p>
      <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)' }}>{children}</p>;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors related to `ApplicantDetailModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ApplicantDetailModal.tsx
git commit -m "feat: add ApplicantDetailModal component for kanban board"
```

---

### Task 6: `ApplicationsBoard` component + wire into the page

**Files:**
- Create: `src/components/admin/ApplicationsBoard.tsx`
- Modify: `src/app/admin/applications/page.tsx` (full file)

- [ ] **Step 1: Create the board component**

Create `src/components/admin/ApplicationsBoard.tsx`:

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { BoardColumn } from './BoardColumn';
import { ApplicantDetailModal } from './ApplicantDetailModal';
import type { Submission, Stage } from './ApplicantCard';

const COLUMNS: { id: Stage; title: string }[] = [
  { id: 'reviewing', title: 'Reviewing' },
  { id: 'reached_out', title: 'Reached Out' },
  { id: 'approved', title: 'Approved' },
];

export function ApplicationsBoard() {
  const submissions = useQuery(api.leadershipInterest.list, {}) as Submission[] | undefined;
  const setStage = useMutation(api.leadershipInterest.setStage);
  const [pendingMoves, setPendingMoves] = useState<Record<string, Stage>>({});
  const [detailId, setDetailId] = useState<Id<'leadershipInterest'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const result: Record<Stage, Submission[]> = { reviewing: [], reached_out: [], approved: [] };
    for (const s of submissions ?? []) {
      const effectiveStage = pendingMoves[s._id] ?? s.stage ?? 'reviewing';
      result[effectiveStage].push(s);
    }
    return result;
  }, [submissions, pendingMoves]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as Id<'leadershipInterest'>;
    const newStage = over.id as Stage;
    const currentStage = (active.data.current?.stage as Stage) ?? 'reviewing';
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

  const detailSubmission = submissions?.find((s) => s._id === detailId) ?? null;

  if (submissions === undefined) {
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
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              id={col.id}
              title={col.title}
              submissions={grouped[col.id]}
              onOpenDetail={setDetailId}
            />
          ))}
        </div>
      </DndContext>

      {detailSubmission && (
        <ApplicantDetailModal submission={detailSubmission} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the "Full Applications" section in the page**

Replace the entire contents of `src/app/admin/applications/page.tsx` with:

```tsx
'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ApplicationsBoard } from '@/components/admin/ApplicationsBoard';

type CallRequest = {
  _id: string;
  name: string;
  contact: string;
  roles: string[];
  submittedAt: number;
};

export default function ApplicationsPage() {
  const callRequests = useQuery(api.leadershipInterest.listCallRequests, {}) as CallRequest[] | undefined;

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
            Applications
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>
            Fall 2026 · Leadership Interest Submissions
          </p>
        </div>

        {/* ── Call Requests ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
              Call Requests
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
            {callRequests && (
              <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>
                {callRequests.length} total
              </span>
            )}
          </div>

          {callRequests === undefined ? (
            <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)', padding: '32px 0' }}>Loading…</p>
          ) : callRequests.length === 0 ? (
            <p className="font-cormorant" style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.2)', padding: '32px 0' }}>No call requests yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callRequests.map((r) => {
                const dateStr = new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isEmail = r.contact.includes('@');
                return (
                  <div key={r._id} style={{
                    borderRadius: 16,
                    border: '1px solid rgba(180,87,65,0.18)',
                    background: 'rgba(180,87,65,0.03)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span className="font-cormorant" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{r.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{r.contact}</span>
                      </div>
                      {r.roles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {r.roles.map((role) => (
                            <span key={role} style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,73,0.07)', color: '#003049' }}>{role}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>{dateStr}</span>
                      <a
                        href={isEmail ? `mailto:${r.contact}` : `tel:${r.contact}`}
                        style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: 999, background: '#b45741', color: '#fff7eb', textDecoration: 'none' }}
                      >
                        {isEmail ? 'Email' : 'Call'} {r.name.split(' ')[0]}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Applicant Board ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
              Full Applications
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
          </div>
          <ApplicationsBoard />
        </div>

      </div>
    </div>
  );
}
```

(Note: `maxWidth` was widened from 820 to 1100 to fit the 3 board columns comfortably.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ApplicationsBoard.tsx src/app/admin/applications/page.tsx
git commit -m "feat: wire kanban board into /admin/applications"
```

---

### Task 7: Manual end-to-end verification

**Files:**
- Create (temporary, removed at end of task): `convex/oneOffCleanup.ts`

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Create a throwaway test applicant**

In a browser, go to `http://localhost:3000/join`, pick any role, fill in name "ZZ Test", any email/grad year/hours, and submit a full application (a short video file is required by the form — any short clip works).

- [ ] **Step 3: Verify the board**

Go to `http://localhost:3000/admin/applications`. Confirm:
- "ZZ Test" appears in the "Reviewing" column.
- Dragging the card (via its handle) to "Reached Out" moves it there and the move persists after a page refresh.
- Picking a role from the card's dropdown persists after a page refresh.
- Clicking the card body (not the handle or dropdown) opens the detail modal showing grad year, hours/week, and the video; clicking outside the modal or the × closes it.
- The "Call Requests" section above is unchanged.

- [ ] **Step 4: Clean up the test record**

Create a temporary `convex/oneOffCleanup.ts`:

```ts
import { internalMutation } from "./_generated/server";

export const deleteTestApplicant = internalMutation({
  args: {},
  handler: async (ctx) => {
    const apps = await ctx.db.query("leadershipInterest").collect();
    let deleted = 0;
    for (const a of apps) {
      if (a.name.trim().toLowerCase() === "zz test") {
        await ctx.db.delete(a._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
```

Run: `npx convex dev --once` (to deploy it), then `npx convex run oneOffCleanup:deleteTestApplicant`
Expected: output shows `{ deleted: 1 }`.

Delete `convex/oneOffCleanup.ts` and run `npx convex dev --once` again so no standing delete-capable function is left on the live deployment.

- [ ] **Step 5: Stop the dev server**

No commit for this task — `oneOffCleanup.ts` is created and removed within the task, so there's nothing to commit.

---

### Task 8: Push the branch

**Files:** none

- [ ] **Step 1: Push**

Run: `git push -u origin feature/applicants-kanban-board`
Expected: branch pushed successfully. Per the current Vercel setup, this creates a preview deployment but does not go live to wmaac.org until manually promoted — consistent with the existing workflow for this repo.

No commit for this task.
