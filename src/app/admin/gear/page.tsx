'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { InlineEdit } from '@/components/admin/InlineEdit';

const ACCENT = '#003049';

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const CATEGORIES = ['Microphones', 'Cables', 'Monitors', 'Stands', 'PA / Speakers', 'Mixing', 'Lighting', 'Staging', 'Power', 'Recording', 'Other'];

export default function GearPage() {
  const allGear      = useQuery(api.gearItems.list) ?? [];
  const allRows      = useQuery(api.eventGear.listAll) ?? [];
  const createGear   = useMutation(api.gearItems.create);
  const updateGear   = useMutation(api.gearItems.update);
  const removeGear   = useMutation(api.gearItems.remove);
  const genUploadUrl = useMutation(api.gearItems.generateUploadUrl);

  const [newName, setNewName]             = useState('');
  const [newCategory, setNewCategory]     = useState('Microphones');
  const [newDisposition, setNewDisp]      = useState<'buy' | 'rent'>('buy');
  const [newPrice, setNewPrice]           = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl]   = useState('');
  const [adding, setAdding]               = useState(false);
  const [showAddForm, setShowAddForm]     = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createGear({
        name: newName.trim(),
        category: newCategory,
        disposition: newDisposition,
        purchasePrice: newDisposition === 'buy' && newPrice ? Math.round(parseFloat(newPrice) * 100) : undefined,
        rentalPricePerEvent: newDisposition === 'rent' && newPrice ? Math.round(parseFloat(newPrice) * 100) : undefined,
        sourceName: newSourceName.trim() || undefined,
        sourceUrl: newSourceUrl.trim() || undefined,
      });
      setNewName(''); setNewPrice(''); setNewSourceName(''); setNewSourceUrl('');
      setShowAddForm(false);
    } finally { setAdding(false); }
  }

  async function handleScreenshotUpload(gearId: any, file: File) {
    const url = await genUploadUrl({});
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const { storageId } = await res.json();
    await updateGear({ id: gearId, sourceScreenshotStorageId: storageId });
  }

  async function handleRemove(gearId: any, name: string) {
    try {
      await removeGear({ id: gearId });
    } catch {
      alert(`Cannot delete "${name}" — it is used by one or more events.`);
    }
  }

  // Group by category
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: allGear.filter(g => g.category === cat),
  })).filter(g => g.items.length > 0);

  const knownCats = new Set(CATEGORIES);
  const other = allGear.filter(g => !knownCats.has(g.category));

  // Event usage map: gearItemId → eventGear rows
  const usageMap = new Map<string, typeof allRows>();
  for (const row of allRows) {
    if (!row.gear) continue;
    const key = row.gearItemId as string;
    usageMap.set(key, [...(usageMap.get(key) ?? []), row]);
  }

  const allGroups = [...grouped, ...(other.length > 0 ? [{ category: 'Other', items: other }] : [])];

  // Summary computations
  const buyItems  = allGear.filter(g => g.disposition === 'buy');
  const rentItems = allGear.filter(g => g.disposition === 'rent');

  const buyTotal = buyItems.reduce((acc, gear) => {
    const usage = usageMap.get(gear._id as string) ?? [];
    const maxQty = usage.length > 0 ? Math.max(...usage.map((u: any) => u.quantity)) : 1;
    return acc + (gear.purchasePrice ?? 0) * maxQty;
  }, 0);

  const rentTotal = rentItems.reduce((acc, gear) => {
    const usage = usageMap.get(gear._id as string) ?? [];
    return acc + (gear.rentalPricePerEvent ?? 0) * usage.length;
  }, 0);

  return (
    <div className="admin-page min-h-screen bg-[#fff7eb]">
      <div className="px-6 py-3 border-b border-[rgba(0,48,73,0.08)]">
        <a href="/admin/events" className="text-sm text-[rgba(0,48,73,0.5)] hover:text-[#003049]">← Events</a>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#003049]">Gear Library</h1>
          <button
            onClick={() => setShowAddForm(s => !s)}
            className="text-sm px-4 py-2 rounded bg-[#003049] text-[#fff7eb] hover:opacity-90 transition-opacity"
          >
            {showAddForm ? 'Cancel' : '+ Add Gear Item'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-8 p-4 border border-[rgba(0,48,73,0.12)] rounded-lg bg-white space-y-3">
            <h3 className="text-sm font-semibold text-[#003049]">New Gear Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name *" required className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="buy" checked={newDisposition === 'buy'} onChange={() => setNewDisp('buy')} /> Buy
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="rent" checked={newDisposition === 'rent'} onChange={() => setNewDisp('rent')} /> Rent
                </label>
              </div>
              <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder={newDisposition === 'buy' ? 'Purchase price ($)' : 'Rental rate per event ($)'} type="number" step="0.01" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <input value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="Source name (e.g. Sweetwater)" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
              <input value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="Source URL (item listing)" type="url" className="text-sm border border-[rgba(0,48,73,0.2)] rounded px-3 py-2 outline-none focus:border-[#003049]" />
            </div>
            <button type="submit" disabled={adding} className="text-sm px-4 py-2 rounded bg-[#003049] text-[#fff7eb] disabled:opacity-50">
              {adding ? 'Adding…' : 'Add to Library'}
            </button>
          </form>
        )}

        {/* Gear library grouped by category */}
        {allGroups.map(group => (
          <div key={group.category} className="mb-8">
            <h2 className="text-sm font-semibold text-[rgba(0,48,73,0.5)] uppercase tracking-wide mb-3">{group.category}</h2>
            <div className="divide-y divide-[rgba(0,48,73,0.06)] border border-[rgba(0,48,73,0.08)] rounded-lg overflow-hidden">
              {group.items.map(gear => {
                const usage = usageMap.get(gear._id as string) ?? [];
                return (
                  <div key={gear._id} className="p-4 bg-white hover:bg-[rgba(0,48,73,0.01)]">
                    <div className="flex items-start gap-4">
                      {/* Screenshot thumbnail */}
                      <div className="shrink-0 w-14 h-14 rounded border border-[rgba(0,48,73,0.1)] overflow-hidden bg-[rgba(0,48,73,0.03)] flex items-center justify-center">
                        {gear.sourceScreenshotStorageId ? (
                          <ScreenshotThumb storageId={gear.sourceScreenshotStorageId} />
                        ) : (
                          <label className="cursor-pointer text-center text-xs text-[rgba(0,48,73,0.3)] leading-tight p-1">
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleScreenshotUpload(gear._id, f); }} />
                            Add<br/>photo
                          </label>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Name + disposition */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <InlineEdit value={gear.name} onSave={v => updateGear({ id: gear._id, name: v })} displayClassName="font-medium text-[#003049]" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${gear.disposition === 'buy' ? 'bg-[rgba(80,140,80,0.12)] text-[#2a6a2a]' : 'bg-[rgba(196,145,58,0.15)] text-[#7a5010]'}`}>
                            {gear.disposition.toUpperCase()}
                          </span>
                          <select
                            value={gear.disposition}
                            onChange={e => updateGear({ id: gear._id, disposition: e.target.value as 'buy' | 'rent' })}
                            className="text-xs border-0 outline-none bg-transparent text-[rgba(0,48,73,0.4)] cursor-pointer"
                          >
                            <option value="buy">Buy</option>
                            <option value="rent">Rent</option>
                          </select>
                        </div>

                        {/* Price */}
                        <div className="text-xs text-[rgba(0,48,73,0.5)] flex items-center gap-1">
                          {gear.disposition === 'buy' ? (
                            <>Buy price: <InlineEdit value={gear.purchasePrice ? fmt(gear.purchasePrice) : ''} onSave={v => updateGear({ id: gear._id, purchasePrice: Math.round(parseFloat(v.replace('$', '')) * 100) })} placeholder="Add price" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" /></>
                          ) : (
                            <>Rental/event: <InlineEdit value={gear.rentalPricePerEvent ? fmt(gear.rentalPricePerEvent) : ''} onSave={v => updateGear({ id: gear._id, rentalPricePerEvent: Math.round(parseFloat(v.replace('$', '')) * 100) })} placeholder="Add price" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" /></>
                          )}
                        </div>

                        {/* Source */}
                        <div className="text-xs text-[rgba(0,48,73,0.5)] flex items-center gap-2 flex-wrap">
                          <InlineEdit value={gear.sourceName ?? ''} onSave={v => updateGear({ id: gear._id, sourceName: v })} placeholder="Source name" displayClassName="text-xs text-[rgba(0,48,73,0.5)]" />
                          {gear.sourceUrl ? (
                            <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#003049]">View listing ↗</a>
                          ) : (
                            <InlineEdit value="" onSave={v => updateGear({ id: gear._id, sourceUrl: v })} placeholder="Add listing URL" displayClassName="text-xs text-[rgba(0,48,73,0.4)]" />
                          )}
                        </div>

                        {/* Used by events */}
                        {usage.length > 0 && (
                          <div className="text-xs text-[rgba(0,48,73,0.4)]">
                            Used in: {usage.map((u: any, i: number) => (
                              <span key={u._id}>
                                {i > 0 && ', '}
                                <a href={`/admin/event/${u.event?.slug}`} className="underline hover:text-[#003049]">{u.event?.title ?? '?'}</a>
                                {' '}(×{u.quantity})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => handleRemove(gear._id, gear.name)} className="shrink-0 text-[rgba(0,48,73,0.25)] hover:text-[#b45741] text-xs pt-1">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {allGear.length === 0 && (
          <p className="text-sm text-[rgba(0,48,73,0.4)]">No gear items yet. Add your first item above.</p>
        )}

        {/* ── Summaries ── */}
        {allGear.length > 0 && (
          <>
            <div className="my-12 border-t border-[rgba(0,48,73,0.08)]" />

            {/* Buy Summary */}
            {buyItems.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-[#003049] mb-4">Buy Summary</h2>
                <p className="text-xs text-[rgba(0,48,73,0.4)] mb-3">Quantity = max needed simultaneously across all events (buy once, use repeatedly).</p>
                <div className="border border-[rgba(0,48,73,0.1)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[rgba(0,48,73,0.04)]">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Item</th>
                        <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Category</th>
                        <th className="text-center px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Qty</th>
                        <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Unit Price</th>
                        <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Total</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(0,48,73,0.06)]">
                      {buyItems.map(gear => {
                        const usage = usageMap.get(gear._id as string) ?? [];
                        const maxQty = usage.length > 0 ? Math.max(...usage.map((u: any) => u.quantity)) : 1;
                        const unitPrice = gear.purchasePrice ?? 0;
                        const rowTotal = unitPrice * maxQty;
                        return (
                          <tr key={gear._id} className="bg-white">
                            <td className="px-4 py-2 text-[#003049] font-medium">{gear.name}</td>
                            <td className="px-4 py-2 text-[rgba(0,48,73,0.5)]">{gear.category}</td>
                            <td className="px-4 py-2 text-center text-[rgba(0,48,73,0.7)]">{maxQty}</td>
                            <td className="px-4 py-2 text-right text-[rgba(0,48,73,0.7)]">{unitPrice ? fmt(unitPrice) : '—'}</td>
                            <td className="px-4 py-2 text-right font-medium text-[#003049]">{rowTotal ? fmt(rowTotal) : '—'}</td>
                            <td className="px-4 py-2">
                              {gear.sourceUrl && <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[rgba(0,48,73,0.4)] hover:text-[#003049]">↗</a>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[rgba(0,48,73,0.04)]">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-sm font-semibold text-[#003049] text-right">Buy Total</td>
                        <td className="px-4 py-2 text-right font-bold text-[#003049]">{fmt(buyTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}

            {/* Rent Summary */}
            {rentItems.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-[#003049] mb-4">Rent Summary</h2>
                <div className="border border-[rgba(0,48,73,0.1)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[rgba(0,48,73,0.04)]">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Item</th>
                        <th className="text-left px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Events</th>
                        <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Rate/Event</th>
                        <th className="text-right px-4 py-2 text-xs text-[rgba(0,48,73,0.5)] font-semibold">Total</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(0,48,73,0.06)]">
                      {rentItems.map(gear => {
                        const usage = usageMap.get(gear._id as string) ?? [];
                        const rate = gear.rentalPricePerEvent ?? 0;
                        const rowTotal = rate * usage.length;
                        return (
                          <tr key={gear._id} className="bg-white">
                            <td className="px-4 py-2 text-[#003049] font-medium">{gear.name}</td>
                            <td className="px-4 py-2 text-[rgba(0,48,73,0.5)] text-xs">
                              {usage.length === 0 ? '—' : usage.map((u: any, i: number) => (
                                <span key={u._id}>{i > 0 && ', '}{u.event?.title ?? '?'} ×{u.quantity}</span>
                              ))}
                            </td>
                            <td className="px-4 py-2 text-right text-[rgba(0,48,73,0.7)]">{rate ? fmt(rate) : '—'}</td>
                            <td className="px-4 py-2 text-right font-medium text-[#003049]">{rowTotal ? fmt(rowTotal) : '—'}</td>
                            <td className="px-4 py-2">
                              {gear.sourceUrl && <a href={gear.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[rgba(0,48,73,0.4)] hover:text-[#003049]">↗</a>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[rgba(0,48,73,0.04)]">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-[#003049] text-right">Rent Total</td>
                        <td className="px-4 py-2 text-right font-bold text-[#003049]">{fmt(rentTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}

            {/* Grand Total */}
            <div className="rounded-lg border border-[rgba(0,48,73,0.15)] bg-[rgba(0,48,73,0.04)] px-6 py-4 flex items-center justify-between mb-16">
              <div>
                <p className="text-sm font-semibold text-[#003049]">UPAC Gear Request — Grand Total</p>
                <p className="text-xs text-[rgba(0,48,73,0.5)] mt-0.5">Buy {fmt(buyTotal)} + Rent {fmt(rentTotal)}</p>
              </div>
              <p className="text-2xl font-bold text-[#003049]">{fmt(buyTotal + rentTotal)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScreenshotThumb({ storageId }: { storageId: any }) {
  const url = useQuery(api.gearItems.getScreenshotUrl, { storageId });
  if (!url) return null;
  return <img src={url} alt="listing" className="w-full h-full object-cover" />;
}
