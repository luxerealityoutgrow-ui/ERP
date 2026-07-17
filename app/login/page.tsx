"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error(err);
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(authError.message);
        }
      } else if (data.user) {
        // Clear any role override on fresh login
        localStorage.removeItem('luxe-role-override');
        router.replace('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 bg-zinc-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-800/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-zinc-700/5 blur-[80px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img 
            src="/luxe-logo.png" 
            alt="Luxe Realty Logo" 
            className="h-16 w-auto object-contain shrink-0" 
          />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            PROPERTY ERP
          </p>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-sm font-bold text-white tracking-tight">Sign in to your account</h2>
          <p className="text-[11px] text-zinc-400 mt-1 font-semibold">
            Enter your credentials to access the ERP.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@luxerealtypune.com"
                required
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-750/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-750/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-350 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 text-sm font-black hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Team hint */}
        <div className="pt-4 border-t border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
            Access restricted to authorized Luxe Realty team members only.
          </p>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-6 z-10 text-center">
        <p className="text-[10px] text-zinc-600 font-medium">
          © 2026 Luxe Realty Advisors, Pune. Powered by Outgrow Intelligence Studios.
        </p>
      </div>
    </div>
  );
}
