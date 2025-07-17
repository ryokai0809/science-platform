import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

export default function JukuSales() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("2025-07");

  const router = useRouter();

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const jukuId = user.user_metadata.juku_id;
      if (!jukuId) {
        router.push("/");
        return;
      }

      const res = await fetch(`/api/list-sales?jukuId=${jukuId}`);
      if (!res.ok) {
        console.error("API error:", await res.text());
        setLoading(false);
        return;
      }

      const json = await res.json();
      const data: any[] = Array.isArray(json) ? json : [];

      // 月でフィルタ
      const filtered = data.filter(s => s.created_at.startsWith(selectedMonth));

      setSales(filtered);
      const sum = filtered.reduce((acc, cur) => acc + (cur.amount ?? 0), 0);
      setTotal(sum);

      setLoading(false);
    };

    fetchSales();
  }, [selectedMonth]);

  if (loading) return <p>読み込み中…</p>;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">売上確認</h2>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-gray-800 text-white rounded px-2 py-1"
        >
          <option value="2025-07">2025-07</option>
          <option value="2025-06">2025-06</option>
          {/* 必要に応じて増やす */}
        </select>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 text-center shadow-md">
        <h3 className="text-lg font-semibold text-gray-300">総売上 ({selectedMonth})</h3>
        <p className="text-3xl font-bold text-white mt-2">¥{total.toLocaleString()}</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">売上リスト</h3>
        <table className="w-full text-left text-gray-300">
          <thead>
            <tr>
              <th className="pb-2">学生</th>
              <th className="pb-2">金額</th>
              <th className="pb-2">購入日時</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>¥{s.amount}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center text-gray-500">売上データがまだありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => router.push("/juku-dashboard")}
        className="mt-6 bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
      >
        ダッシュボードに戻る
      </button>
    </main>
  );
}
