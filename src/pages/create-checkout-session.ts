// 예: supabase/functions/create-checkout.ts
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2022-11-15",
});

serve(async (req) => {
  const { user_email, product_id } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: product_id, // Stripe 대시보드에서 생성된 price ID
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://yourdomain.com/success",
    cancel_url: "https://yourdomain.com/cancel",
    metadata: {
      user_email,
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
});
