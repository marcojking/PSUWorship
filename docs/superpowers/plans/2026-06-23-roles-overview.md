# Roles Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `RolesOverview` component to `/admin/applications` showing all 15 roles (Leadership + Teams) shaded by assignment status (open / tentative / filled), and remove the "Call Requests" section from that page.

**Architecture:** `RolesOverview` independently subscribes to the same `api.leadershipInterest.list` query `ApplicationsBoard` already uses (Convex dedupes identical subscriptions, so this is free). It derives each role's status client-side by scanning `submissions` for matching `assignedRole` + `stage`, then renders two grouped rows of colored chips. `page.tsx` swaps the old "Call Requests" block for `<RolesOverview />`.

**Tech Stack:** Next.js 16 / React 19 App Router, Convex (read-only — no schema/query changes).

**Testing approach:** This repo has no automated test framework (confirmed in `CLAUDE.md` and the prior kanban-board plan). Verification here is `npx tsc --noEmit` + `npm run lint` for static checks, plus manual verification against the running dev server using the Playwright MCP browser tools (same approach used to verify the kanban board).

**Deploy note:** `main` now auto-deploys to production on every push (fixed earlier this session — Vercel's Production environment branch tracking was repointed from a stale branch to `main`). Do this work on a feature branch so in-progress commits don't go live, and only merge to `main` once verified.

---

### Task 0: Create the feature branch

**Files:** none (environment setup only)

- [ ] **Step 1: Branch off main**

Run:
```bash
git checkout main
git pull origin main
git checkout -b feature/roles-overview
```
Expected: `Switched to a new branch 'feature/roles-overview'`, branched from an up-to-date `main`.

No commit for this task (no files changed).

---

### Task 1: `RolesOverview` component

**Files:**
- Create: `src/components/admin/RolesOverview.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/admin/RolesOverview.tsx`:

```tsx
'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LEADERSHIP_ROLES, TEAM_ROLES } from '@/lib/roles';
import type { Submission } from './ApplicantCard';

type RoleStatus = 'open' | 'tentative' | 'filled';

function statusForRole(role: string, submissions: Submission[]): RoleStatus {
  const matches = submissions.filter((s) => s.assignedRole === role);
  if (matches.length === 0) return 'open';
  if (matches.some((s) => s.stage === 'approved')) return 'filled';
  return 'tentative';
}

const STATUS_STYLES: Record<RoleStatus, React.CSSProperties> = {
  open: {
    background: 'rgba(0,48,73,0.04)',
    border: '1px solid rgba(0,48,73,0.12)',
    color: 'rgba(0,48,73,0.45)',
  },
  tentative: {
    background: 'rgba(79,138,100,0.08)',
    border: '1px dashed #4f8a64',
    color: '#3c6b4d',
  },
  filled: {
    background: '#4f8a64',
    border: '1px solid #4f8a64',
    color: '#fff7eb',
  },
};

function RoleChip({ role, status }: { role: string; status: RoleStatus }) {
  return (
    <span
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 999,
        ...STATUS_STYLES[status],
      }}
    >
      {role}
    </span>
  );
}

function RoleGroup({ title, roles, submissions }: { title: string; roles: string[]; submissions: Submission[] }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(0,48,73,0.4)',
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {roles.map((role) => (
          <RoleChip key={role} role={role} status={statusForRole(role, submissions)} />
        ))}
      </div>
    </div>
  );
}

export function RolesOverview() {
  const submissions = useQuery(api.leadershipInterest.list, {}) as Submission[] | undefined;
  if (submissions === undefined) return null;

  return (
    <div style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
          Roles Overview
        </h2>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
      </div>
      <RoleGroup title="Leadership" roles={LEADERSHIP_ROLES} submissions={submissions} />
      <RoleGroup title="Teams" roles={TEAM_ROLES} submissions={submissions} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If you see `Cannot find module 'react'` style noise unrelated to this file, that's pre-existing — only new errors pointing at `RolesOverview.tsx` matter here.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/RolesOverview.tsx
git commit -m "feat: add RolesOverview component"
```

---

### Task 2: Wire into the page, remove Call Requests

**Files:**
- Modify: `src/app/admin/applications/page.tsx` (currently 117 lines, shown in full below for both old and new state)

- [ ] **Step 1: Replace the file contents**

Current `src/app/admin/applications/page.tsx` starts with this import block and `CallRequest` type, then a "Call Requests" section (lines 1–101), followed by the "Full Applications" section (lines 103–117). Replace the **entire file** with:

```tsx
'use client';
import { ApplicationsBoard } from '@/components/admin/ApplicationsBoard';
import { RolesOverview } from '@/components/admin/RolesOverview';

export default function ApplicationsPage() {
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

        {/* ── Roles Overview ── */}
        <RolesOverview />

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

This removes the `useQuery`/`api` imports, the `CallRequest` type, and the entire "Call Requests" rendering block — none of those are referenced anywhere else in this file. `requestCall`, `listCallRequests`, and the `callRequests` table in Convex are untouched; `/join`'s "request a call" option keeps working exactly as before.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/applications/page.tsx
git commit -m "feat: show roles overview, remove call requests list from admin applications"
```

---

### Task 3: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` (or next free port — check terminal output).

- [ ] **Step 2: Navigate to the page and snapshot it**

Use the Playwright MCP tools:
```
mcp__plugin_playwright_playwright__browser_navigate to http://localhost:3000/admin/applications
mcp__plugin_playwright_playwright__browser_snapshot
```
Expected: snapshot shows a "Roles Overview" heading with "Leadership" and "Teams" sub-groups of chips, no "Call Requests" heading anywhere, and "Full Applications" + the kanban board still below it.

- [ ] **Step 3: Verify status logic against real data**

In the snapshot from Step 2, cross-check a couple of chips against the kanban board state visible on the same page:
- A role with nobody assigned anywhere → its chip should read as `open` styling (muted, solid thin border).
- If any applicant currently has an `assignedRole` set but is sitting in "Reviewing" or "Reached Out" → that role's chip should be `tentative` (dashed green border, light fill).
- If any applicant with an `assignedRole` is in "Approved" → that role's chip should be `filled` (solid green).

If the current data doesn't exercise all three states, use the existing role `<select>` dropdown on a test applicant card to assign a role, and drag/drop a card into "Approved", re-snapshotting after each change to confirm the chip updates live (Convex reactivity — no page reload needed).

- [ ] **Step 4: Verify `/join` call-request flow still works**

```
mcp__plugin_playwright_playwright__browser_navigate to http://localhost:3000/join
```
Click through to the "request a call" option (per the existing `requestCall` flow) and submit it. Expected: submission succeeds with no console errors — this confirms removing the admin-side list didn't break the intake mutation it calls.

No commit for this task (verification only, no file changes).

---

### Task 4: Merge and ship

**Files:** none (git operations only)

- [ ] **Step 1: Push the branch**

Run: `git push -u origin feature/roles-overview`
Expected: branch pushed, no errors.

- [ ] **Step 2: Merge into main**

**Check with the user before this step** — pushing to `main` now triggers an immediate production deploy (per this session's deploy-pipeline fix), so confirm they want this live before proceeding.

Run:
```bash
git checkout main
git pull origin main
git merge --ff-only feature/roles-overview
git push origin main
```
Expected: fast-forward merge (no conflicts, since `main` hasn't moved since Task 0's branch point unless other work landed in the meantime — if it's not a clean fast-forward, stop and re-sync with the user rather than force-merging).

No commit for this task (merge only).
