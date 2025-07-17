import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    const role = user.user_metadata?.role;

    if (!role) {
      toast.error("役割が設定されていません");
      setLoading(false);
      return;
    }

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", role);

    toast.success(t("loginSuccess"));

    if (role === "admin") {
      router.push("/admin-dashboard");
    } else if (role === "juku") {
      router.push("/juku-dashboard");
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <h1 className="text-xl font-bold text-center">{t("login")}</h1>

          <Input
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder={t("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
          >
            {loading ? t("loading") : t("login")}
          </Button>

          <p className="text-center text-sm">
            {t("noAccount")}{" "}
            <button
              onClick={() => router.push("/signup")}
              className="underline text-blue-400"
            >
              {t("signup")}
            </button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}