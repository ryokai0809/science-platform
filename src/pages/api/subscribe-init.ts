import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/utils/supabaseServerClient"; // Service Role Key で作った admin client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, email } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: "Missing user_id or email" });
  }

  // ✅ ユーザーが存在するか確認
  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user_id)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    // 116 = row not found
    console.error("❌ users select error:", selectError.message);
    return res.status(500).json({ error: selectError.message });
  }

  if (!existingUser) {
    // 存在しなければ作成
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: user_id,
        email,
        is_subscribed: false, // フラグは残すが使わない
      });

    if (insertError) {
      console.error("❌ users insert error:", insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    console.log("✅ 新規ユーザー作成");
    // ライセンスがないのでfalse
    return res.status(200).json({ is_subscribed: false });
  }

  // ✅ 有効なライセンスがあるか確認
  const { data: activeLicenses, error: licenseError } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .eq("user_id", user_id)
    .gt("expires_at", new Date().toISOString())
    .eq("is_canceled", false);

  if (licenseError) {
    console.error("❌ licenses select error:", licenseError.message);
    return res.status(500).json({ error: licenseError.message });
  }

  const hasValidLicense = (activeLicenses ?? []).length > 0;

  console.log("✅ ライセンス確認:", hasValidLicense);
  return res.status(200).json({ is_subscribed: hasValidLicense });
}
