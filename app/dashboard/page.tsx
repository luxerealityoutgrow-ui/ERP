"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { fetchLeads, fetchProperties, Lead, Property } from '@/lib/queries';
import { fetchSiteVisits, SiteVisit } from '@/lib/siteVisits';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
  Users, 
  Home, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus, 
  Calendar, 
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Phone,
  AlertCircle,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Shield,
  Wrench,
  UserCheck
} from 'lucide-react';
import { formatPriceShort } from '@/lib/formatters';
import { getPermissions } from '@/lib/permissions';

export default function DashboardPage() {
  const profile = useProfile();
  const router = useRouter();
  const perms = getPermissions(profile?.role);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect SalesPerson if no permission
  useEffect(() => {
    if (profile && !perms.canViewDashboard) {
      router.replace('/leads');
    }
  }, [profile, perms.canViewDashboard, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedLeads = await fetchLeads(profile).catch(() => []);
        const fetchedProperties = await fetchProperties(profile).catch(() => []);
        const fetchedVisits = await fetchSiteVisits(profile).catch(() => []);

        setLeads(fetchedLeads);
        setProperties(fetchedProperties);
        setSiteVisits(fetchedVisits);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  // Mock Work Orders matching reference image
  const workOrders = [
    { code: 'M-3201', unit: 'Unit 304', service: 'Electrical', assignee: 'Addie Bradford', delay: '2 hrs late', priority: 'Urgent', badgeClass: 'untitledui-badge-urgent' },
    { code: 'P-1587', unit: 'Unit 294', service: 'Pest Control', assignee: 'Cora Williams', delay: '2 days late', priority: 'High', badgeClass: 'untitledui-badge-high' },
    { code: 'L-8850', unit: 'Unit 1064', service: 'Landscaping', assignee: 'Trent Marlow', delay: '3 days late', priority: 'Normal', badgeClass: 'untitledui-badge-normal' }
  ];

  // Mock New Requests matching reference image
  const newRequests = [
    { client: 'Sapphire Holloway', unit: 'Unit 329', msg: 'The kitchen sink faucet is leaking steadily, water pooling under the cabinet.' },
    { client: 'Jakub Tucker', unit: 'Unit 651', msg: 'I noticed that the window in my living room is cracked and unable to latch.' },
    { client: 'Diana Hess', unit: 'Unit 327C', msg: 'The garage door remote control has stopped working altogether.' }
  ];

  // Mock Upcoming Units matching reference image
  const upcomingUnits = [
    { unit: 'Unit 213B', rent: '₹2,340 /mo', date: '19 Aug 2026', area: '1280 sqft', img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400' },
    { unit: 'Unit 311A', rent: '₹1,980 /mo', date: '21 Aug 2026', area: '1330 sqft', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=400' },
    { unit: 'Unit 229B', rent: '₹2,750 /mo', date: '23 Aug 2026', area: '1470 sqft', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400' }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Main Workspace Grid (Left 2 Columns + Right Preview Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left & Center Main Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Payments / Financial Summary Card Panel (Reference Image Top Left) */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">Payments</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer">
                <span>This month</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
              <div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">₹1,98,450</p>
                <p className="text-[11px] font-bold text-zinc-400 mt-1">Rent Collected</p>
              </div>
              <div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">₹19,760</p>
                <p className="text-[11px] font-bold text-zinc-400 mt-1">Additional Services</p>
              </div>
              <div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">₹32,435</p>
                <p className="text-[11px] font-bold text-zinc-400 mt-1">Maintenance</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-2xl font-black text-zinc-900 tracking-tight">₹17,350</p>
                </div>
                <p className="text-[11px] font-bold text-zinc-400 mt-1">Outstanding Debt</p>
              </div>
            </div>
          </div>

          {/* 2. Delayed Work Orders / Priority Deals Table (Reference Image Middle) */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">Delayed Work Orders</h2>
              <Link href="/pipeline" className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Assignee</th>
                    <th className="pb-3">Delay</th>
                    <th className="pb-3 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 font-medium">
                  {workOrders.map((wo, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 font-bold text-zinc-900">{wo.code}</td>
                      <td className="py-3.5 text-zinc-600 font-semibold">{wo.unit}</td>
                      <td className="py-3.5 text-zinc-600">{wo.service}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                            {wo.assignee.charAt(0)}
                          </div>
                          <span className="font-bold text-zinc-800">{wo.assignee}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-zinc-500 font-semibold">{wo.delay}</td>
                      <td className="py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${wo.badgeClass}`}>
                          {wo.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. New Requests Row (Reference Image Bottom Left) */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">New Requests</h2>
              <Link href="/leads" className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {newRequests.map((req, idx) => (
                <div key={idx} className="p-4 bg-zinc-50/80 border border-zinc-100 rounded-2xl space-y-2.5 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs text-purple-700 shrink-0">
                      {req.client.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{req.client}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{req.unit}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed font-medium">{req.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Upcoming Units Row (Reference Image Bottom Right) */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">Upcoming Units</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-600">
                <span>Next 3 months</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upcomingUnits.map((u, idx) => (
                <div key={idx} className="group overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100 hover:shadow-lg transition-all">
                  <div className="h-28 w-full overflow-hidden bg-zinc-200 relative">
                    <img src={u.img} alt={u.unit} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-extrabold text-zinc-900">{u.unit}</p>
                      <p className="text-xs font-black text-purple-700">{u.rent}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                      <span>📅 {u.date}</span>
                      <span>📐 {u.area}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Context Panel (4 Cols — Reference Image Right Side) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Featured Property Preview Card ("Green courtyard") */}
          <div className="untitledui-card overflow-hidden p-0">
            {/* Image Header */}
            <div className="h-44 w-full relative overflow-hidden bg-zinc-900">
              <img 
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800" 
                alt="Green Courtyard" 
                className="h-full w-full object-cover opacity-90 hover:scale-105 transition-transform duration-500" 
              />
              <button className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-zinc-900 hover:bg-white transition-all shadow-md cursor-pointer">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {/* Content & Counters */}
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">Green Courtyard</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Listing
                </span>
              </div>

              {/* 4 Metric Counter Columns */}
              <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-zinc-100">
                <div>
                  <p className="text-base font-black text-zinc-900">1923</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Residents</p>
                </div>
                <div>
                  <p className="text-base font-black text-zinc-900">987</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Units</p>
                </div>
                <div>
                  <p className="text-base font-black text-zinc-900">183</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Vacant</p>
                </div>
                <div>
                  <p className="text-base font-black text-zinc-900">81</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Upcoming</p>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '85%' }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400">
                  <span>Leased by 85%</span>
                  <span>15% Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Orders Donut Chart Card */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">Work Orders</h3>
              <ExternalLink className="h-4 w-4 text-zinc-400" />
            </div>

            <div className="flex items-center gap-6 pt-2">
              {/* Ring Chart Center Representation */}
              <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600"
                    strokeDasharray="65, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xl font-black text-zinc-900">72</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Total</p>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-extrabold text-zinc-900">
                <div>
                  <p className="text-lg font-black text-zinc-900">7</p>
                  <p className="text-[10px] text-zinc-400">New</p>
                </div>
                <div>
                  <p className="text-lg font-black text-zinc-900">29</p>
                  <p className="text-[10px] text-zinc-400">Open</p>
                </div>
                <div>
                  <p className="text-lg font-black text-purple-700">31</p>
                  <p className="text-[10px] text-zinc-400">In Progress</p>
                </div>
                <div>
                  <p className="text-lg font-black text-amber-600">5</p>
                  <p className="text-[10px] text-zinc-400">Delayed</p>
                </div>
              </div>
            </div>
          </div>

          {/* On-Site Staff Contacts Panel */}
          <div className="untitledui-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">On-site Staff</h3>
              <ExternalLink className="h-4 w-4 text-zinc-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase">Security</p>
                <p className="font-bold text-zinc-900">Louie Hodges</p>
                <p className="text-[10px] font-semibold text-purple-700">+971 5 927 4321</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase">Maintenance</p>
                <p className="font-bold text-zinc-900">Haris Bowman</p>
                <p className="text-[10px] font-semibold text-purple-700">+971 5 927 8764</p>
              </div>
            </div>

            {/* Stacked Avatar Group */}
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
              <div className="flex -space-x-2 overflow-hidden">
                {['A', 'B', 'C', 'D'].map((initial, idx) => (
                  <div key={idx} className="inline-block h-7 w-7 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                    {initial}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-extrabold text-zinc-500">39 staff members</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
