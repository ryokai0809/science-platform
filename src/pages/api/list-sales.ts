import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseAdmin = createClient(
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

  // sales 取得
  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .select("id, user_id, amount, created_at")
    .eq("juku_id", jukuId);

  if (salesError) {
    return res.status(500).json({ error: salesError.message });
  }

  // users 一覧取得
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    return res.status(500).json({ error: usersError.message });
  }

  const enriched = sales.map((sale) => {
    const user = usersData.users.find((u) => u.id === sale.user_id);
    return {
      ...sale,
      email: user?.email || "(不明)",
    };
  });

  res.status(200).json(enriched);
}
