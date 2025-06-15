// pages/login.tsx
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // 위치는 프로젝트 구조에 따라 수정

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert('로그인 실패: ' + error.message);
    else window.location.href = '/admin/dashboard';
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>로그인</h2>
      <input placeholder="이메일" onChange={e => setEmail(e.target.value)} />
      <input placeholder="비밀번호" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>로그인</button>
    </div>
  );
}
