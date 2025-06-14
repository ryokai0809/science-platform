// pages/success.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";
import { Button } from "../components/ui/button";

export default function SuccessPage() {
  const router = useRouter();
  const { grade_id } = router.query; 

  useEffect(() => {
    const registerLicense = async () => {
      const email = localStorage.getItem("userEmail"); // 저장된 이메일
      const licenseType = localStorage.getItem("selectedGrade"); // 예: "중학교 1학년"

      if (!email || !licenseType) return;

      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(now.getFullYear() + 1);

      const { data, error } = await supabase.from("licenses").insert([
        {
          user_email: email,
          license_type: licenseType,
          purchased_at: now.toISOString(),
          expires_at: oneYearLater.toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase 저장 실패:", error.message);
      } else {
        console.log("라이선스 등록 성공:", data);
      }
    };

    registerLicense();
  }, []);

  return (
    <div className="text-center mt-16 text-white">
      <h1 className="text-2xl font-bold mb-4">결제가 완료되었습니다!</h1>
      <p>이제 영상을 자유롭게 시청하실 수 있습니다.</p>
      <Button
  className="mt-6 bg-primary text-white rounded-full px-6 py-2"
  onClick={() => router.push("/")}
>
  학년 선택으로 돌아가기
</Button>

    </div>
  );
}
