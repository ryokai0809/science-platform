// pages/api/stripe.ts

import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../utils/stripe-server";
import { supabase } from "../../utils/supabaseServerClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { user_email, grade_id, product_id, license_type, } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{ price: product_id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
      metadata: {
      user_email,
      grade_id: String(grade_id),
      product_id,
      license_type,
},
    });

    return res.status(200).json({ id: session.id });
  } catch (err: any) {
    console.error("Stripe セッション作成エラー:", err);
    return res.status(500).json({ message: err.message });
  }
}
