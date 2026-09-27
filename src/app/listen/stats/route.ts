/* wmaac.org/listen/stats: where /listen visitors came from and where they went.
   Unlisted rather than behind a login, like /sept13/stats. It shows counts for
   a public page and nothing personal. */
import { listenStats } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export function GET(): Promise<Response> {
  return listenStats();
}
