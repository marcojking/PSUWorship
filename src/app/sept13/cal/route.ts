/* wmaac.org/sept13/cal — counts an "Add to Calendar" click, then sends the
   person on to Google Calendar.
 *
 * A redirect rather than a click handler on the button. The page ships no
 * JavaScript, an onclick beacon is dropped by content blockers and by anyone
 * long-pressing to open in a new tab, and a click that fails to log is
 * invisible. A redirect cannot be missed: the browser has to come here to find
 * out where it is going.
 *
 * Logged as its own source, 'cal', which is deliberately NOT a page visit —
 * /sept13/stats subtracts it from the visit total and shows it on its own,
 * because someone adding the date to their calendar is a different and much
 * stronger signal than someone loading the page.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { GCAL, isBot } from "../event";

export async function GET(request: Request): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (url) {
    try {
      /* Awaited, not fire-and-forget: the function can be frozen the moment the
         response is returned, which would drop the write. It is one round trip
         to the same region, and a redirect the user never sees is the cheapest
         place in the app to spend it. */
      await new ConvexHttpClient(url).mutation(api.posterScans.log, {
        poster: "cal",
        bot: isBot(request.headers.get("user-agent")),
      });
    } catch {
      /* Never let the counter break the button. If Convex is unreachable the
         person still gets their calendar entry; we just lose one tally. */
    }
  }
  return Response.redirect(GCAL, 302);
}
