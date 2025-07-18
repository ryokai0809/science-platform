import { useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import { useTranslation } from "next-i18next";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function SuccessPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation("common");

  useEffect(() => {
    const notifyServer = async () => {
      const userId = localStorage.getItem("userId");  // 
      const jukuId = localStorage.getItem("jukuId");
      const gradeId = localStorage.getItem("selectedGradeId");

      if (!userId) {
        console.error("❌ Email が未取得");
        return;
      }

      const res = await fetch("/api/subscribe-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          jukuId,
          gradeId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ subscribe-complete API error:", error);
      } else {
        console.log("✅ サーバーに決済完了通知を送信しました");
      }
    };

    notifyServer();
  }, []);

  return (
    <div className="text-center mt-16 text-white">
      <h1 className="text-2xl font-bold mb-4">{t("paymentCompleted")}</h1>
      <p>{t("youCanWatchFreely")}</p>
      <Button
        className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full !important"
        onClick={() => router.push("/")}
      >
        {t("backToGradeSelection")}
      </Button>
    </div>
  );
}

// ✅ 翻訳データを読み込む
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};
