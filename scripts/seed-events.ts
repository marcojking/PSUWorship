import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper: date string like "2026-08-30" → UTC timestamp
function d(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00.000Z').getTime();
}

const SEED_EVENTS = [
  {
    slug: 'first-worship-night',
    title: 'First Worship Night',
    subtitle: 'Early semester worship · Aug 30, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-08-30'),
    endDate: d('2026-08-30'),
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve space via 25Live at semester start',                                        due: 'Aug 24', order: 0 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set and confirm who is leading and playing',                           due: 'Aug 30', order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm sound/tech team availability',                                              due: 'Aug 30', order: 2 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Promote on Instagram — target returning students and new freshmen finding community', due: 'Aug 30', order: 3 },
      { tag: 'Media',     tagColor: 'purple', text: 'Capture Stories and a short highlight Reel — first worship content of the fall',    due: 'Aug 30', order: 4 },
    ],
  },
  {
    slug: 'pat-barrett-concert',
    title: 'Pat Barrett Concert',
    subtitle: 'Fall Kickoff — HUB Lawn · September 13, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-13'),
    endDate: d('2026-09-13'),
    location: 'HUB Lawn — Alumni Stage',
    schedule: [
      { time: '12:00 PM', desc: 'On-site setup begins — HUB Lawn' },
      { time: '7:00 PM',  desc: 'Doors open. Student band opening performance.' },
      { time: '7:30 PM',  desc: 'Pat Barrett — main performance' },
      { time: '9:00 PM',  desc: 'Post-concert community hang' },
      { time: '11:00 PM', desc: 'Strike and load-out complete' },
    ],
    upacRows: [
      { key: 'UPAC Submission Deadline',      val: 'July 17, 2026', urgent: true },
      { key: 'Contract Deadline',             val: 'August 28, 2026' },
      { key: 'All-Inclusive Artist Quote',    val: '$15,000' },
      { key: 'UPAC Covers (90%)',             val: '$13,500' },
      { key: 'PSU Worship Covers (10%)',      val: '$1,500 from Source 30' },
      { key: 'Annual Domestic Performer Cap', val: '$25,000 (UPAC payout, org-wide)' },
      { key: 'Remaining UPAC Performer Budget', val: '$11,500 for Caleb King' },
      { key: 'UPAC Cannot Fund',              val: 'Religious ceremonies, photographers' },
    ],
    upacNote: 'All-inclusive contracts strongly recommended — the $25K cap covers performer fee + their travel + lodging combined. If UPAC funds flights, book within 6 academic days of allocation notification or your org covers any price increase. Pat Barrett must not have performed at University Park in the last 12 months.',
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve HUB Lawn via 25Live',                                                              due: 'Now',      order: 0 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Complete RSO Event Consultation (REC) meeting with Student Affairs',                       due: 'Jun 2026', order: 1 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Meet with HUB Event Management at least 15 academic days before event',                    due: 'Aug 20',   order: 2 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm naming: "PSU Worship at Penn State" — no Penn State trademarks/shields without Licensing Office authorization', due: 'Jul 17', order: 3 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Frame application as "concert / performing arts event" — not a worship service',           due: 'Jul 17',   order: 4 },
      { tag: 'Artist',    tagColor: 'rust',   text: "Check if Pat Barrett performed at University Park in the last 12 months",                  due: 'Jul 17',   order: 5 },
      { tag: 'ASA',       tagColor: 'blue',   text: "Confirm Source 30 balance covers PSU Worship's $1,500 minimum share",                     due: 'Jul 17',   order: 6 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit UPAC funding application by July 17, 2026',                                         due: 'Jul 17',   order: 7 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Ask UPAC: can PA/audio gear purchased for this event be filed under Equipment budget ($5K annual cap)?', due: 'Jul 17', order: 8 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Finalize signed contract with Pat Barrett / management',                                   due: 'Aug 28',   order: 9 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Confirm all-inclusive flat-rate contract (fee + travel + lodging in one number)',          due: 'Aug 28',   order: 10 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'If UPAC funds flights: book within 6 academic days of allocation notice',                  due: 'On Alloc.', order: 11 },
      { tag: 'Artist',    tagColor: 'rust',   text: 'Confirm rider requirements (hospitality, tech, sound, backline)',                          due: 'Aug 28',   order: 12 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Coordinate tent and Alumni Stage setup with HUB',                                          due: 'Aug 28',   order: 13 },
      { tag: 'ASA',       tagColor: 'blue',   text: 'Issue ASA Purchase Order to Pat Barrett / management before payment',                      due: 'Aug 28',   order: 14 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Design event flyer with UPAC logo included',                                               due: 'Aug 31',   order: 15 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Launch Instagram promotion campaign (4,600+ followers)',                                   due: 'Aug 31',   order: 16 },
      { tag: 'Media',     tagColor: 'purple', text: 'Recruit dedicated video + photo team — minimum 2 cameras',                                 due: 'Aug 20',   order: 17 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Set up attendance tracking (QR codes or ID scans) for reconciliation',                     due: 'Sept 13',  order: 18 },
      { tag: 'Media',     tagColor: 'purple', text: 'Produce 60–90s highlight Reel within 7 days',                                              due: 'Sept 20',  order: 19 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit reconciliation within 40 academic days post-event',                                 due: '40d Post', order: 20 },
    ],
  },
  {
    slug: 'jesus-revolution-watch-party',
    title: 'Jesus Revolution Watch Party',
    subtitle: 'Thomas 100 · September 20, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-20'),
    endDate: d('2026-09-20'),
    location: 'Thomas Building 100',
    schedule: [
      { time: '6:30 PM', desc: 'Doors open — Thomas 100' },
      { time: '7:00 PM', desc: 'Film begins — Jesus Revolution' },
      { time: '9:00 PM', desc: 'Post-film discussion / hang' },
    ],
    upacRows: [
      { key: 'UPAC Food Budget (eff. July 1)', val: '$1,000 per event', urgent: true },
      { key: 'UPAC Food Submission Deadline',  val: 'July 24, 2026' },
      { key: 'Venue', val: 'Thomas 100 (AV built-in, free to book)' },
      { key: 'Performer / Film License Fee',   val: 'None — free event' },
    ],
    upacNote: 'UPAC is adding a $1,000/event food line item effective July 1, 2026. If food is planned, submit a UPAC request specifically for the food budget by July 24.',
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve Thomas 100 via 25Live for Sept 20 evening',                                    due: 'Now',     order: 0 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit UPAC food budget request (~$1,000) — new $1K/event policy effective July 1',    due: 'Jul 24',  order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Confirm AV setup — projection and sound system built into Thomas 100',                 due: 'Sept 14', order: 2 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Prepare post-film discussion questions or speaker',                                    due: 'Sept 14', order: 3 },
      { tag: 'Promo',     tagColor: 'green',  text: 'Promote on Instagram — target Christian students and general campus',                   due: 'Sept 15', order: 4 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Set up attendance tracking — required for UPAC reconciliation',                        due: 'Sept 20', order: 5 },
      { tag: 'UPAC',      tagColor: 'navy',   text: 'Submit reconciliation within 40 academic days post-event',                             due: '40d Post', order: 6 },
    ],
  },
  {
    slug: 'songwriting-workshop',
    title: 'Songwriting Workshop',
    subtitle: 'Songwriting Workshop · September 27, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-09-27'),
    endDate: d('2026-09-27'),
    checks: [],
  },
  {
    slug: 'fall-worship-night',
    title: 'Fall Worship Night',
    subtitle: 'Indoor worship · October 4, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-10-04'),
    endDate: d('2026-10-04'),
    schedule: [
      { time: '7:00 PM', desc: 'Doors open' },
      { time: '7:30 PM', desc: 'Worship set begins' },
      { time: '9:00 PM', desc: 'Close + community hang' },
    ],
    checks: [
      { tag: 'Venue',     tagColor: 'gold',   text: 'Decide on indoor venue — HUB Alumni Hall, Eisenhower, or Pasquerilla Spiritual Center', due: 'ASAP',    order: 0 },
      { tag: 'Venue',     tagColor: 'gold',   text: 'Reserve venue via 25Live once decided',                                                  due: 'ASAP',    order: 1 },
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set and confirm band lineup',                                               due: 'Sept 14', order: 2 },
    ],
  },
  {
    slug: 'open-mic-night',
    title: 'Open Mic Night',
    subtitle: 'Open Mic Night · October 18, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-10-18'),
    endDate: d('2026-10-18'),
    checks: [],
  },
  {
    slug: 'caleb-king',
    title: 'Caleb King',
    subtitle: 'Songwriting Workshop + Concert · Oct 30 – Nov 2, 2026',
    status: 'planning' as const,
    color: 'rust' as const,
    startDate: d('2026-10-30'),
    endDate: d('2026-11-02'),
    days: [
      { date: d('2026-10-30'), description: 'Songwriting workshop day 1' },
      { date: d('2026-10-31'), description: 'Songwriting workshop day 2' },
      { date: d('2026-11-01'), description: 'Main Concert / Worship Night (7–9:30 PM)' },
      { date: d('2026-11-02'), description: 'Wrap and debrief' },
    ],
    schedule: [
      { time: 'Fri Oct 30 · TBD',          desc: 'Songwriting workshop begins' },
      { time: 'Sat Oct 31 · TBD',          desc: 'Songwriting workshop day 2' },
      { time: 'Sun Nov 1 · 7–9:30 PM',     desc: 'Main Worship Night / Concert' },
    ],
    checks: [],
  },
  {
    slug: 'nashville-trip',
    title: 'Nashville Trip',
    subtitle: 'Industry trip · Nov 20–23, 2026',
    status: 'planning' as const,
    color: 'blue' as const,
    startDate: d('2026-11-20'),
    endDate: d('2026-11-23'),
    days: [
      { date: d('2026-11-20'), description: 'Depart for Nashville' },
      { date: d('2026-11-21'), description: 'Studio visits and industry meetings' },
      { date: d('2026-11-22'), description: 'Professional worship environment visits' },
      { date: d('2026-11-23'), description: 'Return to State College' },
    ],
    checks: [
      { tag: 'Industry', tagColor: 'rust',   text: 'Plan professional worship environment visits', due: 'Nov 1',  order: 0 },
      { tag: 'Media',    tagColor: 'purple', text: 'Assign team member to document the trip — studio visits, city footage, candid team moments', due: 'Nov 15', order: 1 },
    ],
  },
  {
    slug: 'pre-finals-worship',
    title: 'Pre-Finals Worship Night',
    subtitle: 'Worship before finals week · Dec 12, 2026',
    status: 'planning' as const,
    color: 'navy' as const,
    startDate: d('2026-12-12'),
    endDate: d('2026-12-12'),
    checks: [
      { tag: 'Logistics', tagColor: 'muted',  text: 'Plan worship set — songs that fit end-of-semester exhaustion and encouragement', due: 'Nov 30', order: 0 },
    ],
  },
];

