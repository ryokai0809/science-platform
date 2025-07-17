// pages/api/juku-payouts.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/utils/supabaseServerClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { year, month } = req.query;

  const from = `${year}-${month}-01`;
  const to = `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("juku_id, amount, purchased_at");

  if (error) {
    console.error(error);
    return res.status(500).json({ message: "DB error" });
  }

  const result = new Map<number, number>();

  data
    .filter(s => s.purchased_at >= from && s.purchased_at < to)
    .forEach(s => {
      if (!s.juku_id) return;
      result.set(s.juku_id, (result.get(s.juku_id) || 0) + s.amount);
    });

  const payouts = Array.from(result.entries()).map(([juku_id, total]) => ({
    juku_id,
    total_sales: total,
    payout: Math.round(total * 0.3),
  }));

  res.status(200).json(payouts);
}
