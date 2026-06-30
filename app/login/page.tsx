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

  // If already logged in, redirect
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    });
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
    <div className="min-h-screen w-full flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-800/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-zinc-700/10 blur-[80px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Luxe Realty</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Property ERP</p>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
            Pune&apos;s Premier<br />
            Real Estate CRM.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            Track leads, manage luxury property inventory, schedule site visits, and close deals — built exclusively for the Luxe Realty team.
          </p>
          
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { label: '46+ Active Leads', desc: 'Across all stages' },
              { label: '100+ Properties', desc: 'Premium Pune listings' },
              { label: '7 Team Members', desc: 'Collaborative workspace' },
              { label: 'Real-time Sync', desc: 'Instant updates' },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-xs font-bold text-white">{f.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-zinc-600">© 2026 Luxe Realty Advisors, Pune. Powered by Outgrow Intelligence.</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-zinc-50">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-zinc-900">Luxe Realty</h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Property ERP</p>
            </div>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your Luxe Realty credentials to access the ERP.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@luxerealtypune.com"
                  required
                  autoFocus
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-11 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
          <div className="pt-4 border-t border-zinc-200">
            <p className="text-[10px] text-zinc-400 text-center">
              Access restricted to authorized Luxe Realty team members only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
