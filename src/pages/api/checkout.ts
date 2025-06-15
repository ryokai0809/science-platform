// 예시: pages/api/checkout.ts
export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // 서버 전용
  // 민감한 로직 처리...
  res.status(200).json({ ok: true });
}
