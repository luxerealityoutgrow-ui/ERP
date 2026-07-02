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

  return (
    <aside className={`bg-zinc-950 border-r border-zinc-900 h-full flex flex-col justify-between shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Top Branding & Navigation Container */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide">
        {/* Branding header centered */}
        <div className={`p-4 flex items-center justify-center border-b border-zinc-900 bg-zinc-950 transition-all duration-300 ${isCollapsed ? 'py-5' : ''}`}>
          <img 
            src="/luxe-logo.png" 
            alt="Luxe Realty" 
            className={`w-auto object-contain transition-all duration-300 shrink-0 ${isCollapsed ? 'h-6' : 'h-16'}`} 
          />
        </div>

        {/* Navigation items list */}
        <nav className={`px-4 py-3 space-y-1.5 mt-4 transition-all ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.title} 
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={`flex items-center rounded-lg text-xs tracking-wide transition-all duration-200 group ${
                  isCollapsed 
                    ? 'justify-center p-2.5 mx-1' 
                    : 'justify-between px-3 py-2.5 mx-1'
                } ${
                  isActive 
                    ? 'bg-zinc-900 text-gold-500 font-semibold border-l-2 border-gold-500 shadow-xs' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-gold-500 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-colors duration-200 shrink-0 ${
                    isActive ? 'text-gold-500' : 'text-zinc-500 group-hover:text-gold-500'
                  }`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Date & Time Widget */}
        <div className={`mx-4 mt-auto mb-2 ${isCollapsed ? 'mx-2' : 'mx-4'}`}>
          <div className={`rounded-xl bg-zinc-900 border border-zinc-800 p-3 ${isCollapsed ? 'p-2' : 'p-3'}`}>
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-300">
                  {currentTime ? currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-200">
                    {currentTime ? currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium pl-5.5">
                  {currentTime ? currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer User Info & Collapse Toggle Section */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3">
        {/* User profile details & Logout row */}
        <div className={`flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xs transition-all ${isCollapsed ? 'flex-col gap-3 py-3' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-300 shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{profile?.full_name || 'Rahul Sharma'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{profile?.email || 'rahul@luxerealty.in'}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Collapse toggle row at the bottom of User ID card */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-2`}>
          <button 
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="flex items-center gap-2.5 p-1.5 rounded-lg text-zinc-500 hover:text-gold-500 hover:bg-zinc-900 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4.5 w-4.5" />
            ) : (
              <>
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
