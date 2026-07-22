"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  TrendingUp, 
  UserCheck, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  Menu, 
  X, 
  Search, 
  Bell, 
  LogOut, 
  Building2 
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';

export function MobileNav() {
  const pathname = usePathname();
  const profile = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Leads', href: '/leads', icon: Users },
    { title: 'Properties', href: '/properties', icon: Home },
    { title: 'Pipeline', href: '/pipeline', icon: TrendingUp },
    { title: 'Matchmaker', href: '/matchmaking', icon: UserCheck },
    { title: 'Site Visits', href: '/site-visits', icon: Calendar },
    { title: 'Settings', href: '/settings', icon: Settings },
    { title: 'Users', href: '/users', icon: ShieldCheck },
  ];

  const filteredItems = navItems.filter(item => canAccessRoute(profile?.role, item.href));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="lg:hidden w-full sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-black text-xs shadow-md">
          LR
        </div>
        <div>
          <span className="font-extrabold text-sm text-zinc-900 tracking-tight">Luxe Realty</span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-wider">ERP</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Slide-over Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-zinc-950/60 backdrop-blur-sm flex flex-col justify-between p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1 pb-3 border-b border-zinc-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Navigation</p>
            </div>

            <nav className="space-y-1">
              {filteredItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-zinc-100 space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-zinc-50 rounded-2xl">
                <div className="h-8 w-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">{profile?.role || 'Sales Executive'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
