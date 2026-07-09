"use client";
import '@/lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { RoleOverrideProvider } from '@/lib/role-context';
import { supabase } from '@/lib/supabaseClient';
import { Laptop, Building2, Loader2, ShieldCheck } from 'lucide-react';

function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  // Skip auth gate on login page
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoginPage) {
      setStatus('authenticated');
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus('unauthenticated');
          window.location.href = '/login';
          return;
        }

        // Fetch profile for welcome card
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
          setUserRole(profile.role || 'SalesPerson');
        }

        // Brief delay to show the welcome card
        setTimeout(() => setStatus('authenticated'), 1200);
      } catch {
        setStatus('unauthenticated');
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, [isLoginPage]);

  // Loading / Welcome card
  if (status === 'loading' && !isLoginPage) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-zinc-950">
        <div className="relative">
          {/* Background glow */}
          <div className="absolute inset-0 -m-20 rounded-full bg-zinc-800/20 blur-[80px]" />
          
          {/* Card */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-80 text-center space-y-5 shadow-2xl">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-white tracking-tight">Luxe Realty</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">ERP System</p>
              </div>
            </div>

            {/* Spinner */}
            <div className="flex justify-center py-2">
              <div className="h-10 w-10 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            </div>

            {/* Status text */}
            <div className="space-y-1.5">
              {userName ? (
                <>
                  <p className="text-sm font-bold text-white">Welcome, {userName}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <p className="text-[10px] font-bold text-emerald-400">
                      {userRole === 'SuperAdmin' ? 'Super Admin Access' : userRole === 'Admin' ? 'Admin Access' : 'Sales Executive Access'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">Verifying access...</p>
                  <p className="text-[10px] text-zinc-500">Authenticating your session</p>
                </>
              )}
            </div>

            {/* Bottom bar */}
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-[9px] text-zinc-600">Powered by Outgrow Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !isLoginPage) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // Login page renders without the shell
  if (isLoginPage) {
    return <AuthGate>{children}</AuthGate>;
  }

  return (
    <RoleOverrideProvider>
      <AuthGate>
        {/* Laptop & Desktop Workspace (>= 1024px) */}
        <div className="hidden lg:flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900">
          <SidebarNav />
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 text-zinc-900">{children}</main>
          </div>
        </div>

        {/* Restricted Mobile/Tablet View (< 1024px) */}
        <div className="flex lg:hidden relative h-screen w-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center text-zinc-200 overflow-hidden select-none">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[40%] left-[50%] -translate-x-[50%] w-[600px] h-[600px] rounded-full bg-zinc-800/10 blur-[120px]" />
            <div className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[300px] h-[300px] rounded-full bg-zinc-700/5 blur-[80px]" />
          </div>

          <div className="relative z-10 max-w-sm space-y-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-white">Luxe Realty</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[8px] font-extrabold tracking-widest uppercase">ERP</span>
            </div>

            <div className="relative flex items-center justify-center h-28 w-28 rounded-3xl bg-zinc-900 border border-zinc-800/80 shadow-2xl shadow-zinc-950">
              <div className="absolute inset-0 rounded-3xl bg-white/[0.02] animate-pulse" />
              <div className="relative flex flex-col items-center justify-center">
                <Laptop className="h-10 w-10 text-white animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-1 h-1.5 w-10 bg-zinc-800 rounded-full blur-[2px] opacity-60" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-black text-white tracking-tight">Desktop Access Only</h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                The Luxe Realty ERP is optimized for large displays.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800/60 text-[10px] font-bold text-zinc-500 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-ping" />
              Please use a laptop or desktop computer.
            </div>
          </div>
        </div>
      </AuthGate>
    </RoleOverrideProvider>
  );
}
