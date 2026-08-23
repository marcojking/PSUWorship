import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Case-sensitive redirect for the old capitalised /Sept13 routes.
 *
 * The Sept 13 folder was renamed to lowercase because /sept13 is printed on the
 * promo cards and Vercel builds on case-sensitive Linux. The UNITUS sponsorship
 * link was already shared as /Sept13/Unitus, so it has to keep resolving.
 *
 * This CANNOT be done with redirects() in next.config: those match sources
 * case-insensitively, so a "/Sept13" rule also catches "/sept13" and redirects
 * it to itself forever — an infinite loop on the exact URL we are printing.
 * Middleware sees the raw pathname, so the comparison below is genuinely
 * case-sensitive and lowercase requests fall straight through untouched.
 */

const OLD = "/Sept13";
const NEW = "/sept13";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Exact case match only. "/sept13" fails this and falls through to next().
  if (pathname === OLD || pathname.startsWith(OLD + "/")) {
    const url = req.nextUrl.clone();
    url.pathname = NEW + pathname.slice(OLD.length);
    // 307, not 308: a permanent redirect gets cached in browsers indefinitely
    // and this path may be wanted back later.
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

// The matcher itself is case-insensitive, so lowercase requests still enter the
// middleware; the check above is what actually decides. Kept narrow so no other
// route on the site pays for this.
export const config = {
  matcher: ["/Sept13", "/Sept13/:path*"],
};
