"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  TrendingUp, 
  UserCheck, 
  BarChart3, 
  Settings,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';

export function SidebarNav() {
  const pathname = usePathname();
  const profile = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Live clock
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Leads',
      href: '/leads',
      icon: Users,
    },
    {
      title: 'Properties',
      href: '/properties',
      icon: Home,
    },
    {
      title: 'Pipeline',
      href: '/pipeline',
      icon: TrendingUp,
    },
    {
      title: 'Matchmaker',
      href: '/matchmaking',
      icon: UserCheck,
    },
    {
      title: 'Site Visits',
      href: '/site-visits',
      icon: Calendar,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      title: 'Users',
      href: '/users',
      icon: ShieldCheck,
    },
  ];

  // Filter navigation items based on user role permissions
  const filteredNavItems = navItems.filter(item => 
    canAccessRoute(profile?.role, item.href)
  );

  // Mock active dialogue / leads list matching reference image
  const activeDialogs = [
    { name: 'Adem Barnes', msg: "Hi! I'm moving out 1...", online: true },
    { name: 'Azaan Figueroa', msg: 'Thank you!', online: false },
    { name: 'Sumaya O\'neill', msg: 'Looking forward for...', online: false },
    { name: 'Lukas Mcgowan', msg: 'That suits me well, t...', online: false }
  ];

  return (
    <aside className={`bg-white/90 backdrop-blur-xl border border-white/80 h-full flex flex-col justify-between shrink-0 transition-all duration-300 rounded-3xl p-4 shadow-sm ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Top Branding & Navigation Container */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide space-y-4">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-purple-500/20">
              ⚡
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-extrabold text-sm text-zinc-900 tracking-tight">Home Desk</h1>
                <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Luxe Realty ERP</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={toggleCollapse} className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname !== '/' && item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={`flex items-center rounded-2xl text-xs font-bold transition-all ${
                  isCollapsed ? 'justify-center p-3' : 'justify-start px-4 py-2.5 gap-3'
                } ${
                  isActive 
                    ? 'untitledui-pill-active' 
                    : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Search & Active Dialogues Section (Reference Design) */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-zinc-100/80 space-y-3">
            {/* Search dialogs */}
            <div className="relative px-1">
              <input
                type="text"
                placeholder="Search dialogs"
                className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl pl-8 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            </div>

            {/* Dialogs List */}
            <div className="space-y-1 px-1">
              {activeDialogs.map((dialog, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <div className="relative shrink-0">
                    <div className="h-7 w-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-700">
                      {dialog.name.charAt(0)}
                    </div>
                    {dialog.online && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-zinc-900 truncate group-hover:text-purple-700 transition-colors">{dialog.name}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{dialog.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer Quick Action Pill */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-zinc-100">
          <Link
            href="/leads?action=new-lead"
            className="w-full py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>💬 Broadcast</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
