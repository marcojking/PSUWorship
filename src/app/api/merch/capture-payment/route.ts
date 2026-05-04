import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-01-28.clover" as any,
    });
}

function getConvex() {
    return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
    try {
        const { orderId, paymentIntentId, adminNote } = await request.json();
        if (!orderId || !paymentIntentId) {
            return NextResponse.json({ error: "Missing order ID or payment intent ID" }, { status: 400 });
        }

        // 1. Tell Stripe to officially capture the previously authorized funds
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.capture(paymentIntentId);

        if (intent.status !== "succeeded") {
            return NextResponse.json({ error: "Failed to capture payment" }, { status: 400 });
        }

        // Extract receipt URL now that it's formally charged
        let receiptUrl = undefined;
        if (intent.latest_charge && typeof intent.latest_charge !== "string") {
            receiptUrl = intent.latest_charge.receipt_url;
        }

        // 2. Update Convex order to 'approved' (meaning payment is secure and production can begin)
        const convex = getConvex();
        await convex.mutation(api.orders.updateStatus, {
            id: orderId,
            status: "approved",
            adminNote: adminNote || undefined,
            stripeReceiptUrl: receiptUrl || undefined,
        });

        return NextResponse.json({ success: true, receiptUrl });
    } catch (error) {
        console.error("Payment capture failed:", error);
        return NextResponse.json({ error: "Verification failed. Has it already been captured?" }, { status: 500 });
    }
}
