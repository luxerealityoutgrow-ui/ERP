"use client";
import '@/lib/i18n';
import { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 text-zinc-900">{children}</main>
      </div>
    </div>
  );
}
