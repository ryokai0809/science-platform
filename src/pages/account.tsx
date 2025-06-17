// pages/account.tsx
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import { Youtube, Instagram, ShoppingCart, Heart } from "lucide-react";



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
    <>
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
    <footer className="w-full bg-black text-white text-sm py-6 px-4 mt-12">
  <div className="max-w-4xl mx-auto space-y-4 text-center">
    <p>© science dream Allright reserved.</p>
    <p>
      Email:{" "}
      <a href="mailto:sciencegive@gmail.com" className="underline hover:text-[#EA6137] transition-colors">
        sciencegive@gmail.com
      </a>
    </p>

    <div className="flex justify-center gap-8 mt-6">
      {/* Youtube */}
      <a
        href="https://www.youtube.com/@ScienceDream"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
      >
        <Youtube size={24} />
        <span className="text-xs mt-1">유튜브</span>
      </a>

      {/* Store */}
      <a
        href="https://smartstore.naver.com/sciencegive"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
      >
        <ShoppingCart size={24} />
        <span className="text-xs mt-1">스토어</span>
      </a>

      {/* Instagram */}
      <a
        href="https://instagram.com/sciencegive"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
      >
        <Instagram size={24} />
        <span className="text-xs mt-1">인스타그램</span>
      </a>

      {/* 후원 */}
      <a
        href="https://www.youtube.com/channel/UCIk1-yPCTnFuzfgu4gyfWqw/join"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
      >
        <Heart size={24} />
        <span className="text-xs mt-1">후원하기</span>
      </a>
    </div>
  </div>
</footer>
    </>
    
  );
}
