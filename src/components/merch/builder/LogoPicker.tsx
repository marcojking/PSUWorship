"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface LogoVariant {
    _id: Id<"logoVariants">;
    type: "satin_outline" | "filled" | "patch_backed";
    name: string;
    imageStorageId: Id<"_storage">;
    price: number;
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
    satin_outline: "Clean, minimalist stitching around the logo outline",
    filled: "Dense, fully filled embroidery for bold presence",
    patch_backed: "Embroidered patch sewn onto the garment",
};

export default function LogoPicker({
    variants,
    selectedId,
    onSelect,
}: {
    variants: LogoVariant[];
    selectedId: Id<"logoVariants"> | null;
    onSelect: (id: Id<"logoVariants">) => void;
}) {
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted">Required — choose a PSU Worship logo style</p>
            {variants.map((variant) => (
                <LogoCard
                    key={variant._id}
                    variant={variant}
                    selected={selectedId === variant._id}
                    onSelect={() => onSelect(variant._id)}
                />
            ))}
            {variants.length === 0 && (
                <p className="text-xs text-muted italic">No logo variants configured yet.</p>
            )}
        </div>
    );
}

function LogoCard({
    variant,
    selected,
    onSelect,
}: {
    variant: LogoVariant;
    selected: boolean;
    onSelect: () => void;
}) {
    const imageUrl = useQuery(api.storage.getUrl, { storageId: variant.imageStorageId });

    return (
        <button
            onClick={onSelect}
            className={`w-full rounded-lg border p-3 text-left transition-all ${selected
                    ? "border-secondary bg-secondary/10 ring-1 ring-secondary/30"
                    : "border-border bg-background hover:border-secondary/30"
                }`}
        >
            <div className="flex items-center gap-3">
                {imageUrl && (
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-card">
                        <img src={imageUrl} alt={variant.name} className="h-full w-full object-contain p-1" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{variant.name}</p>
                    <p className="text-[10px] text-muted">{TYPE_DESCRIPTIONS[variant.type] ?? ""}</p>
                    {variant.price > 0 && (
                        <p className="mt-0.5 text-[10px] text-secondary">+${(variant.price / 100).toFixed(2)}</p>
                    )}
                </div>
                <div
                    className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${selected ? "border-secondary bg-secondary" : "border-border"
                        }`}
                />
            </div>
        </button>
    );
}
