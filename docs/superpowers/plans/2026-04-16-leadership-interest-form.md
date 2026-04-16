# Leadership Interest Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step leadership interest form at `/join` where students select roles, enter personal info, record/upload a video, and optionally request a follow-up call — all saved to Convex.

**Architecture:** Single `'use client'` page at `src/app/join/page.tsx` manages all step state in a `formData` object passed down to each step component. On final submit, the video is uploaded to Convex storage first, then a single mutation writes the full record. No data is saved to Convex until the final submit.

**Tech Stack:** Next.js 16 App Router, Convex (DB + file storage), TypeScript, Tailwind CSS, `next/font/google` (Cormorant Garamond + existing Source Sans 3), custom CSS animations in `globals.css`.

**Visual reference:** `docs/superpowers/specs/join-mockup.html` — open this in a browser to see the approved design. The progress bar, card interaction, and glow animation are all implemented there.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `convex/schema.ts` | Add `leadershipInterest` table |
| Create | `convex/leadershipInterest.ts` | `generateUploadUrl` + `submit` mutations |
| Modify | `src/app/layout.tsx` | Add Cormorant Garamond font variable |
| Modify | `src/app/globals.css` | Add `join-page` scroll class + join-specific CSS (progress glow, card badge, slider) |
| Create | `src/app/join/page.tsx` | Page shell, step state machine, Convex submit |
| Create | `src/components/join/ProgressBar.tsx` | Animated pill progress bar with glow |
| Create | `src/components/join/RoleCard.tsx` | Single role/team card with hover+tap description reveal |
| Create | `src/components/join/RoleSelection.tsx` | Step 1 — card grid, worship block, selection logic |
| Create | `src/components/join/Slider.tsx` | Reusable custom-styled range slider |
| Create | `src/components/join/PersonalInfo.tsx` | Step 2 — name, email, grad year, hours sliders |
| Create | `src/components/join/VideoUpload.tsx` | Step 3 — file input with camera capture + preview |
| Create | `src/components/join/FollowUp.tsx` | Step 4 — call checkbox + phone field |
| Create | `src/components/join/ThankYou.tsx` | Success screen |
| Modify | `src/app/page.tsx` | Add "Join the Team" card to homepage |

---

## Task 1: Convex Schema + Mutations

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/leadershipInterest.ts`

- [ ] **Step 1: Add `leadershipInterest` table to schema**

Open `convex/schema.ts`. Add this table inside `defineSchema({...})`, after the `settings` table:

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
  requestsCall: v.boolean(),
  phone: v.optional(v.string()),
  submittedAt: v.number(),
}).index("by_submittedAt", ["submittedAt"]),
```

- [ ] **Step 2: Create the mutations file**

