"use client";

import React from 'react';
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
  Building2,
  Calendar
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export function SidebarNav() {
  const pathname = usePathname();
  const profile = useProfile();

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
      title: 'Sales',
      href: '/pipeline',
      icon: TrendingUp,
    },
    {
      title: 'Clients',
      href: '/matchmaking',
      icon: UserCheck,
    },
    {
      title: 'Calendar',
      href: '/site-visits',
      icon: Calendar,
    },
    {
      title: 'Reporting',
      href: '/reporting',
      icon: BarChart3,
      badge: 'PRO'
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/80 h-full flex flex-col justify-between shrink-0">
      {/* Top Branding Section */}
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-450 p-2.5 rounded-xl text-zinc-950 shadow-md shadow-emerald-500/10">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-zinc-900 uppercase">Luxe Realty</h1>
            <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">ERP PLATFORM</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="px-4 py-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.title} 
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs tracking-wide transition-all duration-200 group ${
                  isActive 
                    ? 'bg-emerald-50/60 text-emerald-700 font-semibold border-l-2 border-emerald-500 shadow-xs' 
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                    isActive ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-800'
                  }`} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info Section */}
      <div className="p-4 border-t border-zinc-150 bg-zinc-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-sm text-emerald-600">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-zinc-800 truncate">{profile?.full_name || 'David Thompson'}</p>
              <p className="text-[10px] text-zinc-400 truncate">{profile?.email || 'david@luxerealty.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50/60 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
