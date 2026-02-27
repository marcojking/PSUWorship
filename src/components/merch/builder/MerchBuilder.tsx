"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCart } from "@/lib/merch/cart";
import ClothingPicker from "./ClothingPicker";
import DesignPicker from "./DesignPicker";
import LogoPicker from "./LogoPicker";
import DesignCanvas from "./DesignCanvas";
import PriceDisplay from "./PriceDisplay";
// ─── Types ───────────────────────────────────────────────────────────────────

export interface DesignPlacement {
    designId: Id<"designs">;
    view: string; // "front" | "back"
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface LogoPlacement {
    view: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BuilderState {
    clothingItemId: Id<"clothingItems"> | null;
    selectedSize: string | null;
    isCustomClothing: boolean;
    customViewUrls: { label: string; url: string }[];
    selectedDesignIds: Id<"designs">[];
    placements: DesignPlacement[];
    logoVariantId: Id<"logoVariants"> | null;
    logoPlacement: LogoPlacement | null;
    activeView: "front" | "back";
    expandedImage?: string | null;
    customNotes: string;
}

const CUSTOM_GARMENT_FEE = 1000; // $10 in cents

// ─── Component ───────────────────────────────────────────────────────────────

export default function MerchBuilder({ draftId }: { draftId?: string }) {
    const clothingItems = useQuery(api.clothing.list, { activeOnly: true });
    const designs = useQuery(api.designs.list, { activeOnly: true });
    const logoVariants = useQuery(api.logoVariants.list);
    const { addItem } = useCart();
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

    // ─── State ───────────────────────────────────────────────────────────────
    const [state, setState] = useState<BuilderState>({
        clothingItemId: null,
        selectedSize: null,
        isCustomClothing: false,
        customViewUrls: [],
        selectedDesignIds: [],
        placements: [],
        logoVariantId: null,
        logoPlacement: null,
        activeView: "front",
        customNotes: "",
    });
    const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
    const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
    const [showAIPreview, setShowAIPreview] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [step, setStep] = useState(0); // mobile stepper: 0=clothing, 1=designs, 2=logo, 3=canvas
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // ─── Upload helper ────────────────────────────────────────────────────
    const uploadBase64ToStorage = useCallback(async (dataUri: string): Promise<string | null> => {
        try {
            const uploadUrl = await generateUploadUrl();
            const res = await fetch(dataUri);
            const blob = await res.blob();
            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
            });
            if (!uploadResult.ok) throw new Error("Upload failed");
            const { storageId } = await uploadResult.json();
            return storageId;
        } catch (err) {
            console.error("Failed to upload mockup:", err);
            return null;
        }
    }, [generateUploadUrl]);

    // ─── Derived data ─────────────────────────────────────────────────────
    const selectedClothing = useQuery(
        api.clothing.get,
        state.clothingItemId ? { id: state.clothingItemId } : "skip",
    );

    const selectedLogo = useMemo(
        () => logoVariants?.find((l) => l._id === state.logoVariantId),
        [logoVariants, state.logoVariantId],
    );

    // ─── Price calc ───────────────────────────────────────────────────────
    const priceBreakdown = useMemo(() => {
        const items: { label: string; amount: number }[] = [];

        // Clothing base
        if (selectedClothing) {
            items.push({ label: selectedClothing.name, amount: selectedClothing.basePrice });
        } else if (state.isCustomClothing) {
            items.push({ label: "Custom garment handling fee", amount: CUSTOM_GARMENT_FEE });
        }

        // Design placements
        state.placements.forEach((p) => {
            const design = designs?.find((d) => d._id === p.designId);
            if (design) {
                items.push({
                    label: `${design.name} embroidery`,
                    amount: design.embroideryPrice ?? 0,
                });
            }
        });

        // Logo upcharge
        if (selectedLogo && selectedLogo.price > 0) {
            items.push({ label: `${selectedLogo.name} logo`, amount: selectedLogo.price });
        }

        return items;
    }, [selectedClothing, state.isCustomClothing, state.placements, designs, selectedLogo]);

    const total = priceBreakdown.reduce((sum, i) => sum + i.amount, 0);

    // ─── Handlers ──────────────────────────────────────────────────────────
    const selectClothing = useCallback((id: Id<"clothingItems">) => {
        setState((prev) => ({
            ...prev,
            clothingItemId: id,
            isCustomClothing: false,
            customViewUrls: [],
            selectedSize: null,
        }));
    }, []);

