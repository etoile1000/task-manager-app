import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", "/api/checkout");
    return NextResponse.redirect(loginUrl);
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    console.error("[checkout] STRIPE_PRO_PRICE_ID is not set");
    return NextResponse.json(
      { error: "Stripe checkout is not configured" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId);
  const mode = price.recurring ? "subscription" : "payment";
  const metadata = {
    supabase_user_id: user.id,
  };

  const origin = req.nextUrl.origin;
  const params: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata,
  };

  if (mode === "subscription") {
    params.subscription_data = { metadata };
  } else {
    params.payment_intent_data = { metadata };
  }

  const session = await stripe.checkout.sessions.create(params);

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(session.url, 303);
}
