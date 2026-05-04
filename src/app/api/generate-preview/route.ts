import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { canvasImage, prompt } = await req.json();

        if (!canvasImage) {
            return NextResponse.json({ error: "No canvas image provided — canvas may not have loaded yet." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "No Gemini API key found in environment variables." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Strip the data URI prefix to get raw base64
        const base64Data = canvasImage.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

        const fullPrompt = `You are an expert product photographer. I have provided a flat 2D mockup of a custom clothing design.
Please create a highly photorealistic lifestyle image of someone wearing this exact clothing item with this design.
Ensure the design looks like it is naturally printed or embroidered into the fabric, following the folds and lighting of the garment.
Keep the background clean, modern, and aesthetic.
Additional user request: ${prompt || "Make it look professional and ready for an e-commerce store."}
Important: Make sure the core design and garment color exactly match the visual appearance of the provided image.`;

        // ──────────────────────────────────────────────
        // Strategy: Use Gemini 2.0 Flash with native image output
        // This model supports image input + image output via responseModalities
        // and produces significantly better edited images than 2.5 Flash Image.
        // ──────────────────────────────────────────────
        console.log("[generate-preview] Calling Gemini 2.5 Flash Image with base64 length:", base64Data.length);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/png",
                                data: base64Data
                            }
                        },
                        { text: fullPrompt }
                    ]
                }
            ],
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        console.log("[generate-preview] Response candidates:", response.candidates?.length ?? 0);

        // Extract the generated image from the response
        let generatedBase64: string | null = null;
        let textFallback: string | null = null;

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    generatedBase64 = part.inlineData.data as string;
                    break;
                }
                if (part.text) {
                    textFallback = part.text;
                }
            }
        }

        if (!generatedBase64) {
            const finishReason = response.candidates?.[0]?.finishReason;
            const errorMsg = `No image data returned from Gemini. Finish reason: ${finishReason ?? "unknown"}. Text: ${textFallback ?? "none"}.`;
            console.error("[generate-preview]", errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: 500 });
        }

        const mimeType = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.mimeType ?? "image/png";
        console.log("[generate-preview] Successfully generated image.");
        return NextResponse.json({ url: `data:${mimeType};base64,${generatedBase64}` });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("AI Preview Generation Error:", errMsg);
        return NextResponse.json(
            { error: `Gemini API error: ${errMsg}` },
            { status: 500 }
        );
    }
}