    const toggleCustomClothing = useCallback(() => {
        setState((prev) => ({
            ...prev,
            clothingItemId: null,
            isCustomClothing: true,
            selectedSize: null,
        }));
    }, []);

    const handleCustomFile = useCallback((view: "front" | "back", file: File) => {
        const url = URL.createObjectURL(file);
        setState((prev) => {
            const existing = prev.customViewUrls.filter((v) => v.label !== view);
            return {
                ...prev,
                customViewUrls: [...existing, { label: view, url }],
            };
        });
    }, []);

    const addDesignSelection = useCallback((designId: Id<"designs">) => {
        setState((prev) => ({
            ...prev,
            selectedDesignIds: [...prev.selectedDesignIds, designId],
        }));
    }, []);

    const updatePlacement = useCallback((index: number, updated: DesignPlacement) => {
        setState((prev) => ({
            ...prev,
            placements: prev.placements.map((p, i) => (i === index ? updated : p)),
        }));
    }, []);

    const removePlacement = useCallback((index: number) => {
        setState((prev) => {
            const removed = prev.placements[index];
            return {
                ...prev,
                placements: prev.placements.filter((_, i) => i !== index),
                selectedDesignIds: [...prev.selectedDesignIds, removed.designId],
            };
        });
    }, []);

    const selectLogo = useCallback((id: Id<"logoVariants">) => {
        setState((prev) => ({
            ...prev,
            logoVariantId: id,
            logoPlacement: null, // Reset placement to tray so they can explicitly place it
        }));
    }, []);

    const handleAddToCart = useCallback(async () => {
        if (!state.clothingItemId || !selectedClothing) return;

        setAddingToCart(true);

        // Helper to safely export a specific view
        const exportSide = async (view: "front" | "back") => {
            let activeWasChanged = false;
            // First check if we need to switch
            if (state.activeView !== view) {
                // If we do, we dispatch the state update manually for immediate effect inside this closure scope callback
                // But actually, because of React's state batching, this is tricky. 
                // A simpler way: we assume the user is clicking Add To Cart on whatever view they are currently on.
                // We will JUST capture the current view for now without magical switching as it's less error prone,
                // BUT let's try to capture both if we can by leveraging the window function.
                setState(prev => ({ ...prev, activeView: view }));
                await new Promise(r => setTimeout(r, 600)); // wait for full re-render
                activeWasChanged = true;
            }

            const base64Canvas = (window as unknown as Record<string, unknown>).__exportMerchCanvas as (() => string | null) | undefined;
            const res = base64Canvas ? base64Canvas() : undefined;

            return res;
        };

        const hasFront = state.placements.some(p => p.view === "front") || (state.logoVariantId && state.logoPlacement?.view === "front");
        const hasBack = state.placements.some(p => p.view === "back") || (state.logoVariantId && state.logoPlacement?.view === "back");

        let frontMockupBase64: string | undefined = undefined;
        let backMockupBase64: string | undefined = undefined;

        // Capture whatever side we are currently on first
        if (state.activeView === "front" && hasFront) {
            frontMockupBase64 = await exportSide("front") || undefined;
            if (hasBack) backMockupBase64 = await exportSide("back") || undefined;
        } else if (state.activeView === "back" && hasBack) {
            backMockupBase64 = await exportSide("back") || undefined;
            if (hasFront) frontMockupBase64 = await exportSide("front") || undefined;
        } else {
            // If we don't have placements on the active view, just do whatever they have
            if (hasFront) frontMockupBase64 = await exportSide("front") || undefined;
            if (hasBack) backMockupBase64 = await exportSide("back") || undefined;
        }

        // Return to original view
        setState(prev => ({ ...prev, activeView: state.activeView }));

        // Upload mockups to Convex storage immediately (so they survive page refreshes)
        let frontMockupId: string | undefined;
        let backMockupId: string | undefined;
        if (frontMockupBase64) frontMockupId = (await uploadBase64ToStorage(frontMockupBase64)) || undefined;
        if (backMockupBase64) backMockupId = (await uploadBase64ToStorage(backMockupBase64)) || undefined;

        const clothingLabel = selectedClothing.name;
        addItem({
            type: "embroidery",
            name: `Embroidered ${clothingLabel}`,
            clothingItemId: state.clothingItemId,
            placements: state.placements.map((p) => ({
                designId: p.designId as string,
                size: `${Math.round(p.width * 100)}%`,
                position: `${p.view} (${Math.round(p.x * 100)}%, ${Math.round(p.y * 100)}%)`,
            })),
            size: state.selectedSize ?? undefined,
            frontMockupId,
            backMockupId,
            frontPreviewUrl: frontPreviewUrl || undefined,
            backPreviewUrl: backPreviewUrl || undefined,
            customNotes: state.customNotes || undefined,
            quantity: 1,
            unitPrice: total,
        });

        alert("Added to cart!");
        setAddingToCart(false);
    }, [
        state.clothingItemId,
        selectedClothing,
        state.selectedSize,
        state.placements,
        state.logoVariantId,
        state.logoPlacement,
        state.activeView,
        state.customNotes,
        frontPreviewUrl,
        backPreviewUrl,
        total,
        addItem,
        uploadBase64ToStorage,
    ]);

