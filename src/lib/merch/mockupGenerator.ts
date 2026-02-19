/**
 * Prompt builder for AI mockup generation.
 * Loads templates and injects variables.
 */

interface PromptVariables {
  design_description?: string;
  clothing_name?: string;
  placement?: string;
  size?: string;
  custom_position?: string;
  fabric_type?: string;
  background?: string;
}

/**
 * Fill a prompt template with variable values.
 */
export function fillTemplate(
  template: string,
  variables: PromptVariables,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }
  }
  // Remove any unfilled variables with sensible defaults
  result = result.replace(/\{background\}/g, "transparent background");
  result = result.replace(/\{fabric_type\}/g, "cotton");
  result = result.replace(/\{[^}]+\}/g, ""); // remove any remaining
  return result.trim();
}

/**
 * Build a multi-design prompt for embroidered clothing.
 */
export function buildEmbroideryPrompt(
  template: string,
  clothingName: string,
  designs: { description: string; size: string; position: string }[],
): string {
  if (designs.length === 1) {
    return fillTemplate(template, {
      clothing_name: clothingName,
      design_description: designs[0].description,
      size: designs[0].size,
      placement: designs[0].position,
      custom_position: designs[0].position,
    });
  }

  // Multi-design: build a compound prompt
  const designDescriptions = designs
    .map(
      (d, i) =>
        `Design ${i + 1}: "${d.description}" (${d.size}) at ${d.position}`,
    )
    .join(". ");

  return fillTemplate(template, {
    clothing_name: clothingName,
    design_description: designDescriptions,
    size: "multiple sizes",
    placement: designs.map((d) => d.position).join(" and "),
  });
}

/**
 * Generate an image via the Vercel AI Gateway.
 * Returns a data URL or null on failure.
 *
 * Model options (set via VERCEL_AI_GATEWAY_MODEL env var):
 *   google/gemini-3-pro-image     — Nano Banana Pro (default, multimodal)
 *   google/gemini-2.5-flash-image — Nano Banana (faster)
 *   bfl/flux-2-pro                — Flux 2 Pro (text-only prompt)
 *
 * imageDataUrls: optional base64 data URIs sent as multimodal inputs.
 * For Google/Gemini models, images are included as multimodal content parts.
 * Order: design image(s) first, then clothing image last.
 */
export async function generateWithVercelGateway(
  prompt: string,
  apiKey: string,
  model = "google/gemini-3-pro-image",
  imageDataUrls: string[] = [],
): Promise<string | null> {
  if (model.startsWith("google/")) {
    return generateWithChatCompletions(prompt, apiKey, model, imageDataUrls);
  }
  return generateWithImagesEndpoint(prompt, apiKey, model);
}

async function generateWithChatCompletions(
  prompt: string,
  apiKey: string,
  model: string,
  imageDataUrls: string[] = [],
): Promise<string | null> {
  // Build multimodal content: images first, then the text instruction
  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

  const content: ContentPart[] = [
    ...imageDataUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
    { type: "text", text: prompt },
  ];

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        modalities: ["image"],
      }),
    });

    if (!response.ok) {
      console.error("Vercel AI Gateway (chat) error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) return null;

    // Already a data URI (data:image/...;base64,...)
    return imageUrl;
  } catch (error) {
    console.error("Vercel AI Gateway chat call failed:", error);
    return null;
  }
}

async function generateWithImagesEndpoint(
  prompt: string,
  apiKey: string,
  model: string,
): Promise<string | null> {
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        providerOptions: {
          blackForestLabs: { outputFormat: "jpeg" },
        },
      }),
    });

    if (!response.ok) {
      console.error("Vercel AI Gateway (images) error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;

    return `data:image/jpeg;base64,${b64}`;
  } catch (error) {
    console.error("Vercel AI Gateway images call failed:", error);
    return null;
  }
}
