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
        const { sessionId } = await request.json();
        if (!sessionId) {
            return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
        }

        const stripe = getStripe();
        const convex = getConvex();

        // 1. Verify with Stripe that the session was actually paid OR successfully authorized
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["payment_intent", "payment_intent.latest_charge"],
        });

        const isPaid = session.payment_status === "paid";

        let paymentIntentId = undefined;
        let isAuthorized = false;
        let receiptUrl = undefined;

        if (session.payment_intent && typeof session.payment_intent !== "string") {
            const pi = session.payment_intent as Stripe.PaymentIntent;
            paymentIntentId = pi.id;
            isAuthorized = pi.status === "requires_capture";

            if (pi.latest_charge && typeof pi.latest_charge !== "string") {
                receiptUrl = pi.latest_charge.receipt_url;
            }
        }

        if (!isPaid && !isAuthorized) {
            return NextResponse.json({ status: "unpaid" });
        }

        // 2. Find the order in Convex
        const order = await convex.query(api.orders.getByStripeSession, {
            stripeSessionId: sessionId,
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // 3. Upgrade status if it's currently stuck in 'pending' or missing a receipt
        if (order.status === "pending" || !order.stripeReceiptUrl || !order.stripePaymentIntentId) {
            // Determine if the order contains custom items needing approval
            const needsApproval = order.items.some(
                (i: any) => i.placements && i.placements.length > 0
            );

            // If it's authorized but not paid, it MUST be pending_approval.
            // If it's paid, it goes to paid unless it theoretically still needed approval (fallback).
            const targetStatus = isAuthorized ? "pending_approval" : (needsApproval ? "pending_approval" : "paid");

            await convex.mutation(api.orders.updateStatus, {
                id: order._id,
                status: order.status === "pending" ? targetStatus : order.status,
                stripeReceiptUrl: receiptUrl || undefined,
                stripePaymentIntentId: paymentIntentId || undefined,
            });
        }

        return NextResponse.json({ success: true, status: order.status });
    } catch (error) {
        console.error("Session verification failed:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
