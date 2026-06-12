// Minimal sign‑in page – replace with your auth flow
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToProvider = async () => {
      const { data } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      console.log(data);
    };
    redirectToProvider();
  }, []);
  return <div className="p-4">Redirecting to provider…</div>;
}
