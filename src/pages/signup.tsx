import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabaseClient";

export default function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("student");
  const [jukuCode, setJukuCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateRandomCode = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSignup = async () => {
    if (!email || !password || !passwordConfirm) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (password !== passwordConfirm) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    let jukuId: number | null = null;

    if (role === "juku") {
      const newCode = generateRandomCode();
      const { data, error } = await supabase
        .from("jukus")
        .insert({ code: newCode })
        .select("id")
        .single();

      if (!data || error) {
        toast.error(t("jukuRegistrationFailed"));
        setLoading(false);
        return;
      }
      jukuId = data.id;
    }

    if (role === "student") {
      if (!jukuCode.trim()) {
        toast.error(t("enterJukuCode"));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("jukus")
        .select("id")
        .eq("code", jukuCode)
        .single();

      if (!data || error) {
        toast.error(t("invalidJukuCode"));
        setLoading(false);
        return;
      }
      jukuId = data.id;
    }

    const { data: authResult, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          juku_id: jukuId,
        },
      },
    });

    if (!authResult?.user || signupError) {
      toast.error(signupError?.message || t("signupFailed"));
      setLoading(false);
      return;
    }

    if (role === "student") {
      const { error: studentError } = await supabase.from("students").insert({
        user_id: authResult.user.id,
        juku_id: jukuId,
        email,
      });
      if (studentError) {
        toast.error(t("studentRegistrationFailed"));
        setLoading(false);
        return;
      }
    }

    toast.success(t("signupSuccess"));
    router.push("/login");
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <h1 className="text-xl font-bold text-center">{t("signup")}</h1>

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
          <Input
            placeholder={t("confirmPassword")}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="student">{t("student")}</option>
            <option value="juku">{t("juku")}</option>
          </select>

          {role === "student" && (
            <Input
              placeholder={t("jukuCode")}
              value={jukuCode}
              onChange={(e) => setJukuCode(e.target.value)}
            />
          )}

          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-[#EA6137] hover:bg-[#d4542e] text-white px-6 py-2 rounded-full"
          >
            {loading ? t("loading") : t("signup")}
          </Button>

          <p className="text-center text-sm">
            {t("haveAccount")}{" "}
            <button
              onClick={() => router.push("/login")}
              className="underline text-blue-400"
            >
              {t("login")}
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
