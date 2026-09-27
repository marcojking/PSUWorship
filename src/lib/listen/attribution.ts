/* Where a visit to /listen came from, and whether it was a person.
 *
 * A tag we handed out wins. Without one, the in-app browser usually gives it
 * away (Instagram, Facebook, TikTok and Snapchat all stamp their user agent),
 * and failing that the referrer might. Whatever is left is "direct".
 *
 * Pure, with relative imports only: the page, the click redirect, the Convex
 * mutation and the tests all call these same functions. */

import { OWN_HOSTS, isSource, isTag } from "./catalog";

export interface Attribution {
  source: string;
  /** True when the source is a tag we gave out, false when it was guessed. */
  tagged: boolean;
}

/* Link-preview fetchers. iMessage, Slack and the rest fetch a URL the moment it
   is pasted, so without this every share would count as a visit. Same list as
   /sept13 (src/app/sept13/event.ts); copied so this module stands alone. */
const BOT_UA =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|whatsapp|telegram|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|skypeuripreview|applebot|googlebot|bingbot|headless/i;

export const isBot = (ua: string | null | undefined): boolean => BOT_UA.test(ua ?? "");

/* Facebook's and Instagram's in-app browsers can fetch a link before it is
   tapped (X-Purpose: preview), and browsers mark speculative loads with
   Sec-Purpose or Purpose: prefetch. None of those is a person arriving. */
export function isPrefetch(headers: { get(name: string): string | null }): boolean {
  return ["sec-purpose", "purpose", "x-purpose", "x-moz"].some((h) => /prefetch|preview/i.test(headers.get(h) ?? ""));
}

/* Checked in order. Instagram's user agent is Safari plus "Instagram", so it
   goes first, before Facebook's markers get a chance to claim it. */
const IN_APP: readonly (readonly [RegExp, string])[] = [
  [/\bInstagram\b/i, "ig"],
  [/FBAN|FBAV|FB_IAB|FBIOS/, "fb"],
  [/musical_ly|BytedanceWebview|\bTikTok\b|trill_/i, "tt"],
  [/Snapchat/i, "snap"],
];

const REFERRERS: readonly (readonly [RegExp, string])[] = [
  [/(^|\.)instagram\.com$/, "ig"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "fb"],
  [/(^|\.)tiktok\.com$/, "tt"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "yt"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)snapchat\.com$/, "snap"],
  [/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/, "search"],
];

function hostOf(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveSource(input: {
  tag?: string | null;
  ua?: string | null;
  referer?: string | null;
}): Attribution {
  const tag = (input.tag ?? "").trim().toLowerCase();
  if (isTag(tag)) return { source: tag, tagged: true };

  const ua = input.ua ?? "";
  for (const [re, source] of IN_APP) if (re.test(ua)) return { source, tagged: false };

  const host = hostOf(input.referer);
  if (host) {
    if (OWN_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
      return { source: "web", tagged: false };
    }
    for (const [re, source] of REFERRERS) if (re.test(host)) return { source, tagged: false };
  }
  return { source: "direct", tagged: false };
}

/* The click redirect's ?p= and ?t=, which the page writes. Checked again
   rather than trusted, because anyone can type a URL. */
export function clickAttribution(p: string | null, t: string | null): Attribution {
  const source = p !== null && isSource(p) ? p : "direct";
  return { source, tagged: t === "1" && isTag(source) };
}
