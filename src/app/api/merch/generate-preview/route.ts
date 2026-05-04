import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const maxDuration = 60; // Allow enough time for AI generation

function getAI() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

function getConvex() {
    return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            canvasImageB64,
            clothingDescription,
            placementMode = "design", // "design" | "logo" 
            configHash // unique hash of this exact layout configuration for caching
        } = body;

        if (!canvasImageB64 || !clothingDescription) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const convex = getConvex();

        // 1. Check AI Render Cache first!
        if (configHash) {
            const cached = await convex.query(api.aiRenderCache.getByHash, { configHash });
            if (cached) {
                // Return the existing storage URL instantly
                const url = await convex.query(api.storage.getUrl, { storageId: cached.imageStorageId });
                if (url) {
                    return NextResponse.json({ imageUrl: url, cached: true, storageId: cached.imageStorageId });
                }
            }
        }

        // 2. Prepare the prompt for Gemini 2.5 Flash Image mapping
        const basePrompt = `A high-quality, realistic catalog product photo of a ${clothingDescription}.`;
        let detailPrompt = "";

        if (placementMode === "logo") {
            detailPrompt = `The attached image is a layout mockup showing a logo placement. Photorealistically render this logo exactly where it appears on the garment mockup. Ensure the logo looks like authentic raised thread embroidery (or a patch, depending on the logo style) seamlessly integrated into the fabric texture. Studio lighting, pure white background.`;
        } else {
            detailPrompt = `The attached image is a layout mockup showing custom graphic designs on the garment. Photorealistically render these graphics exactly where they are placed on the mockup. The graphics should look like high-quality, dense structural thread embroidery seamlessly integrated into the fabric. Do not change the underlying color or shape of the garment itself. Studio lighting, pure white background.`;
        }

        const fullPrompt = `${basePrompt} ${detailPrompt}`;

        // Clean the b64 string
        const base64Data = canvasImageB64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

        // 3. Generate with Gemini 2.5 Flash Image
        // Using simple generateContent with multi-modal input (text + img)
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: base64Data
                    }
                },
                fullPrompt
            ],
        });

        // 4. Extract generated image from response
        let generatedBase64: string | null = null;
        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    generatedBase64 = part.inlineData.data as string;
                    break;
                }
            }
        }

        if (!generatedBase64) {
            throw new Error("No image data returned from Gemini");
        }

        return NextResponse.json({ imageUrl: `data:image/png;base64,${generatedBase64}` });

    } catch (error) {
        console.error("Gemini Preview Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate AI preview" },
            { status: 500 }
        );
    }
}

