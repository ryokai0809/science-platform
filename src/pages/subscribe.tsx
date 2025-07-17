import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import { supabase } from "@/utils/supabaseClient";

export default function SubscribePage() {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const locale = i18n.language;

  useEffect(() => {
    (async () => {
      if (locale !== "ja") {
        setIsSubscribed(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        alert(t("loginRequired"));
        router.push("/");
        return;
      }

      // ✅ サーバーAPIに初期化リクエスト
      const res = await fetch("/api/subscribe-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,

        }),
      });

      if (!res.ok) {
        console.error("❌ ユーザー登録API失敗", await res.text());
        setIsSubscribed(false);
        return;
      }

      const json = await res.json();
      setIsSubscribed(json.is_subscribed ?? false);
    })();
  }, [locale]);

  if (isSubscribed === null) {
    return <p className="text-center mt-12">{t("loading")}</p>;
  }

  return (
    <main className="flex flex-col items-center justify-center p-12 space-y-6">
      <h1 className="text-2xl font-bold">{t("subscribeTitle")}</h1>

      {isSubscribed ? (
        <p className="text-green-600">{t("alreadySubscribed")}</p>
      ) : (
        <Button
  className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-8 py-3 rounded-full"
  onClick={async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        throw new Error("ログインユーザーが取得できませんでした。");
      }

      const selectedGrade = localStorage.getItem("selectedGrade");

      localStorage.setItem("userEmail", user.email || "");
localStorage.setItem("selectedGrade", selectedGrade || "");
localStorage.setItem("jukuId", String(user.user_metadata?.juku_id || ""));


      const res = await fetch("/api/checkout-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1Rfls6FPDAhWFjqhFhCjTxBj",
          email: user.email, // ←ここ
          user_id: user?.id, 
          locale: i18n.language,
          schoolCode: selectedGrade,
          juku_id: user.user_metadata?.juku_id || null,  // 👈 追加
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Request failed: ${res.status} - ${err}`);
      }

      const { url } = await res.json();

      if (!url) {
        throw new Error("Checkout session URL is undefined");
      }

      window.location.href = url;
    } catch (err) {
      console.error("❌ Subscription error:", err);
      alert("エラーが発生しました。もう一度お試しください。");
    }
  }}
>
  {t("startSubscription")}
</Button>

      )}
    </main>
  );
}

// i18n SSR
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};
