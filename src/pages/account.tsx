import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import { Youtube, Instagram, ShoppingCart, Heart } from "lucide-react";
import { useTranslation } from "next-i18next";
import { format } from "date-fns";

export default function AccountPage() {
  const [license, setLicense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation("common");

  useEffect(() => {
    const fetchLicense = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        alert("ログインユーザーが取得できませんでした。");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) setLicense(data);
      setLoading(false);
    };

    fetchLicense();
  }, []);

  const now = new Date();
  const expiresAt = license ? new Date(license.expires_at) : null;
  const isCanceled = license?.is_canceled ?? false;

  const statusText = () => {
    if (!license) return t("noSubscription");
    if (expiresAt && expiresAt < now) return t("expired");
    if (isCanceled) return t("canceledPending");
    return t("active");
  };

  const statusColor = () => {
    if (!license || (expiresAt && expiresAt < now)) return "text-red-400";
    if (isCanceled) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-center space-y-4">
        <h1 className="text-2xl font-bold mb-4">{t("accountInfo")}</h1>

        {loading ? (
          <p>{t("loading")}</p>
        ) : (
          <>
            {license ? (
              <div className="border border-yellow-400 rounded-lg p-6 bg-black w-full max-w-md text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">スタディドリーム</h2>
                    <p className="text-sm text-gray-400">
                      利用可能期限：
                      {license
                        ? format(
                            new Date(license.expires_at),
                            "yyyy/MM/dd"
                          ) + " まで"
                        : "取得中..."}
                    </p>
                  </div>
                  <span className={`font-bold ${statusColor()}`}>
                    {statusText()}
                  </span>
                </div>

                <ul className="mt-4 space-y-1 text-sm text-gray-300">
                  <li className="flex justify-between items-center">
                    <span>✔ {t("unlimitedAccess")}</span>

                    {expiresAt && expiresAt > now && !isCanceled ? (
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-full text-xs"
                        onClick={async () => {
                          try {
                            const { data: authData } =
                              await supabase.auth.getUser();
                            const user = authData?.user;

                            if (!user) {
                              alert("ログイン情報が取得できませんでした。");
                              return;
                            }

                            const res = await fetch("/api/customer-portal", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ user_id: user.id }),
                            });

                            if (!res.ok) {
                              const err = await res.text();
                              throw new Error(
                                `リクエスト失敗: ${res.status} - ${err}`
                              );
                            }

                            const { url } = await res.json();

                            if (!url) {
                              throw new Error(
                                "ポータルURLが取得できませんでした"
                              );
                            }

                            window.location.href = url;
                          } catch (err) {
                            console.error(
                              "❌ サブスク管理ページエラー:",
                              err
                            );
                            alert("サブスク管理ページを開けませんでした。");
                          }
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    ) : (
                      <span className="text-red-400">
                        {t("subscriptionCancelled")}
                      </span>
                    )}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-red-400">{t("noSubscription")}</p>
            )}
          </>
        )}

        <Button
          className="bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
          onClick={() => router.push("/")}
        >
          {t("lectureSelect")}
        </Button>
      </div>

      <footer className="w-full bg-black text-white text-sm py-6 px-4 mt-12">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <p>© science dream Allright reserved.</p>
          <p>
            Email:{" "}
            <a
              href="mailto:sciencegive@gmail.com"
              className="underline hover:text-[#EA6137] transition-colors"
            >
              sciencegive@gmail.com
            </a>
          </p>

          <div className="flex justify-center gap-8 mt-6">
            <a
              href="https://www.youtube.com/@ScienceDream"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
            >
              <Youtube size={24} />
              <span className="text-xs mt-1">{t("youtube")}</span>
            </a>

            <a
              href="https://smartstore.naver.com/sciencegive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
            >
              <ShoppingCart size={24} />
              <span className="text-xs mt-1">{t("store")}</span>
            </a>

            <a
              href="https://instagram.com/sciencegive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
            >
              <Instagram size={24} />
              <span className="text-xs mt-1">{t("instagram")}</span>
            </a>

            <a
              href="https://www.youtube.com/channel/UCIk1-yPCTnFuzfgu4gyfWqw/join"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-[#EA6137] hover:text-[#d4542e] transition-transform transform hover:scale-110"
            >
              <Heart size={24} />
              <span className="text-xs mt-1">{t("support")}</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};
