"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const LOGO_TYPES = [
    { value: "satin_outline", label: "Satin Outline" },
    { value: "filled", label: "Filled" },
    { value: "patch_backed", label: "Patch Backed" },
] as const;

type LogoType = (typeof LOGO_TYPES)[number]["value"];

export default function LogoVariantsAdminPage() {
    const variants = useQuery(api.logoVariants.list);
    const createVariant = useMutation(api.logoVariants.create);
    const updateVariant = useMutation(api.logoVariants.update);
    const removeVariant = useMutation(api.logoVariants.remove);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<Id<"logoVariants"> | null>(null);
    const [existingImageId, setExistingImageId] = useState<Id<"_storage"> | null>(null);
    const existingImageUrl = useQuery(api.storage.getUrl, existingImageId && !filePreview ? { storageId: existingImageId } : "skip");
    const displayMain = filePreview ?? existingImageUrl;

    const [form, setForm] = useState({
        name: "",
        type: "satin_outline" as LogoType,
        price: "",
        fixedSize: "20",
    });

    const handleEdit = (variant: {
        _id: Id<"logoVariants">;
        name: string;
        type: LogoType;
        price: number;
        fixedSize?: number;
        imageStorageId: Id<"_storage">;
    }) => {
        setEditingId(variant._id);
        setForm({
            name: variant.name,
            type: variant.type,
            price: (variant.price / 100).toFixed(2),
            fixedSize: variant.fixedSize ? Math.round(variant.fixedSize * 100).toString() : "20",
        });
        setExistingImageId(variant.imageStorageId);
        setFile(null);
        setFilePreview(null);
        if (fileRef.current) fileRef.current.value = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setExistingImageId(null);
        setFile(null);
        setFilePreview(null);
        setForm({ name: "", type: "satin_outline", price: "", fixedSize: "20" });
        if (fileRef.current) fileRef.current.value = "";
    };

    const uploadFile = async (f: File) => {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": f.type },
            body: f,
        });
        const { storageId } = await result.json();
        return storageId as Id<"_storage">;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && !file) {
            alert("Image is required to create a new logo variant.");
            return;
        }

        setSaving(true);
        try {
            let imageId = existingImageId;
            if (file) {
                imageId = await uploadFile(file);
            }

            const fixedSizeDec = parseFloat(form.fixedSize) / 100;
            if (editingId) {
                await updateVariant({
                    id: editingId,
                    name: form.name,
                    type: form.type,
                    price: Math.round(parseFloat(form.price || "0") * 100),
                    fixedSize: fixedSizeDec,
                    ...(imageId ? { imageStorageId: imageId } : {}),
                });
            } else {
                if (!imageId) throw new Error("Missing image");
                await createVariant({
                    name: form.name,
                    type: form.type,
                    price: Math.round(parseFloat(form.price || "0") * 100),
                    fixedSize: fixedSizeDec,
                    imageStorageId: imageId,
                });
            }
            cancelEdit();
        } catch (err) {
            console.error("Failed to save logo variant:", err);
            alert("Error saving. See console.");
        }
        setSaving(false);
    };

    const inputCls =
        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">Logo Variants</h1>

            {/* Create / Edit form */}
            <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{editingId ? "Edit Logo Variant" : "Add Logo Variant"}</h3>
                    {editingId && (
                        <button type="button" onClick={cancelEdit} className="text-xs text-muted hover:text-foreground underline">
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium">
                        Logo Image <span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                                setFile(f);
                                setFilePreview(URL.createObjectURL(f));
                            }
                        }}
                        className="mb-2 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary file:cursor-pointer w-full"
                    />
                    <ImagePreview filePreview={filePreview} storageId={!file ? existingImageId : null} />
                </div>

                <div className="mb-4 grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm text-muted">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Gold Logo"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-muted">Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LogoType }))}
                            className={inputCls}
                        >
                            {LOGO_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-muted">Price Upcharge ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                            placeholder="0.00"
                            className={inputCls}
                        />
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-border bg-background/50 p-4">
                    <p className="mb-2 text-sm font-medium">Logo Size Slider</p>
                    <p className="mb-4 text-xs text-muted">Adjust the slider below to set the default size relative to the width of the clothing.</p>

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 max-w-[300px]">
                            <label className="mb-1 block text-sm text-muted">Logo Size ({form.fixedSize}% width)</label>
                            <div className="flex items-center gap-4 mb-4">
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    value={form.fixedSize}
                                    onChange={(e) => setForm((f) => ({ ...f, fixedSize: e.target.value }))}
                                    className="w-full accent-secondary"
                                />
                                <span className="text-sm font-medium w-12 text-right">{form.fixedSize}%</span>
                            </div>

                            <div className="relative w-full aspect-[3/4] bg-secondary/5 rounded-xl border border-border flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/50 -translate-x-1/2" />
                                <div className="absolute left-0 right-0 top-1/3 h-px bg-border/50" />

                                {displayMain ? (
                                    <img
                                        src={displayMain}
                                        className="absolute top-1/3 -translate-y-1/2 drop-shadow-md transition-all duration-200"
                                        style={{ width: `${form.fixedSize}%`, height: 'auto', objectFit: 'contain' }}
                                        alt="preview"
                                    />
                                ) : (
                                    <div className="text-muted text-xs text-center px-4">Upload an image above to see sizing preview</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={(!editingId && !file) || !form.name || saving}
                    className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Logo Variant"}
                </button>
            </form>

            {/* Existing variants */}
            <h2 className="mb-4 text-lg font-semibold">
                All Variants ({variants?.length ?? 0})
            </h2>

            {!variants ? (
                <div className="text-muted">Loading...</div>
            ) : variants.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
                    No logo variants yet. Add one above.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {variants.map((v) => (
                        <LogoCard
                            key={v._id}
                            variant={v as { _id: Id<"logoVariants">; name: string; type: LogoType; price: number; fixedSize?: number; imageStorageId: Id<"_storage"> }}
                            onEdit={() => handleEdit(v as { _id: Id<"logoVariants">; name: string; type: LogoType; price: number; fixedSize?: number; imageStorageId: Id<"_storage"> })}
                            onDelete={() => {
                                if (confirm("Delete this logo variant?")) removeVariant({ id: v._id });
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ImagePreview({ filePreview, storageId }: { filePreview: string | null; storageId: Id<"_storage"> | null }) {
    const url = useQuery(api.storage.getUrl, storageId && !filePreview ? { storageId } : "skip");
    const displayUrl = filePreview ?? url;

    if (!displayUrl) return null;

    return (
        <div className="h-24 w-24 overflow-hidden rounded-lg border border-border bg-background p-1">
            <img src={displayUrl} alt="Preview" className="h-full w-full object-contain" />
        </div>
    );
}

function LogoCard({
    variant,
    onEdit,
    onDelete,
}: {
    variant: { _id: Id<"logoVariants">; name: string; type: string; price: number; fixedSize?: number; imageStorageId: Id<"_storage"> };
    onEdit: () => void;
    onDelete: () => void;
}) {
    const imgUrl = useQuery(api.storage.getUrl, { storageId: variant.imageStorageId });

    const typeLabel = LOGO_TYPES.find((t) => t.value === variant.type)?.label ?? variant.type;

    return (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <div className="mb-3 h-32 overflow-hidden rounded-lg bg-background p-2 border border-border/50 flex items-center justify-center">
                {imgUrl ? (
                    <img src={imgUrl} alt={variant.name} className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                )}
            </div>
            <h3 className="font-semibold">{variant.name}</h3>
            <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">{typeLabel}</span>
                <span className="text-sm text-muted">
                    {variant.price > 0 ? `+$${(variant.price / 100).toFixed(2)}` : "Free"}
                </span>
            </div>
            {variant.fixedSize && (
                <div className="mt-1 text-xs text-muted">
                    Size: {Math.round(variant.fixedSize * 100)}% width
                </div>
            )}
            <div className="mt-4 pt-3 border-t border-border/50 flex gap-2 items-center">
                <button onClick={onEdit} className="rounded bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors">
                    Edit
                </button>
                <button onClick={onDelete} className="ml-auto rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    );
}
