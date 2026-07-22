"use client";

import '@/lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { RoleOverrideProvider } from '@/lib/role-context';
import { supabase } from '@/lib/supabaseClient';

function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

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

        setStatus('authenticated');
      } catch {
        setStatus('unauthenticated');
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, [isLoginPage]);

  if (status === 'loading' && !isLoginPage) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#ffffff]">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 rounded-[9px] bg-[#d4ad4d] text-white flex items-center justify-center font-bold mx-auto text-base">
            LR
          </div>
          <p className="text-xs font-medium text-[#5d5d5d]">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <AuthGate>{children}</AuthGate>;
  }

  return (
    <RoleOverrideProvider>
      <AuthGate>
        <div className="h-screen w-screen bg-transparent flex flex-col font-sans overflow-hidden">
          <Header />
          <div className="flex-1 flex w-full px-6 py-6 gap-6 overflow-hidden">
            <SidebarNav />
            <main className="flex-1 min-w-0 overflow-y-auto pr-1">
              {children}
            </main>
          </div>
        </div>
      </AuthGate>
    </RoleOverrideProvider>
  );
}