    const customFrontUrl = state.customViewUrls.find((v) => v.label === "front")?.url;
    const customBackUrl = state.customViewUrls.find((v) => v.label === "back")?.url;

    const handleGenerateAIPreview = useCallback(async () => {
        setIsGeneratingAI(true);
        const originalView = state.activeView;

        const generateSide = async (side: "front" | "back", promptDesc: string) => {
            // Always force-set the view to the target side.
            // This guarantees the canvas renders the correct placements
            // regardless of what the current view state was.
            setState(prev => ({ ...prev, activeView: side }));
            // Wait long enough for React to re-render the canvas with
            // the new view's clothing image + design placements.
            await new Promise(r => setTimeout(r, 800));

            const base64Canvas = (window as unknown as Record<string, unknown>).__exportMerchCanvas as (() => string | null) | undefined;
            const canvasImage = base64Canvas ? base64Canvas() : null;

            if (!canvasImage) throw new Error(`${side} canvas export failed`);

            const res = await fetch("/api/generate-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    canvasImage,
                    prompt: `A beautiful, closely cropped photorealistic ${promptDesc} product shot of this exact garment on a hanger. Zoom in so the designs fill more of the frame while still showing the garment context. The designs MUST look like highly realistic, authentic, raised thread embroidery. Critically: Make the texture, flow, and folds of the embroidery exactly match and follow the folds and natural lighting of the underlying garment fabric so it looks truly physically attached. Clean studio background.`,
                }),
            });

