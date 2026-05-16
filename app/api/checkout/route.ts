import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}


type ResolvedPrice =
  | { priceId: string; source: "STRIPE_PRO_PRICE_ID" }
  | { priceId: string; source: "PAYMENT_LINK" };

async function resolvePriceId(stripe: Stripe): Promise<ResolvedPrice | null> {
  const explicitPriceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
  if (explicitPriceId) {
    return { priceId: explicitPriceId, source: "STRIPE_PRO_PRICE_ID" };
  }

  const paymentLinkUrl = process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL?.trim();
  if (!paymentLinkUrl) return null;

  const links = await stripe.paymentLinks.list({ active: true, limit: 100 });
  const link = links.data.find((item) => item.url === paymentLinkUrl);
  if (!link) {
    console.error("[checkout] Payment Link URL was not found in Stripe account", {
      paymentLinkUrl,
    });
    return null;
  }

  const lineItems = await stripe.paymentLinks.listLineItems(link.id, { limit: 1 });
  const priceId = lineItems.data[0]?.price?.id;
  if (!priceId) {
    console.error("[checkout] Payment Link has no price line item", {
      paymentLinkId: link.id,
    });
    return null;
  }

  return { priceId, source: "PAYMENT_LINK" };
}

export async function GET(req: NextRequest) {
  try {
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

    const stripe = getStripe();
    const resolvedPrice = await resolvePriceId(stripe);
    if (!resolvedPrice) {
      console.error(
        "[checkout] Missing STRIPE_PRO_PRICE_ID and could not resolve price from Payment Link",
      );
      return NextResponse.json(
        { error: "Stripe checkout is not configured" },
        { status: 500 },
      );
    }

    const { priceId, source: priceSource } = resolvedPrice;
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
      params.payment_method_collection = "always";
      params.subscription_data = { metadata };
    } else {
      params.payment_intent_data = { metadata };
    }

    console.info("[checkout] creating session", {
      priceSource,
      priceId,
      mode,
      recurring: Boolean(price.recurring),
      paymentMethodCollection: params.payment_method_collection ?? null,
    });

    const session = await stripe.checkout.sessions.create(params);

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 },
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("[checkout] failed to create Checkout Session", err);
    return NextResponse.json(
      { error: "Failed to create Stripe Checkout Session" },
      { status: 500 },
    );
  }
}