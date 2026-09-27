/* Request handling for /listen, shared by its route files. */

import { after } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { clickAttribution, isBot, isPrefetch, resolveSource } from "./attribution";
import { ARTIST, serviceByKey } from "./catalog";
import { renderListenPage, renderStats, renderStatsMessage } from "./render";

type ListenEvent = {
  kind: "visit" | "click";
  source: string;
  service?: string;
  tagged: boolean;
  bot: boolean;
};

/* Written after the response has gone out. after() keeps the function alive
   until the write finishes, where an un-awaited promise can be frozen mid-flight
   and lost. Any failure costs one count, never the page or the redirect. */
function record(event: ListenEvent): void {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return;
  after(async () => {
    try {
      await new ConvexHttpClient(url).mutation(api.listen.log, event);
    } catch {
      /* lose the count, keep the page */
    }
  });
}

/* no-store on everything: a response served from any cache is a visit nobody
   counted, and the totals would flatten into something that looks like real data. */
const HTML = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

export function listenPage(request: Request, tag: string | null): Response {
  const ua = request.headers.get("user-agent");
  const a = resolveSource({ tag, ua, referer: request.headers.get("referer") });
  if (request.method === "GET") {
    record({ kind: "visit", source: a.source, tagged: a.tagged, bot: isBot(ua) || isPrefetch(request.headers) });
  }
  return new Response(renderListenPage(a), { headers: HTML });
}

export function listenGo(request: Request, key: string): Response {
  const service = serviceByKey(key);
  if (!service) {
    return new Response(null, {
      status: 302,
      headers: { Location: new URL(ARTIST.path, request.url).toString(), "Cache-Control": "no-store" },
    });
  }
  const q = new URL(request.url).searchParams;
  const a = clickAttribution(q.get("p"), q.get("t"));
  if (request.method === "GET") {
    record({
      kind: "click",
      source: a.source,
      service: service.key,
      tagged: a.tagged,
      bot: isBot(request.headers.get("user-agent")) || isPrefetch(request.headers),
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: service.url, "Cache-Control": "no-store" },
  });
}

export async function listenStats(): Promise<Response> {
  const headers = { ...HTML, "X-Robots-Tag": "noindex, nofollow" };
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return new Response(renderStatsMessage("Listen page", "Not configured."), { status: 503, headers });
  }
  try {
    const s = await new ConvexHttpClient(url).query(api.listen.summary, {});
    return new Response(renderStats(s), { headers });
  } catch {
    return new Response(renderStatsMessage("Listen page", "Could not reach the database. Try again."), {
      status: 502,
      headers,
    });
  }
}
