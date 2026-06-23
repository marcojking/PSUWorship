'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { BoardColumn } from './BoardColumn';
import { ApplicantDetailModal } from './ApplicantDetailModal';
import type { Submission, Stage } from './ApplicantCard';

const COLUMNS: { id: Stage; title: string }[] = [
  { id: 'reviewing', title: 'Reviewing' },
  { id: 'reached_out', title: 'Reached Out' },
  { id: 'approved', title: 'Approved' },
];

export function ApplicationsBoard() {
  const submissions = useQuery(api.leadershipInterest.list, {}) as Submission[] | undefined;
  const setStage = useMutation(api.leadershipInterest.setStage);
  const [pendingMoves, setPendingMoves] = useState<Record<string, Stage>>({});
  const [detailId, setDetailId] = useState<Id<'leadershipInterest'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const result: Record<Stage, Submission[]> = { reviewing: [], reached_out: [], approved: [] };
    for (const s of submissions ?? []) {
      const effectiveStage = pendingMoves[s._id] ?? s.stage ?? 'reviewing';
      result[effectiveStage].push(s);
    }
    return result;
  }, [submissions, pendingMoves]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as Id<'leadershipInterest'>;
    const newStage = over.id as Stage;
    const currentStage = (active.data.current?.stage as Stage) ?? 'reviewing';
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

  const detailSubmission = submissions?.find((s) => s._id === detailId) ?? null;

  if (submissions === undefined) {
    return <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)', padding: '32px 0' }}>Loading…</p>;
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(180,87,65,0.1)', color: '#b45741', fontSize: '0.78rem' }}>
          {error}
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              id={col.id}
              title={col.title}
              submissions={grouped[col.id]}
              onOpenDetail={setDetailId}
            />
          ))}
        </div>
      </DndContext>

      {detailSubmission && (
        <ApplicantDetailModal submission={detailSubmission} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
