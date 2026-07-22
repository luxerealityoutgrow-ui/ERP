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
  Calendar, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';

export function SidebarNav({ onClose, className = '' }: { onClose?: () => void; className?: string }) {
  const pathname = usePathname();
  const profile = useProfile();

  const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Leads', href: '/leads', icon: Users },
    { title: 'Properties', href: '/properties', icon: Home },
    { title: 'Pipeline', href: '/pipeline', icon: TrendingUp },
    { title: 'Matchmaker', href: '/matchmaking', icon: UserCheck },
    { title: 'Site Visits', href: '/site-visits', icon: Calendar },
    { title: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => 
    canAccessRoute(profile?.role, item.href)
  );

  return (
    <div className={`flex flex-col justify-between h-full w-full text-left ${className}`}>
      <div className="space-y-6">
        
        {/* Large Prominent Brand Logo (No text next to it) */}
        <div className="px-2 pt-1 pb-2 flex items-center justify-center">
          <Link href="/dashboard" className="block group">
            <img 
              src="/luxe-logo.png" 
              alt="Luxe Realty Logo" 
              className="h-16 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname !== '/' && item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-[#d4ad4d] border-l-2 border-[#d4ad4d] rounded-l-none'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#d4ad4d]' : 'text-zinc-500'}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Status Card */}
      <div className="space-y-3">
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-[9px] space-y-1">
          <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Active User'}</p>
          <p className="text-[9px] font-bold text-[#d4ad4d] uppercase tracking-wider">{profile?.role || 'Sales Executive'}</p>
        </div>

        {/* Powered by Outgrow Logo Footer (No text next to logo) */}
        <div className="pt-1 text-center">
          <a 
            href="https://www.letsoutgrow.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors group"
          >
            <span className="text-zinc-500 font-medium">Powered by</span>
            <img 
              src="https://www.letsoutgrow.com/oglogo.png" 
              alt="Outgrow" 
              className="h-4 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all" 
            />
          </a>
        </div>
      </div>
    </div>
  );
}
