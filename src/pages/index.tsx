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
    {!isAuthenticated ? (
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">로그인</h1>
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
        <Button onClick={isSignUp ? handleSignUp : handleSignIn}>
          {isSignUp ? "회원가입" : "로그인"}
        </Button>
        <Button variant="ghost" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "로그인 화면으로" : "회원가입하기"}
        </Button>
      </div>
    ) : (
      <div className="space-y-6 w-full max-w-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">학년 선택</h2>
          <Button onClick={handleLogout}>로그아웃</Button>
        </div>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="w-full p-2 border"
        >
          <option value="">학년 선택</option>
          {gradesWithSubject.map((g) => (
            <option
              key={g.id}
              value={`${g.subjects[0]?.name || ""} ${g.name}`}
              onClick={() => setSelectedGradeId(g.id)}
            >
              {`${g.subjects[0]?.name || ""} ${g.name}`}
            </option>
          ))}
        </select>
        {selectedGrade && renderVideos()}
      </div>
    )}
  </main>
);

}
