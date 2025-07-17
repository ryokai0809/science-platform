import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jukuId = Number(req.query.jukuId);

  if (!jukuId) {
    return res.status(400).json({ error: "Missing jukuId" });
  }

  // sales テーブルから juku_id の売上データを取得
  const { data, error } = await supabase
    .from("sales")
    .select("amount, created_at")
    .eq("juku_id", jukuId);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  // 月単位で集計
  const monthly: Record<string, number> = {};

  (data || []).forEach((sale) => {
    const month = sale.created_at.slice(0, 7); // YYYY-MM
    monthly[month] = (monthly[month] || 0) + (sale.amount || 0);
  });

  return res.status(200).json({ monthly });
}
