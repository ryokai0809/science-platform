// import "@/styles/globals.css";
// import type { AppProps } from "next/app";
// import { Toaster } from "react-hot-toast";
// import { appWithTranslation } from 'next-i18next'; // ✅ 추가

// function MyApp({ Component, pageProps }: AppProps) {
//   return (
//     <>
//       <Component {...pageProps} />
//       <Toaster position="top-right" reverseOrder={false} />
//     </>
//   );
// }

// export default appWithTranslation(MyApp);


import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster, toast } from "react-hot-toast";
import { appWithTranslation } from "next-i18next";
import { supabase } from "@/utils/supabaseClient";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthFromURL = async () => {
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");

      if (accessToken && refreshToken) {
        setLoading(true);

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("❌ セッション設定エラー", error);
          toast.error("認証に失敗しました。再度ログインしてください。");
          setLoading(false);
          return;
        }

        toast.success("認証が完了しました");
        setLoading(false);
        router.replace("/"); // 認証後はトップページに遷移
      }
    };

    handleAuthFromURL();
  }, [router]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-lg animate-pulse">ログイン処理中...</div>
        </div>
      )}

      <Component {...pageProps} />
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default appWithTranslation(MyApp);
