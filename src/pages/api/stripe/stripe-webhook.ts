import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/utils/stripe-server";
import { supabaseAdmin } from "@/utils/supabaseServerClient";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook Error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || err}`);
  }

  // 重複チェック
  const { data: existing } = await supabaseAdmin
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existing) {
    console.log("Duplicate event:", event.id);
    return res.status(200).send("Duplicate event ignored.");
  }

  // 実際の処理
  if (event.type === "checkout.session.completed") {
    // ライセンス登録処理など
  }

  // イベントを記録
  await supabaseAdmin.from("webhook_events").insert({
    id: event.id,
    type: event.type,
  });

  res.status(200).json({ received: true });
}
