// utils/supabaseServerClient.ts
import { createClient } from "@supabase/supabase-js";

// ❗ server-side admin key 使用（RLS回避など）
export const supabase = createClient(
  process.env.SUPABASE_URL!, // ✅ 서버 전용 URL 사용
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ 서버 전용 키
);
