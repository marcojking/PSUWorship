"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface DesignItem {
    _id: Id<"designs">;
    name: string;
    imageStorageId: Id<"_storage">;
    embroideryPrice?: number;
    embroideryEnabled?: boolean;
}

export default function DesignPicker({
    designs,
    selectedIds,
    onAdd,
    onNext,
}: {
    designs: DesignItem[];
    selectedIds: Id<"designs">[];
    onAdd: (id: Id<"designs">) => void;
    onNext?: () => void;
}) {
    const embroideryDesigns = designs.filter((d) => d.embroideryEnabled !== false);

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted">Tap to add (multi-select)</p>
            <div className="grid grid-cols-2 gap-2">
                {embroideryDesigns.map((design) => {
                    const count = selectedIds.filter((id) => id === design._id).length;
                    return (
                        <DesignCard
                            key={design._id}
                            design={design}
                            count={count}
                            onAdd={() => onAdd(design._id)}
                        />
                    );
                })}
            </div>
            {onNext && selectedIds.length > 0 && (
                <button
                    onClick={onNext}
                    className="w-full rounded-lg bg-secondary px-4 py-2.5 text-xs font-medium text-background"
                >
                    Next: Choose Logo →
                </button>
            )}
        </div>
    );
}

function DesignCard({
    design,
    count,
    onAdd,
}: {
    design: DesignItem;
    count: number;
    onAdd: () => void;
}) {
    const imageUrl = useQuery(api.storage.getUrl, { storageId: design.imageStorageId });
    const price = design.embroideryPrice ?? 0;

    return (
        <button
            onClick={onAdd}
            className={`relative rounded-lg border p-2 text-left transition-all ${count > 0
                    ? "border-secondary bg-secondary/10"
                    : "border-border bg-background hover:border-secondary/30"
                }`}
        >
            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-background">
                    {count}
                </span>
            )}
            {imageUrl && (
                <div className="mb-1.5 aspect-square overflow-hidden rounded-md bg-card">
                    <img src={imageUrl} alt={design.name} className="h-full w-full object-contain" />
                </div>
            )}
            <p className="truncate text-xs font-medium">{design.name}</p>
            <p className="text-[10px] text-muted">+${(price / 100).toFixed(2)}</p>
        </button>
    );
}
