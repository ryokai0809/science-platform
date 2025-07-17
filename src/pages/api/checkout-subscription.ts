import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/utils/stripe-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { priceId, juku_id, schoolCode, locale, email, user_id } = req.body;

  try {
    console.log("Creating Stripe Session with:", { priceId, email, juku_id, schoolCode, locale, user_id });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale: "ja",
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/${locale || 'ja'}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: {
        email,
        user_id, 
        juku_id,  // 👈 追加
        school_code: schoolCode,
        locale,
      },
      customer_email: email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    res.status(500).json({ error: (error as any)?.message || 'Unknown error' });
  }
}
