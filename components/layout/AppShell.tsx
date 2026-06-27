"use client";
import '@/lib/i18n';
import { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { RoleSwitcher } from './RoleSwitcher';
import { RoleOverrideProvider } from '@/lib/role-context';
import { Laptop } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleOverrideProvider>
      {/* Laptop & Desktop Workspace (>= 1024px) */}
      <div className="hidden lg:flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900">
        <SidebarNav />
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 text-zinc-900">{children}</main>
        </div>
        <RoleSwitcher />
      </div>

      {/* Restricted Mobile/Tablet View (< 1024px) */}
      <div className="flex lg:hidden relative h-screen w-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center text-zinc-200 overflow-hidden select-none">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] left-[50%] -translate-x-[50%] w-[600px] h-[600px] rounded-full bg-zinc-800/10 blur-[120px]" />
          <div className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[300px] h-[300px] rounded-full bg-zinc-700/5 blur-[80px]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-sm space-y-8 flex flex-col items-center">
          {/* Logo Branding */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-white">Luxe Realty</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[8px] font-extrabold tracking-widest uppercase">ERP</span>
          </div>

          {/* Device graphic with bouncing laptop */}
          <div className="relative flex items-center justify-center h-28 w-28 rounded-3xl bg-zinc-900 border border-zinc-800/80 shadow-2xl shadow-zinc-950">
            <div className="absolute inset-0 rounded-3xl bg-white/[0.02] animate-pulse" />
            <div className="relative flex flex-col items-center justify-center">
              <Laptop className="h-10 w-10 text-white animate-bounce duration-1000" style={{ animationDuration: '3s' }} />
              <div className="absolute -bottom-1 h-1.5 w-10 bg-zinc-800 rounded-full blur-[2px] opacity-60" />
            </div>
          </div>

          {/* Restriction messages */}
          <div className="space-y-3">
            <h2 className="text-xl font-black text-white tracking-tight">Desktop Access Only</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              The Luxe Realty ERP is optimized for large displays to accommodate high-density property maps, leads databases, and matchmaking workflows.
            </p>
          </div>

          {/* Action indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800/60 text-[10px] font-bold text-zinc-500 tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-ping" />
            Please use a laptop or desktop computer to access.
          </div>
        </div>
      </div>
    </RoleOverrideProvider>
  );
}
