import type { Metadata, Viewport } from 'next';
import PracticeBoard from './PracticeBoard';

// Internal band page. It is not linked from anywhere on the site and it should
// not turn up in a search for the club or the event, so the noindex lives here
// rather than relying on obscurity.
export const metadata: Metadata = {
  title: 'Practice · HUB Lawn Sept 13',
  robots: { index: false, follow: false },
};

// The root layout disables pinch-zoom site-wide, which is right for the app-like
// pages but wrong here: this is a chord chart read off a phone outdoors, in
// sunlight, at arm's length on a music stand. Being able to zoom in on one line
// is the whole point. Overridden for this route only.
export const viewport: Viewport = {
  maximumScale: 5,
  userScalable: true,
};

export default function PracticePage() {
  return <PracticeBoard />;
}
