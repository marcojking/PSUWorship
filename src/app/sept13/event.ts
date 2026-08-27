/* Shared between the event page and /sept13/cal, which has to build the same
   Google Calendar URL and classify the same user agents. Two copies of either
   would drift, and the one that drifted would be the counter. */

// Google Calendar expects UTC. Sept 13 2026 is EDT (UTC-4), so 6:30 PM ET = 22:30Z.
export const GCAL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("The Figs — Live on HUB Lawn") +
  "&dates=20260913T223000Z/20260914T023000Z" +
  "&location=" + encodeURIComponent("HUB Lawn, Penn State, University Park, PA") +
  "&details=" + encodeURIComponent("Free and open to everyone. wmaac.org/sept13");

/* Link-preview fetchers. iMessage, Slack and the rest hit a URL the moment it
   is pasted, so without this every share would look like a click. */
const BOT_UA =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|whatsapp|telegram|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|skypeuripreview|applebot|googlebot|bingbot|headless/i

export const isBot = (ua: string | null): boolean => BOT_UA.test(ua ?? "");
