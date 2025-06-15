import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import getStripe from "../utils/stripe";
import type { Subject } from "@/types/subject";
import toast from "react-hot-toast";
import type { License } from "@/types/license";
import type { Grade } from "@/types/grade"; // 없으면 만들기
import type { Video } from "@/types/video";

function getEmbedUrl(url: string): string {
  const videoIdMatch = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  const videoId = videoIdMatch?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

type GradeWithSubject = {
  id: number;
  name: string;
  subjects: {
    name: string;
  }[];
};

export default function Home() {
  const [schoolCode, setSchoolCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [userLicense, setUserLicense] = useState(null);
  const [gradesWithSubject, setGradesWithSubject] = useState<GradeWithSubject[]>([]);
  const [paidGrades, setPaidGrades] = useState<number[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // index.tsx 상단 근처
const goToAccountPage = () => router.push("/account");


  const now = new Date();
  const license = licenses.find(l => l.grade_id === selectedGradeId);
  const isExpired = license ? new Date(license.expires_at) < new Date() : true;
  const hasPaid = !!license && !isExpired;

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // subjects는 단순하게
      const { data: subjects } = await supabase.from("subjects").select("id, name");
      const { data: grades } = await supabase.from("grades").select("id, name");
      const { data: videos } = await supabase.from("videos").select("*");
      setSubjects(subjects || []);
      setGrades(grades || []);
      setVideos(videos || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchLicenses = async () => {
      const userEmail = localStorage.getItem("userEmail");
      const { data, error } = await supabase
        .from("licenses")
        .select("*, grades(id, name, subjects(name))")
        .eq("user_email", userEmail)
        .gte("expires_at", new Date().toISOString());
      if (!error) {
        setLicenses(data);
        const paidGradeIds = data.map((item: License) => item.grade_id);
        setPaidGrades(paidGradeIds);
      }
    };
    fetchLicenses();
  }, []);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data, error } = await supabase.from("grades").select("id, name, subjects(name)");
      if (!error) setGradesWithSubject(data || []);
    };
    fetchGrades();
  }, []);

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setIsAuthenticated(true);
      setUserEmail(email);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
    }
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      alert("회원가입 성공! 이메일을 확인해주세요.");
      setIsSignUp(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
    setSelectedGrade("");
    localStorage.clear();
  };

  const handlePayment = async () => {
    if (!selectedGradeId) return;
    const stripe = await getStripe();
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: userEmail, product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk", grade_id: selectedGradeId, license_type: selectedGrade })
    });
    const { id: sessionId } = await res.json();
    await stripe.redirectToCheckout({ sessionId });
  };

  const renderVideos = () => {
    const matchedVideos = videos.filter((v) => {
      const grade = v.grades;
      const label = `${grade?.subjects?.name || ""} ${grade?.name || ""}`;
      return label === selectedGrade;
    });
    const selectedGradeId = matchedVideos[0]?.grade_id;
    const isPaid = paidGrades.includes(selectedGradeId);
    return (
      <div className="space-y-6">
        {isPaid ? (
          matchedVideos.map((v) => (
            <iframe key={v.id} width="560" height="315" src={getEmbedUrl(v.url)} title={v.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          ))
        ) : (
          <>
            {matchedVideos.map((v) => (
              <div key={v.id} className="blur-sm pointer-events-none">
                <iframe width="560" height="315" src={getEmbedUrl(v.url)} title={v.title} frameBorder="0"></iframe>
              </div>
            ))}
            <Button onClick={handlePayment}>라이센스 구매 (\u20a9120,000 / 1년)</Button>
          </>
        )}
      </div>
    );
  };

  return (
  <main className="flex min-h-screen flex-col items-center justify-center p-8">

<div className="absolute top-4 left-4 z-10">
  <button onClick={() => setShowMenu(!showMenu)} className="text-white text-2xl">
    ☰
  </button>

  {showMenu && (
    <div className="mt-2 bg-black shadow rounded p-4 space-y-2">
      <div className="text-white text-sm">{userEmail || "비로그인 상태"}</div>
      {isAuthenticated && (
        <>
         <Button className="bg-primary text-white rounded-full px-4 py-2 w-full" onClick={goToAccountPage}>
  계정
</Button>

          <Button
            className="bg-primary text-white rounded-full px-4 py-2 w-full"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </>
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
    <Input
      placeholder="이메일"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <Input
      placeholder="비밀번호"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    {isSignUp ? (
      <Button onClick={handleSignUp} className="w-full bg-primary text-white rounded-full">
        회원가입
      </Button>
    ) : (
      <Button onClick={handleSignIn} className="w-full bg-primary text-white rounded-full">
        로그인
      </Button>
    )}
    <div className="text-center text-sm">
      {isSignUp ? (
        <>
          이미 계정이 있으신가요?{" "}
          <button onClick={() => setIsSignUp(false)} className="underline">
            로그인
          </button>
        </>
      ) : (
        <>
          아직 회원이 아니신가요?{" "}
          <button onClick={() => setIsSignUp(true)} className="underline">
            회원가입
          </button>
        </>
      )}
    </div>
  </CardContent>
</Card>

      ) : (
        <div className="space-y-8 text-center">
          {!selectedGrade ? (
            <>
              <h2 className="text-2xl font-bold">학년 선택</h2>

              <div className="flex flex-wrap gap-4 justify-center">
  {gradesWithSubject.map((grade) => (
    <Button
      key={grade.id}
      className="bg-primary text-white rounded-full px-6 py-2"
      onClick={() => {
        const label = `${grade.subjects[0]?.name} ${grade.name}`;
        setSelectedGrade(label);
        setSelectedGradeId(grade.id);
        localStorage.setItem("selectedGrade", label);
      }}
    >
      {grade.subjects[0]?.name} {grade.name}
    </Button>
  ))}
</div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{selectedGrade} 영상 목록</h3>
              {renderVideos(
                
              )}
              <div className="space-x-2">
                <Button className="bg-primary text-white rounded-full px-6 py-2" onClick={() => setSelectedGrade("")}>학년 선택으로 돌아가기</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
