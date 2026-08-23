import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

/* Public endpoint behind the volunteer form on /sept13.
 *
 * The form is meant to be forwarded around churches and campus ministries, so
 * this is unauthenticated by design. The Convex mutation does the real
 * validation (length caps, allow-listed roles); this layer exists to keep the
 * Convex URL off the client, reject obvious junk early, and return a friendly
 * message instead of a raw mutation error.
 */

const MAX_BODY = 8 * 1024; // a legitimate sign-up is well under 1 KB

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : undefined);

  // Honeypot: a hidden field real people never fill in. Bots fill everything.
  // Return 200 so the bot believes it succeeded and does not retry or adapt.
  if (str("website")) {
    return NextResponse.json({ ok: true });
  }

  const name = str("name")?.trim();
  const email = str("email")?.trim();
  if (!name || !email) {
    return NextResponse.json(
      { error: "Please include your name and email." },
      { status: 400 },
    );
  }

  const roles = Array.isArray(b.roles)
    ? (b.roles as unknown[]).filter((r): r is string => typeof r === "string")
    : [];

  try {
    await getConvex().mutation(api.eventVolunteers.submit, {
      name,
      email,
      phone: str("phone"),
      church: str("church"),
      roles,
      camera: str("camera"),
      notes: str("notes"),
      event: "hub-lawn-2026-09-13",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Convex wraps thrown errors with a request id, "Server Error", and a stack
    // trace pointing at the .ts file. Never let that reach a visitor: pull out
    // just the message we threw, and only if it is one of our own validation
    // messages. Anything else is our bug, not something they can act on.
    const message = err instanceof Error ? err.message : "";
    const thrown = message.match(/Uncaught Error:\s*([^\n]+)/)?.[1]?.trim() ?? "";
    const isOurs = /required/i.test(thrown);
    if (!isOurs) console.error("[volunteer] unexpected Convex error:", message);
    return NextResponse.json(
      { error: isOurs ? thrown : "Something went wrong on our end. Please try again." },
      { status: 400 },
    );
  }
}
