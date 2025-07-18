// import { supabaseAdmin } from "@/utils/supabaseServerClient";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).end();

//   const { email, licenseType, gradeId, jukuId, amount } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: "email is required" });
//   }

//   console.log("📥 subscribe-complete payload:", { email, licenseType, gradeId, jukuId, amount });

//   // 1️⃣ ユーザー確認
//   const { data: user, error: userError } = await supabaseAdmin
//     .from("users")
//     .select("id")
//     .eq("email", email)
//     .single();

//   if (userError) {
//     console.error("❌ users select error:", userError);
//     return res.status(500).json({ error: userError.message });
//   }

//   const userId = user?.id;

//   // 2️⃣ `users` テーブル更新
//   const { error: upsertError } = await supabaseAdmin
//     .from("users")
//     .upsert(
//       [{ id: userId, email, is_subscribed: true }],
//       { onConflict: "email" }
//     );

//   if (upsertError) {
//     console.error("❌ users upsert error:", upsertError);
//     return res.status(500).json({ error: upsertError.message });
//   }

//   // 3️⃣ `sales` テーブルに履歴を追加
//   const { error: salesError } = await supabaseAdmin
//     .from("sales")
//     .insert([
//       {
//         user_id: userId,
//         user_email: email,
//         juku_id: jukuId,
//         grade_id: gradeId,
//         license_type: licenseType,
//         amount,
//         created_at: new Date(),
//       },
//     ]);

//   if (salesError) {
//     console.error("❌ sales insert error:", salesError);
//     return res.status(500).json({ error: salesError.message });
//   }

//   console.log("✅ subscribe-complete success for", email);
//   res.status(200).json({ success: true });
// }

// import { supabaseAdmin } from "@/utils/supabaseServerClient";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { email, licenseType, gradeId, jukuId, amount } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: "email is required" });
//   }

//   console.log("📥 subscribe-complete payload:", { email, licenseType, gradeId, jukuId, amount });

//   // ✅ 1️⃣ ユーザー確認
//   const { data: user, error: userError } = await supabaseAdmin
//     .from("users")
//     .select("id")
//     .eq("email", email)
//     .maybeSingle();

//   if (userError || !user) {
//     console.error("❌ users select error:", userError?.message ?? "User not found");
//     return res.status(500).json({ error: userError?.message ?? "User not found" });
//   }

//   const userId = user.id;

//   // ✅ 2️⃣ `users` テーブル更新 (is_subscribed を true に)
//   const { error: upsertError } = await supabaseAdmin
//     .from("users")
//     .upsert(
//       [
//         {
//           id: userId,
//           email,
//           is_subscribed: true,
//         },
//       ],
//       { onConflict: "email" }
//     );

//   if (upsertError) {
//     console.error("❌ users upsert error:", upsertError.message);
//     return res.status(500).json({ error: upsertError.message });
//   }

//   // ✅ 3️⃣ `sales` テーブルに履歴を追加
//   const { error: salesError } = await supabaseAdmin
//     .from("sales")
//     .insert([
//       {
//         user_id: userId,
//         juku_id: jukuId ?? null,
//         grade_id: gradeId ?? null,
//         license_type: licenseType ?? "default",
//         amount: amount ?? 0,
//         created_at: new Date().toISOString(),
//       },
//     ]);

//   if (salesError) {
//     console.error("❌ sales insert error:", salesError.message);
//     return res.status(500).json({ error: salesError.message });
//   }

//   console.log("✅ subscribe-complete success for", email);
//   return res.status(200).json({ success: true });
// }

import { supabaseAdmin } from "@/utils/supabaseServerClient";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { user_id, licenseType, gradeId, jukuId, amount } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  console.log("📥 subscribe-complete payload:", { user_id, licenseType, gradeId, jukuId, amount });

  // ✅ 1️⃣ ユーザー確認
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user_id)
    .maybeSingle();

  if (userError || !user) {
    console.error("❌ users select error:", userError?.message ?? "User not found");
    return res.status(500).json({ error: userError?.message ?? "User not found" });
  }

  const userId = user.id;

  // ✅ 2️⃣ `users` テーブル更新 (is_subscribed を true に)
  const { error: upsertError } = await supabaseAdmin
    .from("users")
    .update({ is_subscribed: true })
    .eq("id", userId);

  if (upsertError) {
    console.error("❌ users update error:", upsertError.message);
    return res.status(500).json({ error: upsertError.message });
  }

  // ✅ 3️⃣ `sales` テーブルに履歴を追加
  const { error: salesError } = await supabaseAdmin
    .from("sales")
    .insert([
      {
        user_id: userId,
        juku_id: jukuId ?? null,
        grade_id: gradeId ?? null,
        license_type: licenseType ?? "default",
        amount: amount ?? 0,
        created_at: new Date().toISOString(),
      },
    ]);

  if (salesError) {
    console.error("❌ sales insert error:", salesError.message);
    return res.status(500).json({ error: salesError.message });
  }

  console.log("✅ subscribe-complete success for", userId);
  return res.status(200).json({ success: true });
}
