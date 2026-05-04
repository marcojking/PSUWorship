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
    onUpdateLogoPlacement,
    onRemoveLogoPlacement,
    designs,
    showAIPreview,
    isGeneratingAI,
    frontPreviewUrl,
    backPreviewUrl,
    handleGenerateAIPreview,
    onExpandImage,
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
    onUpdateLogoPlacement?: (p: LogoPlacement) => void;
    onRemoveLogoPlacement?: () => void;
    designs: DesignData[];
    // AI Preview Props
    showAIPreview: boolean;
    isGeneratingAI: boolean;
    frontPreviewUrl: string | null;
    backPreviewUrl: string | null;
    handleGenerateAIPreview: () => void;
    onExpandImage: (url: string) => void;
}) {
    const stageRef = useRef<Konva.Stage>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Resolve clothing image
    const frontStorageId = clothingItem?.frontImageStorageId ?? clothingItem?.imageStorageId;
    const backStorageId = clothingItem?.backImageStorageId;
    const frontUrl = useQuery(api.storage.getUrl, frontStorageId ? { storageId: frontStorageId } : "skip");
    const backUrl = useQuery(api.storage.getUrl, backStorageId ? { storageId: backStorageId } : "skip");

    // Use custom uploaded image if available, otherwise use Convex clothing image
    const customUrl = customViewUrls?.find((v) => v.label === activeView)?.url;
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
        <div className="w-full h-full flex flex-col items-center justify-center relative">

            {/* AI Preview Overlay */}
            {showAIPreview && (
                <div
                    className="absolute z-20 flex flex-col items-center justify-center p-6 text-foreground text-center bg-background/95 backdrop-blur-md rounded-lg shadow-xl"
                    style={{ width: CANVAS_W, maxWidth: "100%", aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
                >
                    {isGeneratingAI ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
                            <p className="text-sm font-medium text-secondary animate-pulse">Generating realistic preview...</p>
                            <p className="text-xs text-muted max-w-[200px]">This takes about 20-30 seconds. We are weaving digital threads...</p>
                        </div>
                    ) : (() => {
                        const currentPreviewUrl = activeView === "front" ? frontPreviewUrl : backPreviewUrl;

                        if (currentPreviewUrl) {
                            return (
                                <div
                                    className="w-full h-full flex items-center justify-center cursor-zoom-in group relative"
                                    onClick={() => onExpandImage(currentPreviewUrl)}
                                >
                                    <img src={currentPreviewUrl} alt={`${activeView} preview`} className="w-full h-full object-contain rounded-lg shadow-sm bg-background" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-lg">
                                        <span className="opacity-0 group-hover:opacity-100 bg-background/80 text-foreground px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-opacity shadow-sm border border-border/50">
                                            Click to expand
                                        </span>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div className="flex flex-col items-center gap-4 max-w-[300px]">
                                    <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center text-2xl mb-2 text-secondary shadow-inner">✨</div>
                                    <h4 className="text-lg font-bold">Ready to see it real?</h4>
                                    <p className="text-sm text-muted mb-6">We will generate a high-quality, photorealistic mockup of your custom piece with raised embroidery textures.</p>
                                    <button
                                        onClick={handleGenerateAIPreview}
                                        className="w-full bg-secondary text-background hover:bg-secondary/90 px-6 py-3 rounded-lg font-semibold shadow-lg shadow-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Generate AI Preview
                                    </button>
                                </div>
                            );
                        }
                    })()}
                </div>
            )}

            {/* Canvas */}
            <div
                className={`relative flex items-center justify-center transition-transform hover:scale-[1.01] duration-300 ${showAIPreview ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{ width: CANVAS_W, maxWidth: "100%", aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            >
                <Stage
                    ref={stageRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    style={{ width: "100%", height: "100%" }}
                    onClick={(e) => {
                        // Deselect if clicking on empty stage area
                        if (e.target === e.target.getStage() || e.target.hasName('bg')) {
                            setSelectedId(null);
                        }
                    }}
                    onTap={(e) => {
                        if (e.target === e.target.getStage() || e.target.hasName('bg')) {
                            setSelectedId(null);
                        }
                    }}
                >
                    <Layer>
                        {/* Clothing background */}
                        {clothingImage && (
                            <KonvaImage
                                name="bg"
                                image={clothingImage}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                listening={true}
                            />
                        )}

                        {/* If no clothing, show placeholder */}
                        {!clothingImage && (
                            <Rect
                                name="bg"
                                width={CANVAS_W}
                                height={CANVAS_H}
                                fill="#1a1a1a"
                                cornerRadius={8}
                                listening={true}
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
                                onTransformEnd={(w, h, x, y) => {
                                    onUpdatePlacement(placement.originalIndex, {
                                        ...placement,
                                        width: w / CANVAS_W,
                                        height: h / CANVAS_H,
                                        x: x / CANVAS_W,
                                        y: y / CANVAS_H,
                                    });
                                }}
                            />
                        ))}

                        {logoPlacement && logoVariant && activeView === logoPlacement.view && (
                            <DraggableLogo
                                logoVariant={logoVariant}
                                placement={logoPlacement}
                                selected={selectedId === "logo"}
                                onSelect={() => setSelectedId("logo")}
                                onDragEnd={(newX, newY) => {
                                    onUpdateLogoPlacement?.({
                                        ...logoPlacement,
                                        x: newX / CANVAS_W,
                                        y: newY / CANVAS_H,
                                    });
                                }}
                                onTransformEnd={(w, h, newX, newY) => {
                                    onUpdateLogoPlacement?.({
                                        ...logoPlacement,
                                        width: w / CANVAS_W,
                                        height: h / CANVAS_H,
                                        x: newX / CANVAS_W,
                                        y: newY / CANVAS_H,
                                    });
                                }}
                            />
                        )}
                    </Layer>
                </Stage>

                {/* HTML Overlay for UI Controls */}
                {viewPlacements.map((placement) => (
                    <CanvasDeleteBtn
                        key={`delete-${placement.originalIndex}`}
                        x={placement.x * CANVAS_W + placement.width * CANVAS_W}
                        y={placement.y * CANVAS_H}
                        onClick={() => {
                            onRemovePlacement(placement.originalIndex);
                            if (selectedId === `design-${placement.originalIndex}`) {
                                setSelectedId(null);
                            }
                        }}
                    />
                ))}

                {logoPlacement && logoVariant && activeView === logoPlacement.view && (
                    <CanvasDeleteBtn
                        x={logoPlacement.x * CANVAS_W + logoPlacement.width * CANVAS_W}
                        y={logoPlacement.y * CANVAS_H}
                        onClick={() => {
                            onRemoveLogoPlacement?.();
                            if (selectedId === "logo") {
                                setSelectedId(null);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function CanvasDeleteBtn({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md transition-transform hover:scale-110"
            style={{ left: x, top: y }}
            aria-label="Remove item"
        >
            ✕
        </button>
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
    onTransformEnd: (w: number, h: number, x: number, y: number) => void;
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

    useEffect(() => {
        // Automatically set the correct aspect ratio upon initial load if height is 0
        if (image && image.width && image.height && placement.height === 0) {
            const currentW = placement.width * CANVAS_W;
            const currentH = currentW * (image.height / image.width);
            onTransformEnd(currentW, currentH, placement.x * CANVAS_W, placement.y * CANVAS_H);
        }
    }, [image, placement.height, placement.width, placement.x, placement.y, onTransformEnd]);

    const x = placement.x * CANVAS_W;
    const y = placement.y * CANVAS_H;
    const w = placement.width * CANVAS_W;
    const h = placement.height === 0 && image && image.width
        ? w * (image.height / image.width)
        : placement.height * CANVAS_H;

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
                    node.scaleY(1); // reset scale
                    onTransformEnd(
                        Math.max(MIN_SIZE, node.width() * scaleX),
                        Math.max(MIN_SIZE, node.height() * scaleY),
                        node.x(),
                        node.y()
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
                    keepRatio={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
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
    onDragEnd,
    onTransformEnd,
}: {
    logoVariant: LogoVariantData;
    placement: LogoPlacement;
    selected: boolean;
    onSelect: () => void;
    onDragEnd: (x: number, y: number) => void;
    onTransformEnd: (w: number, h: number, x: number, y: number) => void;
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

    useEffect(() => {
        if (image && image.width && image.height && placement.height === 0) {
            const currentW = placement.width * CANVAS_W;
            const currentH = currentW * (image.height / image.width);
            onTransformEnd(currentW, currentH, placement.x * CANVAS_W, placement.y * CANVAS_H);
        }
    }, [image, placement.height, placement.width, placement.x, placement.y, onTransformEnd]);

    if (!image) return null;

    const x = placement.x * CANVAS_W;
    const y = placement.y * CANVAS_H;
    const w = placement.width * CANVAS_W;
    const h = placement.height === 0 && image && image.width
        ? w * (image.height / image.width)
        : placement.height * CANVAS_H;

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
                onDragEnd={(e) => {
                    onDragEnd(e.target.x(), e.target.y());
                }}
                onTransformEnd={() => {
                    const node = shapeRef.current!;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1); // reset scale
                    onTransformEnd(
                        Math.max(MIN_SIZE, node.width() * scaleX),
                        Math.max(MIN_SIZE, node.height() * scaleY),
                        node.x(),
                        node.y()
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
                    rotateEnabled={false}
                    keepRatio={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    anchorCornerRadius={4}
                    anchorFill="#c4793a"
                    anchorStroke="#c4793a"
                    borderStroke="#c4793a"
                />
            )}
        </>
    );
}
