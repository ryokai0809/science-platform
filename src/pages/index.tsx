import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import getStripe from "../utils/stripe";

import toast from "react-hot-toast";

// 성공
toast.success("결제 완료!");

// 에러
toast.error("결제 중 오류 발생");

// 로딩 중
const loading = toast.loading("결제 진행 중...");

// 완료되면 갱신
toast.success("결제 성공!", { id: loading }); // 로딩 토스트를 성공으로 변경

export default function Home() {
  const [schoolCode, setSchoolCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // 로그인/회원가입 모드 전환용
  const [userLicense, setUserLicense] = useState(null); // 라이선스 상태
  const [gradesWithSubject, setGradesWithSubject] = useState([]);
  const [paidGrades, setPaidGrades] = useState<number[]>([]); // 유료 학년 id 목록
  const [licenses, setLicenses] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const now = new Date();
  const license = licenses.find(l => l.grade_id === selectedGradeId);
  const isExpired = license ? new Date(license.expires_at) < new Date() : true;
  const hasPaid = !!license && !isExpired;
  const [videos, setVideos] = useState([]);


  useEffect(() => {
  const fetchLicenses = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const { data, error } = await supabase
      .from("licenses")
      .select("*, grades(id, name, subjects(name))")
      .eq("user_email", userEmail)
      .gte("expires_at", new Date().toISOString());

    if (error) {
      console.error("라이센스 불러오기 오류:", error.message);
    } else {
      setLicenses(data); // 👈 전체 라이선스를 저장
      const paidGradeIds = data.map((item) => item.grade_id);
      setPaidGrades(paidGradeIds); // ✅ useState로 관리
    }
  };

  fetchLicenses();
}, []);



   useEffect(() => {
  const fetchVideos = async () => {
    const { data, error } = await supabase
  .from("videos")
  .select(`
    *,
    grades (
      name,
      subjects (
        name
      )
    )
  `);

    if (error) {
      console.error("영상 불러오기 실패:", error.message);
    } else {
      setVideos(data || []);
    }
  };

  fetchVideos();
}, []);


  const updateSubject = async (id, name) => {
    await supabase.from("subjects").update({ name }).eq("id", id);
    setEditingSubject(null);
    fetchData();
  };

  const updateGrade = async (id, name) => {
    await supabase.from("grades").update({ name }).eq("id", id);
    setEditingGrade(null);
    fetchData();
  };

  const updateVideo = async (id, updated) => {
    await supabase.from("videos").update(updated).eq("id", id);
    setEditingVideo(null);
    fetchData();
  };
  

  const router = useRouter();

  const goToAccountPage = () => {
  router.push("/account");
};



  const handleSignUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert("회원가입 실패: " + error.message);
  } else {
    alert("회원가입 성공! 이메일을 확인해주세요.");
    setIsSignUp(false); // 회원가입 후 로그인 모드로
  }
};
   const handleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("로그인 실패: " + error.message);
  } else {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", email);
  }
};



  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedEmail = localStorage.getItem("userEmail");
    const storedPaid = localStorage.getItem("hasPaid");

    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    if (storedPaid === "true") {
      setHasPaid(true);
    }
  }, []);

  useEffect(() => {
  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from("grades")
      .select("id, name, subjects(name)");  // 관계명 subjects가 있어야 합니다

    if (error) {
      console.error("학년 불러오기 실패:", error.message);
    } else {
      setGradesWithSubject(data || []);
    }
  };

  fetchGrades();
}, []);


useEffect(() => {
  const fetchLicense = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("user_email", userEmail)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

  };
  fetchLicense();
}, []);

