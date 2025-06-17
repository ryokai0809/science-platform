import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("로그인이 필요합니다");
      router.push("/");
      return;
    }
    setUserEmail(email);

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_email", email)
        .order("purchased_at", { ascending: false });

      if (error) {
        console.error("결제 이력 불러오기 실패:", error.message);
      } else {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">결제 이력</h1>

      {history.length === 0 ? (
        <p className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important">결제 이력이 없습니다.</p>
      ) : (
<table className="w-full text-sm text-left border border-gray-600 text-white">
  <thead className="bg-gray-800 text-white">
  <tr>
    <th className="px-4 py-3 border-b border-gray-700">라이선스 종류</th>
    <th className="px-4 py-3 border-b border-gray-700">결제일</th>
    <th className="px-4 py-3 border-b border-gray-700">만료일</th>
    <th className="px-4 py-3 border-b border-gray-700">상태</th>
  </tr>
</thead>

  <tbody className="divide-y divide-gray-700">
  {history.map((item, idx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expireDate = new Date(item.expires_at);
    expireDate.setHours(0, 0, 0, 0);
    const isValid = expireDate >= today;

    return (
      <tr key={idx} className="hover:bg-gray-700">
        <td className="px-4 py-2">{item.license_type}</td>
        <td className="px-4 py-2">
          {new Date(item.purchased_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-2">
          {expireDate.toLocaleDateString()}
        </td>
        <td className="px-4 py-2 font-semibold">
          {isValid ? (
            <span className="text-green-400">사용 가능</span>
          ) : (
            <span className="text-red-400">사용 불가</span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>


</table>

      )}
      <div className="mt-6 flex justify-center">

            <Button
  className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
  onClick={() => router.push("/")}
>
  강의 선택
</Button>
     </div>
    </main>
  );
}
