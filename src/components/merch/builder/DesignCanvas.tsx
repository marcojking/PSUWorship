"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from "react-konva";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import type { DesignPlacement, LogoPlacement } from "./MerchBuilder";
import useImage from "use-image";
import Konva from "konva";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClothingItemData {
    _id: Id<"clothingItems">;
    name: string;
    imageStorageId?: Id<"_storage">;
    frontImageStorageId?: Id<"_storage">;
    backImageStorageId?: Id<"_storage">;
}

interface LogoVariantData {
    _id: Id<"logoVariants">;
    imageStorageId: Id<"_storage">;
}

interface DesignData {
    _id: Id<"designs">;
    name: string;
    imageStorageId: Id<"_storage">;
    fixedSize?: number;
}

// ─── Canvas sizes ────────────────────────────────────────────────────────────

const CANVAS_W = 450;
const CANVAS_H = 550;
const MIN_SIZE = 30;
const MAX_SIZE = 250;

// ─── Component ───────────────────────────────────────────────────────────────

export default function DesignCanvas({
    clothingItem,
    customViewUrls,
    placements,
    logoPlacement,
    logoVariant,
    activeView,
    onViewChange,
    onUpdatePlacement,
    onRemovePlacement,
    designs,
}: {
    clothingItem: ClothingItemData | null | undefined;
    customViewUrls?: { label: string; url: string }[];
    placements: DesignPlacement[];
    logoPlacement: LogoPlacement | null;
    logoVariant: LogoVariantData | null | undefined;
    activeView: "front" | "back";
    onViewChange: (v: "front" | "back") => void;
    onUpdatePlacement: (index: number, p: DesignPlacement) => void;
    onRemovePlacement: (index: number) => void;
    designs: DesignData[];
}) {
    const stageRef = useRef<Konva.Stage>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Resolve clothing image
    const frontStorageId = clothingItem?.frontImageStorageId ?? clothingItem?.imageStorageId;
    const backStorageId = clothingItem?.backImageStorageId;
    const frontUrl = useQuery(api.storage.getUrl, frontStorageId ? { storageId: frontStorageId } : "skip");
    const backUrl = useQuery(api.storage.getUrl, backStorageId ? { storageId: backStorageId } : "skip");

    // Use custom uploaded image if available, otherwise use Convex clothing image
    const customUrl = customViewUrls?.[0]?.url;
    const clothingUrl = customUrl ?? (activeView === "front" ? frontUrl : backUrl);
    const [clothingImage] = useImage(clothingUrl ?? "", "anonymous");

    // Filter placements for current view
    const viewPlacements = placements
        .map((p, i) => ({ ...p, originalIndex: i }))
        .filter((p) => p.view === activeView);

    const exportCanvas = useCallback(() => {
        if (!stageRef.current) return null;
        return stageRef.current.toDataURL({ pixelRatio: 2 });
    }, []);

    // Expose export method on window for parent (MerchBuilder) to call
    useEffect(() => {
        (window as unknown as Record<string, unknown>).__exportMerchCanvas = exportCanvas;
        return () => { delete (window as unknown as Record<string, unknown>).__exportMerchCanvas; };
    }, [exportCanvas]);

    return (
        <div>
            {/* View tabs */}
            <div className="mb-3 flex gap-2">
                {(["front", "back"] as const).map((view) => (
                    <button
                        key={view}
                        onClick={() => { onViewChange(view); setSelectedId(null); }}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${activeView === view
                                ? "bg-secondary text-background"
                                : "bg-card text-muted border border-border hover:border-secondary/30"
                            }`}
                    >
                        {view}
                    </button>
                ))}
            </div>

            {/* Canvas */}
            <div
                className="relative overflow-hidden rounded-lg border border-border bg-background"
                style={{ width: CANVAS_W, maxWidth: "100%", aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
                onClick={() => setSelectedId(null)}
            >
                <Stage
                    ref={stageRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    style={{ width: "100%", height: "100%" }}
                >
                    <Layer>
                        {/* Clothing background */}
                        {clothingImage && (
                            <KonvaImage
                                image={clothingImage}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                listening={false}
                            />
                        )}

                        {/* If no clothing, show placeholder */}
                        {!clothingImage && (
                            <Rect
                                width={CANVAS_W}
                                height={CANVAS_H}
                                fill="#1a1a1a"
                                cornerRadius={8}
                                listening={false}
                            />
                        )}

                        {/* Design placements */}
                        {viewPlacements.map((placement) => (
                            <DraggableDesign
                                key={`design-${placement.originalIndex}`}
                                id={`design-${placement.originalIndex}`}
                                placement={placement}
                                designs={designs}
                                selected={selectedId === `design-${placement.originalIndex}`}
                                onSelect={() => setSelectedId(`design-${placement.originalIndex}`)}
                                onDragEnd={(x, y) => {
                                    onUpdatePlacement(placement.originalIndex, {
                                        ...placement,
                                        x: x / CANVAS_W,
                                        y: y / CANVAS_H,
                                    });
                                }}
                                onTransformEnd={(w, h) => {
                                    onUpdatePlacement(placement.originalIndex, {
                                        ...placement,
                                        width: w / CANVAS_W,
                                        height: h / CANVAS_H,
                                    });
                                }}
                            />
                        ))}

                        {/* Logo placement */}
                        {logoPlacement && logoVariant && activeView === logoPlacement.view && (
                            <DraggableLogo
                                logoVariant={logoVariant}
                                placement={logoPlacement}
                                selected={selectedId === "logo"}
                                onSelect={() => setSelectedId("logo")}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>

            {/* Design list */}
            {viewPlacements.length > 0 && (
                <div className="mt-3 space-y-1">
                    {viewPlacements.map((p) => {
                        const d = designs.find((dd) => dd._id === p.designId);
                        return (
                            <div key={p.originalIndex} className="flex items-center justify-between rounded-md bg-card px-3 py-1.5 text-xs">
                                <span>{d?.name ?? "Design"}</span>
                                <button
                                    onClick={() => onRemovePlacement(p.originalIndex)}
                                    className="text-muted hover:text-red-400"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── DraggableDesign ─────────────────────────────────────────────────────────

function DraggableDesign({
    id,
    placement,
    designs,
    selected,
    onSelect,
    onDragEnd,
    onTransformEnd,
}: {
    id: string;
    placement: DesignPlacement & { originalIndex: number };
    designs: DesignData[];
    selected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
    onTransformEnd: (w: number, h: number) => void;
}) {
    const design = designs.find((d) => d._id === placement.designId);
    const imageUrl = useQuery(
        api.storage.getUrl,
        design?.imageStorageId ? { storageId: design.imageStorageId } : "skip",
    );
    const [image] = useImage(imageUrl ?? "", "anonymous");
    const shapeRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (selected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selected]);

    const x = placement.x * CANVAS_W;
    const y = placement.y * CANVAS_H;
    const w = placement.width * CANVAS_W;
    const h = placement.height * CANVAS_H;

    if (!image) return null;

    return (
        <>
            <KonvaImage
                ref={shapeRef}
                id={id}
                image={image}
                x={x}
                y={y}
                width={w}
                height={h}
                draggable
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                onDragEnd={(e) => {
                    onDragEnd(e.target.x(), e.target.y());
                }}
                onTransformEnd={() => {
                    const node = shapeRef.current!;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onTransformEnd(
                        Math.max(MIN_SIZE, node.width() * scaleX),
                        Math.max(MIN_SIZE, node.height() * scaleY),
                    );
                }}
                dragBoundFunc={(pos) => ({
                    x: Math.max(0, Math.min(pos.x, CANVAS_W - w)),
                    y: Math.max(0, Math.min(pos.y, CANVAS_H - h)),
                })}
            />
            {selected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(_oldBox, newBox) => {
                        if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) return _oldBox;
                        if (newBox.width > MAX_SIZE || newBox.height > MAX_SIZE) return _oldBox;
                        return newBox;
                    }}
                    rotateEnabled={false}
                    anchorCornerRadius={4}
                    anchorFill="#c4793a"
                    anchorStroke="#c4793a"
                    borderStroke="#c4793a"
                />
            )}
        </>
    );
}

// ─── DraggableLogo ───────────────────────────────────────────────────────────

function DraggableLogo({
    logoVariant,
    placement,
    selected,
    onSelect,
}: {
    logoVariant: LogoVariantData;
    placement: LogoPlacement;
    selected: boolean;
    onSelect: () => void;
}) {
    const imageUrl = useQuery(api.storage.getUrl, { storageId: logoVariant.imageStorageId });
    const [image] = useImage(imageUrl ?? "", "anonymous");
    const shapeRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (selected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selected]);

    if (!image) return null;

    const x = placement.x * CANVAS_W;
    const y = placement.y * CANVAS_H;
    const w = placement.width * CANVAS_W;
    const h = placement.height * CANVAS_H;

    return (
        <>
            <KonvaImage
                ref={shapeRef}
                id="logo"
                image={image}
                x={x}
                y={y}
                width={w}
                height={h}
                draggable
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                dragBoundFunc={(pos) => ({
                    x: Math.max(0, Math.min(pos.x, CANVAS_W - w)),
                    y: Math.max(0, Math.min(pos.y, CANVAS_H - h)),
                })}
            />
            {selected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    anchorCornerRadius={4}
                    anchorFill="#c4793a"
                    anchorStroke="#c4793a"
                    borderStroke="#c4793a"
                />
            )}
        </>
    );
}
