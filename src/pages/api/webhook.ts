import { buffer } from "micro";
import { stripe } from "../../utils/stripe-server";
import { supabase } from "../../utils/supabaseServerClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook verify error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

    if (event.type === "checkout.session.completed") {
     const session = event.data.object;           // Stripe 세션
     console.log("✅ session.metadata:", session.metadata);

     const user_email = session.metadata.user_email;
     const grade_id   = Number(session.metadata.grade_id);
     const license_type = session.metadata.license_type;

     const { error } = await supabase
       .from("licenses")
       .insert({
         user_email,
         grade_id,
         license_type,
         purchased_at: new Date(session.created * 1000).toISOString(),
         expires_at: new Date(
           new Date().setFullYear(new Date().getFullYear() + 1)
         ).toISOString(),
       });

     if (error) {
       // 터미널에 오류 내용이 찍히므로 원인 파악이 쉬워집니다
       console.error("❌ Supabase insert error:", error.message);
     } else {
       console.log("✅ License inserted successfully");
     }
   }

  return res.status(200).json({ received: true });
}
