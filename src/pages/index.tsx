import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useTranslation } from 'next-i18next';

import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";
import getStripe from "@/utils/stripe";
import { Youtube, Instagram, ShoppingCart, Heart, Twitter } from "lucide-react";

export type Subject = {
  id: number;
  name: string;
};

export type Grade = {
  id: number;
  name: string;
  subjects: Subject;
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
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  const youtubeMatch = url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

  return url;
};

export default function Home() {
  const [gradesWithSubject, setGradesWithSubject] = useState<Grade[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [paidGrades, setPaidGrades] = useState<number[]>([]);

  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedGradeLabel, setSelectedGradeLabel] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { t, i18n } = useTranslation('common');
  const locale = i18n.language;
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const contactEmail = locale === "ja" ? "sciencedreamjp@gmail.com" : "sciencegive@gmail.com";

  useEffect(() => {
    (async () => {
      const currentLocale = i18n.language || "ko";
      const { data: subjectData } = await supabase.from("subjects").select("id, name").eq("locale", currentLocale);
      const subjectIds = (subjectData ?? []).map(s => s.id);

      const { data: gradeData } = await supabase.from("grades").select(`id, name, subject_id, subjects!grades_subject_id_fkey(id, name)`).in("subject_id", subjectIds);
      const { data: videoData, error: videoError } = await supabase.from("videos").select(`id, title, url, grade_id, locale, grades:grades!videos_grade_id_fkey(id, name, subjects(id, name))`).eq("locale", currentLocale);

      if (videoError) {
        console.error("❌ videoData error", videoError);
        toast.error("영상 데이터를 불러오는 데 문제가 발생했습니다");
        return;
      }

      setGradesWithSubject((gradeData ?? []) as unknown as Grade[]);
      setVideos((videoData ?? []) as unknown as Video[]);
    })();
  }, [i18n.language]);

  useEffect(() => {
    (async () => {
      const u = localStorage.getItem("userId");
if (!u) return;
setUserId(u);

      if (locale === "ja") {
        const res = await fetch("/api/subscribe-status", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: u }),
});

        if (res.ok) {
          const json = await res.json();
          setPaidGrades(json.is_subscribed ? [999] : []);
        }
      } else {
        const { data } = await supabase.from("licenses").select("grade_id, expires_at").eq("user_email", u).gt("expires_at", new Date().toISOString());
        const grades = (data ?? []).map(l => l.grade_id || 999);
        setPaidGrades(grades);
      }
    })();
  }, [locale]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const logout = () => {
    supabase.auth.signOut();
    setUserId("");
    setSelectedGradeId(null);
    setSelectedGradeLabel("");
    localStorage.clear();
    setShowMenu(false);
  };

  const handlePayment = async () => {
    if (!selectedGradeId) return;
    const stripe = await getStripe();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
  localStorage.setItem("userId", userData.user.id);
}
        if (!userData.user) return;
    const userId = userData.user.id;
    const jukuId = userData.user.user_metadata?.juku_id || null;

    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        grade_id: selectedGradeId,
        product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk",
        license_type: selectedGradeLabel,
        juku_id: jukuId,
      }),
    });

    const { id } = await res.json();
    stripe.redirectToCheckout({ sessionId: id });
  };

  const renderVideos = () => {
    const list = videos.filter(v => v.grade_id === selectedGradeId);
    if (!list.length) return <p className="text-gray-400">{t("noVideo")}</p>;

    const paid = selectedGradeId === null || paidGrades.includes(selectedGradeId) || paidGrades.includes(999);

    return (
      <div className="space-y-4">
        {list.map(v => (
          <div key={v.id} className={paid ? "" : "blur-sm pointer-events-none"}>
            <button onClick={() => setSelectedVideoId(selectedVideoId === v.id ? null : v.id)} className="block w-full text-left font-bold text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition">
              {v.title}
            </button>
            {selectedVideoId === v.id && (
              <div className="mt-2">
                <iframe width="560" height="315" src={getEmbedUrl(v.url)} title={v.title} frameBorder={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full rounded-lg" />
              </div>
            )}
          </div>
        ))}

 {!paid && (
  locale === "ja" ? (
    <div className="text-center space-y-2 mt-4">
      <p className="text-sm text-red-500">
        {t("subscribeToWatch")}
      </p>

      {/* paid === false の場合だけボタン表示 */}
      {paidGrades.length === 0 && (
        <Button
          className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
          onClick={() => router.push("/subscribe")}
        >
          {t("goSubscribe")}
        </Button>
      )}
    </div>
  ) : (
    <Button
      className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
      onClick={handlePayment}
    >
      {t("buyLicense")}
    </Button>
  )
)}

        {/* {!paid && (
          locale === "ja" ? (
            <Button onClick={() => router.push("/subscribe")}>{t("goSubscribe")}</Button>
          ) : (
            <Button onClick={handlePayment}>{t("buyLicense")}</Button>
          )
        )} */}
      </div>
    );
  };

  return (
    <>
      <main className="flex flex-col items-center p-8 space-y-6">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => setShowMenu(!showMenu)} className="text-white text-2xl">☰</button>
         {showMenu && (
  <div ref={menuRef} className="mt-2 bg-black shadow rounded p-4 space-y-4">
    <div className="text-white text-sm">
      {userId ? `UserID: ${userId}` : t("notLoggedIn")}
    </div>
    <div className="flex flex-col space-y-2">
      {userId ? (
        <>
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
            onClick={() => router.push("/account")}
          >
            {t("account")}
          </Button>
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
            onClick={logout}
          >
            {t("logout")}
          </Button>
        </>
      ) : (
        <>
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
            onClick={() => router.push("/signup")}
          >
            {t("register")}
          </Button>
          <Button
            className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
            onClick={() => router.push("/login")}
          >
            {t("login")}
          </Button>
        </>
      )}
    </div>
  </div>
)}


        </div>

        <img src={locale === "ja" ? "/banner_ja.png" : "/banner.png"} alt="banner" className="max-w-xl w-full mx-auto rounded-lg" />

        {!selectedGradeId ? (
          <>
            <h2 className="text-2xl font-bold">{t("lectureSelect")}</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {gradesWithSubject.map(g => (
                <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
                key={g.id} onClick={() => { setSelectedGradeId(g.id); setSelectedGradeLabel(`${g.subjects?.name ?? ""} ${g.name}`.trim()); }}>
                  {`${g.subjects?.name ?? ""} ${g.name}`}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4 w-full max-w-2xl">
            <h3 className="text-xl font-bold">{t("videoList", { label: selectedGradeLabel })}</h3>
            {renderVideos()}
            <div className="flex justify-center">
            <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
            onClick={() => setSelectedGradeId(null)}
            >{t("lectureSelect")}</Button>
             </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-black text-white text-sm py-6 px-4 mt-12">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <p>© science dream Allright reserved.</p>
          <p>Email: <a href={`mailto:${contactEmail}`} className="underline hover:text-[#EA6137] transition-colors">{contactEmail}</a></p>
          <div className="flex justify-center gap-8 mt-6">
            {locale === "ko" && (
              <>
                <a href="https://www.youtube.com/@ScienceDream" target="_blank" rel="noopener noreferrer"><Youtube size={24} /></a>
                <a href="https://smartstore.naver.com/sciencegive" target="_blank" rel="noopener noreferrer"><ShoppingCart size={24} /></a>
                <a href="https://instagram.com/sciencegive" target="_blank" rel="noopener noreferrer"><Instagram size={24} /></a>
                <a href="https://www.youtube.com/channel/UCIk1-yPCTnFuzfgu4gyfWqw/join" target="_blank" rel="noopener noreferrer"><Heart size={24} /></a>
              </>
            )}
            {locale === "ja" && (
              <>
                <a href="https://www.youtube.com/@sciencedream_jp" target="_blank" rel="noopener noreferrer"><Youtube size={24} /></a>
                <a href="https://x.com/QV3pX5YYdj6A3NL" target="_blank" rel="noopener noreferrer"><Twitter size={24} /></a>
              </>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}



// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/router";
// import toast from "react-hot-toast";
// import { useTranslation } from 'next-i18next'

// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { supabase } from "@/utils/supabaseClient";
// import getStripe from "@/utils/stripe";
// import { Youtube, Instagram, ShoppingCart, Heart, Twitter } from "lucide-react";

// export type Subject = {
//   id: number;
//   name: string;
// };

// export type License = {
//   grade_id: number;
//   expires_at: string;
// };

// export type Grade = {
//   id: number;
//   name: string;
//   subjects: Subject; // ← 単数でOK。外部キーのエイリアスとして `subjects` を使う
// };

// export type Video = {
//   id: number;
//   title: string;
//   url: string;
//   grade_id: number;
//   grades: {
//     id: number;
//     name: string;
//     subjects: Subject;
//   };
// };

// const getEmbedUrl = (url: string): string => {
//   const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
//   if (vimeoMatch) {
//     return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
//   }

//   const youtubeMatch = url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
//   if (youtubeMatch) {
//     return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
//   }

//   return url; // fallback
// };


// export default function Home() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [userEmail, setUserEmail] = useState("");

//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [gradesWithSubject, setGradesWithSubject] = useState<Grade[]>([]);
//   const [videos, setVideos] = useState<Video[]>([]);

//   const [licenses, setLicenses] = useState<License[]>([]);
//   const [paidGrades, setPaidGrades] = useState<number[]>([]);

//   const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
//   const [selectedGradeLabel, setSelectedGradeLabel] = useState<string>("");
//   const [showMenu, setShowMenu] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);
//   const { t } = useTranslation('common');
//   const { i18n } = useTranslation()
//   const locale = i18n.language
//   const router = useRouter();
//   const [passwordConfirm, setPasswordConfirm] = useState("");
//   const contactEmail = locale === "ja" ? "sciencedreamjp@gmail.com" : "sciencegive@gmail.com";
//   const [role, setRole] = useState("student");
//   const [jukuCode, setJukuCode] = useState("");
//   const generateRandomCode = (): string => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let code = '';
//   for (let i = 0; i < 6; i++) {
//     code += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return code;
// };

//   useEffect(() => {
//   const checkAuth = async () => {
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//   setIsAuthenticated(false);
//   setUserEmail("");
//   localStorage.clear();
//   return;
// }

// const role = user.user_metadata?.role;

// if (!role) return;

// setUserEmail(user.email ?? "");

//     setIsAuthenticated(true);

//     if (role === 'admin') {
//       router.push("/admin-dashboard");
//     } else if (role === 'juku') {
//       router.push("/juku-dashboard");
//     }
//   };

//   checkAuth();
// }, []);



// useEffect(() => {
//   (async () => {
//     const currentLocale = i18n.language || "ko";

//     const { data: subjectData } = await supabase
//       .from("subjects")
//       .select("id, name")
//       .eq("locale", currentLocale);

//     const subjectIds = (subjectData ?? []).map((s) => s.id);

//     const { data: gradeData } = await supabase
//       .from("grades")
//       .select(`
//         id,
//         name,
//         subject_id,
//         subjects!grades_subject_id_fkey (
//           id,
//           name
//         )
//       `)
//       .in("subject_id", subjectIds);

//     const { data: videoData, error: videoError } = await supabase
//       .from("videos")
//       .select(`
//         id,
//         title,
//         url,
//         grade_id,
//         locale,
//         grades:grades!videos_grade_id_fkey (
//           id,
//           name,
//           subjects (
//             id,
//             name
//           )
//         )
//       `)
//       .eq("locale", currentLocale);

//     if (videoError) {
//       console.error("❌ videoData error", videoError);
//       toast.error("영상 데이터를 불러오는 데 문제가 발생했습니다");
//       return;
//     }

//     setSubjects(subjectData ?? []);
//     setGradesWithSubject((gradeData ?? []) as unknown as Grade[]);
//     setVideos((videoData ?? []) as unknown as Video[]);
//   })();
// }, [i18n.language]);

// useEffect(() => {
//   (async () => {
//     const u = localStorage.getItem("userEmail");
//     if (!u) return;
//     setUserEmail(u);
//     setIsAuthenticated(true);

//     if (locale === "ja") {
//       const res = await fetch("/api/subscribe-status", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: u }),
//       });

//       if (res.ok) {
//         const json = await res.json();
//         setPaidGrades(json.is_subscribed ? [999] : []);
//       } else {
//         console.error("❌ subscribe-status API error", await res.text());
//         setPaidGrades([]);
//       }
//     } else {
//       const { data, error } = await supabase
//         .from("licenses")
//         .select("grade_id, expires_at")
//         .eq("user_email", u)
//         .gt("expires_at", new Date().toISOString());

//       if (error) {
//         console.error("❌ licenses error", error);
//         setPaidGrades([]);
//         return;
//       }

//       const grades = (data ?? []).map((l) => l.grade_id || 999);
//       setPaidGrades(grades);
//     }
//   })();
// }, [locale]);


//   useEffect(() => {
//   const handleClickOutside = (e: MouseEvent) => {
//     if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
//       setShowMenu(false);
//     }
//   };

//   if (showMenu) {
//     document.addEventListener("mousedown", handleClickOutside);
//   } else {
//     document.removeEventListener("mousedown", handleClickOutside);
//   }

//   return () => {
//     document.removeEventListener("mousedown", handleClickOutside);
//   };
// }, [showMenu]);

// useEffect(() => {
//   const browserLang = navigator.language;

//   // 현재 라우터의 locale과 다를 경우만 변경
//   if (browserLang.startsWith("ja") && router.locale !== "ja") {
//     router.push(router.pathname, router.asPath, { locale: "ja" });
//   } else if (browserLang.startsWith("ko") && router.locale !== "ko") {
//     router.push(router.pathname, router.asPath, { locale: "ko" });
//   }
// }, []);

// const signIn = async () => {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error) return toast.error(error.message);

//   const user = data.user;
//   const role = user.user_metadata.role;

//   if (!role) {
//     toast.error("役割が設定されていません");
//     return;
//   }

//   setIsAuthenticated(true);
//   setUserEmail(email);
//   localStorage.setItem("userEmail", email);
//   localStorage.setItem("userRole", role);

//   toast.success(t("loginSuccess"));

//   if (role === 'admin') {
//     router.push("/admin-dashboard");
//   } else if (role === 'juku') {
//     router.push("/juku-dashboard");
//   } else {
//     router.push("/");
//   }
// };


//   const signUp = async () => {
//   if (!email.trim()) {
//     toast.error("メールアドレスを入力してください");
//     return;
//   }

//   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//     toast.error("正しいメールアドレスを入力してください");
//     return;
//   }

//   if (!password) {
//     toast.error("パスワードを入力してください");
//     return;
//   }

//   if (password.length < 8) {
//     toast.error("パスワードは8文字以上にしてください");
//     return;
//   }

//   if (password !== passwordConfirm) {
//     toast.error(t("passwordMismatch"));
//     return;
//   }

//   if (!role) {
//     toast.error("役割を選択してください");
//     return;
//   }

//   let jukuId: number | null = null;

//   if (role === 'juku') {
//   const jukuCode = generateRandomCode();

//   const { data: juku, error: jukuError } = await supabase
//     .from("jukus")
//     .insert({ code: jukuCode })
//     .select("id")
//     .single();

//   if (!juku || jukuError) {
//     toast.error("塾の登録に失敗しました");
//     return;
//   }

//   jukuId = juku.id;
// }

//   if (role === 'student') {
//     if (!jukuCode.trim()) {
//       toast.error("塾コードを入力してください");
//       return;
//     }

//     // 塾コード確認
//     const { data: juku, error: jukuError } = await supabase
//       .from("jukus")
//       .select("id")
//       .eq("code", jukuCode)
//       .single();

//     if (!juku || jukuError) {
//       toast.error("無効な塾コードです");
//       return;
//     }

//     jukuId = juku.id;
//   }

//   const { data: authResult, error } = await supabase.auth.signUp({ 
//   email, 
//   password,
//   options: {
//     data: {
//       role,
//       juku_id: jukuId,
//     }
//   }
// });

// if (error || !authResult.user) {
//   toast.error(error?.message ?? "サインアップに失敗しました");
//   return;
// }

// const userId = authResult.user.id;

// if (role === 'student') {
//   const { error: studentError } = await supabase.from("students").insert({
//     user_id: userId,
//     juku_id: jukuId,
//     email: email, 
//   });
//   if (studentError) {
//     console.error(studentError);
//     toast.error("学生登録に失敗しました");
//     return;
//   }
// }

// toast.success(t("signupSuccess"));
// setIsSignUp(false);

// };




//   const logout = () => {
//     supabase.auth.signOut();
//     setIsAuthenticated(false);
//     setUserEmail("");
//     setSelectedGradeId(null);
//     setSelectedGradeLabel("");
//     localStorage.clear();
//     setShowMenu(false);
//   };

//   const handlePayment = async () => {
//   if (!selectedGradeId) return;

//   const stripe = await getStripe();

//   // 現在のユーザー情報を取得
//   const { data: userData, error: userError } = await supabase.auth.getUser();

//   if (userError || !userData.user) {
//     toast.error("ユーザー情報の取得に失敗しました");
//     return;
//   }

//   const currentUser = userData.user;
//   const userId = currentUser.id;
//   const jukuId = currentUser.user_metadata?.juku_id || null;

//   const res = await fetch("/api/stripe", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       user_email: userEmail,
//       grade_id: selectedGradeId,
//       product_id: "price_1RYYlbFPDAhWFjqhRsr5ZJZk",
//       license_type: selectedGradeLabel,
//       user_id: userId,
//       juku_id: jukuId,
//     }),
//   });

//   const { id } = await res.json();
//   stripe.redirectToCheckout({ sessionId: id });
// };

// const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

// const renderVideos = () => {
//   const list = videos.filter((v) => v.grade_id === selectedGradeId);
//   if (!list.length) return <p className="text-gray-400">{t("noVideo")}</p>;
//   const paid =
//   selectedGradeId === null ||
//   paidGrades.includes(selectedGradeId!) || paidGrades.includes(999);


//   return (
//     <div className="space-y-4">
//       {list.map((v) => (
//         <div key={v.id} className={paid ? "" : "blur-sm pointer-events-none"}>
//           {/* 제목 클릭 시 토글 */}
//           <button
//             onClick={() =>
//               setSelectedVideoId(selectedVideoId === v.id ? null : v.id)
//             }
//             className="block w-full text-left font-bold text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition"
//           >
//             {v.title}
//           </button>

//           {/* 선택된 경우에만 iframe 렌더링 */}
//           {selectedVideoId === v.id && (
//             <div className="mt-2">
//               <iframe
//                 width="560"
//                 height="315"
//                 src={getEmbedUrl(v.url)}
//                 title={v.title}
//                 frameBorder={0}
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                 allowFullScreen
//                 className="w-full rounded-lg"
//               />
//             </div>
//           )}
//         </div>
//       ))}


//       {!paid && (
//   locale === "ja" ? (
//     <div className="text-center space-y-2 mt-4">
//       <p className="text-sm text-red-500">
//         {t("subscribeToWatch")}
//       </p>

//       {/* paid === false の場合だけボタン表示 */}
//       {paidGrades.length === 0 && (
//         <Button
//           className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//           onClick={() => router.push("/subscribe")}
//         >
//           {t("goSubscribe")}
//         </Button>
//       )}
//     </div>
//   ) : (
//     <Button
//       className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//       onClick={handlePayment}
//     >
//       {t("buyLicense")}
//     </Button>
//   )
// )}




//     </div>
//   );
// };


//   return (
//     <>
//     <main className="flex min-h-[calc(100vh-150px)] flex-col items-center justify-center p-8 space-y-6">
//       <div className="absolute top-4 left-4 z-10">
//         <button
//           onClick={() => setShowMenu(!showMenu)}
//           className="text-white text-2xl"
//         >
//           ☰
//         </button>

//        {showMenu && (
//   <div ref={menuRef} className="mt-2 bg-black shadow rounded p-4 space-y-4">
//     <div className="text-white text-sm">{userEmail || t("notLoggedIn")}</div>
//     <div className="flex flex-col space-y-2">
//       <Button
//         className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//         onClick={() => router.push("/account")}
//       >
//         {t("account")}
//       </Button>
//       <Button
//         className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//         onClick={logout}
//       >
//         {t("logout")}
//       </Button>
//     </div>
//   </div>
// )}

//       </div>

//       {!isAuthenticated ? (
//         <Card className="w-full max-w-md">
//           <CardContent className="space-y-4">
//             <h1 className="text-xl font-bold text-center">
//   {isSignUp ? t("signup") : t("login")}
// </h1>
//             <Input placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
//             <Input
//               placeholder={t("password")}
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//             {isSignUp && (
//   <>
//     <Input
//       placeholder={t("confirmPassword")}
//       type="password"
//       value={passwordConfirm}
//       onChange={(e) => setPasswordConfirm(e.target.value)}
//     />

//     <select
//       value={role}
//       onChange={(e) => setRole(e.target.value)}
//       className="w-full border rounded px-2 py-1"
//     >
//       <option value="student">学生</option>
//       <option value="juku">塾</option>
//     </select>

//     {/* 役割が student の場合のみ塾コードを表示 */}
//     {role === 'student' && (
//       <Input
//         placeholder="塾コード"
//         value={jukuCode}
//         onChange={(e) => setJukuCode(e.target.value)}
//       />
//     )}

//   </>
// )}


//             {isSignUp ? (
//               <>
//               <div className="flex justify-center">
//               <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important" onClick={signUp}>
//                 {t("signup")}
//               </Button>
//               </div>
//               <p className="text-sm text-gray-400 mt-2 text-center">
//       登録後に確認メールが送信されますので、メール内のリンクをクリックして認証を完了してください。
//               </p>
//               </>
//             ) : (
//               <div className="flex justify-center">
//               <Button className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important" onClick={signIn}>
//                 {t("login")}
//               </Button>
//               </div>
//             )}
//             <button
//               className="text-xs underline w-full text-center"
//               onClick={() => setIsSignUp(!isSignUp)}
//             >
//               {isSignUp ? t("toLogin"): t("toSignup")}
//             </button>
//           </CardContent>
//         </Card>
//       ) : (
//         <>
//         <div className="space-y-8 text-center">

//           <img
//   src={locale === "ja" ? "/banner_ja.png" : "/banner.png"}
//   alt="banner"
//   className="max-w-xl w-full mx-auto rounded-lg"
// />


//           {!selectedGradeId ? (
//             <>
//               <h2 className="text-2xl font-bold">{t("lectureSelect")}</h2>


//               <div className="flex flex-wrap gap-4 justify-center">
//                 {gradesWithSubject.map((g) => (
//   <Button
//     key={g.id}
//     className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//     onClick={() => {
//       const label = `${g.subjects?.name ?? ""} ${g.name}`.trim();
//       setSelectedGradeId(g.id);
//       setSelectedGradeLabel(label);
//        localStorage.setItem("selectedGrade", label);
//     }}
//   >
//     {`${g.subjects?.name ?? ""} ${g.name}`}
//   </Button>
// ))}


//               </div>
//             </>
//           ) : (
//             <div className="space-y-4 w-full max-w-2xl">
//               <h3 className="text-xl font-bold">
//   {t("videoList", { label: selectedGradeLabel })}
// </h3>

//               {renderVideos()}
//               <Button
//                 className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
//                 onClick={() => setSelectedGradeId(null)}
//               >
//                  {t("lectureSelect")}
//               </Button>
//             </div>
//           )}
//           </div>
//         </>
//       )}
// {!selectedGradeId && (
//       <div className="w-full flex flex-col items-center mt-2">
//   <h3 className="text-xl font-bold mb-4">{t("sampleVideo")}</h3>
//   <div className="w-full max-w-xl aspect-video">
//     <iframe
//       src="https://www.youtube.com/embed/Z5mVj31NR7M"
//       title="샘플 영상"
//       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//       allowFullScreen
//       className="w-full h-full rounded-lg shadow-lg"
//     />
//   </div>
// </div>)}
//     </main>



// <footer className="w-full bg-black text-white text-sm py-6 px-4 mt-12">
//   <div className="max-w-4xl mx-auto space-y-4 text-center">
//     <p>© science dream Allright reserved.</p>
//     <p>
//   Email:{" "}
//   <a href={`mailto:${contactEmail}`} className="underline hover:text-[#EA6137] transition-colors">
//     {contactEmail}
//   </a>
// </p>
//     <div className="flex justify-center gap-8 mt-6">
//   {locale === "ko" && (
//     <>
//       {/* 유튜브 */}
//       <a
//         href="https://www.youtube.com/@ScienceDream"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
//       >
//         <Youtube size={24} />
//         <span className="text-xs mt-1">{t("youtube")}</span>
//       </a>

//       {/* 스마트스토어 */}
//       <a
//         href="https://smartstore.naver.com/sciencegive"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
//       >
//         <ShoppingCart size={24} />
//         <span className="text-xs mt-1">{t("store")}</span>
//       </a>

//       {/* 인스타그램 */}
//       <a
//         href="https://instagram.com/sciencegive"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
//       >
//         <Instagram size={24} />
//         <span className="text-xs mt-1">{t("instagram")}</span>
//       </a>

//       {/* 후원 */}
//       <a
//         href="https://www.youtube.com/channel/UCIk1-yPCTnFuzfgu4gyfWqw/join"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
//       >
//         <Heart size={24} />
//         <span className="text-xs mt-1">{t("support")}</span>
//       </a>
//     </>
//   )}

//   {locale === "ja" && (
//     <>
//       {/* 日本向けYouTube */}
//       <a
//         href="https://www.youtube.com/@sciencedream_jp"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
//       >
//         <Youtube size={24} />
//         <span className="text-xs mt-1">YouTube</span>
//       </a>

//       {/* X (Twitter) */}
// <a
//   href="https://x.com/QV3pX5YYdj6A3NL"
//   target="_blank"
//   rel="noopener noreferrer"
//   className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
// >
//   <Twitter size={24} />
//   <span className="text-xs mt-1">X</span>
// </a>

//     </>
//   )}
// </div>

//   </div>
// </footer>





//     </>
//   );
// }

// import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// export async function getStaticProps({ locale }: { locale: string }) {
//   return {
//     props: {
//       ...(await serverSideTranslations(locale, ['common'])),
//     },
//   }
// }