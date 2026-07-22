"use client";

import '@/lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { RoleOverrideProvider } from '@/lib/role-context';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on page changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <AuthGate>{children}</AuthGate>;
  }

  return (
    <RoleOverrideProvider>
      <AuthGate>
        <div className="h-screen w-screen bg-transparent flex flex-col font-sans overflow-hidden">
          <Header onToggleMenu={() => setIsMobileOpen(prev => !prev)} />
          
          <div className="flex-1 flex w-full px-4 py-4 md:px-6 md:py-6 gap-4 md:gap-6 overflow-hidden relative">
            
            {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
            <aside className="w-64 shrink-0 bg-zinc-950 border border-zinc-850 rounded-[14px] p-5 hidden lg:flex flex-col justify-between shadow-md text-left">
              <SidebarNav />
            </aside>

            {/* Mobile Slide-Out Drawer Navigation */}
            {isMobileOpen && (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity" 
                  onClick={() => setIsMobileOpen(false)}
                />
                
                {/* Drawer Panel */}
                <div className="relative w-64 bg-zinc-950 h-full p-5 flex flex-col justify-between animate-in slide-in-from-left duration-200 shadow-2xl border-r border-zinc-850">
                  {/* Close button */}
                  <button 
                    onClick={() => setIsMobileOpen(false)} 
                    className="absolute right-4 top-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {/* Reuse SidebarNav component with onClose trigger */}
                  <SidebarNav onClose={() => setIsMobileOpen(false)} />
                </div>
              </div>
            )}

            <main className="flex-1 min-w-0 overflow-y-auto pr-1">
              {children}
            </main>
          </div>
        </div>
      </AuthGate>
    </RoleOverrideProvider>
  );
}