Create `convex/leadershipInterest.ts`:

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    gradYear: v.number(),
    weeklyHours: v.number(),
    roles: v.array(v.string()),
    worshipTeam: v.boolean(),
    instruments: v.optional(v.string()),
    videoStorageId: v.id("_storage"),
    requestsCall: v.boolean(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadershipInterest", {
      ...args,
      submittedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 3: Verify Convex schema compiles**

Run from `PSUWorship/` directory:
```bash
npx convex dev --once
```
Expected: no type errors, schema push succeeds. If Convex is already running in another terminal, just save the files — it will auto-push.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/leadershipInterest.ts
git commit -m "feat: add leadershipInterest convex schema and mutations"
```

---

## Task 2: Font + Global CSS

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Cormorant Garamond to layout**

Open `src/app/layout.tsx`. Replace the entire file with:

```tsx
import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PSUWorship",
  description: "Learn to sing vocal harmonies with real-time pitch feedback",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PSUWorship",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${cormorant.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add join page CSS to globals.css**

Open `src/app/globals.css`. Append this block at the end of the file:

```css
/* ── Join Page ── */
html:has(.join-page), body:has(.join-page) {
  overflow: auto;
  position: static;
  height: auto;
}

/* Cormorant Garamond font utility */
.font-cormorant {
  font-family: var(--font-cormorant), 'Cormorant Garamond', serif;
}

/* Progress bar glow animation */
@keyframes join-glow-breathe {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1;   }
}

.join-progress-glow {
  animation: join-glow-breathe 3s ease-in-out infinite;
}

/* Card badge entrance animation */
@keyframes join-badge-in {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 0.85; transform: scale(1); }
}

.join-badge-visible {
  animation: join-badge-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Custom join slider — navy track, rust fill via JS inline style, cream thumb */
input[type="range"].join-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  background: linear-gradient(
    to right,
    #b45741 0%,
    #b45741 var(--fill-pct, 0%),
    rgba(0,48,73,0.15) var(--fill-pct, 0%),
    rgba(0,48,73,0.15) 100%
  );
}

input[type="range"].join-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  background: #fff7eb;
  border: 2px solid #b45741;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
}

input[type="range"].join-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

input[type="range"].join-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  background: #fff7eb;
  border: 2px solid #b45741;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #b45741;
}
```

- [ ] **Step 3: Verify font loads**

Run `npm run dev`, open `http://localhost:3000`. No console errors. (Cormorant Garamond won't be visible yet — that's expected.)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add Cormorant Garamond font and join page global styles"
```

---

## Task 3: ProgressBar Component

**Files:**
- Create: `src/components/join/ProgressBar.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/ProgressBar.tsx`:

```tsx
const STEPS = ['Roles', 'About You', 'Your Story', 'Follow Up'];

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const fillPct = (currentStep / STEPS.length) * 100;

  return (
    <div
      className="relative w-full h-10 rounded-full overflow-hidden"
      style={{ background: 'rgba(0,48,73,0.1)' }}
    >
      {/* Navy fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-500 ease-in-out"
        style={{ width: `${fillPct}%` }}
      />

      {/* Blue-grey glow from fill edge */}
      <div
        className="join-progress-glow absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${fillPct}%`,
          width: '45%',
          background: 'linear-gradient(90deg, rgba(127,160,175,0.32) 0%, rgba(127,160,175,0.10) 40%, transparent 100%)',
          borderRadius: '0 9999px 9999px 0',
        }}
      />

      {/* Step labels overlay */}
      <div className="absolute inset-0 flex pointer-events-none">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className="flex-1 flex items-center justify-center text-[0.6rem] font-semibold tracking-widest uppercase"
            style={{ color: i < currentStep ? '#fff7eb' : 'rgba(0,48,73,0.3)' }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/ProgressBar.tsx
git commit -m "feat: add join ProgressBar component"
```

---

## Task 4: RoleCard Component

**Files:**
- Create: `src/components/join/RoleCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/RoleCard.tsx`:

```tsx
'use client';
import { useState } from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  variant: 'leadership' | 'team';
  selectionNumber: number | null; // null = not selected
  isDimmed: boolean;
  onToggle: () => void;
}

