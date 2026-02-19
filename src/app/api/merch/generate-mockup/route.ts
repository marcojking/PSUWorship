import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  fillTemplate,
  buildEmbroideryPrompt,
  generateWithVercelGateway,
} from "@/lib/merch/mockupGenerator";

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/** Fetch a URL and return it as a base64 data URI. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/png";
    const b64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const gatewayKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
  if (!gatewayKey) {
    return NextResponse.json(
      { error: "Vercel AI Gateway API key not configured" },
      { status: 500 },
    );
  }

  const model = process.env.VERCEL_AI_GATEWAY_MODEL ?? "google/gemini-3-pro-image";

  const body = await request.json();
  const {
    clothingItemId,
    designConfigs,
  }: {
    clothingItemId?: string;
    designConfigs: { designId: string; size: string; position: string }[];
  } = body;

  if (!designConfigs || designConfigs.length === 0) {
    return NextResponse.json({ error: "No designs provided" }, { status: 400 });
  }

  try {
    const convex = getConvex();

    // Load clothing item image
    let clothingName = "clothing item";
    let clothingDataUrl: string | null = null;
    if (clothingItemId) {
      const clothing = await convex.query(api.clothing.get, {
        id: clothingItemId as Id<"clothingItems">,
      });
      if (clothing) {
        clothingName = clothing.name;
        const storageUrl = await convex.query(api.storage.getUrl, {
          storageId: clothing.imageStorageId,
        });
        if (storageUrl) clothingDataUrl = await toDataUrl(storageUrl);
      }
    }

    // Load design images + descriptions
    const designDetails = await Promise.all(
      designConfigs.map(async (config) => {
        const design = await convex.query(api.designs.get, {
          id: config.designId as Id<"designs">,
        });
        let designDataUrl: string | null = null;
        if (design?.imageStorageId) {
          const storageUrl = await convex.query(api.storage.getUrl, {
            storageId: design.imageStorageId,
          });
          if (storageUrl) designDataUrl = await toDataUrl(storageUrl);
        }
        return {
          description: design?.description ?? "design",
          size: config.size,
          position: config.position,
          dataUrl: designDataUrl,
        };
      }),
    );

    // Build the text prompt
    const template = await convex.query(api.promptTemplates.getActiveByType, {
      type: "embroidered",
    });
    const templateStr =
      template?.template ??
      "Photorealistic {clothing_name} with this exact design ({size}) embroidered at {placement}. Faithfully reproduce the design's colors and shapes as an embroidered patch. Thread texture on fabric. Studio lighting on plain background.";

    const prompt = buildEmbroideryPrompt(templateStr, clothingName, designDetails);

    // Collect image data URLs to send as multimodal inputs:
    // [design image(s), then clothing image]
    const imageDataUrls: string[] = [
      ...designDetails.map((d) => d.dataUrl).filter(Boolean) as string[],
      ...(clothingDataUrl ? [clothingDataUrl] : []),
    ];

    // Generate main mockup
    const mainImage = await generateWithVercelGateway(prompt, gatewayKey, model, imageDataUrls);

    // Generate close-ups (only for 1-2 designs to keep cost down)
    const closeups: string[] = [];
    if (designDetails.length <= 2) {
      const closeupTemplate = await convex.query(api.promptTemplates.getActiveByType, {
        type: "closeup",
      });
      const fallbackCloseupTemplate =
        "Show the entire design as an embroidered patch lying flat on {fabric_type} fabric. Display the full design without cropping, with the fabric texture clearly visible. Flat-lay product photography, soft studio lighting.";
      const templateStr = closeupTemplate?.template ?? fallbackCloseupTemplate;

      for (const detail of designDetails) {
        const closeupPrompt = fillTemplate(templateStr, {
          design_description: detail.description,
          fabric_type: "cotton",
        });
        // Send design image + clothing image so the model uses the right fabric texture
        const closeupImages = [
          ...(detail.dataUrl ? [detail.dataUrl] : []),
          ...(clothingDataUrl ? [clothingDataUrl] : []),
        ];
        const closeupUrl = await generateWithVercelGateway(closeupPrompt, gatewayKey, model, closeupImages);
        if (closeupUrl) closeups.push(closeupUrl);
      }
    }

    return NextResponse.json({ mainImage, closeups });
  } catch (error) {
    console.error("Mockup generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate mockup" },
      { status: 500 },
    );
  }
}
