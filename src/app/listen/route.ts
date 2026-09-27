/* wmaac.org/listen: every place to hear gentle & lowly, in the one link that
   goes in bios and posts. The code is in src/lib/listen/, and the design is in
   docs/superpowers/specs/2026-09-26-listen-pages-design.md. */
import { listenPage } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return listenPage(request, new URL(request.url).searchParams.get("p"));
}
