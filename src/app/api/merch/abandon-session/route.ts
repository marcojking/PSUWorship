import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

function getConvex() {
    return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();
        if (!sessionId) {
            return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
        }

        const convex = getConvex();
        const result = await convex.mutation(api.orders.cleanupAbandoned, {
            stripeSessionId: sessionId,
        });

        return NextResponse.json({ result });
    } catch (error) {
        console.error("Abandon session failed:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
