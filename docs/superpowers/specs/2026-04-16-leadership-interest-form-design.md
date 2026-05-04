# Leadership Interest Form — Design Spec
**Date:** 2026-04-16
**Route:** `/join`
**Backend:** Convex (`leadershipInterest` table + Convex file storage for video)

---

## Overview

A 4-step multi-step form for students to express interest in PSU Worship leadership roles or team positions. Built as a single Next.js page with client-side step progression (no route changes between steps). Matches the existing site's cream/navy/rust design system.

---

## Step 1 — Role Selection

### Layout
- PSU Worship logo + page title "Join the Team" at top
- Brief mission context pulled from the announcement script (1–2 sentences max)
- Banner: "Select up to 3 roles you're most interested in. Your first pick is your top choice."
- Two card sections: **Leadership Roles** then **Team Positions**
- Sticky "Continue" button at bottom, disabled until at least 1 card is selected

### Leadership Role Cards (11)
Filled card style: navy background (`bg-primary`), cream text. Bold role title. Description revealed on hover (desktop) or tap (mobile).

| Role | Description |
|---|---|
| Vice President | Assist the President, step in when needed, and help coordinate across all teams |
| Music Director | Lead musical direction for worship nights and recordings — set keys, arrangements, and rehearsal structure |
| Treasurer | Manage club finances, track expenses, handle UPAC funding requests |
| Secretary | Take meeting notes, manage communications, keep the team organized |
| Event Coordinator | Plan and execute worship nights and events, co-lead the Events & Hospitality team |
| Hospitality Lead | Create a welcoming environment at every event, co-lead the Events & Hospitality team |
| Social Media Lead | Own our social presence — content strategy, posting cadence, and platform growth |
| Media Lead | Direct photo/video coverage of events and manage content production |
| Tech/Production Lead | Run live sound and lighting at events, oversee studio sessions — full training provided |
| Graphic Design Lead | Create visual assets, promotional materials, and brand consistency |
| Prayer Lead | Organize and lead prayer for the club — before events, during meetings, and beyond |

### Team Position Cards (4)
Outlined card style: cream background, navy border (`border-primary border-2`), navy text. Slightly smaller than leadership cards. Section includes a subtitle: "Lower time commitment — great if you want to be involved without a leadership role."

| Team | Description |
|---|---|
| Media & Social Team | Help capture events on camera, edit content, and manage social posts |
| Events & Hospitality Team | Help set up/tear down events, greet guests, and support the event planning process |
| Graphics Team | Assist with design assets, flyers, and visual content |
| Sound & Tech Team | Run sound and gear at events — typically once a month or less |

