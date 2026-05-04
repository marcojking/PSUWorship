"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

// ─── Embroidery Card Image Settings ───────────────────────────────────────────

function EmbroideryCardSettings() {
  const cardImageId = useQuery(api.settings.get, { key: "embroidery_card_image" });
  const currentImageUrl = useQuery(
    api.storage.getUrl,
    cardImageId ? { storageId: cardImageId as Id<"_storage"> } : "skip",
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const setSetting = useMutation(api.settings.set);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!supported.includes(file.type)) {
      setUploadError(
        `Unsupported format (${file.type || file.name.split(".").pop()}). Please upload a JPG, PNG, or WebP.`
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!result.ok) throw new Error(`Upload failed: ${result.status}`);
      const text = await result.text();
      let storageId: string | undefined;
      try {
        const json = JSON.parse(text);
        storageId = json.storageId;
        if (!storageId) throw new Error(`Unexpected response shape: ${text}`);
      } catch {
        throw new Error(`Non-JSON response: ${text}`);
      }
      if (!storageId) throw new Error(`No storageId in response: ${text}`);
      await setSetting({ key: "embroidery_card_image", value: storageId });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
      console.error("Failed to upload embroidery card image:", err);
    }
    setUploading(false);
  };

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Custom Embroidery Card Photo</h3>
      <p className="mb-4 text-sm text-muted">
        This image appears on the Custom Embroidery card in the shop grid.
      </p>
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Embroidery card" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted/50">
              No image
            </div>
          )}
        </div>

        {/* Upload */}
        <div>
          <label className="mb-1 block text-sm text-muted">
            {currentImageUrl ? "Replace photo" : "Upload photo"}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            disabled={uploading}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer disabled:opacity-50"
          />
          {uploading && <p className="mt-1 text-xs text-muted">Uploading...</p>}
          {uploadError && <p className="mt-1 text-xs text-red-400 break-all">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}

type ProductType = "premade" | "bundle" | "limited";

type SizeRow = { size: string; quantity: string };

