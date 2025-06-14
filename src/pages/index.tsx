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
  const [gradesWithSubject, setGradesWithSubject] = useState([]);
  const [paidGrades, setPaidGrades] = useState<number[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [videos, setVideos] = useState([]);

  const now = new Date();
  const license = licenses.find(l => l.grade_id === selectedGradeId);
  const isExpired = license ? new Date(license.expires_at) < new Date() : true;
  const hasPaid = !!license && !isExpired;

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: subjects } = await supabase.from("subjects").select("id, name, subject_id, subjects(name)");
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
        const paidGradeIds = data.map((item) => item.grade_id);
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
      {/* 생략: 로그인 폼 및 강의 선택 UI */}
    </main>
  );
}
