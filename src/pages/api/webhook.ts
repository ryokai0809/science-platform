import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { stripe } from "@/utils/stripe-server";
import { supabaseAdmin } from "@/utils/supabaseServerClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook verify error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { user_id } = session.metadata || {};
    const stripeCustomerId = session.customer as string;

    if (!user_id) {
      console.error("❌ metadata missing");
      return res.status(400).send("Missing metadata");
    }

    console.log("✅ checkout.session.completed:", { user_id, stripeCustomerId });

    await supabaseAdmin
      .from("users")
      .update({
        is_subscribed: true,
        stripe_customer_id: stripeCustomerId,
      })
      .eq("id", user_id);

    // licenses
    const { data: license } = await supabaseAdmin
      .from("licenses")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (license) {
      await supabaseAdmin
        .from("licenses")
        .update({
          stripe_customer_id: stripeCustomerId,
          is_canceled: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", license.id);
    } else {
      await supabaseAdmin
        .from("licenses")
        .upsert({
          user_id,
          stripe_customer_id: stripeCustomerId,
          is_canceled: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "user_id" });
    }

    console.log("✅ licenses を更新しました");

    // sales
    const juku_id = session.metadata?.juku_id || null;

    let amount = 0;

    const subscriptionId = session.subscription as string;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      amount = subscription.items.data[0]?.price.unit_amount || session.amount_total || 0;
    }

    await supabaseAdmin
      .from("sales")
      .insert({
        user_id,
        juku_id,
        amount,
      });

    console.log("✅ sales に記録しました");
  }

  if (event.type === "customer.subscription.updated") {
  const subscription = event.data.object as Stripe.Subscription & { current_period_end: number };

  const stripeCustomerId = subscription.customer as string;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  let currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;

  if (typeof subscription.current_period_end === "number") {
    currentPeriodEnd = subscription.current_period_end * 1000;
  }

  await supabaseAdmin
    .from("licenses")
    .update({
      is_canceled: cancelAtPeriodEnd,
      expires_at: new Date(currentPeriodEnd).toISOString(),
    })
    .eq("stripe_customer_id", stripeCustomerId);

  console.log("✅ licenses subscription.updated 反映");

  if (!cancelAtPeriodEnd) {
    // salesにも記録
    const license = await supabaseAdmin
      .from("licenses")
      .select("user_id, juku_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (license.data) {
      await supabaseAdmin
        .from("sales")
        .insert({
          user_id: license.data.user_id,
          juku_id: license.data.juku_id,
          amount: subscription.items.data[0]?.price.unit_amount || 0,
        });
      console.log("✅ sales に記録しました (subscription.updated)");
    }
  }
}

  // subscription.deleted
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const stripeCustomerId = subscription.customer as string;

    await supabaseAdmin
      .from("licenses")
      .update({
        is_canceled: true,
        expires_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", stripeCustomerId);

    console.log("✅ licenses subscription.deleted 反映");
  }

  return res.status(200).json({ received: true });
}
