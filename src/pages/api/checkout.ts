// src/pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  res.status(200).json({ ok: true });
}
