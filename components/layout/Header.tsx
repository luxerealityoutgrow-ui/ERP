"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  ChevronDown, 
  Compass, 
  Users, 
  Home, 
  CornerDownLeft,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fetchLeads, fetchProperties, Lead, Property } from '@/lib/queries';

export function Header() {
  const profile = useProfile();
  const router = useRouter();

  // Search Palette State
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fallback mock sets
  const mockLeads: Partial<Lead>[] = [
    { id: 'mock-1', client_name: 'Ananya Sharma', preferred_location: 'Kalyani Nagar, Pune' },
    { id: 'mock-2', client_name: 'Vikram Malhotra', preferred_location: 'Koregaon Park, Pune' },
    { id: 'mock-3', client_name: 'Rajesh Gupta', preferred_location: 'Baner, Pune' },
    { id: 'mock-4', client_name: 'Deepika Rao', preferred_location: 'Viman Nagar, Pune' }
  ];

  const mockProperties: Partial<Property>[] = [
    { id: 'prop-1', title: 'Pristine Kyra', location: 'Kalyani Nagar' },
    { id: 'prop-2', title: 'Power Heights', location: 'Koregaon Park' },
    { id: 'prop-3', title: 'Vivencia', location: 'Baner' },
    { id: 'prop-4', title: 'NYATI Evoque', location: 'Viman Nagar' }
  ];

  // Fetch active items on mount to keep search populated
  useEffect(() => {
    const loadSearchPool = async () => {
      try {
        const leadsData = await fetchLeads(profile);
        const propsData = await fetchProperties(profile);
        setLeads(leadsData && leadsData.length > 0 ? leadsData : mockLeads as Lead[]);
        setProperties(propsData && propsData.length > 0 ? propsData : mockProperties as Property[]);
      } catch (err) {
        console.error("Error loading search items:", err);
        setLeads(mockLeads as Lead[]);
        setProperties(mockProperties as Property[]);
      }
    };
    loadSearchPool();
  }, [profile]);

  // Global meta+k / ctrl+k keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset indices on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Unified Flat Search Results List for Arrow Navigation
  const flatResults = useMemo(() => {
    const navItems = [
      { type: 'nav', id: 'nav-dashboard', label: 'Go to Dashboard', sub: 'Nav • Overview & statistics', href: '/dashboard', icon: Compass },
      { type: 'nav', id: 'nav-leads', label: 'Go to Leads Management', sub: 'Nav • Clients & pipelines', href: '/leads', icon: Users },
      { type: 'nav', id: 'nav-properties', label: 'Go to Properties Inventory', sub: 'Nav • Inventory & pricing', href: '/properties', icon: Home },
      { type: 'nav', id: 'nav-pipeline', label: 'Go to Sales Pipeline', sub: 'Nav • Status tracking & closures', href: '/pipeline', icon: Compass },
      { type: 'nav', id: 'nav-matchmaking', label: 'Go to Matchmaking Engine', sub: 'Nav • Requirement-to-property match', href: '/matchmaking', icon: Compass }
    ].filter(item => 
      searchQuery === '' || 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const leadItems = leads
      .filter(l => 
        searchQuery !== '' && 
        (l.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         l.preferred_location?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(l => ({
        type: 'lead',
        id: `lead-${l.id}`,
        label: l.client_name || 'Unnamed client',
        sub: `Lead • Prefers ${l.preferred_location || 'Flexible'}`,
        href: `/leads/${l.id}`,
        icon: Users
      }));

    const propItems = properties
      .filter(p => 
        searchQuery !== '' && 
        (p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.location?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(p => ({
        type: 'property',
        id: `prop-${p.id}`,
        label: p.title || 'Untitled Listing',
        sub: `Property • Located in ${p.location || 'Flexible'}`,
        href: `/properties`,
        icon: Home
      }));

    return [...navItems, ...leadItems, ...propItems];
  }, [searchQuery, leads, properties]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = flatResults[selectedIndex];
      if (activeItem) {
        handleNavigate(activeItem.href);
      }
    }
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 py-3.5 flex items-center justify-between z-10 select-none">
        
        {/* Search Trigger Input (Opens CMD+K Dialog) */}
        <div 
          onClick={() => setIsOpen(true)}
          className="relative w-80 cursor-pointer group"
        >
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-hover:text-zinc-650 transition-colors" />
          <input 
            type="text" 
            readOnly
            placeholder="Search properties, leads, nav...   ⌘K" 
            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-850 placeholder-zinc-400/80 focus:outline-none cursor-pointer hover:border-zinc-350 transition-all duration-200"
          />
        </div>

        {/* Header Utilities */}
        <div className="flex items-center gap-5">
          {/* Connection status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-100">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Live CRM Database</span>
          </div>

          {/* Current Date */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-700">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Notifications and Mail Icons */}
          <div className="flex items-center gap-3">
            {/* Email button */}
            <button className="relative p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-855 hover:bg-zinc-100 transition-all">
              <Mail className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-zinc-500 text-[9px] font-bold text-white flex items-center justify-center border border-white">
                2
              </span>
            </button>

            {/* Notifications button */}
            <button className="relative p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-855 hover:bg-zinc-100 transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-zinc-500 text-[9px] font-bold text-white flex items-center justify-center border border-white animate-pulse">
                5
              </span>
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="h-5 w-[1px] bg-zinc-200" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-950 transition-colors">
                  {profile?.full_name || 'User'}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase">
                  {profile?.role || 'Loading...'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-zinc-900 flex items-center justify-center text-sm font-bold text-white">
                        {profile?.full_name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{profile?.full_name}</p>
                        <p className="text-[10px] text-zinc-500">{profile?.email}</p>
                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          profile?.role === 'SuperAdmin' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                          profile?.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {profile?.role === 'SalesPerson' ? 'Sales Executive' : profile?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Access Summary */}
                  <div className="p-3 border-b border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Your Access</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.role === 'SuperAdmin' || profile?.role === 'Admin' ? (
                        <>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Dashboard</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Reporting</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Export</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Settings</span>
                        </>
                      ) : null}
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Leads</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Properties</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">Calendar</span>
                      {profile?.role === 'SuperAdmin' && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[9px] font-bold text-violet-700 border border-violet-100">User Mgmt</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={() => { setIsProfileOpen(false); window.location.href = '/settings'; }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <Settings className="h-3.5 w-3.5 text-zinc-400" />
                      Account Settings
                    </button>
                    {profile?.role === 'SuperAdmin' && (
                      <button
                        onClick={() => { setIsProfileOpen(false); window.location.href = '/users'; }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        User Management
                      </button>
                    )}
                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          localStorage.removeItem('luxe-role-override');
                          window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-zinc-200/80 rounded-2xl shadow-2xl bg-white">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center border-b border-zinc-150 px-4 py-3 bg-zinc-50/50">
            <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search leads, property listings, app navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleModalKeyDown}
              className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none h-9 border-none py-1 focus:ring-0"
            />
            <span className="px-2 py-0.5 rounded border border-zinc-200 bg-white text-[9px] font-extrabold text-zinc-400 select-none shadow-2xs">ESC</span>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 bg-white">
            {/* Navigations Group */}
            {flatResults.some(r => r.type === 'nav') && (
              <div className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-400">Navigation Pages</div>
            )}
            {flatResults.filter(r => r.type === 'nav').map((item) => {
              const globalIndex = flatResults.findIndex(r => r.id === item.id);
              const isActive = globalIndex === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{item.label}</p>
                      <p className={`text-[9px] truncate ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>{item.sub}</p>
                    </div>
                  </div>
                  {isActive && <CornerDownLeft className="h-3 w-3 text-white/70 shrink-0" />}
                </div>
              );
            })}

            {/* Leads Group */}
            {flatResults.some(r => r.type === 'lead') && (
              <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-100 mt-2 pt-2">Active CRM Leads</div>
            )}
            {flatResults.filter(r => r.type === 'lead').map((item) => {
              const globalIndex = flatResults.findIndex(r => r.id === item.id);
              const isActive = globalIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Users className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{item.label}</p>
                      <p className={`text-[9px] truncate ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>{item.sub}</p>
                    </div>
                  </div>
                  {isActive && <CornerDownLeft className="h-3 w-3 text-white/70 shrink-0" />}
                </div>
              );
            })}

            {/* Properties Group */}
            {flatResults.some(r => r.type === 'property') && (
              <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-100 mt-2 pt-2">Properties Inventory</div>
            )}
            {flatResults.filter(r => r.type === 'property').map((item) => {
              const globalIndex = flatResults.findIndex(r => r.id === item.id);
              const isActive = globalIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Home className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{item.label}</p>
                      <p className={`text-[9px] truncate ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>{item.sub}</p>
                    </div>
                  </div>
                  {isActive && <CornerDownLeft className="h-3 w-3 text-white/70 shrink-0" />}
                </div>
              );
            })}

            {flatResults.length === 0 && (
              <div className="py-8 text-center text-xs font-semibold text-zinc-400">
                No matching results found for "{searchQuery}"
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 select-none">
            <span className="flex items-center gap-1.5">
              <span>↑↓ Navigation</span>
              <span className="h-3 w-[1px] bg-zinc-300" />
              <span>⏎ Select</span>
            </span>
            <span>Luxe CRM Search</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
