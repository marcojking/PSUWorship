/* wmaac.org/listen/<tag>: the same page, tagged with where the link was posted,
   e.g. gentleandlowlyband.com/listen/ig in the Instagram bio. The tags are TAG_INFO in
   src/lib/listen/catalog.ts. An unknown tag still shows the page. */
import { listenPage } from "@/lib/listen/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ tag: string }> }): Promise<Response> {
  const { tag } = await ctx.params;
  return listenPage(request, tag);
}
