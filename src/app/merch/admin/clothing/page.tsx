"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ClothingAdminPage() {
  const items = useQuery(api.clothing.list, {});
  const createItem = useMutation(api.clothing.create);
  const updateItem = useMutation(api.clothing.update);
  const removeItem = useMutation(api.clothing.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    placementNames: "", // comma-separated
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      const placements = form.placementNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, i) => ({ id: `p${i}`, name }));

      await createItem({
        name: form.name,
        imageStorageId: storageId as Id<"_storage">,
        basePrice: Math.round(parseFloat(form.basePrice) * 100),
        placements,
      });

      setFile(null);
      setPreview(null);
      setForm({ name: "", basePrice: "", placementNames: "" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("Failed to create clothing item:", err);
    }
    setSaving(false);
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Clothing Items</h1>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Add Clothing Item</h3>

        <div className="mb-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
          />
        </div>

        {preview && (
          <div className="mb-4 h-32 w-32 overflow-hidden rounded-lg border border-border bg-background">
            <img src={preview} alt="Preview" className="h-full w-full object-contain" />
          </div>
        )}

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Black Hoodie"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Base Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.basePrice}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              placeholder="35.00"
              className={inputCls}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted">
            Placement zones (comma-separated)
          </label>
          <input
            type="text"
            value={form.placementNames}
            onChange={(e) => setForm((f) => ({ ...f, placementNames: e.target.value }))}
            placeholder="left chest, back center, right sleeve"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={!file || !form.name || saving}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Uploading..." : "Add Item"}
        </button>
      </form>

      {/* Existing items */}
      <h2 className="mb-4 text-lg font-semibold">
        All Items ({items?.length ?? 0})
      </h2>

      {!items ? (
        <div className="text-muted">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
          No clothing items yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ClothingCard
              key={item._id}
              item={item}
              onToggleActive={() => updateItem({ id: item._id, active: !item.active })}
              onDelete={() => {
                if (confirm("Delete this item?")) removeItem({ id: item._id });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClothingCard({
  item,
  onToggleActive,
  onDelete,
}: {
  item: {
    _id: Id<"clothingItems">;
    name: string;
    basePrice: number;
    placements: { id: string; name: string }[];
    active: boolean;
    imageStorageId: Id<"_storage">;
  };
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const imageUrl = useQuery(api.storage.getUrl, { storageId: item.imageStorageId });

  return (
    <div className={`rounded-xl border bg-card p-4 ${item.active ? "border-border" : "border-border/50 opacity-60"}`}>
      {imageUrl && (
        <div className="mb-3 h-32 overflow-hidden rounded-lg bg-background">
          <img src={imageUrl} alt={item.name} className="h-full w-full object-contain" />
        </div>
      )}
      <h3 className="font-semibold">{item.name}</h3>
      <p className="text-sm text-muted">${(item.basePrice / 100).toFixed(2)} base</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {item.placements.map((p) => (
          <span key={p.id} className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
            {p.name}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onToggleActive} className="rounded bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
          {item.active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={onDelete} className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}
