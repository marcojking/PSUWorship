"use client";

import { useState, useEffect } from "react";
import { getAllDrafts, deleteDraft, updateDraftName, type MerchDraft } from "@/lib/merch/drafts";
import Link from "next/link";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<MerchDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    const all = await getAllDrafts();
    setDrafts(all);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this draft?")) return;
    await deleteDraft(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/merch"
        className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to Merch
      </Link>

      <h1 className="mb-2 text-2xl font-bold">My Drafts</h1>
      <p className="mb-8 text-sm text-muted">
        Saved designs stored in your browser. These won&apos;t sync across devices.
      </p>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : drafts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="mb-2 text-muted">No saved drafts</p>
          <Link href="/merch/custom" className="text-sm text-secondary hover:underline">
            Start customizing →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onDelete={() => handleDelete(draft.id!)}
              onRename={async (name) => {
                await updateDraftName(draft.id!, name);
                setDrafts((prev) =>
                  prev.map((d) => (d.id === draft.id ? { ...d, name } : d)),
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  onDelete,
  onRename,
}: {
  draft: MerchDraft;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(draft.name ?? "");
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);

  useEffect(() => {
    if (draft.mockupBlob) {
      const url = URL.createObjectURL(draft.mockupBlob);
      setMockupUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [draft.mockupBlob]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Mockup preview */}
      {mockupUrl ? (
        <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-background">
          <img src={mockupUrl} alt="Draft preview" className="h-full w-full object-contain" />
        </div>
      ) : (
        <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-background text-sm text-muted">
          No preview
        </div>
      )}

      {/* Name */}
      {editing ? (
        <div className="mb-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename(name);
                setEditing(false);
              }
            }}
          />
          <button
            onClick={() => { onRename(name); setEditing(false); }}
            className="text-xs text-secondary"
          >
            Save
          </button>
        </div>
      ) : (
        <h3
          onClick={() => setEditing(true)}
          className="mb-1 cursor-pointer text-sm font-semibold hover:text-secondary transition-colors truncate"
        >
          {draft.name || "Untitled Draft"}
        </h3>
      )}

      {/* Info */}
      <p className="mb-1 text-xs text-muted">
        {draft.designConfigs.length} design{draft.designConfigs.length !== 1 ? "s" : ""}
        {" · "}${(draft.totalPrice / 100).toFixed(2)}
      </p>
      <p className="mb-3 text-[10px] text-muted/60">
        {draft.createdAt.toLocaleDateString()}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/merch/custom?draft=${draft.id}`}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium transition-colors hover:border-secondary/40"
        >
          Edit
        </Link>
        <button
          onClick={onDelete}
          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
