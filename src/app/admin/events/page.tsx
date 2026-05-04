'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../convex/_generated/api';
import { EventCard } from '@/components/admin/EventCard';

// ── Types ──────────────────────────────────────────────────────────────────

type MonthGroup = { monthName: string; monthKey: string; weeks: Date[][] };

// ── Calendar types & data ──────────────────────────────────────────────────

type CalEventType = 'worship' | 'football' | 'break' | 'holiday' | 'academic' | 'finals' | 'deadline' | 'social' | 'release';
type CalEvent = { label: string; type: string; eventId?: string };

const MONTH_NAMES: Record<number, string> = {
  3: 'April', 4: 'May', 5: 'June', 6: 'July', 7: 'August', 8: 'September', 9: 'October', 10: 'November', 11: 'December',
};

const CAL: Record<string, CalEvent[]> = {
  '2026-05-04': [{ label: 'Finals', type: 'finals' }],
  '2026-05-05': [{ label: 'Finals', type: 'finals' }],
  '2026-05-06': [{ label: 'Finals', type: 'finals' }],
  '2026-05-07': [{ label: 'Finals', type: 'finals' }],
  '2026-05-08': [{ label: 'Finals', type: 'finals' }, { label: 'Single 1 Drops', type: 'release' }],
  '2026-05-12': [{ label: 'Acoustic Push', type: 'social' }],
  '2026-05-19': [{ label: 'Acoustic Push', type: 'social' }],
  '2026-05-26': [{ label: 'EP Announce', type: 'social' }],
  '2026-06-05': [{ label: 'EP Drops', type: 'release' }],
  '2026-07-17': [{ label: 'UPAC Due: Pat Barrett', type: 'deadline' }],
  '2026-07-24': [{ label: 'UPAC Food: Jesus Rev', type: 'deadline' }],
  '2026-08-24': [{ label: 'Semester Begins', type: 'academic' }],
  '2026-08-28': [{ label: 'Contract: Pat Barrett', type: 'deadline' }],
  '2026-08-31': [{ label: 'Promo: Pat Barrett', type: 'social' }],
  '2026-09-04': [{ label: 'UPAC Due: Caleb King', type: 'deadline' }],
  '2026-09-05': [{ label: 'vs. Marshall', type: 'football' }],
  '2026-09-07': [{ label: 'Labor Day', type: 'holiday' }],
  '2026-09-15': [{ label: 'Promo: Jesus Rev', type: 'social' }],
  '2026-09-19': [{ label: 'vs. Buffalo', type: 'football' }, { label: 'Promo: Caleb King', type: 'social' }],
  '2026-09-21': [{ label: 'Promo: Worship Night', type: 'social' }],
  '2026-09-26': [{ label: 'vs. Wisconsin', type: 'football' }],
  '2026-09-28': [{ label: 'UPAC Due: Nashville', type: 'deadline' }],
  '2026-10-10': [{ label: 'vs. USC', type: 'football' }],
  '2026-10-19': [{ label: 'Contract: Caleb King', type: 'deadline' }],
  '2026-10-25': [{ label: 'Chosen Songs Announced', type: 'social' }],
  '2026-10-31': [{ label: 'vs. Purdue', type: 'football' }],
  '2026-11-03': [{ label: 'Demos Begin', type: 'release' }],
  '2026-11-09': [{ label: 'Contract: Nashville', type: 'deadline' }],
  '2026-11-14': [{ label: 'vs. Minnesota', type: 'football' }],
  '2026-11-15': [{ label: 'Demos End', type: 'release' }],
  '2026-11-21': [{ label: 'vs. Rutgers', type: 'football' }],
  '2026-11-22': [{ label: 'Break Begins', type: 'break' }],
  '2026-11-23': [{ label: 'Thanksgiving Break', type: 'break' }],
  '2026-11-24': [{ label: 'Thanksgiving Break', type: 'break' }],
  '2026-11-25': [{ label: 'Thanksgiving Break', type: 'break' }],
  '2026-11-26': [{ label: 'Thanksgiving', type: 'holiday' }],
  '2026-11-27': [{ label: 'Thanksgiving Break', type: 'break' }],
  '2026-11-28': [{ label: 'Thanksgiving Break', type: 'break' }, { label: 'Recording Week', type: 'release' }],
  '2026-11-29': [{ label: 'Recording Week', type: 'release' }],
  '2026-11-30': [{ label: 'Recording Week', type: 'release' }],
  '2026-12-01': [{ label: 'Recording Week', type: 'release' }],
  '2026-12-02': [{ label: 'Recording Week', type: 'release' }],
  '2026-12-03': [{ label: 'Mix & Master', type: 'release' }],
  '2026-12-04': [{ label: 'Cabin Shoot', type: 'release' }],
  '2026-12-05': [{ label: 'Cabin Shoot', type: 'release' }],
  '2026-12-06': [{ label: 'Cabin Shoot', type: 'release' }],
  '2026-12-11': [{ label: 'Last Day', type: 'academic' }],
  '2026-12-14': [{ label: 'Finals', type: 'finals' }],
  '2026-12-15': [{ label: 'Finals', type: 'finals' }],
  '2026-12-16': [{ label: 'Finals', type: 'finals' }],
  '2026-12-17': [{ label: 'Finals', type: 'finals' }],
  '2026-12-18': [{ label: 'Finals', type: 'finals' }],
};