### Card Interaction
- Click selects the card; a large number badge (1, 2, or 3) appears in the top-right corner
- Selected card gets a rust highlight (`bg-secondary/20 border-secondary`)
- Clicking a selected card deselects it; remaining selections renumber automatically
- Maximum 3 selections across both sections combined
- If 3 are already selected, unselected cards are visually dimmed but remain clickable (clicking one deselects #3 and selects the new card as #3)

### Mobile Description Behavior
- On mobile, tapping a card reveals the description and selects it in one action. Tapping again deselects.
- Description text scales down to fit within the card — never truncates or overflows. Use `text-sm` as default, `text-xs` if long. Description container has a fixed max height with `overflow-hidden` — text is written to fit, not clipped.

### Worship Team Question
Below both card sections, a separate block (visually distinct — light rust tint `bg-secondary/10`, rounded border):

> **Interested in the Worship Team?**
> Anyone at PSU Worship is welcome to write, record, and perform original songs with us — regardless of what role you hold.
> [ ] Yes, I'd like to be part of the Worship Team

If checked, a follow-up field appears:
> What instrument(s) do you play or want to learn? (free text input, e.g. "guitar, drums, I want to learn keys")

---

## Step 2 — Personal Info

Four fields on a clean form:

| Field | Input Type | Notes |
|---|---|---|
| Name | Text input | |
| Email | Email input | |
| Graduation Year | Slider | Range: 2026–2032, shows selected year as label |
| Weekly Hours | Slider | Range: 1–10, shows selected value + "hrs/week" label |

Below the hours slider, italic disclaimer: *"Non-binding — we just want to get a sense of your availability."*

---

## Step 3 — Video Submission

- Heading: "Tell us about yourself"
- Subheading: "Why do you want to be part of PSU Worship, and what does worship mean to you?"
- Note in a subtle callout box: *"This doesn't need to be scripted or formal — we actually prefer your raw, honest thoughts. 1–3 minutes is plenty."*
- Single file input: `accept="video/*" capture="user"` — on mobile this opens the camera directly; on desktop allows file upload
- Video preview shown after selection (HTML5 `<video>` element)
- User can re-record/re-upload by clicking the input again
- Video uploaded to Convex file storage on submit (not on selection, to avoid wasted uploads)

---

## Step 4 — Follow-Up Contact

- Heading: "One last thing"
- Checkbox: "I'd like Marco to reach out for a call or in-person meeting"
- If checked, a phone number field appears (tel input, optional format guidance: "e.g. 555-867-5309")
- Email from Step 2 is reused — no need to re-enter

Submit button: "Submit Application"

On success: full-page thank-you screen with PSU Worship logo, a short encouraging message, and no further actions required.

---

## Navigation Between Steps

- Progress indicator at top: 4 dots or a step bar (Step 1 of 4, etc.)
- "Back" button on steps 2–4
- "Continue" button advances to next step
- No data is saved to Convex until final submit — all state lives in React (useState or useReducer)
- On final submit: video uploads first (Convex storage), then the full record is written in a single mutation

---

## Convex Schema — New Table

```ts
leadershipInterest: defineTable({
  name: v.string(),
  email: v.string(),
  gradYear: v.number(),
  weeklyHours: v.number(),
  roles: v.array(v.string()),         // ordered by selection priority, index 0 = top choice
  worshipTeam: v.boolean(),
  instruments: v.optional(v.string()),
  videoStorageId: v.id("_storage"),
  requestsCall: v.boolean(),
  phone: v.optional(v.string()),
  submittedAt: v.number(),
})
```

Convex mutation: `api.leadershipInterest.submit`
- Accepts all fields above
- Writes a single document — no partial saves

---

## Design System Alignment

- Colors: `bg-primary` (navy), `bg-secondary` (rust), `bg-background` (cream), `text-foreground`
- Font: Source Sans 3 (already loaded)
- Card radius: `rounded-2xl` (matches existing tool cards)
- Page uses `setlist-page` class to enable scrolling
- Form inputs use existing focus pattern: `focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors`
- No hardcoded colors

---

## Aesthetic Direction

The form should feel intentional and polished — minimalist but not sterile. Every element should look like someone made a decision about it.

- **Cards:** Generous padding (`p-6`+), large bold role title, subtle shadow. Not just a border box with text.
- **Role number badge:** Large (`text-4xl`), semi-transparent, positioned in the corner — feels graphic, not utilitarian
- **Sliders:** Custom styled — rust-colored track fill, larger thumb. Not the default browser slider.
- **Form fields (Step 2):** Tall inputs (`h-14`+), large text (`text-lg`), minimal border that brightens on focus. Feels substantial, not like a generic form.
- **Video upload area (Step 3):** Large dashed-border drop zone with a camera icon and the prompt text centered inside. Transforms into a video preview once a file is selected.
- **Progress bar:** Single continuous pill bar. Navy fill for the active step, step names overlaid as labels inside the bar (cream on the filled portion, muted navy on unfilled). A soft blue-grey (`#7fa0af`) glow gradient anchored at the fill edge breathes slowly in opacity — directional ambient energy, not a loading animation. No discrete moving objects.
- **Typography:** Mix of sizes intentionally. Page headings are large. Disclaimers and captions are small and muted. Nothing is uniformly sized.
- **Worship Team block:** Rust tint background (`bg-secondary/10`), rounded, slightly inset — feels like a distinct invitation, not a checkbox afterthought
- **Thank you screen:** Centered logo, large warm heading, generous whitespace. Simple and memorable.
- **Spacing:** Breathe. Don't crowd elements. The page should feel calm.

---

## Out of Scope (for now)

- Admin view for browsing submissions (use Convex dashboard directly)
- Email notifications on submit
- Duplicate submission prevention
