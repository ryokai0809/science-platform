import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import getStripe from "@/utils/stripe";

export type Subject = {
  id: number;
  name: string;
};

export type Grade = {
  id: number;
  name: string;
  subjects: Subject[];
};

export type License = {
  grade_id: number;
  expires_at: string;
};

export type Video = {
  id: number;
  title: string;
  url: string;
  grade_id: number;
  grades: Grade;
};

const getEmbedUrl = (url: string) => {
  if (url.includes("/shorts/")) return url.replace("/shorts/", "/embed/");
  const m = url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradesWithSubject, setGradesWithSubject] = useState<Grade[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const [licenses, setLicenses] = useState<License[]>([]);
  const [paidGrades, setPaidGrades] = useState<number[]>([]);

  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedGradeLabel, setSelectedGradeLabel] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("subjects").select("id,name");
      const { data: g } = await supabase
        .from("grades")
        .select("id,name, subjects(id,name)");
      const { data: v } = await supabase
        .from("videos")
        .select("*, grades(id,name, subjects(id,name))");

      setSubjects(s ?? []);
      setGradesWithSubject((g ?? []) as Grade[]);
      setVideos((v ?? []) as Video[]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const u = localStorage.getItem("userEmail");
      if (!u) return;
      setUserEmail(u);
      setIsAuthenticated(true);
      const { data, error } = await supabase
        .from("licenses")
        .select("grade_id, expires_at")
        .eq("user_email", u)
        .gte("expires_at", new Date().toISOString());
      if (error) {
        console.error(error.message);
        return;
      }
      setLicenses(data ?? []);
      setPaidGrades((data ?? []).map((l) => l.grade_id));
    })();
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast.error(error.message);
    toast.success("로그인 완료");
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem("userEmail", email);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return toast.error(error.message);
    toast.success("회원가입 메일을 확인하세요 ✉️");
    setIsSignUp(false);
  };

  const logout = () => {
    supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail("");
    setSelectedGradeId(null);
    setSelectedGradeLabel("");
    localStorage.clear();
  };

  const handlePayment = async () => {
    if (!selectedGradeId) return;
    const stripe = await getStripe();
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: userEmail,
        grade_id: selectedGradeId,
        product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk",
        license_type: selectedGradeLabel,
      }),
    });
    const { id } = await res.json();
    stripe.redirectToCheckout({ sessionId: id });
  };

  const renderVideos = () => {
    const list = videos.filter((v) => v.grade_id === selectedGradeId);
    if (!list.length) return <p className="text-gray-400">영상이 없습니다.</p>;
    const paid = paidGrades.includes(selectedGradeId!);
    return (
      <div className="space-y-6">
        {list.map((v) => (
          <div key={v.id} className={paid ? "" : "blur-sm pointer-events-none"}>
            <iframe
              width="560"
              height="315"
              src={getEmbedUrl(v.url)}
              title={v.title}
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
        {!paid && (
          <Button className="bg-orange-500 text-white" onClick={handlePayment}>
            라이센스 구매 (₩120,000 / 1년)
          </Button>
        )}
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-6">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-white text-2xl"
        >
          ☰
        </button>

        {showMenu && (
          <div className="mt-2 bg-black shadow rounded p-4 space-y-2">
            <div className="text-white text-sm">{userEmail || "비로그인 상태"}</div>
            {isAuthenticated && (
              <Button
                className="bg-orange-500 text-white rounded-full px-4 py-2 w-full"
                onClick={logout}
              >
                로그아웃
              </Button>
            )}
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
            <h1 className="text-xl font-bold text-center">
              {isSignUp ? "회원가입" : "로그인"}
            </h1>
            <Input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {isSignUp ? (
              <Button className="w-full bg-orange-500 text-white" onClick={signUp}>
                회원가입
              </Button>
            ) : (
              <Button className="w-full bg-orange-500 text-white" onClick={signIn}>
                로그인
              </Button>
            )}
            <button
              className="text-xs underline w-full text-center"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "로그인 화면으로" : "회원가입하기"}
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="space-y-8 text-center">

          <img
  src="/banner.png"
  alt="배너"
  className="max-w-xl w-full mx-auto rounded-lg"
/>

          {!selectedGradeId ? (
            <>
              <h2 className="text-2xl font-bold">강의 선택</h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {gradesWithSubject.map((g) => (
                  <Button
                    key={g.id}
                    className="bg-orange-500 text-white rounded-full px-6 py-2"
                    onClick={() => {
                      setSelectedGradeId(g.id);
                      const label = `${g.subjects?.[0]?.name ?? ""} ${g.name}`.trim();
                      setSelectedGradeLabel(label);
                    }}
                  >
                    {g.subjects?.[0]?.name} {g.name}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 w-full max-w-2xl">
              <h3 className="text-xl font-bold">{selectedGradeLabel} 영상 목록</h3>
              {renderVideos()}
              <Button
                className="bg-orange-500 text-white"
                onClick={() => setSelectedGradeId(null)}
              >
                학년 선택으로 돌아가기
              </Button>
            </div>
          )}
          </div>
        </>
      )}
    </main>
  );
}
