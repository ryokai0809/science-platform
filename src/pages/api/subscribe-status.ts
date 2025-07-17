import { supabaseAdmin } from "@/utils/supabaseServerClient";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  // ユーザーIDを取得
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (userError || !userData) {
    console.error("users select error", userError?.message);
    return res.status(500).json({ error: userError?.message ?? "User not found" });
  }

  const userId = userData.id;

  // 有効なライセンスを確認
  const { data: licenses, error: licenseError } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .eq("user_id", userId) // 👈 修正ポイント
    .gt("expires_at", new Date().toISOString());

  if (licenseError) {
    console.error("licenses select error", licenseError.message);
    return res.status(500).json({ error: licenseError.message });
  }

  const hasValidLicense = (licenses ?? []).length > 0;

  res.status(200).json({ is_subscribed: hasValidLicense });
}

// import { supabaseAdmin } from "@/utils/supabaseServerClient";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { user_id } = req.body;

//   if (!user_id) {
//     return res.status(400).json({ error: "Missing user_id" });
//   }

//   const { data: licenses, error: licenseError } = await supabaseAdmin
//     .from("licenses")
//     .select("id")
//     .eq("user_id", user_id)
//     .gt("expires_at", new Date().toISOString());

//   if (licenseError) {
//     console.error("licenses select error", licenseError.message);
//     return res.status(500).json({ error: licenseError.message });
//   }

//   const hasValidLicense = (licenses ?? []).length > 0;

//   res.status(200).json({ is_subscribed: hasValidLicense });
// }
