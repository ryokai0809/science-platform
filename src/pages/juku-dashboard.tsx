import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";

export default function JukuDashboard() {
  const [jukuCode, setJukuCode] = useState("");
  const [students, setStudents] = useState<{ user_id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 🔷 現在のログインユーザー
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const jukuId = Number(user.user_metadata?.juku_id);

      if (!jukuId) {
        setLoading(false);
        return;
      }

      console.log("🎯 jukuId:", jukuId);

      // 🔷 塾コードの取得
      const { data: jukuData } = await supabase
        .from("jukus")
        .select("code")
        .eq("id", jukuId)
        .single();

      setJukuCode(jukuData?.code || "");

      // 🔷 API経由で students 一覧を取得
      const res = await fetch(`/api/list-students?jukuId=${jukuId}`);
      if (!res.ok) {
        console.error("list-students API error", await res.text());
        setStudents([]);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setStudents(json.students ?? []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <p className="text-white text-center mt-10">読み込み中…</p>;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">塾ダッシュボード</h1>

      <div className="bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">塾コード</p>
            <p className="text-xl font-semibold text-white">{jukuCode}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">登録学生数</p>
            <p className="text-xl font-semibold text-white">{students.length} 人</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">学生リスト</h2>
          {students.length > 0 ? (
            <ul className="space-y-1">
  {students.map((student) => (
    <li
      key={student.user_id}
      className="bg-gray-700 px-3 py-1 rounded text-sm text-white"
    >
      {student.email}
    </li>
  ))}
</ul>

          ) : (
            <p className="text-gray-400 text-sm">まだ学生が登録されていません</p>
          )}
        </div>

        <div className="flex flex-col space-y-2 mt-4">
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
            onClick={() => router.push("/juku-sales")}
          >
            売上を確認する
          </Button>
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/ja";
            }}
          >
            ログアウト
          </Button>
        </div>
      </div>
    </main>
  );
}
