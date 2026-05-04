'use client';
import { use, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../../convex/_generated/api';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { EventCard } from '@/components/admin/EventCard';

const COLOR_ACCENT: Record<string, string> = { navy: '#003049', rust: '#b45741', blue: '#7fa0af' };
const COLOR_BG: Record<string, string>     = { navy: 'rgba(0,48,73,0.06)', rust: 'rgba(180,87,65,0.06)', blue: 'rgba(127,160,175,0.06)' };

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function fmtDisplay(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function getDaysBetween(startTs: number, endTs: number): number[] {
  const days: number[] = [];
  let cur = startTs;
  while (cur <= endTs) { days.push(cur); cur += 86400000; }
  return days;
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const event = useQuery(api.events.getBySlug, { slug });
  const allEvents = useQuery(api.events.list) ?? [];
  const updateEvent = useMutation(api.events.update);

  if (event === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-[rgba(0,48,73,0.4)]">Loading…</div>;
  }
  if (event === null) {
    return <div className="min-h-screen flex items-center justify-center text-[rgba(0,48,73,0.4)]">Event not found.</div>;
  }

  const accent = COLOR_ACCENT[event.color] ?? '#003049';
  const accentBg = COLOR_BG[event.color];
  const isMultiDay = event.endDate > event.startDate;
  const days = isMultiDay ? getDaysBetween(event.startDate, event.endDate) : [];

  async function patchEvent(fields: Omit<Parameters<typeof updateEvent>[0], 'id'>) {
    await updateEvent({ id: event!._id, ...fields });
  }

  const dayDescMap = Object.fromEntries((event.days ?? []).map(d => [d.date, d.description]));
  async function saveDayDesc(dateTs: number, description: string) {
    const current = event!.days ?? [];
    const next = current.some(d => d.date === dateTs)
      ? current.map(d => d.date === dateTs ? { ...d, description } : d)
      : [...current, { date: dateTs, description }];
    await patchEvent({ days: next });
  }

  async function addScheduleRow() {
    await patchEvent({ schedule: [...(event!.schedule ?? []), { time: '', desc: '' }] });
  }
  async function updateScheduleRow(idx: number, field: 'time' | 'desc', value: string) {
    const next = (event!.schedule ?? []).map((r, i) => i === idx ? { ...r, [field]: value } : r);
    await patchEvent({ schedule: next });
  }
  async function removeScheduleRow(idx: number) {
    await patchEvent({ schedule: (event!.schedule ?? []).filter((_, i) => i !== idx) });
  }

  async function addUpacRow() {
    await patchEvent({ upacRows: [...(event!.upacRows ?? []), { key: '', val: '' }] });
  }
  async function updateUpacRow(idx: number, field: 'key' | 'val' | 'urgent', value: string | boolean) {
    const next = (event!.upacRows ?? []).map((r, i) => i === idx ? { ...r, [field]: value } : r);
    await patchEvent({ upacRows: next });
  }
  async function removeUpacRow(idx: number) {
    await patchEvent({ upacRows: (event!.upacRows ?? []).filter((_, i) => i !== idx) });
  }

  return (
    <div className="admin-page min-h-screen bg-[#fff7eb]">

      {/* Back nav */}
      <div className="px-6 py-3 border-b border-[rgba(0,48,73,0.08)]">
        <button onClick={() => router.push('/admin/events')} className="text-sm text-[rgba(0,48,73,0.5)] hover:text-[#003049] transition-colors">
          ← All Events
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pt-8 pb-6" style={{ background: accentBg, borderBottom: `1px solid ${accent}20` }}>
        <div className="max-w-4xl mx-auto">
          {/* Status + Color */}
          <div className="flex items-center gap-3 mb-3">
            <select
              value={event.status}
              onChange={e => patchEvent({ status: e.target.value as 'planning' | 'confirmed' | 'complete' })}
              className="text-xs px-2 py-1 rounded-full border outline-none cursor-pointer"
              style={{ borderColor: `${accent}40`, color: accent, background: `${accent}10` }}
            >
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Complete</option>
            </select>
            <select
              value={event.color}
              onChange={e => patchEvent({ color: e.target.value as 'navy' | 'rust' | 'blue' })}
              className="text-xs px-2 py-1 rounded-full border outline-none cursor-pointer bg-transparent"
              style={{ borderColor: `${accent}40`, color: accent }}
            >
              <option value="navy">Navy</option>
              <option value="rust">Rust</option>
              <option value="blue">Blue</option>
            </select>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-semibold" style={{ color: accent }}>
            <InlineEdit
              value={event.title}
              onSave={v => patchEvent({ title: v })}
              placeholder="Event title"
              displayClassName="text-3xl font-semibold"
            />
          </h1>

          {/* Subtitle */}
          <div className="mt-1 text-base" style={{ color: `${accent}99` }}>
            <InlineEdit
              value={event.subtitle ?? ''}
              onSave={v => patchEvent({ subtitle: v })}
              placeholder="Add subtitle…"
            />
          </div>

          {/* Dates */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm" style={{ color: `${accent}bb` }}>
            <label className="flex items-center gap-2">
              Start:
              <input
                type="date"
                value={fmtDate(event.startDate)}
                onChange={e => {
                  const ts = new Date(e.target.value + 'T00:00:00.000Z').getTime();
                  patchEvent({ startDate: ts, endDate: Math.max(ts, event.endDate) });
                }}
                style={{ colorScheme: 'light' }}
                className="border-b border-current bg-transparent outline-none text-sm cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2">
              End:
              <input
                type="date"
                value={fmtDate(event.endDate)}
                onChange={e => {
                  const ts = new Date(e.target.value + 'T00:00:00.000Z').getTime();
                  patchEvent({ endDate: Math.max(ts, event.startDate) });
                }}
                style={{ colorScheme: 'light' }}
                className="border-b border-current bg-transparent outline-none text-sm cursor-pointer"
              />
            </label>
            {isMultiDay && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${accent}15` }}>Multi-day</span>}
          </div>

          {/* Location */}
          <div className="mt-2 text-sm flex items-center gap-1" style={{ color: `${accent}99` }}>
            <span>📍</span>
            <InlineEdit
              value={event.location ?? ''}
              onSave={v => patchEvent({ location: v })}
              placeholder="Add location…"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* Description */}
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>Description</h2>
          <InlineEdit
            value={event.description ?? ''}
            onSave={v => patchEvent({ description: v })}
            multiline
            placeholder="Add event description…"
            displayClassName="text-sm text-[rgba(0,48,73,0.7)] leading-relaxed whitespace-pre-wrap"
          />
        </section>

        {/* Per-day descriptions (multi-day only) */}
        {isMultiDay && (
          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>Day-by-Day</h2>
            <div className="space-y-4">
              {days.map(dayTs => (
                <div key={dayTs} className="border-l-2 pl-4" style={{ borderColor: `${accent}40` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: `${accent}99` }}>{fmtDisplay(dayTs)}</p>
                  <InlineEdit
                    value={dayDescMap[dayTs] ?? ''}
                    onSave={v => saveDayDesc(dayTs, v)}
                    multiline
                    placeholder="Describe this day…"
                    displayClassName="text-sm text-[rgba(0,48,73,0.7)] whitespace-pre-wrap"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>Schedule</h2>
            <button onClick={addScheduleRow} className="text-xs px-3 py-1 rounded border hover:opacity-80 transition-opacity" style={{ borderColor: `${accent}30`, color: accent }}>
              + Add row
            </button>
          </div>
          {(event.schedule ?? []).length === 0 ? (
            <p className="text-sm text-[rgba(0,48,73,0.4)]">No schedule rows yet.</p>
          ) : (
            <div className="divide-y divide-[rgba(0,48,73,0.06)]">
              {(event.schedule ?? []).map((row, idx) => (
                <div key={`${row.time}-${idx}`} className="flex items-start gap-3 py-2">
                  <div className="w-28 shrink-0">
                    <InlineEdit value={row.time} onSave={v => updateScheduleRow(idx, 'time', v)} placeholder="Time" displayClassName="text-xs font-medium text-[rgba(0,48,73,0.6)]" />
                  </div>
                  <div className="flex-1">
                    <InlineEdit value={row.desc} onSave={v => updateScheduleRow(idx, 'desc', v)} placeholder="Description" displayClassName="text-sm text-[rgba(0,48,73,0.8)]" />
                  </div>
                  <button onClick={() => removeScheduleRow(idx)} className="text-[rgba(0,48,73,0.3)] hover:text-[#b45741] text-xs shrink-0 pt-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UPAC Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>UPAC</h2>
            <button onClick={addUpacRow} className="text-xs px-3 py-1 rounded border hover:opacity-80 transition-opacity" style={{ borderColor: `${accent}30`, color: accent }}>
              + Add row
            </button>
          </div>
          {(event.upacRows ?? []).length > 0 && (
            <div className="divide-y divide-[rgba(0,48,73,0.06)] mb-4">
              {(event.upacRows ?? []).map((row, idx) => (
                <div key={`${row.key}-${idx}`} className={`flex items-start gap-3 py-2 ${row.urgent ? 'bg-[rgba(180,87,65,0.04)]' : ''}`}>
                  <div className="w-52 shrink-0">
                    <InlineEdit value={row.key} onSave={v => updateUpacRow(idx, 'key', v)} placeholder="Key" displayClassName="text-xs font-medium text-[rgba(0,48,73,0.6)]" />
                  </div>
                  <div className="flex-1">
                    <InlineEdit value={row.val} onSave={v => updateUpacRow(idx, 'val', v)} placeholder="Value" displayClassName={`text-sm ${row.urgent ? 'text-[#b45741] font-medium' : 'text-[rgba(0,48,73,0.8)]'}`} />
                  </div>
                  <label className="flex items-center gap-1 text-xs text-[rgba(0,48,73,0.5)] shrink-0">
                    <input type="checkbox" checked={!!row.urgent} onChange={e => updateUpacRow(idx, 'urgent', e.target.checked)} className="accent-[#b45741]" />
                    urgent
                  </label>
                  <button onClick={() => removeUpacRow(idx)} className="text-[rgba(0,48,73,0.3)] hover:text-[#b45741] text-xs shrink-0 pt-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
          {/* UPAC note */}
          <div className="mt-2">
            <p className="text-xs text-[rgba(0,48,73,0.4)] mb-1">Note</p>
            <InlineEdit
              value={event.upacNote ?? ''}
              onSave={v => patchEvent({ upacNote: v })}
              multiline
              placeholder="Add UPAC notes…"
              displayClassName="text-xs text-[rgba(0,48,73,0.6)] leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </section>

        {/* Checklist — placeholder, implemented in Task 10 */}
        <ChecklistSection eventId={event._id} accent={accent} />

        {/* Gear — placeholder, implemented in Task 11 */}
        <GearSection eventId={event._id} accent={accent} />

        {/* All events list */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: accent }}>All Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allEvents.map(ev => (
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
                isActive={ev.slug === slug}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

const TAG_COLORS: Record<string, string> = {
  muted:  'bg-[rgba(0,48,73,0.08)] text-[rgba(0,48,73,0.6)]',
  purple: 'bg-[rgba(103,58,183,0.12)] text-[#5c35a8]',
  navy:   'bg-[rgba(0,48,73,0.15)] text-[#003049]',
  gold:   'bg-[rgba(196,145,58,0.18)] text-[#7a5010]',
  green:  'bg-[rgba(80,140,80,0.15)] text-[#2a6a2a]',
  rust:   'bg-[rgba(180,87,65,0.15)] text-[#b45741]',
  blue:   'bg-[rgba(127,160,175,0.18)] text-[#2a5869]',
};

const TAG_OPTIONS = ['Logistics', 'Venue', 'UPAC', 'Promo', 'Media', 'Artist', 'ASA', 'Industry'];
const TAG_COLOR_OPTIONS = ['muted', 'purple', 'navy', 'gold', 'green', 'rust', 'blue'];

function ChecklistSection({ eventId, accent }: { eventId: any; accent: string }) {
  const checks = useQuery(api.eventChecks.listByEvent, { eventId }) ?? [];
  const createCheck = useMutation(api.eventChecks.create);
  const updateCheck = useMutation(api.eventChecks.update);
  const toggleDone  = useMutation(api.eventChecks.toggleDone);
  const removeCheck = useMutation(api.eventChecks.remove);

  const [tag, setTag]           = useState('Logistics');
  const [tagColor, setTagColor] = useState('muted');
  const [text, setText]         = useState('');
  const [due, setDue]           = useState('');
  const [adding, setAdding]     = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    try {
      await createCheck({ eventId, tag, tagColor, text: text.trim(), due: due || undefined, order: checks.length });
      setText(''); setDue('');
    } finally { setAdding(false); }
  }

  const doneCount = checks.filter(c => c.done).length;

  return (
    <section>
      <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>
        Checklist <span className="text-xs font-normal text-[rgba(0,48,73,0.4)] ml-2">{doneCount}/{checks.length} done</span>
      </h2>

      <div className="space-y-1">
        {checks.map(check => (
          <div key={check._id} className={`flex items-start gap-3 py-2 rounded px-2 ${check.done ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={check.done}
              onChange={() => toggleDone({ id: check._id })}
              className="mt-0.5 accent-[#003049] shrink-0"
            />
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TAG_COLORS[check.tagColor] ?? TAG_COLORS.muted}`}>
              {check.tag}
            </span>
            <div className="flex-1 min-w-0">
              <InlineEdit
                value={check.text}
                onSave={v => updateCheck({ id: check._id, text: v })}
                displayClassName={`text-sm ${check.done ? 'line-through' : 'text-[rgba(0,48,73,0.85)]'}`}
              />
            </div>
            {check.due && (
              <span className="text-xs text-[rgba(0,48,73,0.4)] shrink-0">
                <InlineEdit value={check.due} onSave={v => updateCheck({ id: check._id, due: v })} displayClassName="text-xs text-[rgba(0,48,73,0.4)]" />
              </span>
            )}
            <button onClick={() => removeCheck({ id: check._id })} className="text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2 items-end border-t border-[rgba(0,48,73,0.06)] pt-4">
        <select value={tag} onChange={e => setTag(e.target.value)} className="text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none">
          {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={tagColor} onChange={e => setTagColor(e.target.value)} className="text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none">
          {TAG_COLOR_OPTIONS.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Task description"
          className="flex-1 min-w-48 text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-1.5 outline-none focus:border-[#003049]"
        />
        <input
          value={due}
          onChange={e => setDue(e.target.value)}
          placeholder="Due (e.g. Aug 30)"
          className="w-32 text-xs border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none focus:border-[#003049]"
        />
        <button type="submit" disabled={adding} className="text-xs px-3 py-1.5 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
          {adding ? '…' : '+ Add'}
        </button>
      </form>
    </section>
  );
}

function GearSection({ eventId, accent }: { eventId: any; accent: string }) {
  const rows = useQuery(api.eventGear.listByEvent, { eventId }) ?? [];
  const updateRow = useMutation(api.eventGear.update);
  const removeRow = useMutation(api.eventGear.removeFromEvent);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: accent }}>Gear</h2>
        <a href="/admin/gear" className="text-xs underline" style={{ color: `${accent}80` }}>Manage library →</a>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[rgba(0,48,73,0.4)]">No gear added yet.</p>
      ) : (
        <div className="divide-y divide-[rgba(0,48,73,0.06)]">
          {rows.map(row => {
            if (!row.gear) return null;
            return (
              <div key={row._id} className="flex items-start gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgba(0,48,73,0.85)]">{row.gear.name}</p>
                  <p className="text-xs text-[rgba(0,48,73,0.4)]">{row.gear.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${row.gear.disposition === 'buy' ? 'bg-[rgba(80,140,80,0.12)] text-[#2a6a2a]' : 'bg-[rgba(196,145,58,0.15)] text-[#7a5010]'}`}>
                  {row.gear.disposition.toUpperCase()}
                </span>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={e => updateRow({ id: row._id, quantity: Number(e.target.value) })}
                  className="w-12 text-center text-sm border border-[rgba(0,48,73,0.2)] rounded px-1 py-0.5 outline-none"
                />
                <div className="w-32">
                  <InlineEdit
                    value={row.notes ?? ''}
                    onSave={v => updateRow({ id: row._id, notes: v })}
                    placeholder="Notes…"
                    displayClassName="text-xs text-[rgba(0,48,73,0.5)]"
                  />
                </div>
                <button onClick={() => removeRow({ id: row._id })} className="text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs shrink-0">✕</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <button
          onClick={() => setShowSearch(s => !s)}
          className="text-xs px-3 py-1.5 rounded border hover:opacity-80 transition-opacity"
          style={{ borderColor: `${accent}30`, color: accent }}
        >
          {showSearch ? 'Cancel' : '+ Add Gear'}
        </button>
        {showSearch && <GearSearch eventId={eventId} onAdded={() => setShowSearch(false)} />}
      </div>
    </section>
  );
}

function GearSearch({ eventId, onAdded }: { eventId: any; onAdded: () => void }) {
  const allGear = useQuery(api.gearItems.list) ?? [];
  const addToEvent = useMutation(api.eventGear.addToEvent);
  const createGear = useMutation(api.gearItems.create);

  const [query, setQuery]   = useState('');
  const [quantity, setQty]  = useState(1);
  const [newName, setNewName]         = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDisp, setNewDisp]         = useState<'buy' | 'rent'>('buy');
  const [creating, setCreating]       = useState(false);

  const filtered   = allGear.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = allGear.find(g => g.name.toLowerCase() === query.toLowerCase());

  async function handleSelect(gearItemId: any) {
    await addToEvent({ eventId, gearItemId, quantity });
    setQuery(''); setQty(1);
    onAdded();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCategory.trim()) return;
    setCreating(true);
    try {
      const gearItemId = await createGear({ name: newName.trim(), category: newCategory.trim(), disposition: newDisp });
      await addToEvent({ eventId, gearItemId, quantity });
      setQuery(''); setNewName(''); setNewCategory(''); setQty(1);
      onAdded();
    } finally { setCreating(false); }
  }

  return (
    <div className="mt-3 border-t border-[rgba(0,48,73,0.06)] pt-3">
      <div className="flex gap-2 items-center mb-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search gear library…"
          className="flex-1 text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-1.5 outline-none focus:border-[#003049]"
        />
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQty(Number(e.target.value))}
          className="w-16 text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none text-center"
        />
      </div>

      {query && (
        <ul className="border border-[rgba(0,48,73,0.12)] rounded divide-y divide-[rgba(0,48,73,0.06)] mb-2 max-h-48 overflow-y-auto">
          {filtered.map(g => (
            <li key={g._id}>
              <button
                onClick={() => handleSelect(g._id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(0,48,73,0.04)] flex items-center justify-between"
              >
                <span>{g.name}</span>
                <span className="text-xs text-[rgba(0,48,73,0.4)]">{g.category} · {g.disposition.toUpperCase()}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-xs text-[rgba(0,48,73,0.4)]">No matches — fill in below to create</li>
          )}
        </ul>
      )}

      {query && !exactMatch && (
        <form onSubmit={handleCreate} className="bg-[rgba(0,48,73,0.03)] rounded p-3 space-y-2">
          <p className="text-xs text-[rgba(0,48,73,0.5)] font-medium">Create new gear item</p>
          <input
            value={newName || query}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none"
          />
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Category (e.g. Microphones)"
            className="w-full text-sm border border-[rgba(0,48,73,0.2)] rounded px-2 py-1.5 outline-none"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" value="buy" checked={newDisp === 'buy'} onChange={() => setNewDisp('buy')} /> Buy
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" value="rent" checked={newDisp === 'rent'} onChange={() => setNewDisp('rent')} /> Rent
            </label>
          </div>
          <button type="submit" disabled={creating} className="text-xs px-3 py-1.5 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
            {creating ? '…' : 'Create + Add to Event'}
          </button>
        </form>
      )}
    </div>
  );
}
