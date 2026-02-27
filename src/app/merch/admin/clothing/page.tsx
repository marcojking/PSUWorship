"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type ClothingItem = {
  _id: Id<"clothingItems">;
  name: string;
  basePrice: number;
  placements: { id: string; name: string }[];
  active: boolean;
  imageStorageId?: Id<"_storage">;
  frontImageStorageId?: Id<"_storage">;
  backImageStorageId?: Id<"_storage">;
};

export default function ClothingAdminPage() {
  const items = useQuery(api.clothing.list, {});
  const createItem = useMutation(api.clothing.create);
  const updateItem = useMutation(api.clothing.update);
  const removeItem = useMutation(api.clothing.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<Id<"clothingItems"> | null>(null);
  const [existingFrontId, setExistingFrontId] = useState<Id<"_storage"> | null>(null);
  const [existingBackId, setExistingBackId] = useState<Id<"_storage"> | null>(null);

  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    placementNames: "",
  });

  const handleEdit = (item: ClothingItem) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      basePrice: (item.basePrice / 100).toFixed(2),
      placementNames: item.placements.map(p => p.name).join(", "),
    });

    const fId = item.frontImageStorageId ?? item.imageStorageId;
    const bId = item.backImageStorageId ?? item.imageStorageId;
    setExistingFrontId(fId ?? null);
    setExistingBackId(bId ?? null);

    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(null);
    setBackPreview(null);
    if (frontFileRef.current) frontFileRef.current.value = "";
    if (backFileRef.current) backFileRef.current.value = "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExistingFrontId(null);
    setExistingBackId(null);
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(null);
    setBackPreview(null);
    setForm({ name: "", basePrice: "", placementNames: "" });
    if (frontFileRef.current) frontFileRef.current.value = "";
    if (backFileRef.current) backFileRef.current.value = "";
  };

  const uploadFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId as Id<"_storage">;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !frontFile) {
      alert("Front image is required to create a new item.");
      return;
    }

    setSaving(true);

    try {
      let finalFrontId = existingFrontId;
      if (frontFile) {
        finalFrontId = await uploadFile(frontFile);
      }

      let finalBackId = existingBackId;
      if (backFile) {
        finalBackId = await uploadFile(backFile);
      }

      // Fallback: If no back image is provided at all, use front image
      if (!finalBackId && finalFrontId) {
        finalBackId = finalFrontId;
      }

      const placements = form.placementNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, i) => ({
          id: `p${i}`,
          name,
          type: "main" as const,
          view: "front",
          x: 0.3 + i * 0.1,
          y: 0.3,
          defaultSize: 30,
        }));

      if (editingId) {
        if (!finalFrontId || !finalBackId) throw new Error("Missing required images");
        await updateItem({
          id: editingId,
          name: form.name,
          frontImageStorageId: finalFrontId,
          backImageStorageId: finalBackId,
          description: form.name,
          basePrice: Math.round(parseFloat(form.basePrice) * 100),
          placements,
        });
      } else {
        if (!finalFrontId || !finalBackId) throw new Error("Missing required images");
        await createItem({
          name: form.name,
          frontImageStorageId: finalFrontId,
          backImageStorageId: finalBackId,
          description: form.name,
          basePrice: Math.round(parseFloat(form.basePrice) * 100),
          availableSizes: ["S", "M", "L", "XL"],
          stock: { S: 0, M: 0, L: 0, XL: 0 },
          placements,
        });
      }

      cancelEdit();
    } catch (err) {
      console.error("Failed to save clothing item:", err);
      alert("Error saving. See console.");
    }
    setSaving(false);
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Clothing Items</h1>

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{editingId ? "Edit Clothing Item" : "Add Clothing Item"}</h3>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs text-muted hover:text-foreground underline">Cancel Edit</button>
          )}
        </div>

        <div className="mb-4 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Front Image <span className="text-red-500">*</span></label>
            <input
              ref={frontFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFrontFile(f);
                  setFrontPreview(URL.createObjectURL(f));
                }
              }}
              className="mb-2 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer w-full"
            />
            <ImagePreview filePreview={frontPreview} storageId={!frontFile ? existingFrontId : null} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Back Image <span className="text-muted font-normal">(optional, defaults to front)</span></label>
            <input
              ref={backFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setBackFile(f);
                  setBackPreview(URL.createObjectURL(f));
                }
              }}
              className="mb-2 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer w-full"
            />
            <ImagePreview filePreview={backPreview} storageId={!backFile ? existingBackId : null} />
          </div>
        </div>

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
          disabled={(!editingId && !frontFile) || !form.name || saving}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : editingId ? "Save Changes" : "Add Item"}
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
              item={item as ClothingItem}
              onEdit={() => handleEdit(item as ClothingItem)}
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

function ImagePreview({ filePreview, storageId }: { filePreview: string | null, storageId: Id<"_storage"> | null }) {
  const url = useQuery(api.storage.getUrl, storageId && !filePreview ? { storageId } : "skip");
  const displayUrl = filePreview ?? url;

  if (!displayUrl) return null;

  return (
    <div className="h-24 w-24 overflow-hidden rounded-lg border border-border bg-background p-1">
      <img src={displayUrl} alt="Preview" className="h-full w-full object-contain" />
    </div>
  );
}

function ClothingCard({
  item,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  item: ClothingItem;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const frontImgId = item.frontImageStorageId ?? item.imageStorageId;
  const backImgId = item.backImageStorageId ?? item.imageStorageId;

  const frontUrl = useQuery(api.storage.getUrl, frontImgId ? { storageId: frontImgId } : "skip");
  const backUrl = useQuery(api.storage.getUrl, backImgId ? { storageId: backImgId } : "skip");

  return (
    <div className={`rounded-xl border bg-card p-4 flex flex-col ${item.active ? "border-border" : "border-border/50 opacity-60"}`}>
      <div className="mb-3 flex gap-2 h-32">
        {frontUrl && (
          <div className="flex-1 overflow-hidden rounded-lg bg-background p-1 border border-border/50 relative">
            <span className="absolute top-1 left-1 bg-background/80 text-[9px] px-1 rounded font-medium text-muted uppercase tracking-wider backdrop-blur-sm z-10 border border-border/50">Front</span>
            <img src={frontUrl} alt={`${item.name} front`} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
          </div>
        )}
        {backUrl && (
          <div className="flex-1 overflow-hidden rounded-lg bg-background p-1 border border-border/50 relative">
            <span className="absolute top-1 left-1 bg-background/80 text-[9px] px-1 rounded font-medium text-muted uppercase tracking-wider backdrop-blur-sm z-10 border border-border/50">Back</span>
            <img src={backUrl} alt={`${item.name} back`} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
          </div>
        )}
      </div>
      <h3 className="font-semibold">{item.name}</h3>
      <p className="text-sm text-muted">${(item.basePrice / 100).toFixed(2)} base</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.placements.map((p) => (
          <span key={p.id} className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
            {p.name}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex gap-2 items-center">
        <button onClick={onEdit} className="rounded bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors">
          Edit
        </button>
        <button onClick={onToggleActive} className="rounded bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors">
          {item.active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={onDelete} className="ml-auto rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
