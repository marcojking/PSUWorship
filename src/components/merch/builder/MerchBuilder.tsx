"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCart } from "@/lib/merch/cart";
import ClothingPicker from "./ClothingPicker";
import DesignPicker from "./DesignPicker";
import LogoPicker from "./LogoPicker";
import DesignCanvas from "./DesignCanvas";
import AIPreviewPanel from "./AIPreviewPanel";
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
    placements: DesignPlacement[];
    logoVariantId: Id<"logoVariants"> | null;
    logoPlacement: LogoPlacement | null;
    activeView: "front" | "back";
}

const CUSTOM_GARMENT_FEE = 1000; // $10 in cents

// ─── Component ───────────────────────────────────────────────────────────────

export default function MerchBuilder({ draftId }: { draftId?: string }) {
    const clothingItems = useQuery(api.clothing.list, { activeOnly: true });
    const designs = useQuery(api.designs.list, { activeOnly: true });
    const logoVariants = useQuery(api.logoVariants.list);
    const { addItem } = useCart();

    // ─── State ───────────────────────────────────────────────────────────────
    const [state, setState] = useState<BuilderState>({
        clothingItemId: null,
        selectedSize: null,
        isCustomClothing: false,
        customViewUrls: [],
        placements: [],
        logoVariantId: null,
        logoPlacement: null,
        activeView: "front",
    });
    const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [step, setStep] = useState(0); // mobile stepper: 0=clothing, 1=designs, 2=logo, 3=canvas
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

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

    const addDesign = useCallback((designId: Id<"designs">) => {
        const placement: DesignPlacement = {
            designId,
            view: "front",
            x: 0.35,
            y: 0.3,
            width: 0.3,
            height: 0.3,
        };
        setState((prev) => ({
            ...prev,
            placements: [...prev.placements, placement],
        }));
    }, []);

    const updatePlacement = useCallback((index: number, updated: DesignPlacement) => {
        setState((prev) => ({
            ...prev,
            placements: prev.placements.map((p, i) => (i === index ? updated : p)),
        }));
    }, []);

    const removePlacement = useCallback((index: number) => {
        setState((prev) => ({
            ...prev,
            placements: prev.placements.filter((_, i) => i !== index),
        }));
    }, []);

    const selectLogo = useCallback((id: Id<"logoVariants">) => {
        setState((prev) => ({
            ...prev,
            logoVariantId: id,
            logoPlacement: prev.logoPlacement ?? {
                view: "front",
                x: 0.1,
                y: 0.15,
                width: 0.15,
                height: 0.1,
            },
        }));
    }, []);

    const handleAddToCart = useCallback(() => {
        const clothingLabel = selectedClothing?.name ?? "Custom Item";
        addItem({
            type: "embroidery",
            name: `Embroidered ${clothingLabel}`,
            clothingItemId: state.clothingItemId ?? undefined,
            placements: state.placements.map((p) => ({
                designId: p.designId as string,
                size: `${Math.round(p.width * 100)}%`,
                position: `${p.view} (${Math.round(p.x * 100)}%, ${Math.round(p.y * 100)}%)`,
            })),
            size: state.selectedSize ?? undefined,
            mockupBlobUrl: aiPreviewUrl ?? undefined,
            quantity: 1,
            unitPrice: total,
        });
    }, [selectedClothing, state, aiPreviewUrl, total, addItem]);

    // ─── Render helpers ────────────────────────────────────────────────────
    const customFrontUrl = state.customViewUrls.find((v) => v.label === "front")?.url;
    const customBackUrl = state.customViewUrls.find((v) => v.label === "back")?.url;
    const hasClothing = state.clothingItemId !== null || state.isCustomClothing;
    const hasDesigns = state.placements.length > 0;
    const hasLogo = state.logoVariantId !== null;
    const canBuild = hasClothing && hasDesigns && hasLogo;

    // ─── Mobile Stepper ────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div className="px-4 py-6">
                {/* Step indicator */}
                <div className="mb-6 flex items-center justify-center gap-2">
                    {["Clothing", "Designs", "Logo", "Preview"].map((label, i) => (
                        <button
                            key={label}
                            onClick={() => setStep(i)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${step === i
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

                {/* Step content */}
                {step === 0 && (
                    <ClothingPicker
                        items={clothingItems ?? []}
                        selectedId={state.clothingItemId}
                        onSelect={(id) => { selectClothing(id); setStep(1); }}
                        onToggleCustom={toggleCustomClothing}
                        onCustomFile={handleCustomFile}
                        isCustomClothing={state.isCustomClothing}
                        customFrontUrl={customFrontUrl}
                        customBackUrl={customBackUrl}
                        selectedSize={state.selectedSize}
                        onSizeChange={(size) => setState(prev => ({ ...prev, selectedSize: size }))}
                    />
                )}
                {step === 1 && (
                    <DesignPicker
                        designs={designs ?? []}
                        selectedIds={state.placements.map((p) => p.designId)}
                        onAdd={(id) => { addDesign(id); }}
                        onNext={() => setStep(2)}
                    />
                )}
                {step === 2 && (
                    <LogoPicker
                        variants={logoVariants ?? []}
                        selectedId={state.logoVariantId}
                        onSelect={(id) => { selectLogo(id); setStep(3); }}
                    />
                )}
                {step === 3 && (
                    <div className="space-y-4">
                        <DesignCanvas
                            clothingItem={selectedClothing}
                            customViewUrls={state.isCustomClothing ? state.customViewUrls : undefined}
                            placements={state.placements}
                            logoPlacement={state.logoPlacement}
                            logoVariant={selectedLogo}
                            activeView={state.activeView}
                            onViewChange={(v) => setState((prev) => ({ ...prev, activeView: v }))}
                            onUpdatePlacement={updatePlacement}
                            onRemovePlacement={removePlacement}
                            designs={designs ?? []}
                        />
                        <AIPreviewPanel
                            previewUrl={aiPreviewUrl}
                            generating={generating}
                            onGenerate={async () => {
                                setGenerating(true);
                                // Canvas export → API call handled inside
                                setGenerating(false);
                            }}
                        />
                        <PriceDisplay items={priceBreakdown} total={total} />
                        {canBuild && (
                            <div className="flex gap-3">
                                <button className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium">
                                    Save Draft
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-background"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ─── Desktop: 4-panel layout ───────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <h2 className="mb-2 text-2xl font-bold">Custom Embroidery Builder</h2>
            <p className="mb-6 text-sm text-muted">
                Pick clothing, choose designs, select your logo style, and drag everything into place.
            </p>

            {/* Disclaimer */}
            <div className="mb-6 rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-3 text-xs text-muted">
                💡 Placement is approximate. We may adjust slightly for best embroidery results
                and will confirm before charging your card.
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Panel 1: Clothing + Size */}
                <div className="col-span-3 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4" style={{ maxHeight: "70vh" }}>
                    <h3 className="text-sm font-semibold">1. Choose Clothing</h3>
                    <ClothingPicker
                        items={clothingItems ?? []}
                        selectedId={state.clothingItemId}
                        onSelect={selectClothing}
                        onToggleCustom={toggleCustomClothing}
                        onCustomFile={handleCustomFile}
                        isCustomClothing={state.isCustomClothing}
                        customFrontUrl={customFrontUrl}
                        customBackUrl={customBackUrl}
                        selectedSize={state.selectedSize}
                        onSizeChange={(size) => setState(prev => ({ ...prev, selectedSize: size }))}
                    />
                </div>

                {/* Panel 2: Design selector */}
                <div className="col-span-2 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4" style={{ maxHeight: "70vh" }}>
                    <h3 className="text-sm font-semibold">2. Add Designs</h3>
                    <DesignPicker
                        designs={designs ?? []}
                        selectedIds={state.placements.map((p) => p.designId)}
                        onAdd={addDesign}
                    />
                </div>

                {/* Panel 3: Logo variant */}
                <div className="col-span-2 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4" style={{ maxHeight: "70vh" }}>
                    <h3 className="text-sm font-semibold">3. Logo Style</h3>
                    <LogoPicker
                        variants={logoVariants ?? []}
                        selectedId={state.logoVariantId}
                        onSelect={selectLogo}
                    />
                </div>

                {/* Panel 4: Canvas + AI Preview */}
                <div className="col-span-5 space-y-4">
                    <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                        <h3 className="mb-3 text-sm font-semibold">4. Preview & Arrange</h3>
                        <DesignCanvas
                            clothingItem={selectedClothing}
                            customViewUrls={state.isCustomClothing ? state.customViewUrls : undefined}
                            placements={state.placements}
                            logoPlacement={state.logoPlacement}
                            logoVariant={selectedLogo}
                            activeView={state.activeView}
                            onViewChange={(v) => setState((prev) => ({ ...prev, activeView: v }))}
                            onUpdatePlacement={updatePlacement}
                            onRemovePlacement={removePlacement}
                            designs={designs ?? []}
                        />
                    </div>

                    <AIPreviewPanel
                        previewUrl={aiPreviewUrl}
                        generating={generating}
                        onGenerate={async () => {
                            setGenerating(true);
                            setGenerating(false);
                        }}
                    />

                    <PriceDisplay items={priceBreakdown} total={total} />

                    {canBuild && (
                        <div className="flex gap-3">
                            <button className="flex-1 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-secondary/40">
                                Save Draft
                            </button>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                                Add to Cart
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