const CELL_TINT: Record<string, string> = {
  '2026-11-22': 'rgba(196,145,58,0.07)', '2026-11-23': 'rgba(196,145,58,0.07)',
  '2026-11-24': 'rgba(196,145,58,0.07)', '2026-11-25': 'rgba(196,145,58,0.07)',
  '2026-11-26': 'rgba(196,145,58,0.07)', '2026-11-27': 'rgba(196,145,58,0.07)',
  '2026-11-28': 'rgba(196,145,58,0.07)', '2026-11-29': 'rgba(196,145,58,0.07)',
  '2026-05-04': 'rgba(180,87,65,0.07)', '2026-05-05': 'rgba(180,87,65,0.07)',
  '2026-05-06': 'rgba(180,87,65,0.07)', '2026-05-07': 'rgba(180,87,65,0.07)',
  '2026-05-08': 'rgba(180,87,65,0.07)',
  '2026-12-14': 'rgba(180,87,65,0.07)', '2026-12-15': 'rgba(180,87,65,0.07)',
  '2026-12-16': 'rgba(180,87,65,0.07)', '2026-12-17': 'rgba(180,87,65,0.07)',
  '2026-12-18': 'rgba(180,87,65,0.07)',
};

const EV_STYLE: Record<string, { bg: string; text: string; border?: string; pill: boolean }> = {
  worship:  { bg: '#003049',                     text: '#fff7eb',               pill: true  },
  football: { bg: 'rgba(127,160,175,0.18)',      text: '#2a5869', border: 'rgba(127,160,175,0.35)', pill: true },
  break:    { bg: 'transparent',                 text: 'rgba(139,92,32,0.75)', pill: false },
  holiday:  { bg: 'transparent',                 text: 'rgba(139,92,32,0.85)', pill: false },
  academic: { bg: 'transparent',                 text: 'rgba(0,48,73,0.55)',   pill: false },
  finals:   { bg: 'transparent',                 text: 'rgba(180,87,65,0.8)', pill: false },
  deadline: { bg: 'rgba(180,87,65,0.18)',        text: '#b45741', border: 'rgba(180,87,65,0.3)', pill: true },
  social:   { bg: 'rgba(80,140,80,0.15)',        text: '#2a6a2a', border: 'rgba(80,140,80,0.3)', pill: true },
  release:  { bg: 'rgba(196,145,58,0.25)',       text: '#7a5010', border: 'rgba(196,145,58,0.5)', pill: true },
};

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildCalendar(): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const cur = new Date(2026, 3, 27); // Week of April 27 — first week showing May release arc
  const end = new Date(2026, 11, 21);
  let currentMonthIdx = -1;
  let currentGroup: MonthGroup | null = null;
  while (cur < end) {
    const week: Date[] = [];
    const weekMonday = new Date(cur);
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    const m = weekMonday.getMonth();
    if (m !== currentMonthIdx) {
      currentMonthIdx = m;
      currentGroup = { monthName: MONTH_NAMES[m] ?? '', monthKey: `2026-${String(m).padStart(2,'0')}`, weeks: [] };
      groups.push(currentGroup);
    }
    currentGroup!.weeks.push(week);
  }
  return groups;
}

