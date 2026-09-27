/* wmaac.org/listen/go/<service>: counts a tap, then sends the person on.
   A redirect rather than a click beacon, like /sept13/cal: content blockers,
   long-press and open-in-new-tab all skip a beacon, but every one of them
   still has to come through here to find out where it's going. */
import { listenGo } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ service: string }> }): Promise<Response> {
  const { service } = await ctx.params;
  return listenGo(request, service);
}