            const data = await res.json();
            if (data.url) {
                if (side === "front") setFrontPreviewUrl(data.url);
                if (side === "back") setBackPreviewUrl(data.url);
            } else {
                const msg = data.error || data.message || JSON.stringify(data);
                throw new Error(msg);
            }
        };

        try {
            await generateSide("front", "front-view");

            const hasBack = state.placements.some((p) => p.view === "back") ||
                (state.logoPlacement?.view === "back");

            if (hasBack || selectedClothing?.backImageStorageId || customBackUrl) {
                await generateSide("back", "back-view");
            }

            // Restore view
            setState(prev => ({ ...prev, activeView: originalView }));
        } catch (err: any) {
            console.error("AI Preview Error:", err);
            alert(`AI Preview failed: ${err.message || "Unknown error"}`);
        } finally {
            setIsGeneratingAI(false);
        }
    }, [state.activeView, state.placements, state.logoPlacement, selectedClothing, customBackUrl]);

    // ─── Render helpers ────────────────────────────────────────────────────
    const hasClothing = state.clothingItemId !== null || state.isCustomClothing;
    const hasDesigns = state.placements.length > 0;
    const hasLogo = state.logoVariantId !== null;

    // Strict Size Enforcement
    const requiresSize = hasClothing && !state.isCustomClothing && selectedClothing?.availableSizes && selectedClothing.availableSizes.length > 0;
    const hasSize = state.selectedSize !== null;
    const canBuild = hasClothing && hasDesigns && hasLogo && (!requiresSize || hasSize);

    // ─── Unified Responsive Layout ─────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl md:py-8">
            <div className="hidden md:block px-4 mb-8">
                <h2 className="mb-2 text-2xl font-bold">Custom Embroidery Builder</h2>
                <p className="mb-4 text-sm text-muted">Pick clothing, choose designs, select your logo style, and arrange your masterpiece.</p>
                <div className="rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-3 text-xs text-muted">
                    💡 Placement is approximate. We may adjust slightly for best embroidery results and will confirm before charging your card.
                </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-12 md:gap-8">
                {/* Left Column (Stepper Content) */}
                <div className="md:col-span-5 flex flex-col pt-4 md:pt-0">
                    {/* Step indicator */}
                    <div className="px-4 mb-6 flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {["Clothing", "Designs", "Logo", "Preview"].map((label, i) => (
                            <button
                                key={label}
                                onClick={() => setStep(i)}
                                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${step === i
                                    ? "bg-secondary text-background"
                                    : i < step
                                        ? "bg-secondary/20 text-secondary"
                                        : "bg-card text-muted"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 pb-12">
                        <div className={step === 0 ? "block" : "hidden"}>
                            <h3 className="mb-4 text-sm font-semibold hidden md:block">1. Choose Clothing</h3>
                            <ClothingPicker
                                items={clothingItems ?? []}
                                selectedId={state.clothingItemId}
                                onSelect={(id) => { selectClothing(id); if (isMobile) setStep(1); }}
                                onToggleCustom={toggleCustomClothing}
                                onCustomFile={handleCustomFile}
                                isCustomClothing={state.isCustomClothing}
                                customFrontUrl={customFrontUrl}
                                customBackUrl={customBackUrl}
                                selectedSize={state.selectedSize}
                                onSizeChange={(size) => setState(prev => ({ ...prev, selectedSize: size }))}
                            />
                        </div>

                        <div className={step === 1 ? "block" : "hidden"}>
                            <h3 className="mb-4 text-sm font-semibold hidden md:block">2. Choose Designs</h3>
                            <DesignPicker
                                designs={designs ?? []}
                                selectedIds={state.selectedDesignIds}
                                onAdd={addDesignSelection}
                                onNext={() => setStep(2)}
                            />
                        </div>

                        <div className={step === 2 ? "block" : "hidden"}>
                            <h3 className="mb-4 text-sm font-semibold hidden md:block">3. Choose Logo Style</h3>
                            <LogoPicker
                                variants={logoVariants ?? []}
                                selectedId={state.logoVariantId}
                                onSelect={(id) => { selectLogo(id); setStep(3); }}
                            />
                        </div>

                        {/* Empty state prompt for desktop if they are on step 3 but using desktop right column */}
                        <div className="hidden md:block mt-8 text-center px-6">
                            {step === 3 && (
                                <p className="text-sm text-muted animate-pulse">
                                    ← You can click the steps above to change your selections at any time.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Canvas/Preview) */}
                <div className={`md:col-span-7 pb-12 md:pb-0 ${step === 3 ? "block px-4" : "hidden md:block md:px-4"}`}>
                    <div className="sticky top-24 space-y-4 pt-4 md:pt-0">
                        <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3 hidden md:flex">
                                <h3 className="text-sm font-semibold">4. Preview & Arrange</h3>
                                <div className="flex items-center gap-4">
                                    {/* Front/Back Toggle */}
                                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
                                        {(["front", "back"] as const).map((view) => (
                                            <button
                                                key={view}
                                                onClick={() => setState((prev) => ({ ...prev, activeView: view }))}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${state.activeView === view ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                {view}
                                            </button>
                                        ))}
                                    </div>

                                    {/* AI/Builder Toggle — hidden for now */}
                                    {false && (
                                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
                                            <button
                                                onClick={() => setShowAIPreview(false)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showAIPreview ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                Builder
                                            </button>
                                            <button
                                                onClick={() => setShowAIPreview(true)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showAIPreview ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                ✨ AI Preview
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="mb-3 text-sm font-semibold md:hidden">4. Preview & Arrange</h3>

                            <div className="flex flex-col gap-3">
                                {/* Mobile Toggles */}
                                <div className="flex md:hidden flex-col gap-2 w-full">
                                    <div className="flex items-center justify-center w-full gap-1 bg-background border border-border rounded-lg p-1">
                                        {(["front", "back"] as const).map((view) => (
                                            <button
                                                key={view}
                                                onClick={() => setState((prev) => ({ ...prev, activeView: view }))}
                                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md capitalize transition-colors ${state.activeView === view ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                {view}
                                            </button>
                                        ))}
                                    </div>
                                    {false && (
                                        <div className="flex items-center justify-center w-full gap-1 bg-background border border-border rounded-lg p-1">
                                            <button
                                                onClick={() => setShowAIPreview(false)}
                                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${!showAIPreview ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                Builder
                                            </button>
                                            <button
                                                onClick={() => setShowAIPreview(true)}
                                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${showAIPreview ? "bg-secondary text-background shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/10"}`}
                                            >
                                                ✨ AI Preview
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 items-start">
                                    {/* Canvas Side / AI Preview Side */}
                                    <div className="flex-1 w-full min-w-0 flex items-center justify-center relative min-h-[500px]">
                                        <DesignCanvas
                                            clothingItem={selectedClothing}
                                            customViewUrls={state.isCustomClothing ? state.customViewUrls : undefined}
                                            placements={state.placements}
                                            logoPlacement={state.logoPlacement}
                                            logoVariant={selectedLogo}
                                            activeView={state.activeView}
                                            onViewChange={(v: "front" | "back") => setState((prev) => ({ ...prev, activeView: v }))}
                                            onUpdatePlacement={updatePlacement}
                                            onRemovePlacement={removePlacement}
                                            onUpdateLogoPlacement={(p) => setState(prev => ({ ...prev, logoPlacement: p }))}
                                            onRemoveLogoPlacement={() => setState(prev => ({ ...prev, logoPlacement: null }))}
                                            designs={designs ?? []}
                                            showAIPreview={showAIPreview}
                                            isGeneratingAI={isGeneratingAI}
                                            frontPreviewUrl={frontPreviewUrl}
                                            backPreviewUrl={backPreviewUrl}
                                            handleGenerateAIPreview={handleGenerateAIPreview}
                                            onExpandImage={(url: string) => setState(prev => ({ ...prev, expandedImage: url }))}
                                        />
                                    </div>

                                    {/* Side Panel Tray */}
                                    {(!showAIPreview && (state.selectedDesignIds.length > 0 || (state.logoVariantId && !state.logoPlacement))) && (
                                        <div className="w-24 shrink-0 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-3 shadow-sm flex flex-col gap-2 relative h-[500px]">
                                            <div className="text-center pb-2 pt-1 border-b border-border/30 shrink-0">
                                                <span className="block text-[10px] uppercase tracking-wider text-muted font-bold">Add to</span>
                                                <span className="block text-sm font-semibold capitalize text-foreground">{state.activeView}</span>
                                            </div>
                                            <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden py-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                {state.selectedDesignIds.map((dId, index) => {
                                                    const design = designs?.find(d => d._id === dId);
                                                    if (!design) return null;
                                                    return (
                                                        <div key={`tray-design-${index}`} className="relative">
                                                            <TrayImage
                                                                storageId={design.imageStorageId}
                                                                alt={design.name}
                                                                onClick={() => {
                                                                    const placement: DesignPlacement = {
                                                                        designId: dId,
                                                                        view: state.activeView,
                                                                        x: 0.35,
                                                                        y: 0.3,
                                                                        width: design.fixedSize ? design.fixedSize : 0.3,
                                                                        height: 0, // Auto-calculated in DesignCanvas based on aspect ratio
                                                                    };
                                                                    setState(prev => ({
                                                                        ...prev,
                                                                        placements: [...prev.placements, placement],
                                                                        selectedDesignIds: prev.selectedDesignIds.filter((_, i) => i !== index),
                                                                    }));
                                                                }}
                                                                onRemove={() => {
                                                                    setState(prev => ({
                                                                        ...prev,
                                                                        selectedDesignIds: prev.selectedDesignIds.filter((_, i) => i !== index),
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}

                                                {state.logoVariantId && !state.logoPlacement && selectedLogo && (
                                                    <div className="relative">
                                                        <TrayImage
                                                            storageId={selectedLogo.imageStorageId}
                                                            alt="Logo"
                                                            label="LOGO"
                                                            onClick={() => {
                                                                setState(prev => ({
                                                                    ...prev,
                                                                    logoPlacement: {
                                                                        view: state.activeView,
                                                                        x: 0.1,
                                                                        y: 0.15,
                                                                        width: 0.15,
                                                                        height: 0, // Auto-calculated in DesignCanvas based on aspect ratio
                                                                    }
                                                                }));
                                                            }}
                                                            onRemove={() => {
                                                                setState(prev => ({
                                                                    ...prev,
                                                                    logoVariantId: null,
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Custom Instructions */}
                            <div className="mt-4 rounded-lg border border-secondary/40 bg-secondary/5 p-3">
                                <label htmlFor="custom-notes" className="block text-xs font-semibold text-secondary mb-2">
                                    📝 Custom Instructions <span className="font-normal text-muted/60">(optional)</span>
                                </label>
                                <textarea
                                    id="custom-notes"
                                    value={state.customNotes}
                                    onChange={(e) => setState(prev => ({ ...prev, customNotes: e.target.value }))}
                                    placeholder="Describe anything the builder can't capture — e.g. 'Put the flower on the left sleeve' or 'I want the back design smaller and centered'. Make sure you've selected the designs you want and how many of each."
                                    rows={3}
                                    className="w-full rounded-md border border-secondary/30 bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30 resize-none transition-colors"
                                />
                            </div>

                            {/* Add to Cart */}
                            <div className="mt-4">
                                {!canBuild && (
                                    <div className="mb-3 rounded-md bg-muted/10 border border-border/50 px-3 py-2">
                                        <p className="text-xs font-medium text-muted mb-1">To add to cart, you still need to:</p>
                                        <ul className="text-xs text-muted/80 space-y-0.5 list-disc list-inside">
                                            {!hasClothing && <li>Select a garment (Step 1)</li>}
                                            {requiresSize && !hasSize && <li>Select an apparel size (Step 1)</li>}
                                            {!hasDesigns && <li>Add at least one design to the canvas (Step 2)</li>}
                                            {!hasLogo && <li>Choose a logo placement (Step 3)</li>}
                                        </ul>
                                    </div>
                                )}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!canBuild || addingToCart}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${canBuild
                                        ? "bg-secondary text-background hover:bg-secondary/90 shadow-lg shadow-secondary/20 active:scale-[0.98]"
                                        : "bg-muted/20 text-muted/50 cursor-not-allowed"
                                        }`}
                                >
                                    {addingToCart ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>🛒 Add to Cart</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {
                state.expandedImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm transition-opacity"
                        onClick={() => setState(prev => ({ ...prev, expandedImage: null }))}
                    >
                        <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center cursor-zoom-out">
                            <img
                                src={state.expandedImage}
                                alt="Expanded preview"
                                className="object-contain w-auto h-auto max-h-[90vh] rounded-xl shadow-2xl"
                                onClick={(e) => e.stopPropagation()} // Let clicking outside close it
                            />
                            <button
                                className="absolute top-4 right-4 rounded-full bg-background/80 p-2 text-foreground/70 hover:bg-background hover:text-foreground shadow-sm transition-colors"
                                onClick={() => setState(prev => ({ ...prev, expandedImage: null }))}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function TrayImage({ storageId, alt, onClick, onRemove, label }: { storageId: string, alt: string, onClick: () => void, onRemove?: () => void, label?: string }) {
    const url = useQuery(api.storage.getUrl, storageId ? { storageId: storageId as Id<"_storage"> } : "skip");

    return (
        <div className="relative group w-full aspect-square shrink-0">
            {onRemove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-1.5 -right-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md hover:scale-110 transition-transform"
                    aria-label="Remove item"
                >
                    ✕
                </button>
            )}
            <button
                onClick={onClick}
                className="flex h-full w-full items-center justify-center overflow-hidden rounded-md border border-border bg-background hover:border-secondary transition-colors shadow-sm relative group-hover:border-secondary"
            >
                {url ? (
                    <img src={url} alt={alt} className="h-full w-full object-contain p-1 transition-transform group-hover:scale-110" />
                ) : (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                )}
                {label && (
                    <div className="absolute top-1 right-1 z-10 text-[8px] bg-background/80 px-1 rounded text-secondary font-bold backdrop-blur-sm shadow-sm">{label}</div>
                )}
                <div className="absolute inset-0 bg-secondary/10 opacity-0 transition-opacity group-hover:opacity-100 z-10" />

                <div className="absolute bottom-0 right-0 left-0 bg-secondary pt-[2px] opacity-0 transition-opacity group-hover:opacity-100 z-10" />
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="h-5 w-5 rounded-full bg-secondary/90 text-white flex items-center justify-center shadow-md">
                        <span className="text-sm leading-none">+</span>
                    </div>
                </div>
            </button>
        </div>
    );
}