const MONTH_GROUPS = buildCalendar();

// ── Page ───────────────────────────────────────────────────────────────────

export default function EventsAdminPage() {
  const router = useRouter();
  const createEvent = useMutation(api.events.create);
  const convexEvents = useQuery(api.events.list) ?? [];

  // Merge Convex events into the calendar
  const mergedCal = useMemo(() => {
    const cal: Record<string, CalEvent[]> = { ...CAL };
    for (const ev of convexEvents) {
      let cur = ev.startDate;
      while (cur <= ev.endDate) {
        const key = new Date(cur).toISOString().slice(0, 10);
        cal[key] = [...(cal[key] ?? []), { label: ev.title, type: 'worship', eventId: ev.slug }];
        cur += 86400000;
      }
    }
    return cal;
  }, [convexEvents]);

  // Quick-add form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setAdding(true);
    try {
      const slug = await createEvent({
        title: newTitle.trim(),
        startDate: new Date(newDate + 'T00:00:00.000Z').getTime(),
      });
      setNewTitle('');
      setNewDate('');
      router.push(`/admin/event/${slug}`);
    } catch (err) {
      alert(`Failed to create event: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="admin-page min-h-screen px-6 py-12 max-w-4xl mx-auto" style={{ background: '#fff7eb' }}>

      {/* Header */}
      <div className="mb-4">
        <a href="/admin" className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(180,87,65,0.7)', textDecoration: 'none' }}>
          ← Admin
        </a>
      </div>
      <div className="mb-10">
        <p className="text-[0.6rem] font-semibold tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(180,87,65,0.7)' }}>
          WM&A — Internal Planning
        </p>
        <h1 className="font-cormorant font-semibold text-4xl" style={{ color: '#003049' }}>
          Fall 2026 Events
        </h1>
        <p className="mt-1 text-sm font-light" style={{ color: 'rgba(0,48,73,0.5)' }}>
          Master plan · Aug 24 – Dec 18, 2026
        </p>
      </div>

      {/* ── Semester Calendar ── */}
      <SemesterCalendar
        cal={mergedCal}
        onWorshipClick={(slug) => router.push(`/admin/event/${slug}`)}
      />

      {/* Event List */}
      <div className="mt-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-lg font-semibold text-[#003049] mb-4">All Events</h2>
        {convexEvents.length === 0 ? (
          <p className="text-sm text-[rgba(0,48,73,0.5)]">No events yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {convexEvents.map(ev => (
              <EventCard
                key={ev._id}
                slug={ev.slug}
                title={ev.title}
                subtitle={ev.subtitle}
                location={ev.location}
                status={ev.status}
                color={ev.color}
                startDate={ev.startDate}
                endDate={ev.endDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className="mt-10 px-4 max-w-5xl mx-auto pb-16">
        <h2 className="text-lg font-semibold text-[#003049] mb-3">Add Event</h2>
        <form onSubmit={handleAddEvent} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[rgba(0,48,73,0.6)]">Title</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Event title"
              required
              className="border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 text-sm outline-none focus:border-[#003049] w-64"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[rgba(0,48,73,0.6)]">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              required
              style={{ colorScheme: 'light' }}
              className="border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 text-sm outline-none focus:border-[#003049]"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-[#003049] text-[#fff7eb] px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {adding ? 'Creating…' : 'Create Event →'}
          </button>
        </form>
      </div>

      {/* ── UPAC framing note ── */}
      <div className="rounded-xl p-4 mt-10 text-sm font-light leading-relaxed"
        style={{ background: 'rgba(180,87,65,0.07)', borderLeft: '3px solid rgba(180,87,65,0.4)', color: '#003049' }}>
        <span className="font-semibold" style={{ color: '#b45741' }}>UPAC framing note: </span>
        UPAC does not fund "religious ceremonies or worship services." All applications must be framed as concerts, performing arts events, or arts programming. Work with your faculty mentor before submitting.
        <span className="block mt-2 font-light" style={{ color: 'rgba(0,48,73,0.55)' }}>
          <span className="font-semibold" style={{ color: '#b45741' }}>New July 1, 2026: </span>
          UPAC is adding a $1,000/event food budget line item. File food requests separately from performer/program requests.
        </span>
      </div>
    </div>
  );
}

// ── Semester Calendar component ────────────────────────────────────────────

function SemesterCalendar({ cal, onWorshipClick }: {
  cal: Record<string, CalEvent[]>;
  onWorshipClick: (eventId: string) => void;
}) {
  const [hidden, setHidden] = useState<Set<CalEventType>>(new Set());
  const [closedMonths, setClosedMonths] = useState<Set<string>>(new Set(['2026-03', '2026-04', '2026-05', '2026-06']));
  const [tooltipData, setTooltipData] = useState<{ ev: CalEvent; rect: DOMRect } | null>(null);
  const today = new Date();
  const todayKey = toKey(today);
  const semStart = new Date(2026, 7, 24);
  const semEnd = new Date(2026, 11, 18);
  const planStart = new Date(2026, 3, 27);

  function toggleFilter(type: CalEventType) {
    setHidden(prev => { const next = new Set(prev); next.has(type) ? next.delete(type) : next.add(type); return next; });
  }
  function toggleMonth(key: string) {
    setClosedMonths(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }
  function isVisible(type: string): boolean {
    if (hidden.has(type as CalEventType)) return false;
    if (type === 'holiday' && hidden.has('break')) return false;
    return true;
  }

  function getTooltipInfo(ev: CalEvent): { title: string; sub: string } {
    const custom: Record<string, string> = {
      'Demos Begin':            'Two-week student demo window opens (Nov 3–15). Students record rough demos of their chosen songs before the final recording week with producer Dawson.',
      'Demos End':              'Demo window closes. All student demos should be delivered to Dawson by Nov 20 for review and prep before the final recording week begins Nov 28.',
      'Mix & Master':           'Marco + producer Dawson spend the day finalizing mixes and masters for all recorded tracks. No student sessions — buffer day reserved immediately before the Dec 4–6 cabin content shoot.',
      'Recording Week':         'Producer Dawson is on-site at Pasquerilla Spiritual Center all week (Nov 28–Dec 2). Students sign up for individual recording slots. All demo tracks should be prepped and delivered in advance.',
      'Cabin Shoot':            'Marco + small team head to the PA cabin (Dec 4–6) to shoot EP promotional content: album cover photography, visualizer backgrounds, and social media assets.',
      'Single 1 Drops':         'Lead single releases to Spotify, Apple Music, and all streaming platforms on finals Friday (May 8). Targets students traveling home for maximum commute-day listening.',
      'EP Drops':               '3-song EP releases in full (June 5). All tracks stacked via waterfall strategy — the lead single is included with its original ISRC preserved to maintain stream count compounding.',
      'EP Announce':            'Official EP announcement across Instagram. Teaser content from BTS studio footage and voice memos builds final pre-release anticipation.',
      'Acoustic Push':          'Weekly acoustic / stripped content post on Instagram. Sustains algorithmic visibility and keeps the waitlist engaged between the single and EP release.',
      'Chosen Songs Announced': 'Leadership team reveals which Open Mic Night songs were selected to be professionally recorded and included on the semester EP.',
      'Break Begins':           'Thanksgiving Break begins (Nov 22–28). Classes resume Monday, November 30.',
      'Thanksgiving Break':     'Thanksgiving Break — no classes. Nov 22–28.',
      'Semester Begins':        'Fall 2026 semester starts. Begin executing pre-planned event bookings, UPAC submissions, and promo campaigns.',
      'Last Day':               'Last day of Fall 2026 classes. Finals begin Dec 14.',
    };
    if (ev.label in custom) return { title: ev.label, sub: custom[ev.label] };
    if (ev.type === 'worship') return { title: ev.label, sub: 'WM&A public event — click to view details' };
    const subs: Record<string, string> = {
      worship: 'WM&A public event', football: 'Home football game — high-traffic campus day',
      break: 'Academic break — no classes', holiday: 'University holiday',
      academic: 'Academic milestone', finals: 'Finals period',
      deadline: 'UPAC / contract deadline — must submit by this date',
      social: 'Instagram post / social media push',
      release: 'Music production or release milestone',
    };
    return { title: ev.label, sub: subs[ev.type] ?? '' };
  }

  const LEGEND: { type: CalEventType; label: string }[] = [
    { type: 'worship',  label: 'WM&A (Public)' },
    { type: 'football', label: 'Home Football*' },
    { type: 'deadline', label: 'UPAC Deadlines' },
    { type: 'social',   label: 'Social Media' },
    { type: 'release',  label: 'Music & Production' },
    { type: 'break',    label: 'Break / Holiday' },
    { type: 'academic', label: 'Academic' },
    { type: 'finals',   label: 'Finals' },
  ];

  return (
    <div style={{ marginBottom: 56 }}>
      <p className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'rgba(0,48,73,0.4)' }}>
        Semester at a Glance
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {LEGEND.map(({ type, label }) => {
          const s = EV_STYLE[type];
          const off = hidden.has(type);
          return (
            <button key={type} onClick={() => toggleFilter(type)} style={{
              display: 'flex', alignItems: 'center', gap: 5, opacity: off ? 0.3 : 1,
              cursor: 'pointer', background: off ? 'transparent' : 'rgba(0,48,73,0.04)',
              border: '1px solid rgba(0,48,73,0.1)', borderRadius: 999, padding: '3px 8px 3px 5px',
              transition: 'opacity 0.15s, background 0.15s',
            }}>
              {s.pill ? (
                <div style={{ width: 14, height: 6, borderRadius: 2, background: s.bg, border: s.border ? `1px solid ${s.border}` : undefined, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: type === 'break' || type === 'holiday' ? 'rgba(196,145,58,0.45)' : type === 'finals' ? 'rgba(180,87,65,0.45)' : 'rgba(0,48,73,0.3)',
                }} />
              )}
              <span style={{ fontSize: '0.54rem', fontWeight: 500, color: 'rgba(0,48,73,0.5)', letterSpacing: '0.04em', userSelect: 'none' }}>{label}</span>
            </button>
          );
        })}
        <span style={{ fontSize: '0.5rem', color: 'rgba(0,48,73,0.28)', marginLeft: 2 }}>*verify with PSU Athletics</span>
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as never }}>
        <div style={{ minWidth: 490 }}>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5, marginBottom: 4 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: i >= 5 ? 'rgba(0,48,73,0.2)' : 'rgba(0,48,73,0.32)', paddingBottom: 4,
              }}>{d}</div>
            ))}
          </div>

          {/* Month groups */}
          {MONTH_GROUPS.map(({ monthName, monthKey, weeks }) => {
            const isOpen = !closedMonths.has(monthKey);
            const isPreSemester = weeks[0][0] < semStart;

            return (
              <div key={monthKey} style={{ marginBottom: 2 }}>
                {/* Month header — collapsible */}
                <button onClick={() => toggleMonth(monthKey)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 8, paddingBottom: 4, background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  <span className="font-cormorant" style={{
                    fontSize: '0.85rem', fontWeight: 600, fontStyle: 'italic', flexShrink: 0,
                    color: isPreSemester ? 'rgba(180,87,65,0.55)' : 'rgba(0,48,73,0.4)',
                  }}>
                    {monthName}
                  </span>
                  {isPreSemester && (
                    <span style={{
                      fontSize: '0.46rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '1px 6px', borderRadius: 999, flexShrink: 0,
                      background: 'rgba(180,87,65,0.1)', color: 'rgba(180,87,65,0.55)',
                    }}>Planning</span>
                  )}
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.07)' }} />
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{
                    transition: 'transform 0.2s', flexShrink: 0, color: 'rgba(0,48,73,0.25)',
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }}>
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Weeks */}
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {weeks.map((week, wi) => (
                      <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
                        {week.map((day, di) => {
                          const key = toKey(day);
                          const events = cal[key] || [];
                          const isWeekend = di >= 5;
                          const inSemester = day >= semStart && day <= semEnd;
                          const inPlanning = day >= planStart && day < semStart;
                          const inRange = inSemester || inPlanning;
                          const isToday = key === todayKey;
                          const tint = CELL_TINT[key];
                          const visibleEvents = events.filter(e => isVisible(e.type));
                          const cellBg = tint ? tint
                            : inPlanning ? 'rgba(196,145,58,0.04)'
                            : isWeekend ? 'rgba(0,48,73,0.018)' : 'rgba(0,48,73,0.022)';

                          return (
                            <div key={di} style={{
                              minHeight: 54, borderRadius: 5,
                              border: `1px solid ${isToday ? 'rgba(180,87,65,0.45)' : 'rgba(0,48,73,0.062)'}`,
                              background: inRange ? cellBg : 'transparent',
                              padding: '4px 5px', display: 'flex', flexDirection: 'column',
                              opacity: inRange ? 1 : 0.12, boxSizing: 'border-box',
                            }}>
                              <div style={{
                                fontSize: '0.52rem', fontWeight: day.getDate() === 1 ? 700 : isToday ? 700 : 300,
                                color: isToday ? '#b45741' : inPlanning ? 'rgba(180,87,65,0.4)' : isWeekend ? 'rgba(0,48,73,0.28)' : 'rgba(0,48,73,0.42)',
                                lineHeight: 1, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3,
                              }}>
                                {day.getDate()}
                                {isToday && <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#b45741', flexShrink: 0 }} />}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto' }}>
                                {visibleEvents.map((ev, ei) => {
                                  const s = EV_STYLE[ev.type] ?? EV_STYLE.worship;
                                  const isClickable = ev.type === 'worship' && ev.eventId;
                                  return (
                                    <div key={ei}
                                      onMouseEnter={(e) => setTooltipData({ ev, rect: e.currentTarget.getBoundingClientRect() })}
                                      onMouseLeave={() => setTooltipData(null)}>
                                      {s.pill ? (
                                        <span
                                          onClick={isClickable ? () => onWorshipClick(ev.eventId!) : undefined}
                                          style={{
                                            display: 'block', fontSize: '0.43rem', fontWeight: 600,
                                            letterSpacing: '0.02em', lineHeight: 1.4, padding: '1px 3px', borderRadius: 3,
                                            background: s.bg, color: s.text, border: s.border ? `1px solid ${s.border}` : undefined,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            cursor: isClickable ? 'pointer' : 'default',
                                          }}>{ev.label}</span>
                                      ) : (
                                        <span style={{
                                          display: 'block', fontSize: '0.43rem', fontWeight: 500,
                                          color: s.text, lineHeight: 1.3, letterSpacing: '0.02em',
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'default',
                                        }}>{ev.label}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed-position tooltip — never clipped by scroll containers */}
      {tooltipData && (() => {
        const { ev, rect } = tooltipData;
        const info = getTooltipInfo(ev);
        const s = EV_STYLE[ev.type] ?? EV_STYLE.worship;
        const W = 252;
        const approxH = 88;
        const rawLeft = rect.left + rect.width / 2 - W / 2;
        const safeLeft = typeof window !== 'undefined' ? Math.max(10, Math.min(rawLeft, window.innerWidth - W - 10)) : rawLeft;
        const aboveTop = rect.top - approxH - 10;
        const showBelow = aboveTop < 10;
        const top = showBelow ? rect.bottom + 10 : aboveTop;
        return (
          <div style={{
            position: 'fixed', left: safeLeft, top, width: W, zIndex: 9999,
            background: '#fff7eb', borderRadius: 10, padding: '11px 13px',
            boxShadow: '0 12px 36px rgba(0,48,73,0.16), 0 2px 8px rgba(0,48,73,0.09)',
            border: '1px solid rgba(0,48,73,0.13)', pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              {s.pill
                ? <div style={{ width: 10, height: 10, borderRadius: 3, background: s.bg, border: s.border ? `1px solid ${s.border}` : undefined, flexShrink: 0 }} />
                : <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.text, flexShrink: 0, opacity: 0.7 }} />
              }
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#003049', lineHeight: 1.25, flex: 1 }}>{info.title}</p>
            </div>
            <p style={{ fontSize: '0.6rem', fontWeight: 400, color: 'rgba(0,48,73,0.62)', lineHeight: 1.55, paddingLeft: 17 }}>{info.sub}</p>
          </div>
        );
      })()}
    </div>
  );
}