async function main() {
  console.log('Seeding events...');
  for (const ev of SEED_EVENTS) {
    const existing = await client.query(api.events.getBySlug, { slug: ev.slug });
    if (existing !== null) {
      console.log(`  - skip ${ev.title} (already seeded)`);
      continue;
    }
    const { checks, ...eventFields } = ev;
    const slug = await client.mutation(api.events.create, {
      title: eventFields.title,
      startDate: eventFields.startDate,
    });
    const created = await client.query(api.events.getBySlug, { slug });
    if (!created) throw new Error(`Created event not found by slug: ${slug}`);
    const eventId = created._id;
    // Patch remaining fields
    await client.mutation(api.events.update, {
      id: eventId,
      subtitle: eventFields.subtitle,
      location: (eventFields as any).location,
      status: eventFields.status,
      color: eventFields.color,
      endDate: eventFields.endDate,
      days: (eventFields as any).days,
      schedule: (eventFields as any).schedule,
      upacRows: (eventFields as any).upacRows,
      upacNote: (eventFields as any).upacNote,
    });
    for (const check of checks) {
      await client.mutation(api.eventChecks.create, { eventId, ...check });
    }
    console.log(`  ✓ ${ev.title}`);
  }
  console.log('Done.');
}

main().catch(console.error);
