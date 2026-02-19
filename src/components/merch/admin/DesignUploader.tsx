"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { detectShape } from "@/lib/merch/shapeDetector";

interface ExistingDesign {
  _id: Id<"designs">;
  name: string;
  description: string;
  category?: string;
  imageStorageId: Id<"_storage">;
  shapePath?: string;
  stickerEnabled?: boolean;
  patchEnabled?: boolean;
  embroideryEnabled?: boolean;
  stickerPrice: number;
  patchPrice: number;
  embroideryPriceLarge: number;
  embroideryPriceSmall: number;
  fixedSizeOnly: boolean;
  patchImageStorageId?: Id<"_storage">;
  embroideryImageStorageId?: Id<"_storage">;
}

interface DesignUploaderProps {
  onCreated?: () => void;
  editDesign?: ExistingDesign;
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

function toCents(dollars: string): number {
  const val = parseFloat(dollars);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

function cents(n: number) {
  return (n / 100).toFixed(2);
}

export default function DesignUploader({ onCreated, editDesign }: DesignUploaderProps) {
  const isEditing = !!editDesign;
  const router = useRouter();

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createDesign = useMutation(api.designs.create);
  const updateDesign = useMutation(api.designs.update);

  // Main image
  const existingImageUrl = useQuery(
    api.storage.getUrl,
    editDesign ? { storageId: editDesign.imageStorageId } : "skip",
  );
  const mainFileRef = useRef<HTMLInputElement>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [shapePath, setShapePath] = useState<string>(editDesign?.shapePath ?? "");
  const [detecting, setDetecting] = useState(false);

  // Patch image
  const existingPatchUrl = useQuery(
    api.storage.getUrl,
    editDesign?.patchImageStorageId ? { storageId: editDesign.patchImageStorageId } : "skip",
  );
  const patchFileRef = useRef<HTMLInputElement>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [patchPreview, setPatchPreview] = useState<string | null>(null);

  // Embroidery image
  const existingEmbroideryUrl = useQuery(
    api.storage.getUrl,
    editDesign?.embroideryImageStorageId
      ? { storageId: editDesign.embroideryImageStorageId }
      : "skip",
  );
  const embroideryFileRef = useRef<HTMLInputElement>(null);
  const [embroideryFile, setEmbroideryFile] = useState<File | null>(null);
  const [embroideryPreview, setEmbroideryPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Type toggles
  const [stickerEnabled, setStickerEnabled] = useState(editDesign?.stickerEnabled ?? true);
  const [patchEnabled, setPatchEnabled] = useState(editDesign?.patchEnabled ?? true);
  const [embroideryEnabled, setEmbroideryEnabled] = useState(
    editDesign?.embroideryEnabled ?? false,
  );

  // Prices
  const [form, setForm] = useState({
    name: editDesign?.name ?? "",
    description: editDesign?.description ?? "",
    category: editDesign?.category ?? "",
    stickerPrice: editDesign ? cents(editDesign.stickerPrice) : "",
    patchPrice: editDesign ? cents(editDesign.patchPrice) : "",
    embroideryPriceLarge: editDesign ? cents(editDesign.embroideryPriceLarge) : "",
    embroideryPriceSmall: editDesign ? cents(editDesign.embroideryPriceSmall) : "",
    fixedSizeOnly: editDesign?.fixedSizeOnly ?? false,
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

  const handleTypeFileChange =
    (
      setFile: (f: File) => void,
      setPreview: (url: string) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
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
      let patchStorageId: Id<"_storage"> | undefined;
      let embroideryStorageId: Id<"_storage"> | undefined;

      if (mainFile) mainStorageId = await uploadFile(mainFile);
      if (patchFile) patchStorageId = await uploadFile(patchFile);
      if (embroideryFile) embroideryStorageId = await uploadFile(embroideryFile);

      const fields = {
        name: form.name,
        description: form.description,
        shapePath: shapePath || undefined,
        category: form.category || undefined,
        stickerEnabled,
        patchEnabled,
        embroideryEnabled,
        stickerPrice: toCents(form.stickerPrice),
        patchPrice: toCents(form.patchPrice),
        embroideryPriceLarge: toCents(form.embroideryPriceLarge),
        embroideryPriceSmall: toCents(form.embroideryPriceSmall),
        fixedSizeOnly: form.fixedSizeOnly,
        ...(patchStorageId ? { patchImageStorageId: patchStorageId } : {}),
        ...(embroideryStorageId ? { embroideryImageStorageId: embroideryStorageId } : {}),
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
        setPatchFile(null);
        setPatchPreview(null);
        setEmbroideryFile(null);
        setEmbroideryPreview(null);
        setForm({
          name: "", description: "", category: "",
          stickerPrice: "", patchPrice: "",
          embroideryPriceLarge: "", embroideryPriceSmall: "",
          fixedSizeOnly: false,
        });
        if (mainFileRef.current) mainFileRef.current.value = "";
        if (patchFileRef.current) patchFileRef.current.value = "";
        if (embroideryFileRef.current) embroideryFileRef.current.value = "";
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
            {isEditing ? "Main Image — Sticker (replace optional)" : "Main Image — Sticker (PNG, transparent background)"}
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

        {displayMain && (
          <div className="mb-4 flex gap-4">
            <ImagePreview src={displayMain} label={mainFile ? "new" : undefined} />
            {shapePath && (
              <ImagePreview src={displayMain} label="clip-path" clipPath={shapePath} />
            )}
            {detecting && <div className="flex items-center text-sm text-muted">Detecting shape...</div>}
          </div>
        )}

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
            placeholder="Describe the design for AI prompt context..."
            rows={2}
            className={inputCls + " resize-none"}
          />
        </div>
      </div>

      {/* ── STICKER ── */}
      <TypeSection
        label="Sticker"
        description="Printed die-cut vinyl sticker"
        enabled={stickerEnabled}
        onToggle={setStickerEnabled}
      >
        <PriceInput
          label="Price"
          value={form.stickerPrice}
          onChange={(v) => setForm((f) => ({ ...f, stickerPrice: v }))}
        />
        <p className="mt-2 text-xs text-muted">Uses main image above.</p>
      </TypeSection>

      {/* ── PATCH ── */}
      <TypeSection
        label="Patch"
        description="Embroidered patch with background fill and satin border"
        enabled={patchEnabled}
        onToggle={setPatchEnabled}
      >
        <PriceInput
          label="Price"
          value={form.patchPrice}
          onChange={(v) => setForm((f) => ({ ...f, patchPrice: v }))}
        />
        <div className="mt-3">
          <label className="mb-1 block text-sm text-muted">
            Patch Image (PNG — shows the background fill) — optional, falls back to main
          </label>
          <input
            ref={patchFileRef}
            type="file"
            accept="image/png"
            onChange={handleTypeFileChange(setPatchFile, setPatchPreview)}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
          />
          {(patchPreview ?? existingPatchUrl) && (
            <div className="mt-2">
              <ImagePreview
                src={patchPreview ?? existingPatchUrl!}
                label={patchFile ? "new" : undefined}
              />
            </div>
          )}
        </div>
      </TypeSection>

      {/* ── EMBROIDERY ── */}
      <TypeSection
        label="Embroidery"
        description="Design stitched directly onto clothing — no backing"
        enabled={embroideryEnabled}
        onToggle={setEmbroideryEnabled}
      >
        <div className="grid grid-cols-2 gap-3">
          <PriceInput
            label="Large price"
            value={form.embroideryPriceLarge}
            onChange={(v) => setForm((f) => ({ ...f, embroideryPriceLarge: v }))}
          />
          <PriceInput
            label="Small price"
            value={form.embroideryPriceSmall}
            onChange={(v) => setForm((f) => ({ ...f, embroideryPriceSmall: v }))}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.fixedSizeOnly}
            onChange={(e) => setForm((f) => ({ ...f, fixedSizeOnly: e.target.checked }))}
            className="rounded border-border"
          />
          <span className="text-muted">Fixed size only (hide large/small toggle)</span>
        </label>
        <div className="mt-3">
          <label className="mb-1 block text-sm text-muted">
            Embroidery Image (PNG — design without background patch) — optional, falls back to main
          </label>
          <input
            ref={embroideryFileRef}
            type="file"
            accept="image/png"
            onChange={handleTypeFileChange(setEmbroideryFile, setEmbroideryPreview)}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
          />
          {(embroideryPreview ?? existingEmbroideryUrl) && (
            <div className="mt-2">
              <ImagePreview
                src={embroideryPreview ?? existingEmbroideryUrl!}
                label={embroideryFile ? "new" : undefined}
              />
            </div>
          )}
        </div>
      </TypeSection>

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
          disabled={(!mainFile && !isEditing) || !form.name || saving}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Design"}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TypeSection({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 transition-colors ${enabled ? "border-secondary/40" : "border-border opacity-60"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 rounded border-border accent-secondary"
        />
        <div>
          <p className="font-medium leading-none">{label}</p>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </label>
      {enabled && <div className="mt-4 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function ImagePreview({
  src,
  label,
  clipPath,
}: {
  src: string;
  label?: string;
  clipPath?: string;
}) {
  return (
    <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border bg-background">
      <img
        src={src}
        alt="Preview"
        className="h-full w-full object-contain"
        style={clipPath ? { clipPath: `path("${clipPath}")` } : undefined}
      />
      {label && (
        <span className="absolute bottom-1 right-1 rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] text-background">
          {label}
        </span>
      )}
    </div>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors"
        />
      </div>
    </div>
  );
}
