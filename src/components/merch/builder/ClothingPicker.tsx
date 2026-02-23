"use client";

import { useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ClothingItem {
    _id: Id<"clothingItems">;
    name: string;
    basePrice: number;
    imageStorageId?: Id<"_storage">;
    frontImageStorageId?: Id<"_storage">;
    availableSizes?: string[];
}

export default function ClothingPicker({
    items,
    selectedId,
    onSelect,
    onToggleCustom,
    onCustomFile,
    isCustomClothing,
    customFrontUrl,
    customBackUrl,
    selectedSize,
    onSizeChange,
}: {
    items: ClothingItem[];
    selectedId: Id<"clothingItems"> | null;
    onSelect: (id: Id<"clothingItems">) => void;
    onToggleCustom: () => void;
    onCustomFile: (view: "front" | "back", file: File) => void;
    isCustomClothing: boolean;
    customFrontUrl?: string;
    customBackUrl?: string;
    selectedSize: string | null;
    onSizeChange: (size: string) => void;
}) {
    const selectedItem = items.find((i) => i._id === selectedId);
    const frontRef = useRef<HTMLInputElement>(null);
    const backRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                    <ClothingCard
                        key={item._id}
                        item={item}
                        selected={selectedId === item._id}
                        onSelect={() => onSelect(item._id)}
                    />
                ))}

                {/* Upload your own — same card format */}
                <button
                    onClick={onToggleCustom}
                    className={`rounded-lg border p-2 text-left transition-all ${
                        isCustomClothing
                            ? "border-secondary bg-secondary/10 ring-1 ring-secondary/30"
                            : "border-border bg-background hover:border-secondary/30"
                    }`}
                >
                    <div className="mb-1.5 aspect-square overflow-hidden rounded-md bg-card">
                        {customFrontUrl ? (
                            <img src={customFrontUrl} alt="Your clothing" className="h-full w-full object-contain p-1" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <span className="text-2xl text-muted">+</span>
                            </div>
                        )}
                    </div>
                    <p className="truncate text-xs font-medium">Upload Your Own</p>
                    <p className="text-[10px] text-muted">$10.00 fee</p>
                </button>
            </div>

            {/* Front / Back upload zones — shown when custom is active */}
            {isCustomClothing && (
                <div className="grid grid-cols-2 gap-2">
                    {/* Hidden inputs */}
                    <input
                        ref={frontRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onCustomFile("front", f);
                            if (frontRef.current) frontRef.current.value = "";
                        }}
                    />
                    <input
                        ref={backRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onCustomFile("back", f);
                            if (backRef.current) backRef.current.value = "";
                        }}
                    />

                    {/* Front zone */}
                    <button
                        onClick={() => frontRef.current?.click()}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-2 transition-colors hover:border-secondary/40"
                    >
                        <div className="aspect-square w-full overflow-hidden rounded-md bg-card">
                            {customFrontUrl ? (
                                <img src={customFrontUrl} alt="Front" className="h-full w-full object-contain p-1" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <span className="text-lg text-muted/40">+</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-medium text-muted">
                            {customFrontUrl ? "Replace front" : "Front"}
                        </p>
                    </button>

                    {/* Back zone */}
                    <button
                        onClick={() => backRef.current?.click()}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-2 transition-colors hover:border-secondary/40"
                    >
                        <div className="aspect-square w-full overflow-hidden rounded-md bg-card">
                            {customBackUrl ? (
                                <img src={customBackUrl} alt="Back" className="h-full w-full object-contain p-1" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <span className="text-lg text-muted/40">+</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-medium text-muted">
                            {customBackUrl ? "Replace back" : "Back"}
                        </p>
                    </button>
                </div>
            )}

            {/* Size selector */}
            {selectedItem?.availableSizes && selectedItem.availableSizes.length > 0 && (
                <div className="pt-2">
                    <p className="mb-2 text-xs font-medium text-muted">Size</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedItem.availableSizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => onSizeChange(size)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${selectedSize === size
                                        ? "bg-secondary text-background"
                                        : "bg-background border border-border text-foreground hover:border-secondary/40"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ClothingCard({
    item,
    selected,
    onSelect,
}: {
    item: ClothingItem;
    selected: boolean;
    onSelect: () => void;
}) {
    const storageId = item.frontImageStorageId ?? item.imageStorageId;
    const imageUrl = useQuery(
        api.storage.getUrl,
        storageId ? { storageId } : "skip",
    );

    return (
        <button
            onClick={onSelect}
            className={`rounded-lg border p-2 text-left transition-all ${selected
                    ? "border-secondary bg-secondary/10 ring-1 ring-secondary/30"
                    : "border-border bg-background hover:border-secondary/30"
                }`}
        >
            {imageUrl && (
                <div className="mb-1.5 aspect-square overflow-hidden rounded-md bg-card">
                    <img src={imageUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                </div>
            )}
            <p className="truncate text-xs font-medium">{item.name}</p>
            <p className="text-[10px] text-muted">${(item.basePrice / 100).toFixed(2)}</p>
        </button>
    );
}
