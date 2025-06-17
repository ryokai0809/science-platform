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
    <div className="flex flex-col items-center justify-center min-h-screen text-white text-center space-y-4">
      <h1 className="text-2xl font-bold mb-4">계정 정보</h1>

      <Button 
      className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
      onClick={() => router.push("/history")}
      >
  결제 이력
</Button>

      <Button
  className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
  onClick={() => router.push("/")}
>
  강의 선택
</Button>

    </div>
    
    
  );
}