type Product = {
  _id: Id<"standaloneProducts">;
  name: string;
  description: string;
  price: number;
  type: string;
  quantity: number;
  active: boolean;
  bundleContents?: string[];
  imageStorageIds: Id<"_storage">[];
  sizeInventory?: { size: string; quantity: number }[];
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// ─── Size Inventory Editor ─────────────────────────────────────────────────────

function SizeInventoryEditor({
  rows,
  onChange,
}: {
  rows: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
}) {
  const usedSizes = new Set(rows.map((r) => r.size));
  const nextSize = SIZES.find((s) => !usedSizes.has(s)) ?? "";
  const addRow = () => onChange([...rows, { size: nextSize, quantity: "1" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof SizeRow, value: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm text-muted">Sizes & Stock</label>
        <button
          type="button"
          onClick={addRow}
          disabled={usedSizes.size >= SIZES.length}
          className="rounded bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary disabled:opacity-40"
        >
          + Add size
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted/60">No sizes added. Click + Add size to track per-size inventory.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.size}
                onChange={(e) => updateRow(i, "size", e.target.value)}
                className={inputCls + " flex-1"}
              >
                {SIZES.map((s) => (
                  <option key={s} value={s} disabled={usedSizes.has(s) && s !== row.size}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
                className={inputCls + " w-20"}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="shrink-0 text-muted hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const updateProduct = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    price: (product.price / 100).toFixed(2),
    type: product.type as ProductType,
    quantity: String(product.quantity),
    bundleContents: product.bundleContents?.join(", ") ?? "",
  });
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    product.sizeInventory?.map((s) => ({ size: s.size, quantity: String(s.quantity) })) ?? [],
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageStorageIds = product.imageStorageIds;

      if (files.length > 0) {
        const newIds: Id<"_storage">[] = [];
        for (const file of files) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await result.json();
          newIds.push(storageId as Id<"_storage">);
        }
        imageStorageIds = [...imageStorageIds, ...newIds];
      }

      const bundleContents = form.bundleContents
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Build size inventory — only for premade, only rows with a size name
      const sizeInventory =
        form.type === "premade" && sizeRows.length > 0
          ? sizeRows
              .filter((r) => r.size.trim())
              .map((r) => ({ size: r.size.trim(), quantity: parseInt(r.quantity) || 0 }))
          : undefined;

      // If using size inventory, total quantity = sum of all sizes
      const totalQty =
        sizeInventory
          ? sizeInventory.reduce((sum, s) => sum + s.quantity, 0)
          : parseInt(form.quantity) || 0;

      await updateProduct({
        id: product._id,
        name: form.name,
        description: form.description,
        price: Math.round(parseFloat(form.price) * 100),
        type: form.type,
        quantity: totalQty,
        bundleContents: bundleContents.length > 0 ? bundleContents : undefined,
        imageStorageIds,
        sizeInventory,
      });

      onClose();
    } catch (err) {
      console.error("Failed to update product:", err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold">Edit Product</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))}
                className={inputCls}
              >
                <option value="premade">Pre-made</option>
                <option value="bundle">Bundle</option>
                <option value="limited">Limited Edition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Description</label>
            <textarea
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputCls + " resize-none"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputCls}
              />
            </div>
            {form.type !== "premade" || sizeRows.length === 0 ? (
              <div>
                <label className="mb-1 block text-sm text-muted">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className={inputCls}
                />
              </div>
            ) : (
              <div className="flex items-end">
                <p className="text-xs text-muted">
                  Total qty auto-calculated from sizes
                </p>
              </div>
            )}
          </div>

          {/* Size inventory — only for premade */}
          {form.type === "premade" && (
            <SizeInventoryEditor rows={sizeRows} onChange={setSizeRows} />
          )}

          {/* Bundle contents */}
          {form.type === "bundle" && (
            <div>
              <label className="mb-1 block text-sm text-muted">Bundle Contents</label>
              <input
                type="text"
                value={form.bundleContents}
                onChange={(e) => setForm((f) => ({ ...f, bundleContents: e.target.value }))}
                placeholder="Item 1, Item 2"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-muted">
              Add Photos{" "}
              <span className="text-xs text-muted/60">
                (appends to existing {product.imageStorageIds.length} image
                {product.imageStorageIds.length !== 1 ? "s" : ""})
              </span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-muted">{files.length} new file(s) selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-secondary px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StandaloneAdminPage() {
  const products = useQuery(api.products.list, {});
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    type: "premade" as ProductType,
    quantity: "1",
    bundleContents: "",
  });
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setSaving(true);

    try {
      const storageIds: Id<"_storage">[] = [];
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        storageIds.push(storageId as Id<"_storage">);
      }

      const bundleContents = form.bundleContents
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const sizeInventory =
        form.type === "premade" && sizeRows.length > 0
          ? sizeRows
              .filter((r) => r.size.trim())
              .map((r) => ({ size: r.size.trim(), quantity: parseInt(r.quantity) || 0 }))
          : undefined;

      const totalQty = sizeInventory
        ? sizeInventory.reduce((sum, s) => sum + s.quantity, 0)
        : parseInt(form.quantity) || 1;

      await createProduct({
        name: form.name,
        description: form.description,
        imageStorageIds: storageIds,
        price: Math.round(parseFloat(form.price) * 100),
        type: form.type,
        quantity: totalQty,
        bundleContents: bundleContents.length > 0 ? bundleContents : undefined,
        sizeInventory,
      });

      setFiles([]);
      setSizeRows([]);
      setForm({ name: "", description: "", price: "", type: "premade", quantity: "1", bundleContents: "" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("Failed to create product:", err);
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Standalone Products</h1>

      <EmbroideryCardSettings />

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Add Product</h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted">Photos</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-muted">{files.length} file(s) selected</p>
          )}
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Matt 6 Gray Sweater"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Type</label>
            <select
              value={form.type}
              onChange={(e) => {
                setForm((f) => ({ ...f, type: e.target.value as ProductType }));
                setSizeRows([]);
              }}
              className={inputCls}
            >
              <option value="premade">Pre-made</option>
              <option value="bundle">Bundle</option>
              <option value="limited">Limited Edition</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted">Description</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className={inputCls + " resize-none"}
          />
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className={inputCls}
            />
          </div>
          {form.type !== "premade" || sizeRows.length === 0 ? (
            <div>
              <label className="mb-1 block text-sm text-muted">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className={inputCls}
              />
            </div>
          ) : (
            <div className="flex items-end pb-2">
              <p className="text-xs text-muted">Qty auto-calculated from sizes</p>
            </div>
          )}
        </div>

        {/* Size inventory — premade only */}
        {form.type === "premade" && (
          <div className="mb-4">
            <SizeInventoryEditor rows={sizeRows} onChange={setSizeRows} />
          </div>
        )}

        {/* Bundle contents */}
        {form.type === "bundle" && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted">Bundle Contents</label>
            <input
              type="text"
              value={form.bundleContents}
              onChange={(e) => setForm((f) => ({ ...f, bundleContents: e.target.value }))}
              placeholder="Item 1, Item 2"
              className={inputCls}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={files.length === 0 || !form.name || saving}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Uploading..." : "Add Product"}
        </button>
      </form>

      {/* Existing products */}
      <h2 className="mb-4 text-lg font-semibold">All Products ({products?.length ?? 0})</h2>

      {!products ? (
        <div className="text-muted">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
          No standalone products yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <AdminProductCard
              key={product._id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onToggleActive={() => updateProduct({ id: product._id, active: !product.active })}
              onDelete={() => {
                if (confirm("Delete this product?")) removeProduct({ id: product._id });
              }}
            />
          ))}
        </div>
      )}

      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

// ─── Admin Product Card ────────────────────────────────────────────────────────

function AdminProductCard({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const firstImageUrl = useQuery(
    api.storage.getUrl,
    product.imageStorageIds.length > 0 ? { storageId: product.imageStorageIds[0] } : "skip",
  );

  const typeLabel =
    { premade: "Pre-made", bundle: "Bundle", limited: "Limited" }[product.type as ProductType] ??
    product.type;

  const hasSizes = (product.sizeInventory?.length ?? 0) > 0;

  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        product.active ? "border-border" : "border-border/50 opacity-60"
      }`}
    >
      {firstImageUrl && (
        <div className="mb-3 h-32 overflow-hidden rounded-lg bg-background">
          <img src={firstImageUrl} alt={product.name} className="h-full w-full object-contain" />
        </div>
      )}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-semibold">{product.name}</h3>
        <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
          {typeLabel}
        </span>
      </div>
      <p className="text-sm text-muted">
        ${(product.price / 100).toFixed(2)} ·{" "}
        {hasSizes ? (
          <span>
            {product.sizeInventory!
              .map((s) => `${s.size}:${s.quantity}`)
              .join(", ")}
          </span>
        ) : (
          `${product.quantity} in stock`
        )}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onEdit}
          className="rounded bg-secondary/20 px-2.5 py-1 text-xs font-medium text-secondary"
        >
          Edit
        </button>
        <button
          onClick={onToggleActive}
          className="rounded bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent"
        >
          {product.active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={onDelete}
          className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
