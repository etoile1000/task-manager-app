import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-admin";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

async function setPro(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_pro: true })
    .eq("id", userId);
  if (error) console.error("[stripe webhook] setPro failed", error);
  else console.log("[stripe webhook] setPro success", { userId });
}

async function unsetPro(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_pro: false })
    .eq("id", userId);
  if (error) console.error("[stripe webhook] unsetPro failed", error);
  else console.log("[stripe webhook] unsetPro success", { userId });
}

function userIdFromSession(session: Stripe.Checkout.Session): string | undefined {
  const fromMeta = session.metadata?.supabase_user_id?.trim();
  if (fromMeta) return fromMeta;
  const fromClientRef = session.client_reference_id?.trim();
  if (fromClientRef) return fromClientRef;
  return undefined;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid) return;

  const userId = userIdFromSession(session);
  if (!userId) {
    console.warn("[stripe webhook] checkout.session.completed: missing user id in metadata");
    return;
  }
  await setPro(userId);
}

async function handleSubscriptionActive(sub: Stripe.Subscription) {
  const userId = sub.metadata?.supabase_user_id?.trim();
  if (!userId) return;

  if (sub.status === "active" || sub.status === "trialing") {
    console.log("[stripe webhook] setPro", { userId, status: sub.status, subId: sub.id });
    await setPro(userId);
  } else if (
    sub.status === "canceled" ||
    sub.status === "unpaid" ||
    sub.status === "incomplete_expired" ||
    sub.status === "past_due"
  ) {
    console.log("[stripe webhook] unsetPro", { userId, status: sub.status, subId: sub.id });
    await unsetPro(userId);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionActive(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