const getEmbedUrl = (youtubeUrl) => {
  // Shorts 링크 처리
  if (youtubeUrl.includes("/shorts/")) {
    return youtubeUrl.replace("/shorts/", "/embed/");
  }

  // 일반 링크 처리
  const match = youtubeUrl.match(/(?:v=|\/embed\/|\.be\/)([^&?/]+)/);
  if (!match) return youtubeUrl;
  return `https://www.youtube.com/embed/${match[1]}`;
};




  const handleLogin = async () => {
    const now = new Date();
    const isoNow = now.toISOString();

    const { data, error } = await supabase
      .from("school_codes")
      .select("*")
      .eq("code", schoolCode)
      .gte("valid_until", isoNow)
      .maybeSingle();

    if (error) {
      alert("오류가 발생했습니다: " + error.message);
    } else if (data) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");

      localStorage.setItem("userEmail", userEmail);

    } else {
      alert("학교 코드가 유효하지 않거나 만료되었습니다.");
    }
  };

  const handleSignup = () => {
    if (!userEmail) {
      alert("이메일을 입력해주세요");
      return;
    }
    localStorage.setItem("userEmail", userEmail);
    setIsAuthenticated(true);
  };

/* 결제 버튼 */
const handlePayment = async () => {
  if (!selectedGradeId) return;               // 안전장치

  const stripe = await getStripe();

  const res = await fetch("/api/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_email: userEmail,
      product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk",   // Stripe 가격 ID
      grade_id: selectedGradeId,      // ✅ 함께 전송
      license_type: selectedGrade,
    }),
  });

  const { id: sessionId } = await res.json();
  await stripe.redirectToCheckout({ sessionId });
};

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasPaid(false);
    setUserEmail("");
    setSelectedGrade("");
    localStorage.clear();
  };

  const handleStripePayment = async () => {
  try {
    const response = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: userEmail,
        product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk", // 실제 Stripe price ID
      }),
    });

    const { sessionId } = await response.json();

    if (sessionId) {
      const stripe = await getStripe(); // loadStripe 사용
      stripe.redirectToCheckout({ sessionId });
    } else {
      alert("세션 생성 실패");
    }
  } catch (err) {
    alert("결제 중 오류 발생: " + err.message);
  }
};


const renderVideos = () => {
  const matchedVideos = videos.filter((v) => {
    const grade = v.grades;
    const label = `${grade?.subjects?.name || ""} ${grade?.name || ""}`;
    return label === selectedGrade;
  });

  if (matchedVideos.length === 0) {
    return <p className="text-gray-600">아직 등록된 영상이 없습니다.</p>;
  }

  // 현재 선택된 학년 id
  const selectedGradeId = matchedVideos[0]?.grade_id;
  const isPaid = paidGrades.includes(selectedGradeId); // ✅ 중요

  return (
    <div className="space-y-6">
      {isPaid ? (
        matchedVideos.map((v) => (
          <iframe
            key={v.id}
            width="560"
            height="315"
            src={getEmbedUrl(v.url)}
            title={v.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ))
      ) : (
        <>
          {matchedVideos.map((v) => (
            <div key={v.id} className="blur-sm pointer-events-none">
              <iframe
                width="560"
                height="315"
                src={getEmbedUrl(v.url)}
                title={v.title}
                frameBorder="0"
              ></iframe>
            </div>
          ))}
          <Button 
          onClick={handlePayment}>라이센스 구매 (₩120,000 / 1년)
          
          </Button>
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

          <img
  src="/banner.png"
  alt="배너"
  className="max-w-xl w-full mx-auto rounded-lg"
/>




          {!selectedGrade ? (
            <>
              <h2 className="text-2xl font-bold">강의 선택</h2>

              <div className="flex flex-wrap gap-4 justify-center">
  {gradesWithSubject.map((grade) => (
    <Button
      key={grade.id}
      className="bg-primary text-white rounded-full px-6 py-2"
      onClick={() => {
        const label = `${grade.subjects?.name} ${grade.name}`;
        setSelectedGrade(label);
        setSelectedGradeId(grade.id);
        localStorage.setItem("selectedGrade", label);
      }}
    >ㄴ
      {grade.subjects?.name} {grade.name}
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