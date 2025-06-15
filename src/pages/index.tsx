import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

/*
───────────────────────────────────────────────────────────
🔖  Type Definitions
───────────────────────────────────────────────────────────*/
export type Subject = {
  id: number;
  name: string;
};

export type Grade = {
  id: number;
  name: string;
  /** 1 학년에 여러 과목이 연결돼 있을 수도 있으니 배열로 보관 */
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
  grades: Grade; // Supabase join 결과가 들어옴
};

/*
───────────────────────────────────────────────────────────
🔗  외부 모듈 / 유틸
───────────────────────────────────────────────────────────*/
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import getStripe from "@/utils/stripe";

/*
───────────────────────────────────────────────────────────
🧩  Helper
───────────────────────────────────────────────────────────*/
const getEmbedUrl = (url: string) => {
  if (url.includes("/shorts/")) return url.replace("/shorts/", "/embed/");
  const m = url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

/*
───────────────────────────────────────────────────────────
🏠  페이지 컴포넌트
───────────────────────────────────────────────────────────*/
export default function Home() {
  /* ──────────  상태  ────────── */
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

  /* ──────────  라우터 & 토스트  ────────── */
  const router = useRouter();
  const goToAccountPage = () => router.push("/account");

  /* ──────────  최초 데이터 로드  ────────── */
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

  /* ──────────  라이센스 로드  ────────── */
  useEffect(() => {
    (async () => {
      const u = localStorage.getItem("userEmail");
      if (!u) return;
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

  /* ──────────  Auth Action  ────────── */
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

  /* ──────────  결제  ────────── */
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

  /* ──────────  영상 그리기  ────────── */
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
          <Button onClick={handlePayment}>라이센스 구매 (₩120,000 / 1년)</Button>
        )}
      </div>
    );
  };

  /* ──────────  UI 렌더  ────────── */
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-6">
      {/* 메뉴 버튼 */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 text-white text-2xl"
      >
        ☰
      </button>

      {/* 로그인 / 회원가입 카드 */}
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
              <Button className="w-full" onClick={signUp}>
                회원가입
              </Button>
            ) : (
              <Button className="w-full" onClick={signIn}>
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
        /* ──────────  강의 선택 및 영상  ────────── */
        <>
          {!selectedGradeId ? (
            <>
              <h2 className="text-2xl font-bold">강의 선택</h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {gradesWithSubject.map((g) => (
                  <Button
                    key={g.id}
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
            <div className="space-y-4 w-full max-w-2xl">{renderVideos()}</div>
          )}
          <Button onClick={logout}>로그아웃</Button>
        </>
      )}
    </main>
  );
}
