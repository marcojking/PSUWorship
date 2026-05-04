import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(request: Request) {
  const { amount, mode, name, email } = await request.json() as {
    amount: number;
    mode: 'once' | 'monthly';
    name: string;
    email: string;
  };

  if (!amount || amount < 100) {
    return NextResponse.json({ error: 'Minimum gift is $1' }, { status: 400 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  try {
    let session;
    if (mode === 'monthly') {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Monthly Gift — WM&A' },
            unit_amount: amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        metadata: { donor_name: name, donor_email: email },
        success_url: `${origin}/give/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/give`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'One-Time Gift — WM&A' },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        metadata: { donor_name: name, donor_email: email },
        success_url: `${origin}/give/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/give`,
      });
    }

    await getConvex().mutation(api.donations.create, {
      name,
      email,
      amountCents: amount,
      mode,
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe give error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 },
    );
  }
}
