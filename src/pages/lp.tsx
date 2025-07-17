import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signIn = async () => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast.error(error.message);

    const role = data.user.user_metadata.role;
    if (role === "admin") router.push("/admin-dashboard");
    else if (role === "juku") router.push("/juku-dashboard");
    else router.push("/");
  };

  return (
    <main>
      <h1>ログイン</h1>
      <input placeholder="メール" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signIn}>ログイン</button>
    </main>
  );
}
