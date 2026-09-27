/* Everything on wmaac.org/listen that belongs to gentle & lowly rather than to
 * the page itself: the artist, where to listen, the tags we hand out, the
 * colours. attribution.ts, summary.ts, render.ts and respond.ts are identical
 * on marcoking.com; this is the only file that differs.
 *
 * The page's public address is gentleandlowlyband.com/listen (Marco, 9/27).
 * That static site passes /listen and /listen-art through to this app with
 * Vercel rewrites, so the page and its counts still live here, and the older
 * www.wmaac.org/listen links keep working and counting too.
 *
 * Links checked 2026-09-26: each one loads and belongs to the band (matched by
 * release UPC where the service shows one). Pandora, SoundCloud, Audiomack and
 * Bandcamp don't carry the band, so they aren't listed.
 *
 * Follow links: @gentleandlowlyband on Instagram is the account every HUB Lawn
 * post was scheduled from, and its page names "Gentle and Lowly Band" (fetched
 * 2026-09-27). YouTube @gentleandlowlyband is the channel the band's Shorts are
 * scheduled on. TikTok @gentleandlowlyband is the account connected to Buffer
 * on 2026-09-26 (the profile page itself wasn't loaded when this was written). */

export interface Service {
  /** In the /listen/go/<key> URL and in stored events. Never rename one: old rows keep the old key. */
  key: string;
  label: string;
  url: string;
  /** stream: full-width button. more: the smaller two-column grid. follow: the icon row. */
  kind: "stream" | "more" | "follow";
  /** A key of ICONS in icons.ts. */
  icon: string;
}

export const ARTIST = {
  name: "gentle & lowly",
  nameHtml: 'gentle <span class="amp">&amp;</span> lowly',
  line: "Student-written worship from Penn State",
  featured: { title: "peace like a river", note: "Out now", art: "/listen-art/gl-plar-v1.jpg" },
  title: "gentle & lowly | Listen",
  description: "Listen to gentle & lowly on Spotify, Apple Music and wherever else you listen.",
  siteName: "Worship Music & Arts at Penn State",
  footer: "A Worship Music & Arts project at Penn State",
  footerHref: "https://www.wmaac.org",
  origin: "https://gentleandlowlyband.com",
  path: "/listen",
  og: "/listen-art/og-gl-v1.png",
  icon: "/listen-art/gl-icon-v1.png",
} as const;

export const SERVICES: readonly Service[] = [
  { key: "spotify", label: "Spotify", kind: "stream", icon: "spotify", url: "https://open.spotify.com/artist/2rE4LSwX4hBzbu424HqILy" },
  { key: "apple", label: "Apple Music", kind: "stream", icon: "applemusic", url: "https://music.apple.com/us/artist/gentle-lowly/1896290978" },
  { key: "ytmusic", label: "YouTube Music", kind: "stream", icon: "youtubemusic", url: "https://music.youtube.com/channel/UCMqjHqS48Nw0y_QVN7KyG9A" },
  { key: "amazon", label: "Amazon Music", kind: "stream", icon: "note", url: "https://music.amazon.com/artists/B0GZK571MD/gentle-lowly" },
  { key: "tidal", label: "Tidal", kind: "more", icon: "tidal", url: "https://tidal.com/artist/79055215" },
  { key: "deezer", label: "Deezer", kind: "more", icon: "deezer", url: "https://www.deezer.com/artist/389181691" },
  { key: "iheart", label: "iHeartRadio", kind: "more", icon: "iheartradio", url: "https://www.iheart.com/artist/gentle-lowly-50635777/" },
  { key: "instagram", label: "Instagram", kind: "follow", icon: "instagram", url: "https://www.instagram.com/gentleandlowlyband/" },
  { key: "youtube", label: "YouTube", kind: "follow", icon: "youtube", url: "https://www.youtube.com/@gentleandlowlyband" },
  { key: "tiktok", label: "TikTok", kind: "follow", icon: "tiktok", url: "https://www.tiktok.com/@gentleandlowlyband" },
];

/** Tags we hand out, each for one place a link gets posted: gentleandlowlyband.com/listen/<tag>. */
export const TAG_INFO: Record<string, string> = {
  ig: "Band Instagram bio (@gentleandlowlyband)",
  wma: "Club Instagram bio (@wma.pennstate)",
  story: "Instagram story link sticker",
  tt: "TikTok bio",
  yt: "YouTube channel links and video descriptions",
  fb: "Facebook",
  qr: "QR code on a slide, flyer or card",
  email: "Emails",
  text: "Texts and group chats",
  web: "Links on gentleandlowlyband.com or wmaac.org",
};
export const TAGS: readonly string[] = Object.keys(TAG_INFO);

/** Sources attribution.ts can guess when there's no tag. */
export const GUESSES: readonly string[] = ["ig", "fb", "tt", "yt", "snap", "x", "search", "web", "direct"];

export const SOURCES: readonly string[] = [...new Set([...TAGS, ...GUESSES])];

export const SOURCE_LABELS: Record<string, string> = {
  ig: "Instagram",
  wma: "Instagram (@wma.pennstate)",
  story: "Instagram story",
  tt: "TikTok",
  yt: "YouTube",
  fb: "Facebook",
  qr: "QR code",
  email: "Email",
  text: "Texts",
  web: "Our websites",
  snap: "Snapchat",
  x: "X",
  search: "Search",
  direct: "Direct",
};

/** A referrer from one of these (or a subdomain) is counted as "web". */
export const OWN_HOSTS: readonly string[] = ["wmaac.org", "gentleandlowlyband.com"];

/* gentleandlowlyband.com's own tokens (css/, 2026-09): espresso, cream, amber. */
export const THEME = {
  bg: "#1a1714",
  card: "#242019",
  line: "#3a3228",
  ink: "#f5ead6",
  ink2: "rgba(245, 234, 214, 0.68)",
  ink3: "rgba(245, 234, 214, 0.5)",
  accent: "#c4793a",
  display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  body: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  label: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Source+Sans+3:wght@300;400;600&display=swap",
  extraCss: "",
} as const;

/* hasOwnProperty, not Object.hasOwn: convex/ typechecks against ES2021. */
export const isTag = (t: string): boolean => Object.prototype.hasOwnProperty.call(TAG_INFO, t);
export const isSource = (s: string): boolean => SOURCES.includes(s);
export const serviceByKey = (k: string): Service | undefined => SERVICES.find((s) => s.key === k);
