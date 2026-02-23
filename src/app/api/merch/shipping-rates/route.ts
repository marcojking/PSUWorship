import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const shippoKey = process.env.SHIPPO_API_KEY;
  if (!shippoKey) {
    // Return mock rates for development when Shippo isn't configured
    return NextResponse.json({
      rates: [
        { id: "mock_priority", carrier: "USPS", service: "Priority Mail", amount: 895, days: "2-3 business days" },
        { id: "mock_first", carrier: "USPS", service: "First Class", amount: 495, days: "5-7 business days" },
        { id: "mock_ups", carrier: "UPS", service: "Ground", amount: 1195, days: "3-5 business days" },
      ],
    });
  }

  const { address } = await request.json();

  try {
    // Create a shipment to get rates
    const response = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${shippoKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: {
          name: "PSUWorship Merch",
          street1: "123 Main St", // Replace with actual address
          city: "State College",
          state: "PA",
          zip: "16801",
          country: "US",
        },
        address_to: {
          name: address.name,
          street1: address.line1,
          street2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          zip: address.postalCode,
          country: address.country || "US",
        },
        parcels: [
          {
            length: "10",
            width: "8",
            height: "4",
            distance_unit: "in",
            weight: "12",
            mass_unit: "oz",
          },
        ],
        async: false,
      }),
    });

    if (!response.ok) {
      console.error("Shippo API error:", response.status);
      return NextResponse.json({ rates: [] });
    }

    const data = await response.json();

    const rates = (data.rates ?? [])
      .filter((rate: { amount: string }) => rate.amount)
      .sort((a: { amount: string }, b: { amount: string }) => parseFloat(a.amount) - parseFloat(b.amount))
      .slice(0, 2) // Top 2 options
      .map(
        (rate: {
          object_id: string;
          provider: string;
          servicelevel: { name: string };
          amount: string;
          estimated_days: number;
        }) => ({
          id: rate.object_id,
          carrier: rate.provider,
          service: rate.servicelevel?.name ?? "Standard",
          amount: Math.round(parseFloat(rate.amount) * 100), // to cents
          days: rate.estimated_days
            ? `${rate.estimated_days} business day${rate.estimated_days > 1 ? "s" : ""}`
            : "Varies",
        }),
      );

    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Shipping rates error:", error);
    return NextResponse.json({ rates: [] });
  }
}
