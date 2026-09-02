import type { Metadata } from 'next';
import PracticeBoard from './PracticeBoard';

// Internal band page. It is not linked from anywhere on the site and it should
// not turn up in a search for the club or the event, so the noindex lives here
// rather than relying on obscurity.
export const metadata: Metadata = {
  title: 'Practice · HUB Lawn Sept 13',
  robots: { index: false, follow: false },
};

export default function PracticePage() {
  return <PracticeBoard />;
}
