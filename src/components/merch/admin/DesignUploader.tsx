"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { detectShape } from "@/lib/merch/shapeDetector";

export interface ExistingDesign {
  _id: Id<"designs">;
  name: string;
  description: string;
  category?: string;
  imageStorageId: Id<"_storage">;
  shapePath?: string;
  embroideryPrice?: number;
  fixedSize?: number;
  fixedSizeOnly: boolean;
}

interface DesignUploaderProps {
  onCreated?: () => void;
  editDesign?: ExistingDesign;
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

function toCents(dollars: string): number {
  if (!dollars) return 0;
  return Math.round(parseFloat(dollars) * 100);
}

function cents(n: number) {
  return (n / 100).toFixed(2);
}

export default function DesignUploader({ onCreated, editDesign }: DesignUploaderProps) {
  const router = useRouter();
  const isEditing = !!editDesign;

  const createDesign = useMutation(api.designs.create);
  const updateDesign = useMutation(api.designs.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const existingImageUrl = useQuery(
    api.storage.getUrl,
    isEditing ? { storageId: editDesign!.imageStorageId } : "skip",
  );

  const mainFileRef = useRef<HTMLInputElement>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [shapePath, setShapePath] = useState<string>(editDesign?.shapePath ?? "");
  const [detecting, setDetecting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: editDesign?.name ?? "",
    description: editDesign?.description ?? "",
    category: editDesign?.category ?? "",
    embroideryPrice: editDesign ? cents(editDesign.embroideryPrice ?? 0) : "",
    fixedSize: editDesign?.fixedSize ? Math.round(editDesign.fixedSize * 100).toString() : "30",
  });

  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMainFile(f);
    setMainPreview(URL.createObjectURL(f));
    setDetecting(true);
    try {
      setShapePath(await detectShape(f));
    } catch {
      setShapePath("");
    }
    setDetecting(false);
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      let mainStorageId: Id<"_storage"> | undefined;
      if (mainFile) mainStorageId = await uploadFile(mainFile);

      const fields = {
        name: form.name,
        description: form.description,
        shapePath: shapePath || undefined,
        category: form.category || undefined,
        stickerEnabled: false,
        patchEnabled: false,
        embroideryEnabled: true,
        stickerPrice: 0,
        patchPrice: 0,
        embroideryPrice: toCents(form.embroideryPrice),
        fixedSize: parseFloat(form.fixedSize) / 100, // store as e.g. 0.3
        fixedSizeOnly: false,
      };

      if (isEditing && editDesign) {
        await updateDesign({
          id: editDesign._id,
          ...fields,
          ...(mainStorageId ? { imageStorageId: mainStorageId } : {}),
        });
        router.push("/merch/admin/designs");
      } else {
        if (!mainStorageId) return;
        await createDesign({ ...fields, imageStorageId: mainStorageId });
        // Reset
        setMainFile(null);
        setMainPreview(null);
        setShapePath("");
        setForm({
          name: "", description: "", category: "", embroideryPrice: "", fixedSize: "30",
        });
        if (mainFileRef.current) mainFileRef.current.value = "";
        onCreated?.();
      }
    } catch (err) {
      console.error("Failed to save design:", err);
      setSaveError(err instanceof Error ? err.message : String(err));
    }

    setSaving(false);
  };

  const displayMain = mainPreview ?? existingImageUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? `Edit: ${editDesign!.name}` : "Upload New Design"}
        </h3>

        {/* Main design image */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted">
            {isEditing ? "Design Image (Optional Replacement)" : "Design Image (PNG, transparent background)"}
          </label>
          <input
            ref={mainFileRef}
            type="file"
            accept="image/png"
            onChange={handleMainFileChange}
            required={!isEditing}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
          />
        </div>

        {/* Name + Category + Description */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Cross Logo"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="logos, symbols, etc."
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Description (for AI prompts)</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the design so the AI generator understands what it is..."
            rows={2}
            className={inputCls + " resize-none"}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm text-muted">Embroidery Flat Pricing ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.embroideryPrice}
            onChange={(e) => setForm((f) => ({ ...f, embroideryPrice: e.target.value }))}
            placeholder="e.g. 5.00"
            className={inputCls}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Sizing</h3>
        <p className="mb-4 text-sm text-muted">Adjust the slider below to set the default size of the design relative to the width of the clothing.</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Visual Sizer */}
          <div className="flex-1 max-w-[300px]">
            <label className="mb-1 block text-sm text-muted">Embroidery Size ({form.fixedSize}% width)</label>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                min="5"
                max="100"
                value={form.fixedSize}
                onChange={(e) => setForm(f => ({ ...f, fixedSize: e.target.value }))}
                className="w-full accent-secondary"
              />
              <span className="text-sm font-medium w-12 text-right">{form.fixedSize}%</span>
            </div>
            {detecting && <div className="text-sm text-muted">Detecting shape boundary...</div>}

            <div className="relative w-full aspect-[3/4] bg-secondary/5 rounded-xl border border-border flex items-center justify-center overflow-hidden">
              {/* Mock shirt chest bounding box scale */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

              {/* Center guides */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/50 -translate-x-1/2" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-border/50" />

              {displayMain ? (
                <img
                  src={displayMain}
                  className="absolute top-1/3 -translate-y-1/2 drop-shadow-md transition-all duration-200"
                  style={{ width: `${form.fixedSize}%`, height: 'auto', objectFit: 'contain', clipPath: shapePath || 'none' }}
                  alt="preview"
                />
              ) : (
                <div className="text-muted text-xs text-center px-4">Upload an image above to see sizing preview</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {saveError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <strong>Save failed:</strong> {saveError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={() => router.push("/merch/admin/designs")}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-secondary/40 hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || detecting}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Design"}
        </button>
      </div>
    </form>
  );
}
