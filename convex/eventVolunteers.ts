import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* Volunteer sign-ups from the public /sept13 page.
 *
 * `submit` is reachable by anyone on the internet — the form is meant to be
 * forwarded around churches and campus ministries, so there is no auth in front
 * of it. Everything below is therefore validated rather than trusted: field
 * lengths are capped so a single request cannot write an enormous document, and
 * roles are checked against a fixed list instead of accepting free strings.
 *
 * This does NOT include rate limiting. If the form gets spammed, the fix is a
 * captcha or Vercel BotID in front of /api/volunteer, not more validation here.
 */

// Must stay in sync with the checkboxes rendered in src/app/sept13/route.ts.
// Deliberately just two. These are the teams that can actually absorb outside
// volunteers — the rest (setup, tech, prayer) are run by people who already know
// the plan. Offering roles we cannot staff wastes a willing person's time.
const ROLES = ["hospitality", "media"] as const;

const LIMITS = { name: 120, email: 200, phone: 40, church: 160, notes: 1000, camera: 300 };

const VOLUNTEER_DOC = v.object({
  _id: v.id("eventVolunteers"),
  _creationTime: v.number(),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  church: v.optional(v.string()),
  roles: v.array(v.string()),
  camera: v.optional(v.string()),
  notes: v.optional(v.string()),
  submittedAt: v.number(),
  event: v.string(),
  contacted: v.optional(v.boolean()),
});

function clean(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return trimmed.slice(0, max);
}

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    church: v.optional(v.string()),
    roles: v.array(v.string()),
    camera: v.optional(v.string()),
    notes: v.optional(v.string()),
    event: v.optional(v.string()),
  },
  returns: v.id("eventVolunteers"),
  handler: async (ctx, args) => {
    const name = clean(args.name, LIMITS.name);
    const email = clean(args.email, LIMITS.email);
    if (!name) throw new Error("Name is required");
    // Deliberately permissive: enough to catch a typo, not a spec-complete
    // address parser. Rejecting valid-but-unusual addresses is the worse failure.
    if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      throw new Error("A valid email is required");
    }

    const roles = [...new Set(args.roles)]
      .filter((r): r is (typeof ROLES)[number] => (ROLES as readonly string[]).includes(r))
      .slice(0, ROLES.length);

    return await ctx.db.insert("eventVolunteers", {
      name,
      email,
      phone: clean(args.phone, LIMITS.phone),
      church: clean(args.church, LIMITS.church),
      roles,
      // Drop the camera answer unless media was actually selected, so an
      // unchecked-then-rechecked form cannot leave a stale answer behind.
      camera: roles.includes("media") ? clean(args.camera, LIMITS.camera) : undefined,
      notes: clean(args.notes, LIMITS.notes),
      event: clean(args.event, 60) ?? "hub-lawn-2026-09-13",
      submittedAt: Date.now(),
    });
  },
});

export const list = query({
  args: { event: v.optional(v.string()) },
  returns: v.array(VOLUNTEER_DOC),
  handler: async (ctx, args) => {
    if (args.event) {
      return await ctx.db
        .query("eventVolunteers")
        .withIndex("by_event", (q) => q.eq("event", args.event!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("eventVolunteers")
      .withIndex("by_submittedAt")
      .order("desc")
      .collect();
  },
});

// For clearing out spam or duplicates from an admin view.
export const remove = mutation({
  args: { id: v.id("eventVolunteers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const setContacted = mutation({
  args: { id: v.id("eventVolunteers"), contacted: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { contacted: args.contacted });
    return null;
  },
});
