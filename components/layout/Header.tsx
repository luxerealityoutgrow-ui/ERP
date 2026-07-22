"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Home, 
  Plus, 
  TrendingUp, 
  ChevronDown,
  LogOut,
  Search,
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  X,
  ShieldCheck,
  UserCheck,
  Settings,
  LayoutDashboard,
  ArrowRight,
  FileText,
  Building2,
  Tag,
  Menu
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'lead' | 'visit' | 'deal' | 'system' | 'user';
  actor?: string;
  link: string;
}

export function Header({ onToggleMenu }: { onToggleMenu?: () => void }) {
  const profile = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [activeRange, setActiveRange] = useState('today');

  useEffect(() => {
    // Sync initial state if window variable exists
    if (typeof window !== 'undefined') {
      if ((window as any).__dashboardRange) {
        setActiveRange((window as any).__dashboardRange);
      } else {
        (window as any).__dashboardRange = 'today';
      }
    }

    const handleRangeEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveRange(customEvent.detail);
    };
    window.addEventListener('dashboard-range-change', handleRangeEvent);
    return () => {
      window.removeEventListener('dashboard-range-change', handleRangeEvent);
    };
  }, []);

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    if (typeof window !== 'undefined') {
      (window as any).__dashboardRange = range;
      window.dispatchEvent(new CustomEvent('dashboard-range-change', { detail: range }));
    }
  };
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // CMD+K Search Palette State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    navs: any[];
    leads: any[];
    properties: any[];
  }>({ navs: [], leads: [], properties: [] });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Agency-Wide Admin Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Site Visit Confirmed Today',
      message: 'Client Swati Patil confirmed property viewing for Nyati Evoque (Kalyani Nagar) at 02:30 PM.',
      time: '12 mins ago',
      unread: true,
      type: 'visit',
      actor: 'Rahul Sharma',
      link: '/site-visits'
    },
    {
      id: 'n2',
      title: 'New High Priority Lead Inbound',
      message: 'New prospect Siddharth Shetty (+91 98220 44512) assigned with ₹5.20 Cr budget.',
      time: '38 mins ago',
      unread: true,
      type: 'lead',
      actor: 'Priya Mehta',
      link: '/leads'
    },
    {
      id: 'n3',
      title: 'Pipeline Stage Velocity',
      message: 'Deal Vikram Malhotra (Baner Penthouse) advanced to Negotiation stage.',
      time: '1 hour ago',
      unread: true,
      type: 'deal',
      actor: 'Rahul Sharma',
      link: '/pipeline'
    },
    {
      id: 'n4',
      title: 'Property Listing Added',
      message: 'New listing Pristine Kyra (4 BHK • Koregaon Park) added to inventory at ₹5.20 Cr.',
      time: '2 hours ago',
      unread: false,
      type: 'system',
      actor: 'Priya Mehta',
      link: '/properties'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  useEffect(() => {
    const formatDate = () => {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      };
      setCurrentDate(new Date().toLocaleDateString('en-US', options));
    };
    formatDate();
  }, []);

  // Global CMD+K Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Real-time Search Processing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ navs: [], leads: [], properties: [] });
      return;
    }

    const q = searchQuery.toLowerCase();

    // 1. Filter Navigation Pages
    const allNavs = [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Executive control deck & metrics' },
      { title: 'Leads Directory', href: '/leads', icon: Users, desc: 'Client prospects database' },
      { title: 'Properties Inventory', href: '/properties', icon: Home, desc: 'Real estate portfolio listings' },
      { title: 'Sales Pipeline', href: '/pipeline', icon: TrendingUp, desc: 'Deal Kanban board & stages' },
      { title: 'Property Matchmaker', href: '/matchmaking', icon: UserCheck, desc: 'AI property-lead fit engine' },
      { title: 'Site Visits Calendar', href: '/site-visits', icon: Calendar, desc: 'Property viewing schedules' },
      { title: 'Settings & Administration', href: '/settings', icon: Settings, desc: 'User permissions & system config' },
    ];
    const filteredNavs = allNavs.filter(n => n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));

    // 2. Fetch/Filter Leads from Supabase
    async function searchSupabase() {
      try {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, client_name, phone, status, preferred_location, budget_max')
          .or(`client_name.ilike.%${q}%,phone.ilike.%${q}%,preferred_location.ilike.%${q}%`)
          .limit(4);

        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, location, configuration, price')
          .or(`title.ilike.%${q}%,location.ilike.%${q}%,configuration.ilike.%${q}%`)
          .limit(4);

        setSearchResults({
          navs: filteredNavs,
          leads: leadsData || [],
          properties: propsData || []
        });
      } catch (err) {
        console.error('Search error:', err);
      }
    }

    searchSupabase();
  }, [searchQuery]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleDismissNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-850 h-16 px-6 flex items-center justify-between shadow-md text-left">
      
      {/* Left: Universal Search CMD+K Trigger Input (Former Location of Logo) */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-md">
        <button 
          type="button"
          onClick={onToggleMenu}
          className="block lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>
        {/* Desktop Search Input */}
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:block relative w-full cursor-pointer group"
        >
          <input 
            type="text" 
            readOnly
            placeholder="Search properties, leads, nav... ⌘K"
            className="w-full pl-8 pr-12 py-2 bg-zinc-900 border border-zinc-800 rounded-[9px] text-xs font-medium text-white placeholder:text-zinc-500 group-hover:border-[#d4ad4d] transition-all cursor-pointer"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-hover:text-[#d4ad4d] transition-colors" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </span>
        </div>

        {/* Mobile Search Icon Button */}
        <button 
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="block md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Dashboard Range Selector (Conditionally shown only on /dashboard) */}
      {pathname === '/dashboard' && (
        <div className="flex items-center gap-1.5 mx-auto shrink-0 z-10">
          <div className="flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg relative">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: 'ytd', label: 'YTD' },
              { key: 'all', label: 'All' },
            ].map((opt) => {
              const isSelected = activeRange === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleRangeChange(opt.key)}
                  className={`relative px-2 md:px-3 py-1 rounded-md text-[9px] md:text-[10px] font-black transition-colors cursor-pointer select-none z-10 ${
                    isSelected ? 'text-zinc-950 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="header-active-pill"
                      className="absolute inset-0 bg-[#d4ad4d] rounded-md -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Right: Status Pills & Action Controls */}
      <div className="flex items-center gap-3">
        
        {/* Create Button Dropdown */}
        <div className="relative">
          {/* Desktop Create Button Dropdown */}
          <button
            onClick={() => {
              setIsCreateOpen(!isCreateOpen);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#d4ad4d] hover:bg-[#c49d3d] text-white text-xs font-semibold rounded-[9px] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {/* Mobile Create Button Dropdown (Icon Only) */}
          <button
            onClick={() => {
              setIsCreateOpen(!isCreateOpen);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex md:hidden items-center justify-center p-2.5 bg-[#d4ad4d] hover:bg-[#c49d3d] text-white rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>

          {isCreateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCreateOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 border border-zinc-800 rounded-[9px] shadow-lg p-1.5 z-50 text-left space-y-0.5">
                <button
                  onClick={() => { setIsCreateOpen(false); router.push('/leads/create'); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-xs font-semibold text-white hover:bg-zinc-800 transition-colors text-left"
                >
                  <Users className="h-3.5 w-3.5 text-[#d4ad4d]" />
                  <span>New Lead</span>
                </button>
                <button
                  onClick={() => { setIsCreateOpen(false); router.push('/properties/create'); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-xs font-semibold text-white hover:bg-zinc-800 transition-colors text-left"
                >
                  <Home className="h-3.5 w-3.5 text-[#d4ad4d]" />
                  <span>New Property</span>
                </button>
                <button
                  onClick={() => { setIsCreateOpen(false); router.push('/pipeline?action=new-deal'); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-xs font-semibold text-white hover:bg-zinc-800 transition-colors text-left"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-[#d4ad4d]" />
                  <span>New Deal</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Date pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] font-bold text-zinc-400">
          <Calendar className="h-3.5 w-3.5 text-[#d4ad4d]" />
          <span>{currentDate}</span>
        </div>

        {/* ── NOTIFICATION BELL & FUNCTIONAL DRAWER ── */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
              setIsCreateOpen(false);
            }}
            className="relative p-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-450 hover:text-white transition-all cursor-pointer block"
            title="Admin Notifications"
          >
            <Bell className="h-4 w-4 text-[#d4ad4d]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#d4ad4d] text-white text-[9px] font-black flex items-center justify-center border-2 border-zinc-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Drawer */}
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-0 z-50 overflow-hidden animate-in zoom-in-95 duration-150 text-left">
                
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#d4ad4d]" />
                    <h3 className="text-xs font-bold text-white">Agency Operations Stream</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-[#d4ad4d]/20 text-[#d4ad4d] border border-[#d4ad4d]/30 uppercase">
                        {unreadCount} UNREAD
                      </span>
                    )}
                  </div>
                  
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-[#d4ad4d] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" /> Clear unread
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-850 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          router.push(item.link);
                        }}
                        className={`p-4 hover:bg-zinc-800/60 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          item.unread ? 'bg-zinc-900/90' : 'opacity-70'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                                item.type === 'visit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                item.type === 'lead' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                item.type === 'deal' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                'bg-zinc-700/20 text-zinc-300 border-zinc-700/30'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-xs font-extrabold text-white">{item.title}</span>
                            </div>
                            <span className="text-[9px] text-zinc-500 font-bold">{item.time}</span>
                          </div>

                          <p className="text-[11px] text-zinc-300 font-medium leading-snug">{item.message}</p>
                          
                          {item.actor && (
                            <div className="text-[9.5px] font-bold text-[#d4ad4d] flex items-center gap-1 pt-0.5">
                              <span>👤 Executive: {item.actor}</span>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={(e) => handleDismissNotif(item.id, e)}
                          className="text-zinc-600 hover:text-zinc-400 p-1 shrink-0"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-center">
                  <Link 
                    href="/dashboard"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[10px] font-bold text-zinc-400 hover:text-[#d4ad4d] transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View All Admin Audit Logs →</span>
                  </Link>
                </div>

              </div>
            </>
          )}
        </div>

        {/* User profile details & initials avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
              setIsCreateOpen(false);
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="hidden md:block leading-none text-right">
              <span className="font-bold text-xs text-white block group-hover:text-[#d4ad4d] transition-colors">
                {profile?.full_name || 'Rahul Sharma'}
              </span>
              <span className="text-[9px] font-semibold text-zinc-400 mt-0.5 block">
                {profile?.role || 'SuperAdmin'}
              </span>
            </div>
            <div className="h-8 w-8 rounded-[9px] bg-[#d4ad4d] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {profile?.full_name ? getInitials(profile.full_name) : 'RS'}
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-[9px] shadow-lg p-2 z-50 text-left space-y-1">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-xs font-bold text-white">{profile?.full_name || 'Rahul Sharma'}</p>
                  <p className="text-[10px] text-zinc-400">{profile?.email || 'rahul@luxerealty.in'}</p>
                </div>
                <button
                  onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-[6px] transition-colors"
                >
                  Settings & Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-[6px] transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── FULLY FUNCTIONAL UNIVERSAL CMD+K COMMAND PALETTE MODAL ── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col">
            
            {/* Input Bar */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
              <Search className="h-4 w-4 text-[#d4ad4d] shrink-0" />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Type a command, lead name, property, or page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none font-medium"
              />
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 rounded bg-zinc-850 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Results Body */}
            <div className="p-3 max-h-[400px] overflow-y-auto space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Default Suggestions when Query is Empty */}
              {!searchQuery.trim() && (
                <div className="space-y-3 p-2">
                  <div className="text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    Quick Navigation & Actions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { title: 'Go to Dashboard', href: '/dashboard', icon: LayoutDashboard },
                      { title: 'Manage Leads', href: '/leads', icon: Users },
                      { title: 'Property Portfolio', href: '/properties', icon: Home },
                      { title: 'Sales Pipeline', href: '/pipeline', icon: TrendingUp },
                      { title: 'Property Matchmaker', href: '/matchmaking', icon: UserCheck },
                      { title: 'Site Visit Calendar', href: '/site-visits', icon: Calendar },
                      { title: 'Settings & Users', href: '/settings', icon: Settings },
                      { title: '+ Create New Lead', href: '/leads/create', icon: Plus },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(item.href);
                          }}
                          className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/80 hover:border-[#d4ad4d]/40 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-[#d4ad4d]" />
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white">{item.title}</span>
                          </div>
                          <ArrowRight className="h-3 w-3 text-zinc-600 group-hover:text-[#d4ad4d] transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Filtered Search Results */}
              {searchQuery.trim() && (
                <div className="space-y-4">
                  
                  {/* Matching Pages */}
                  {searchResults.navs.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-2 pb-1">
                        Navigation Pages
                      </div>
                      {searchResults.navs.map(n => {
                        const Icon = n.icon;
                        return (
                          <div 
                            key={n.href}
                            onClick={() => {
                              setIsSearchOpen(false);
                              router.push(n.href);
                            }}
                            className="p-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-[#d4ad4d]" />
                              <div>
                                <div className="text-xs font-bold text-white">{n.title}</div>
                                <div className="text-[10px] text-zinc-400">{n.desc}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500">Jump →</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Matching Leads */}
                  {searchResults.leads.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-2 pb-1">
                        Leads Database Records
                      </div>
                      {searchResults.leads.map(l => (
                        <div 
                          key={l.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push('/leads');
                          }}
                          className="p-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-between text-left border border-zinc-850"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{l.client_name}</div>
                            <div className="text-[10px] text-zinc-400">{l.phone} · {l.preferred_location || 'Pune'}</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-[#d4ad4d]/20 text-[#d4ad4d] border border-[#d4ad4d]/30 uppercase">
                              {l.status || 'Hot'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Properties */}
                  {searchResults.properties.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-2 pb-1">
                        Property Listings
                      </div>
                      {searchResults.properties.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push('/properties');
                          }}
                          className="p-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-between text-left border border-zinc-850"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{p.title}</div>
                            <div className="text-[10px] text-zinc-400">{p.location} · {p.configuration}</div>
                          </div>
                          <div className="text-right text-xs font-black text-[#d4ad4d]">
                            ₹{((p.price || 0) / 10000000).toFixed(2)} Cr
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.navs.length === 0 && searchResults.leads.length === 0 && searchResults.properties.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No matching records found for "{searchQuery}".
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer Shortcut Bar */}
            <div className="p-2.5 border-t border-zinc-800 bg-zinc-950 text-center text-[10px] font-bold text-zinc-500 flex items-center justify-between px-4">
              <span>Press <kbd className="bg-zinc-850 border border-zinc-750 px-1.5 py-0.5 rounded text-zinc-300">ESC</kbd> to exit</span>
              <span>Universal Luxe ERP Indexer</span>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
