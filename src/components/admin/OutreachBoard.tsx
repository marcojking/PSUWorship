'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ChurchColumn } from './ChurchColumn';
import { ChurchDetailModal } from './ChurchDetailModal';
import { AddChurchModal } from './AddChurchModal';
import type { ChurchOutreach, ChurchStage } from './ChurchCard';

const COLUMNS: { id: ChurchStage; title: string }[] = [
  { id: 'unprocessed', title: 'Unprocessed' },
  { id: 'approved', title: 'Approved' },
  { id: 'reached_out', title: 'Reached Out' },
  { id: 'supporting_involved', title: 'Supporting & Involved' },
  { id: 'involved_not_supporting', title: 'Involved, Not Supporting' },
  { id: 'non_involved', title: 'Non-Involved' },
];

export function OutreachBoard() {
  const churches = useQuery(api.churchOutreach.list, {}) as ChurchOutreach[] | undefined;
  const setStage = useMutation(api.churchOutreach.setStage);
  const [pendingMoves, setPendingMoves] = useState<Record<string, ChurchStage>>({});
  const [detailId, setDetailId] = useState<Id<'churchOutreach'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const result: Record<ChurchStage, ChurchOutreach[]> = {
      unprocessed: [], approved: [], reached_out: [],
      supporting_involved: [], involved_not_supporting: [], non_involved: [],
    };
    for (const c of churches ?? []) {
      const effectiveStage = pendingMoves[c._id] ?? c.stage;
      result[effectiveStage].push(c);
    }
    return result;
  }, [churches, pendingMoves]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as Id<'churchOutreach'>;
    const newStage = over.id as ChurchStage;
    const currentStage = (active.data.current?.stage as ChurchStage) ?? 'unprocessed';
    if (newStage === currentStage) return;

    setPendingMoves((prev) => ({ ...prev, [id]: newStage }));
    try {
      await setStage({ id, stage: newStage });
    } catch {
      setError("Couldn't save, try again");
      setTimeout(() => setError(null), 3000);
    } finally {
      setPendingMoves((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const detailChurch = churches?.find((c) => c._id === detailId) ?? null;

  if (churches === undefined) {
    return <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)', padding: '32px 0' }}>Loading…</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer' }}
        >
          + Add Entry
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(180,87,65,0.1)', color: '#b45741', fontSize: '0.78rem' }}>
          {error}
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 12 }}>
          {COLUMNS.map((col) => (
            <ChurchColumn
              key={col.id}
              id={col.id}
              title={col.title}
              churches={grouped[col.id]}
              onOpenDetail={setDetailId}
            />
          ))}
        </div>
      </DndContext>

      {detailChurch && (
        <ChurchDetailModal church={detailChurch} onClose={() => setDetailId(null)} />
      )}
      {showAddModal && (
        <AddChurchModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
