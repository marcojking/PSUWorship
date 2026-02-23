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
    onUploadOwn,
    isCustomClothing,
    customThumbnail,
    selectedSize,
    onSizeChange,
}: {
    items: ClothingItem[];
    selectedId: Id<"clothingItems"> | null;
    onSelect: (id: Id<"clothingItems">) => void;
    onUploadOwn: (files: File[]) => void;
    isCustomClothing: boolean;
    customThumbnail?: string;
    selectedSize: string | null;
    onSizeChange: (size: string) => void;
}) {
    const selectedItem = items.find((i) => i._id === selectedId);
    const uploadRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-3">
            {/* Hidden file input */}
            <input
                ref={uploadRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) onUploadOwn(files);
                    if (uploadRef.current) uploadRef.current.value = "";
                }}
            />

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
                    onClick={() => uploadRef.current?.click()}
                    className={`rounded-lg border p-2 text-left transition-all ${
                        isCustomClothing
                            ? "border-secondary bg-secondary/10 ring-1 ring-secondary/30"
                            : "border-border bg-background hover:border-secondary/30"
                    }`}
                >
                    <div className="mb-1.5 aspect-square overflow-hidden rounded-md bg-card">
                        {customThumbnail ? (
                            <img src={customThumbnail} alt="Your clothing" className="h-full w-full object-contain p-1" />
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
