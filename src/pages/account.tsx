// pages/account.tsx
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";



export default function AccountPage() {
  const [license, setLicense] = useState(null);
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : "";
  const router = useRouter();


  useEffect(() => {
    const fetchLicense = async () => {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_email", userEmail)
        .maybeSingle();

      if (data) setLicense(data);
    };
    fetchLicense();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white text-center">
      <h1 className="text-2xl font-bold mb-4">계정 정보</h1>

      <Button 
      className="mt-6 bg-primary text-white rounded-full px-6 py-2"
      onClick={() => router.push("/history")}
      >
  결제 이력
</Button>

      <Button
  className="mt-6 bg-primary text-white rounded-full px-6 py-2"
  onClick={() => router.push("/")}
>
  학년 선택 돌아가기
</Button>

    </div>
    
    
  );
}
