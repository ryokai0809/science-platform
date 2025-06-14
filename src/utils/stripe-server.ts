// utils/stripe-server.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16", // Stripeダッシュボードで推奨される最新APIバージョンに更新してください
});