export default function RoleCard({
  title,
  description,
  variant,
  selectionNumber,
  isDimmed,
  onToggle,
}: RoleCardProps) {
  const [descOpen, setDescOpen] = useState(false);
  const isSelected = selectionNumber !== null;
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  function handleClick() {
    if (isMobile && !isSelected && !descOpen) {
      setDescOpen(true);
      setTimeout(() => setDescOpen(false), 2000);
      return;
    }
    setDescOpen(false);
    onToggle();
  }

  const leadershipBase = isSelected
    ? 'bg-secondary border-secondary shadow-lg'
    : 'bg-primary border-transparent hover:-translate-y-0.5 hover:shadow-xl';

  const teamBase = isSelected
    ? 'bg-secondary/10 border-secondary'
    : 'bg-background border-primary/20 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md';

  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[100px] overflow-hidden
        ${variant === 'leadership' ? leadershipBase : teamBase}
        ${isDimmed ? 'opacity-30 pointer-events-none' : ''}
      `}
    >
      {/* Selection number badge */}
      {isSelected && (
        <div
          className="join-badge-visible absolute top-2 right-3 font-cormorant font-bold leading-none pointer-events-none"
          style={{
            fontSize: '3rem',
            color: variant === 'leadership' ? 'rgba(196,145,58,0.9)' : 'rgba(180,87,65,0.7)',
          }}
        >
          {selectionNumber}
        </div>
      )}

      <div className="p-5 flex flex-col gap-1.5">
        {/* Title */}
        <div
          className={`font-cormorant font-semibold leading-tight text-[1.1rem] ${
            variant === 'leadership'
              ? isSelected ? 'text-background' : 'text-background'
              : isSelected ? 'text-secondary' : 'text-primary'
          }`}
        >
          {title}
        </div>

        {/* Description — visible on hover (desktop) or tap-open (mobile) */}
        <div
          className={`text-[0.72rem] font-light leading-relaxed transition-all duration-200 overflow-hidden ${
            descOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100'
          } ${
            variant === 'leadership' ? 'text-background/70' : 'text-primary/60'
          }`}
          style={{ maxHeight: descOpen ? '80px' : '' }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
```

Note: The description reveal on desktop hover is handled by wrapping the card in a `group` class in `RoleSelection` and using Tailwind's `group-hover:` utilities. See Task 5.

- [ ] **Step 2: Commit**

```bash
git add src/components/join/RoleCard.tsx
git commit -m "feat: add join RoleCard component"
```

---

## Task 5: RoleSelection Component (Step 1)

**Files:**
- Create: `src/components/join/RoleSelection.tsx`

The role data, selection logic, and worship block all live here.

- [ ] **Step 1: Create the component**

Create `src/components/join/RoleSelection.tsx`:

```tsx
'use client';
import { useState } from 'react';
import RoleCard from './RoleCard';

const LEADERSHIP_ROLES = [
  { title: 'Vice President', description: 'Assist the President, step in when needed, and help coordinate across all teams.' },
  { title: 'Music Director', description: 'Lead musical direction for worship nights and recordings — keys, arrangements, rehearsals.' },
  { title: 'Treasurer', description: 'Manage club finances, track expenses, and handle UPAC funding requests.' },
  { title: 'Secretary', description: 'Take meeting notes, manage communications, keep the team organized.' },
  { title: 'Event Coordinator', description: 'Plan and execute worship nights and events. Co-leads the Events & Hospitality team.' },
  { title: 'Hospitality Lead', description: 'Create a welcoming environment at every event. Co-leads the Events & Hospitality team.' },
  { title: 'Social Media Lead', description: 'Own our social presence — content strategy, posting cadence, and platform growth.' },
  { title: 'Media Lead', description: 'Direct photo and video coverage of events and manage content production.' },
  { title: 'Tech/Production Lead', description: 'Run live sound and lighting at events, oversee studio sessions. Full training provided.' },
  { title: 'Graphic Design Lead', description: 'Create visual assets, promotional materials, and maintain brand consistency.' },
  { title: 'Prayer Lead', description: 'Organize and lead prayer for the club — before events, during meetings, and beyond.' },
];

const TEAM_ROLES = [
  { title: 'Media & Social Team', description: 'Help capture events on camera, edit content, and manage social posts.' },
  { title: 'Events & Hospitality Team', description: 'Help set up events, greet guests, and support the event planning process.' },
  { title: 'Graphics Team', description: 'Assist with design assets, flyers, and visual content.' },
  { title: 'Sound & Tech Team', description: 'Run sound and gear at events — typically once a month or less.' },
];

const MAX_SELECTIONS = 3;

interface RoleSelectionProps {
  onNext: (data: { roles: string[]; worshipTeam: boolean; instruments: string }) => void;
}

export default function RoleSelection({ onNext }: RoleSelectionProps) {
  const [selected, setSelected] = useState<string[]>([]); // ordered — index 0 = top choice
  const [worshipTeam, setWorshipTeam] = useState(false);
  const [instruments, setInstruments] = useState('');

  function toggleRole(title: string) {
    setSelected((prev) => {
      if (prev.includes(title)) return prev.filter((r) => r !== title);
      if (prev.length >= MAX_SELECTIONS) return prev;
      return [...prev, title];
    });
  }

  const allRoles = [...LEADERSHIP_ROLES.map(r => r.title), ...TEAM_ROLES.map(r => r.title)];
  const atMax = selected.length >= MAX_SELECTIONS;

  return (
    <div className="flex flex-col gap-8">
      {/* Counter */}
      <p
        className={`font-cormorant font-semibold italic text-lg tracking-wide transition-colors ${
          selected.length > 0 ? 'text-secondary' : 'text-primary/40'
        }`}
      >
        {selected.length} / 3 selected
      </p>

      {/* Leadership Roles */}
      <section>
        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="font-cormorant font-semibold italic text-2xl text-primary">Leadership Roles</h2>
          <div className="flex-1 h-px bg-primary/10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LEADERSHIP_ROLES.map((role) => {
            const selNum = selected.indexOf(role.title);
            return (
              <div key={role.title} className="group">
                <RoleCard
                  title={role.title}
                  description={role.description}
                  variant="leadership"
                  selectionNumber={selNum >= 0 ? selNum + 1 : null}
                  isDimmed={atMax && !selected.includes(role.title)}
                  onToggle={() => toggleRole(role.title)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Positions */}
      <section>
        <div className="flex items-baseline gap-4 mb-2">
          <h2 className="font-cormorant font-semibold italic text-2xl text-primary">Team Positions</h2>
          <div className="flex-1 h-px bg-primary/10" />
          <span className="text-xs text-primary/40 font-normal">Lower time commitment</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {TEAM_ROLES.map((role) => {
            const selNum = selected.indexOf(role.title);
            return (
              <div key={role.title} className="group">
                <RoleCard
                  title={role.title}
                  description={role.description}
                  variant="team"
                  selectionNumber={selNum >= 0 ? selNum + 1 : null}
                  isDimmed={atMax && !selected.includes(role.title)}
                  onToggle={() => toggleRole(role.title)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Worship Team Block */}
      <section
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(180,87,65,0.07)', borderColor: 'rgba(180,87,65,0.2)' }}
      >
        <h3 className="font-cormorant font-semibold italic text-xl text-primary mb-2">
          Interested in the Worship Team?
        </h3>
        <p className="text-sm font-light text-primary/60 leading-relaxed mb-4">
          Anyone at PSU Worship is welcome to write, record, and perform original songs with us — regardless of what role you hold.
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
              worshipTeam ? 'bg-secondary border-secondary' : 'bg-background border-secondary/40'
            }`}
            onClick={() => setWorshipTeam((v) => !v)}
          >
            {worshipTeam && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5l3.5 3.5L11 1" stroke="#fff7eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-sm font-semibold text-primary">
            Yes, I'd like to be part of the Worship Team
          </span>
        </label>

        {worshipTeam && (
          <input
            type="text"
            value={instruments}
            onChange={(e) => setInstruments(e.target.value)}
            placeholder="What instrument(s) do you play or want to learn? (e.g. guitar, vocals, keys)"
            className="mt-4 w-full h-12 px-4 rounded-xl border border-primary/20 bg-background text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        )}
      </section>

      {/* Continue */}
      <button
        disabled={selected.length === 0}
        onClick={() => onNext({ roles: selected, worshipTeam, instruments })}
        className="w-full h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
      >
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/RoleSelection.tsx
git commit -m "feat: add join RoleSelection step component"
```

---

## Task 6: Slider Component

**Files:**
- Create: `src/components/join/Slider.tsx`

This is a reusable slider used for both Grad Year and Weekly Hours in Step 2.

- [ ] **Step 1: Create the component**

Create `src/components/join/Slider.tsx`:

```tsx
'use client';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
  note?: string;
}

export default function Slider({ label, min, max, value, onChange, formatValue, note }: SliderProps) {
  const fillPct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-primary/70 tracking-wide uppercase text-[0.7rem]">
          {label}
        </label>
        <span className="font-cormorant font-semibold text-2xl text-primary">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="join-slider w-full"
        style={{ '--fill-pct': `${fillPct}%` } as React.CSSProperties}
      />

      {note && (
        <p className="text-xs text-primary/40 italic">{note}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/Slider.tsx
git commit -m "feat: add join Slider component"
```

---

## Task 7: PersonalInfo Component (Step 2)

**Files:**
- Create: `src/components/join/PersonalInfo.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/PersonalInfo.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Slider from './Slider';

interface PersonalInfoProps {
  onNext: (data: { name: string; email: string; gradYear: number; weeklyHours: number }) => void;
  onBack: () => void;
}

export default function PersonalInfo({ onNext, onBack }: PersonalInfoProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gradYear, setGradYear] = useState(2028);
  const [weeklyHours, setWeeklyHours] = useState(3);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canAdvance = name.trim().length > 0 && emailValid;

  const inputClass =
    'w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors';

  return (
    <div className="flex flex-col gap-8">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className={inputClass}
          autoComplete="name"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>

      {/* Grad Year slider */}
      <Slider
        label="Graduation Year"
        min={2026}
        max={2032}
        value={gradYear}
        onChange={setGradYear}
      />

      {/* Weekly Hours slider */}
      <Slider
        label="Weekly Hours Available"
        min={1}
        max={10}
        value={weeklyHours}
        onChange={setWeeklyHours}
        formatValue={(v) => `${v} hr${v === 1 ? '' : 's'}/week`}
        note="Non-binding — we just want to get a sense of your availability."
      />

      {/* Nav */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50"
        >
          Back
        </button>
        <button
          disabled={!canAdvance}
          onClick={() => onNext({ name: name.trim(), email: email.trim(), gradYear, weeklyHours })}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/PersonalInfo.tsx
git commit -m "feat: add join PersonalInfo step component"
```

---

## Task 8: VideoUpload Component (Step 3)

**Files:**
- Create: `src/components/join/VideoUpload.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/VideoUpload.tsx`:

```tsx
'use client';
import { useState, useRef } from 'react';

interface VideoUploadProps {
  onNext: (file: File) => void;
  onBack: () => void;
}

export default function VideoUpload({ onNext, onBack }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold text-3xl text-primary">Tell us about yourself.</h2>
        <p className="text-sm font-light text-primary/60 leading-relaxed">
          Why do you want to be part of PSU Worship, and what does worship mean to you?
        </p>
      </div>

      {/* Note */}
      <div
        className="rounded-xl px-5 py-4 text-sm font-light text-primary/70 leading-relaxed"
        style={{ background: 'rgba(0,48,73,0.05)', borderLeft: '2px solid rgba(0,48,73,0.15)' }}
      >
        This doesn't need to be scripted or formal — we actually prefer your raw, honest thoughts. 1–3 minutes is plenty.
      </div>

      {/* Upload / Preview area */}
      {!previewUrl ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-3 py-16 text-primary/40 hover:border-primary/40 hover:text-primary/60 transition-colors cursor-pointer"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          </svg>
          <span className="text-sm font-semibold tracking-wide">Tap to record or upload a video</span>
          <span className="text-xs">Opens camera on mobile</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <video
            src={previewUrl}
            controls
            className="w-full rounded-2xl bg-primary/5"
            style={{ maxHeight: '320px' }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-sm text-primary/50 underline underline-offset-2 hover:text-primary transition-colors text-center"
          >
            Choose a different video
          </button>
        </div>
      )}

      {/* Hidden file input — capture="user" opens front camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />

      {/* Nav */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50"
        >
          Back
        </button>
        <button
          disabled={!file}
          onClick={() => file && onNext(file)}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/VideoUpload.tsx
git commit -m "feat: add join VideoUpload step component"
```

---

## Task 9: FollowUp Component (Step 4)

**Files:**
- Create: `src/components/join/FollowUp.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/FollowUp.tsx`:

```tsx
'use client';
import { useState } from 'react';

interface FollowUpProps {
  isSubmitting: boolean;
  onSubmit: (data: { requestsCall: boolean; phone: string }) => void;
  onBack: () => void;
}

export default function FollowUp({ isSubmitting, onSubmit, onBack }: FollowUpProps) {
  const [requestsCall, setRequestsCall] = useState(false);
  const [phone, setPhone] = useState('');

  const canSubmit = !requestsCall || phone.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold text-3xl text-primary">One last thing.</h2>
        <p className="text-sm font-light text-primary/60 leading-relaxed">
          Would you like Marco to reach out for a call or in-person meeting?
        </p>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-4 cursor-pointer">
        <div
          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            requestsCall ? 'bg-secondary border-secondary' : 'bg-background border-primary/25'
          }`}
          onClick={() => setRequestsCall((v) => !v)}
        >
          {requestsCall && (
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5l4 4L13 1" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className="text-base font-semibold text-primary leading-snug">
          Yes, I'd love to connect with Marco before deciding
        </span>
      </label>

      {/* Phone — shown when checkbox checked */}
      {requestsCall && (
        <div className="flex flex-col gap-2">
          <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 555-867-5309"
            autoComplete="tel"
            className="w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50 disabled:opacity-40"
        >
          Back
        </button>
        <button
          disabled={!canSubmit || isSubmitting}
          onClick={() => onSubmit({ requestsCall, phone: phone.trim() })}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/FollowUp.tsx
git commit -m "feat: add join FollowUp step component"
```

---

## Task 10: ThankYou Screen

**Files:**
- Create: `src/components/join/ThankYou.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/join/ThankYou.tsx`:

```tsx
import Logo from '@/components/Logo';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 gap-8">
      <Logo className="justify-center text-3xl opacity-60" />

      <div className="flex flex-col gap-4 max-w-sm">
        <h1 className="font-cormorant font-semibold text-5xl text-primary leading-tight">
          We're glad<br />you're here.
        </h1>
        <p className="text-base font-light text-primary/60 leading-relaxed">
          We'll review your application with our faculty mentor and be in touch soon. In the meantime — keep worshipping.
        </p>
      </div>

      <div
        className="w-12 h-px"
        style={{ background: 'var(--secondary)' }}
      />

      <p className="text-xs text-primary/30 tracking-widest uppercase">
        Penn State Worship
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/join/ThankYou.tsx
git commit -m "feat: add join ThankYou screen component"
```

---

## Task 11: Page Shell + Convex Submission

**Files:**
- Create: `src/app/join/page.tsx`

This ties everything together. It manages step state, accumulates form data, uploads the video on submit, then calls the Convex mutation.

- [ ] **Step 1: Create the page**

Create `src/app/join/page.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ProgressBar from '@/components/join/ProgressBar';
import RoleSelection from '@/components/join/RoleSelection';
import PersonalInfo from '@/components/join/PersonalInfo';
import VideoUpload from '@/components/join/VideoUpload';
import FollowUp from '@/components/join/FollowUp';
import ThankYou from '@/components/join/ThankYou';

interface FormData {
  roles: string[];
  worshipTeam: boolean;
  instruments: string;
  name: string;
  email: string;
  gradYear: number;
  weeklyHours: number;
  videoFile: File | null;
}

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    roles: [],
    worshipTeam: false,
    instruments: '',
    name: '',
    email: '',
    gradYear: 2028,
    weeklyHours: 3,
    videoFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.leadershipInterest.generateUploadUrl);
  const submit = useMutation(api.leadershipInterest.submit);

  async function handleFinalSubmit(followUp: { requestsCall: boolean; phone: string }) {
    if (!formData.videoFile) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Get a Convex upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload video to Convex storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': formData.videoFile.type },
        body: formData.videoFile,
      });
      if (!uploadRes.ok) throw new Error('Video upload failed');
      const { storageId } = await uploadRes.json();

      // 3. Write the full record
      await submit({
        name: formData.name,
        email: formData.email,
        gradYear: formData.gradYear,
        weeklyHours: formData.weeklyHours,
        roles: formData.roles,
        worshipTeam: formData.worshipTeam,
        instruments: formData.instruments || undefined,
        videoStorageId: storageId,
        requestsCall: followUp.requestsCall,
        phone: followUp.phone || undefined,
      });

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) return <ThankYou />;

  return (
    <div className="join-page min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pb-32">
        {/* Page header */}
        <div className="pt-16 pb-2">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-secondary mb-2">
            PSU Worship
          </p>
          <h1 className="font-cormorant font-semibold text-5xl sm:text-6xl text-primary leading-tight mb-3">
            Join the Team.
          </h1>
          <p className="text-base font-light text-primary/55 leading-relaxed max-w-md">
            God is working at Penn State and music is playing a huge role. We're looking for people who want to be part of that.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-10 mb-12">
          <ProgressBar currentStep={step} />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-secondary/10 text-secondary text-sm">
            {error}
          </div>
        )}

        {/* Steps */}
        {step === 1 && (
          <RoleSelection
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <PersonalInfo
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <VideoUpload
            onNext={(file) => {
              setFormData((f) => ({ ...f, videoFile: file }));
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <FollowUp
            isSubmitting={isSubmitting}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page loads**

Start the dev server (`npm run dev`) and open `http://localhost:3000/join`. The page should render Step 1 with role cards. Check:
- Cards show for all 11 leadership roles and 4 team positions
- Clicking a card selects it and shows a number badge
- Counter updates to "1 / 3 selected", etc.
- Continue button enables after first selection
- Progress bar shows "Roles" section filled

- [ ] **Step 3: Verify step flow end-to-end**

Walk through all 4 steps manually:
1. Select 1–3 roles, optionally check worship team → Continue
2. Fill name + email, adjust sliders → Continue
3. Record or upload a test video → Continue
4. Optionally check call request → Submit Application
5. Thank you screen appears

- [ ] **Step 4: Verify Convex record was created**

Open your Convex dashboard → Data tab → `leadershipInterest` table. Confirm the document was written with all fields. Confirm the `videoStorageId` resolves to a file in Convex storage.

- [ ] **Step 5: Commit**

```bash
git add src/app/join/page.tsx
git commit -m "feat: add join page with 4-step form and convex submission"
```

---

## Task 12: Add to Homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add Join card to homepage tools array**

Open `src/app/page.tsx`. In the `tools` array, add this entry after the existing three:

```tsx
// SVG icon for Join — person with plus
const JoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <circle cx="9" cy="7" r="4" stroke="#fff7eb" strokeWidth="2" fill="none" />
    <path d="M2 21v-1a7 7 0 0 1 11.95-4.95" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="19" y1="13" x2="19" y2="21" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="17" x2="23" y2="17" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

Then add to the `tools` array:

```tsx
{
  id: 'join',
  title: 'Join the Team',
  description: 'Apply for a leadership role or team position in PSU Worship',
  icon: <JoinIcon />,
  href: '/join',
  color: 'bg-secondary',
},
```

- [ ] **Step 2: Verify homepage**

Open `http://localhost:3000`. The "Join the Team" card appears with a rust background icon. Clicking it navigates to `/join`.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Join the Team card to homepage"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| 4-step flow (Roles → Info → Video → Follow-up) | Tasks 5, 7, 8, 9, 11 |
| Leadership cards (11) with hover description | Task 4, 5 |
| Team cards (4), visually distinct | Task 4, 5 |
| Max 3 selections, numbered badges | Task 5 |
| Mobile tap-to-reveal description | Task 4 |
| Worship Team yes/no + instruments | Task 5 |
| Name, email, grad year slider, hours slider | Task 7 |
| Hours slider non-binding note | Task 7 |
| Video file input with camera capture | Task 8 |
| "Raw honest thoughts" note | Task 8 |
| Call request checkbox + phone | Task 9 |
| Thank you screen | Task 10 |
| Convex `leadershipInterest` table | Task 1 |
| Video upload to Convex storage | Task 11 |
| Progress bar with glow animation | Task 3 |
| Cormorant Garamond font | Task 2 |
| `join-page` scroll class | Task 2 |
| Homepage card | Task 12 |
| Aesthetic direction (editorial, minimal, warm) | Tasks 3, 4, 5, 7, 8, 9, 10 |

**No placeholders found.**

**Type consistency:** `FormData` in `page.tsx` matches all step component interfaces. `submit` mutation args match schema definition exactly. `generateUploadUrl` returns a URL string consumed by `fetch`. All consistent.
