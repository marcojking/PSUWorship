import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;

function getAI() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageB64 } = body;

        if (!imageB64) {
            return NextResponse.json({ error: "Missing image" }, { status: 400 });
        }

        const base64Data = imageB64.replace(/^data:image\/(png|jpeg|webp|heic);base64,/, "");

        const prompt = `Analyze this piece of clothing. Respond with a concise 1-sentence description that includes the dominant specific color (like "NAVY BLUE", "HEATHER GREY", "FOREST GREEN", "CRIMSON RED"), the fabric material (if discernible, like cotton, fleece, poly-blend), and the specific type of garment (e.g., zip-up hoodie, pullover hoodie, crewneck sweatshirt, t-shirt, quarter-zip). DO NOT include the background. Example: "A NAVY BLUE cotton-blend pullover hoodie."`;

        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash", // We use standard flash model for text parsing of images
            contents: [
                {
                    inlineData: {
                        mimeType: "image/jpeg", // Assuming jpeg/png converted
                        data: base64Data
                    }
                },
                prompt
            ],
        });

        const description = response.text ?? "";

        return NextResponse.json({ description: description.trim() });

    } catch (error) {
        console.error("Gemini Describe Clothing Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze clothing" },
            { status: 500 }
        );
    }
}
