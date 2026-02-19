"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type ProductType = "premade" | "bundle" | "limited";

export default function StandaloneAdminPage() {
  const products = useQuery(api.products.list, {});
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    type: "premade" as ProductType,
    quantity: "1",
    bundleContents: "",
  });

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

      await createProduct({
        name: form.name,
        description: form.description,
        imageStorageIds: storageIds,
        price: Math.round(parseFloat(form.price) * 100),
        type: form.type,
        quantity: parseInt(form.quantity) || 1,
        bundleContents: bundleContents.length > 0 ? bundleContents : undefined,
      });

      setFiles([]);
      setForm({ name: "", description: "", price: "", type: "premade", quantity: "1", bundleContents: "" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("Failed to create product:", err);
    }
    setSaving(false);
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Standalone Products</h1>

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
              placeholder="Starter Bundle"
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

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
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
        </div>

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
            <ProductCard
              key={product._id}
              product={product}
              onToggleActive={() => updateProduct({ id: product._id, active: !product.active })}
              onDelete={() => {
                if (confirm("Delete this product?")) removeProduct({ id: product._id });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onToggleActive,
  onDelete,
}: {
  product: {
    _id: Id<"standaloneProducts">;
    name: string;
    description: string;
    price: number;
    type: string;
    quantity: number;
    active: boolean;
    imageStorageIds: Id<"_storage">[];
  };
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const firstImageUrl = useQuery(
    api.storage.getUrl,
    product.imageStorageIds.length > 0 ? { storageId: product.imageStorageIds[0] } : "skip",
  );

  const typeLabel = { premade: "Pre-made", bundle: "Bundle", limited: "Limited" }[product.type] ?? product.type;

  return (
    <div className={`rounded-xl border bg-card p-4 ${product.active ? "border-border" : "border-border/50 opacity-60"}`}>
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
      <p className="text-sm text-muted">${(product.price / 100).toFixed(2)} · {product.quantity} in stock</p>
      <div className="mt-3 flex gap-2">
        <button onClick={onToggleActive} className="rounded bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
          {product.active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={onDelete} className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}
