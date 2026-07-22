"use client";
import '@/lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
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
        {/* Responsive Workspace Layout */}
        <div className="h-screen w-screen overflow-hidden flex flex-col p-2 sm:p-4 lg:p-6 bg-gradient-to-br from-[#EAE8F8] via-[#EFF0FA] to-[#E5E3F5]">
          
          {/* Mobile Top Navigation (Phone Viewports) */}
          <MobileNav />

          {/* Floating Home Desk Workspace Panel */}
          <div className="flex-1 flex gap-4 overflow-hidden rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/80 p-2 sm:p-4 shadow-2xl shadow-purple-900/5">
            {/* Left Sidebar (Desktop) */}
            <div className="hidden lg:block h-full">
              <SidebarNav />
            </div>

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent text-zinc-900 scrollbar-hide">
                {children}
              </main>
            </div>
          </div>

        </div>
      </AuthGate>
    </RoleOverrideProvider>
  );
}
