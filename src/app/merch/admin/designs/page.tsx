"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import DesignUploader from "@/components/merch/admin/DesignUploader";

export default function DesignsAdminPage() {
  const designs = useQuery(api.designs.list, {});
  const updateDesign = useMutation(api.designs.update);
  const removeDesign = useMutation(api.designs.remove);
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Designs</h1>

      {/* Upload form */}
      <div className="mb-8">
        <DesignUploader />
      </div>

      {/* Existing designs */}
      <h2 className="mb-4 text-lg font-semibold">
        All Designs ({designs?.length ?? 0})
      </h2>

      {!designs ? (
        <div className="text-muted">Loading...</div>
      ) : designs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
          No designs yet. Upload one above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => (
            <DesignCard
              key={design._id}
              design={design}
              onEdit={() => router.push(`/merch/admin/designs/${design._id}`)}
              onToggleActive={() =>
                updateDesign({ id: design._id, active: !design.active })
              }
              onDelete={() => {
                if (confirm("Delete this design?")) {
                  removeDesign({ id: design._id });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MockupThumb({ storageId, onRemove }: { storageId: Id<"_storage">; onRemove: () => void }) {
  const url = useQuery(api.storage.getUrl, { storageId });
  if (!url) return <div className="h-14 w-14 animate-pulse rounded-lg bg-border" />;
  return (
    <div className="group relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-background">
      <img src={url} alt="mockup" className="h-full w-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs font-bold"
      >
        ✕
      </button>
    </div>
  );
}

function DesignCard({
  design,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  design: {
    _id: Id<"designs">;
    name: string;
    description: string;
    category?: string;
    active: boolean;
    stickerEnabled?: boolean;
    patchEnabled?: boolean;
    embroideryEnabled?: boolean;
    patchPrice: number;
    stickerPrice: number;
    embroideryPriceLarge: number;
    embroideryPriceSmall: number;
    fixedSizeOnly: boolean;
    imageStorageId: Id<"_storage">;
    shapePath?: string;
    mockupStorageIds?: Id<"_storage">[];
  };
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const imageUrl = useQuery(api.storage.getUrl, { storageId: design.imageStorageId });
  const updateDesign = useMutation(api.designs.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const mockupFileRef = useRef<HTMLInputElement>(null);
  const [uploadingMockup, setUploadingMockup] = useState(false);

  const handleMockupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingMockup(true);
    try {
      const newIds: Id<"_storage">[] = [];
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await res.json();
        newIds.push(storageId as Id<"_storage">);
      }
      const existing = design.mockupStorageIds ?? [];
      await updateDesign({ id: design._id, mockupStorageIds: [...existing, ...newIds] });
    } catch (err) {
      console.error("Mockup upload failed:", err);
    }
    setUploadingMockup(false);
    if (mockupFileRef.current) mockupFileRef.current.value = "";
  };

  const removeMockup = async (storageId: Id<"_storage">) => {
    const updated = (design.mockupStorageIds ?? []).filter((id) => id !== storageId);
    await updateDesign({ id: design._id, mockupStorageIds: updated });
  };

  const cents = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        design.active ? "border-border" : "border-border/50 opacity-60"
      }`}
    >
      {/* Design image */}
      {imageUrl && (
        <div className="mb-3 h-32 overflow-hidden rounded-lg bg-background">
          <img src={imageUrl} alt={design.name} className="h-full w-full object-contain" />
        </div>
      )}

      {/* Mockup slideshow photos */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-muted">Hover Slideshow Photos</p>
        <div className="flex flex-wrap gap-2">
          {(design.mockupStorageIds ?? []).map((sid) => (
            <MockupThumb key={sid} storageId={sid} onRemove={() => removeMockup(sid)} />
          ))}
          <label className={`flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted transition-colors hover:border-secondary/60 hover:text-secondary ${uploadingMockup ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="text-lg leading-none">{uploadingMockup ? "…" : "+"}</span>
            <span className="mt-0.5 text-[9px]">add</span>
            <input
              ref={mockupFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMockupUpload}
            />
          </label>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-semibold">{design.name}</h3>
        {!design.active && (
          <span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted">inactive</span>
        )}
      </div>
      <p className="mb-2 text-xs text-muted line-clamp-2">{design.description}</p>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {(design.stickerEnabled ?? true) && <span>Sticker {cents(design.stickerPrice)}</span>}
        {(design.patchEnabled ?? true) && <span>Patch {cents(design.patchPrice)}</span>}
        {(design.embroideryEnabled ?? false) && (
          <span>Embroidery L{cents(design.embroideryPriceLarge)} / S{cents(design.embroideryPriceSmall)}</span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="rounded bg-secondary/20 px-2.5 py-1 text-xs font-medium text-secondary">
          Edit
        </button>
        <button onClick={onToggleActive} className="rounded bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
          {design.active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={onDelete} className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}
