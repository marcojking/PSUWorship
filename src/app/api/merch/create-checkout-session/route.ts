import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, items, deliveryType, shippingAddress, shippingCost, shippingMethod } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  try {
    // Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { name: string; unitPrice: number; quantity: number }) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.unitPrice,
        },
        quantity: item.quantity,
      }),
    );

    // Add shipping as a line item if applicable
    if (deliveryType === "shipping" && shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Shipping — ${shippingMethod}` },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      success_url: `${origin}/merch/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/merch/checkout`,
    });

    // Create pending order in Convex
    const orderTotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0,
    );

    const convex = getConvex();
    await convex.mutation(api.orders.create, {
      email,
      items: items.map(
        (item: {
          type: string;
          designId?: string;
          clothingItemId?: string;
          standaloneProductId?: string;
          name: string;
          quantity: number;
          unitPrice: number;
          size?: string;
          placements?: { designId: string; size: string; position: string }[];
        }) => ({
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          // Note: Convex IDs need to be properly typed; pass as-is for now
          ...(item.designId ? { designId: item.designId as never } : {}),
          ...(item.clothingItemId ? { clothingItemId: item.clothingItemId as never } : {}),
          ...(item.standaloneProductId ? { standaloneProductId: item.standaloneProductId as never } : {}),
          ...(item.placements
            ? {
                placements: item.placements.map((p) => ({
                  designId: p.designId as never,
                  size: p.size,
                  position: p.position,
                })),
              }
            : {}),
        }),
      ),
      total: orderTotal,
      shippingCost: shippingCost ?? 0,
      shippingMethod: shippingMethod ?? "N/A",
      stripeSessionId: session.id,
      deliveryType,
      ...(shippingAddress ? { shippingAddress } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
