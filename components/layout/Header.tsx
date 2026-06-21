"use client";

import React from 'react';
import { Search, Bell, Mail, ChevronDown } from 'lucide-react';
import { useProfile } from '@/lib/auth';

export function Header() {
  const profile = useProfile();
  
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 py-3.5 flex items-center justify-between z-10">
      {/* Search Input Container */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search properties, leads, clients..." 
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-850 placeholder-zinc-400 focus:outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/10 transition-all duration-200"
        />
      </div>

      {/* Header Utilities */}
      <div className="flex items-center gap-5">
        {/* Connection status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-100">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Live CRM Database</span>
        </div>

        {/* Notifications and Mail Icons */}
        <div className="flex items-center gap-3">
          {/* Email button */}
          <button className="relative p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-850 hover:bg-zinc-100 transition-all">
            <Mail className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-zinc-500 text-[9px] font-bold text-white flex items-center justify-center border border-white">
              2
            </span>
          </button>

          {/* Notifications button */}
          <button className="relative p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-850 hover:bg-zinc-100 transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-zinc-500 text-[9px] font-bold text-white flex items-center justify-center border border-white animate-pulse">
              5
            </span>
          </button>
        </div>

        {/* Vertical Separator */}
        <div className="h-5 w-[1px] bg-zinc-200" />

        {/* Profile Details */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-850 group-hover:text-zinc-950 transition-colors">
              {profile?.full_name || 'Rahul Sharma'}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase">
              {profile?.role || 'Senior Agent'}
            </span>
          </div>
          <div className="h-8.5 w-8.5 rounded-xl bg-zinc-50 border border-zinc-250 flex items-center justify-center font-bold text-xs text-zinc-600 shadow-xs">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-650 transition-colors" />
        </div>
      </div>
    </header>
  );
}
