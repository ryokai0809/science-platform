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

  // students 取得
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select("user_id")
    .eq("juku_id", jukuId);

  if (studentsError || !studentsData) {
    return res.status(500).json({ error: studentsError?.message || "students fetch failed" });
  }

  // 全ユーザー取得
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError || !usersData) {
    return res.status(500).json({ error: usersError?.message || "users fetch failed" });
  }

  const enriched = studentsData.map((s) => {
    const userInfo = usersData.users.find((u) => u.id === s.user_id);
    return {
      user_id: s.user_id,
      email: userInfo?.email || "(メール不明)",
    };
  });

  res.status(200).json({ students: enriched });
}
