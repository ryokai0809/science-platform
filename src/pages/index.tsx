import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import getStripe from "@/utils/stripe";
import { Youtube, Instagram, ShoppingCart, Heart } from "lucide-react";

export type Subject = {
  id: number;
  name: string;
};

export type License = {
  grade_id: number;
  expires_at: string;
};


// ✅ 正しくはこうする
export type Grade = {
  id: number;
  name: string;
  subjects: Subject; // ← 単数でOK。外部キーのエイリアスとして `subjects` を使う
};


export type Video = {
  id: number;
  title: string;
  url: string;
  grade_id: number;
  grades: {
    id: number;
    name: string;
    subjects: Subject;
  };
};




const getEmbedUrl = (url: string): string => {
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  const youtubeMatch = url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  return url; // fallback
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
  const menuRef = useRef<HTMLDivElement>(null);
  

  const router = useRouter();

  useEffect(() => {
  (async () => {
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id, name");

    const { data: gradeData } = await supabase
  .from("grades")
  .select(`
    id,
    name,
    subjects!grades_subject_id_fkey (
      id,
      name
    )
  `);


const { data: videoData, error: videoError } = await supabase
  .from("videos")
  .select(`
    id,
    title,
    url,
    grade_id,
    grades:grades!videos_grade_id_fkey (
      id,
      name,
      subjects (
        id,
        name
      )
    )
  `);




    if (videoError) {
      console.error("❌ videoData error", videoError);
    }

    console.log("🎥 videoData", videoData); // ← 콘솔 확인

    setSubjects(subjectData ?? []);
    setGradesWithSubject((gradeData ?? []) as unknown as Grade[]);
    setVideos((videoData ?? []) as unknown as Video[]);
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

  useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowMenu(false);
    }
  };

  if (showMenu) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showMenu]);

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

const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

const renderVideos = () => {
  const list = videos.filter((v) => v.grade_id === selectedGradeId);
  if (!list.length) return <p className="text-gray-400">영상이 없습니다.</p>;
  const paid = paidGrades.includes(selectedGradeId!);

  return (
    <div className="space-y-4">
      {list.map((v) => (
        <div key={v.id} className={paid ? "" : "blur-sm pointer-events-none"}>
          {/* 제목 클릭 시 토글 */}
          <button
            onClick={() =>
              setSelectedVideoId(selectedVideoId === v.id ? null : v.id)
            }
            className="block w-full text-left font-bold text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition"
          >
            {v.title}
          </button>

          {/* 선택된 경우에만 iframe 렌더링 */}
          {selectedVideoId === v.id && (
            <div className="mt-2">
              <iframe
                width="560"
                height="315"
                src={getEmbedUrl(v.url)}
                title={v.title}
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      ))}

      {!paid && (
        <Button
          className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
          onClick={handlePayment}
        >
          이용권 구매 ($70 / 1년)
        </Button>
      )}
    </div>
  );
};


  return (
    <>
    <main className="flex min-h-[calc(100vh-150px)] flex-col items-center justify-center p-8 space-y-6">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-white text-2xl"
        >
          ☰
        </button>

       {showMenu && (
  <div ref={menuRef} className="mt-2 bg-black shadow rounded p-4 space-y-4">
    <div className="text-white text-sm">{userEmail || "비로그인 상태"}</div>
    <div className="flex flex-col space-y-2">
      <Button
        className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
        onClick={() => router.push("/account")}
      >
        계정
      </Button>
      <Button
        className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
        onClick={logout}
      >
        로그아웃
      </Button>
    </div>
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
              <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important" onClick={signUp}>
                회원가입
              </Button>
            ) : (
              <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important" onClick={signIn}>
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
    className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
    onClick={() => {
      const label = `${g.subjects?.name ?? ""} ${g.name}`.trim();
      setSelectedGradeId(g.id);
      setSelectedGradeLabel(label);
    }}
  >
    {`${g.subjects?.name ?? ""} ${g.name}`}
  </Button>
))}


              </div>
            </>
          ) : (
            <div className="space-y-4 w-full max-w-2xl">
              <h3 className="text-xl font-bold">{selectedGradeLabel} 영상 목록</h3>
              {renderVideos()}
              <Button
                className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
                onClick={() => setSelectedGradeId(null)}
              >
                강의 선택
              </Button>
            </div>
          )}
          </div>
        </>
      )}
{!selectedGradeId && (
      <div className="w-full flex flex-col items-center mt-2">
  <h3 className="text-xl font-bold mb-4">샘플 영상</h3>
  <div className="w-full max-w-xl aspect-video">
    <iframe
      src="https://www.youtube.com/embed/Z5mVj31NR7M"
      title="샘플 영상"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full rounded-lg shadow-lg"
    />
  </div>
</div>)}
    </main>



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
