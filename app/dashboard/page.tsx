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
  CheckCircle,
  Clock,
  Eye,
  Phone,
  AlertCircle,
  Target,
  Activity,
  BarChart3,
  ListFilter,
  ArrowRight,
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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs state: overview, leads, properties, activity
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'properties' | 'activity'>('overview');

  // Date range filter
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');

  // Redirect SalesPerson away from dashboard
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
        
        const { data: fetchedLogs } = await supabase
          .from('audit_logs')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(15);

        setLeads(fetchedLeads);
        setProperties(fetchedProperties);
        setSiteVisits(fetchedVisits);
        setAuditLogs(fetchedLogs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  // Date filtering helper
  const getDateCutoff = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case 'today': 
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today;
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  };

  // Filtered data based on date range
  const filteredLeads = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return leads;
    return leads.filter(l => l.created_at && new Date(l.created_at) >= cutoff);
  }, [leads, dateRange]);

  const filteredVisits = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return siteVisits;
    return siteVisits.filter(v => v.visit_date && new Date(v.visit_date) >= cutoff);
  }, [siteVisits, dateRange]);

  // KPI calculations
  const totalLeads = filteredLeads.length;
  const hotLeads = filteredLeads.filter(l => l.status === 'Hot').length;
  const warmLeads = filteredLeads.filter(l => l.status === 'Warm').length;
  const closedLeads = filteredLeads.filter(l => l.status === 'Closed').length;
  const newInquiries = filteredLeads.filter(l => l.stage_id === 'New inquiry').length;
  const inSiteVisitStage = filteredLeads.filter(l => l.stage_id === 'Site visit').length;
  const inFollowUp = filteredLeads.filter(l => l.stage_id === 'Follow up').length;
  const inClosure = filteredLeads.filter(l => l.stage_id === 'Closure').length;

  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status_id === 'Available').length;
  const underOffer = properties.filter(p => p.status_id === 'Under Offer').length;
  const soldProperties = properties.filter(p => p.status_id === 'Sold').length;

  const totalVisits = filteredVisits.length;
  const scheduledVisits = filteredVisits.filter(v => v.status === 'Scheduled').length;
  const completedVisits = filteredVisits.filter(v => v.status === 'Completed' || v.status === 'Done').length;

  // Revenue from sold properties
  const soldRevenue = properties
    .filter(p => p.status_id === 'Sold' && p.price)
    .reduce((sum, p) => sum + (p.price || 0), 0);

  // Conversion rate
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Today's visits
  const today = new Date().toISOString().split('T')[0];
  const todaysVisits = siteVisits.filter(v => v.visit_date === today);

  // Leads needing followup today
  const leadsNeedingFollowup = leads.filter(l => l.next_followup_date === today);

  // Recent leads
  const recentLeads = [...leads]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);

  // Pipeline stage data
  const pipelineData = [
    { label: 'New Inquiry', count: newInquiries, color: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Site Visit', count: inSiteVisitStage, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Follow Up', count: inFollowUp, color: 'bg-violet-500', text: 'text-violet-600' },
    { label: 'Closure', count: inClosure, color: 'bg-emerald-500', text: 'text-emerald-600' },
  ];
  const maxPipeline = Math.max(...pipelineData.map(d => d.count), 1);

  if (profile && !perms.canViewDashboard) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900 px-4 md:px-0">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full bg-zinc-800/40 blur-[80px]" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] rounded-full bg-zinc-700/20 blur-[60px]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-widest border border-white/5">
                Overview
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                ERP Dashboard
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Husain'}
            </h1>
            <p className="text-xs text-zinc-400 max-w-md">
              Review your lead analytics, real-estate portfolio performance, and client site viewing schedules.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Date Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
              {[
                { key: 'today', label: 'Today' },
                { key: '7d', label: '7D' },
                { key: '30d', label: '30D' },
                { key: '90d', label: '90D' },
                { key: 'all', label: 'All' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDateRange(opt.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                    dateRange === opt.key 
                      ? 'bg-white text-zinc-950 shadow-md scale-[1.02]' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="flex items-center bg-white p-2 rounded-2xl border border-zinc-200 shadow-3xs overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1">
          {[
            { key: 'overview', label: 'Performance Summary', icon: Activity },
            { key: 'leads', label: 'Leads Insights', icon: Users },
            { key: 'properties', label: 'Property Portfolio', icon: Home },
            { key: 'activity', label: 'Activity & Audit Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-36 bg-white border border-zinc-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── TAB CONTENT: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Leads */}
                <div className="bg-white border border-zinc-200/85 rounded-3xl p-6 shadow-3xs hover:shadow-2xs hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Total Leads</p>
                      <h3 className="text-3xl font-black text-zinc-900 mt-2">{totalLeads}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 shadow-sm shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100">{hotLeads} Hot</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">{warmLeads} Warm</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">{closedLeads} Closed</span>
                  </div>
                </div>

                {/* Properties */}
                <div className="bg-white border border-zinc-200/85 rounded-3xl p-6 shadow-3xs hover:shadow-2xs hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Properties</p>
                      <h3 className="text-3xl font-black text-zinc-900 mt-2">{totalProperties}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 shadow-sm shrink-0">
                      <Home className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">{availableProperties} Active</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">{underOffer} Pending</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-zinc-100 text-zinc-650 border border-zinc-200">{soldProperties} Sold</span>
                  </div>
                </div>

                {/* Site Visits */}
                <div className="bg-white border border-zinc-200/85 rounded-3xl p-6 shadow-3xs hover:shadow-2xs hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Site Visits</p>
                      <h3 className="text-3xl font-black text-zinc-900 mt-2">{totalVisits}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 shadow-sm shrink-0">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100">{scheduledVisits} Active</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">{completedVisits} Done</span>
                  </div>
                </div>

                {/* Revenue / Deals Closed */}
                <div className="bg-white border border-zinc-200/85 rounded-3xl p-6 shadow-3xs hover:shadow-2xs hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Revenue (Sold)</p>
                      <h3 className="text-3xl font-black text-zinc-900 mt-2">{formatPriceShort(soldRevenue)}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 shadow-sm shrink-0">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-zinc-50 text-zinc-650 border border-zinc-200">{soldProperties} deals closed</span>
                  </div>
                </div>
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-3xs">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900">{conversionRate}%</p>
                    <p className="text-[9px] font-extrabold text-zinc-450 uppercase tracking-wide">Conversion Rate</p>
                  </div>
                </div>
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-3xs">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900">{todaysVisits.length}</p>
                    <p className="text-[9px] font-extrabold text-zinc-455 uppercase tracking-wide">Visits Today</p>
                  </div>
                </div>
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-3xs">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900">{leadsNeedingFollowup.length}</p>
                    <p className="text-[9px] font-extrabold text-zinc-455 uppercase tracking-wide">Follow-ups Due</p>
                  </div>
                </div>
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-3xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900">{newInquiries}</p>
                    <p className="text-[9px] font-extrabold text-zinc-455 uppercase tracking-wide">New Inquiries</p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Pipeline + Today's Schedule */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Pipeline Funnel */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">Sales Pipeline Stages</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Distribution of lead stages</p>
                      </div>
                      <Link href="/pipeline" className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                        View Kanban <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {pipelineData.map((stage) => (
                        <div key={stage.label} className="flex items-center gap-4">
                          <span className="text-[10px] font-extrabold text-zinc-650 w-24 shrink-0 uppercase tracking-wider">{stage.label}</span>
                          <div className="flex-1 h-8 bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden relative">
                            <div 
                              className={`h-full ${stage.color} rounded-lg transition-all duration-500`}
                              style={{ width: `${(stage.count / maxPipeline) * 100}%` }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-zinc-600">
                              {stage.count} leads
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Today's Schedule */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">Today&apos;s Site Visits</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <Link href="/site-visits" className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                        All Viewings <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {todaysVisits.length === 0 ? (
                      <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                        <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 font-medium">No site viewings scheduled for today.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaysVisits.map((visit) => {
                          const lead = leads.find(l => l.id === visit.lead_id);
                          const property = properties.find(p => p.id === visit.property_id);
                          const clientName = lead ? lead.client_name : 'Unknown Client';
                          const propertyTitle = property ? property.title : 'Property';
                          return (
                            <div key={visit.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-3xs">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-650 flex items-center justify-center border border-violet-100 shrink-0">
                                  <Eye className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-zinc-900">{clientName}</p>
                                  <p className="text-[10px] text-zinc-500 font-medium">{propertyTitle} • {visit.visit_time || 'TBD'}</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                                visit.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {visit.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Recent Leads + Property Types */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Recent Leads */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">Recent Inquiries</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Latest leads in ERP system</p>
                      </div>
                      <Link href="/leads" className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {recentLeads.length === 0 ? (
                      <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                        <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 font-medium">No leads currently in system.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentLeads.map((lead) => (
                          <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 transition-colors border border-zinc-100 hover:border-zinc-200 shadow-3xs bg-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                                <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-zinc-900 truncate max-w-[130px]">{lead.client_name}</p>
                                <p className="text-[10px] text-zinc-400 font-bold truncate max-w-[150px] uppercase tracking-wide mt-0.5">{lead.preferred_location || 'Flexible'} • {lead.property_type || 'Any'}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${
                              lead.status === 'Hot' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              lead.status === 'Warm' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              lead.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              'bg-zinc-50 text-zinc-600 border-zinc-200'
                            }`}>
                              {lead.status || 'Hot'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property types list */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Properties by Listing Type</h3>
                    <div className="space-y-2">
                      {Object.entries(
                        properties.reduce<Record<string, number>>((acc, p) => {
                          const type = p.property_type || 'Other';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                          <span className="text-xs font-semibold text-zinc-700">{type}</span>
                          <span className="px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-extrabold text-zinc-700">{count} listings</span>
                        </div>
                      ))}
                      {properties.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-4">No listings currently added.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: LEADS INSIGHTS ── */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leads Stage Distribution card */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                  <h3 className="text-sm font-bold text-zinc-900 mb-5">Lead Progression Stages</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'New inquiry (Initial Entry)', count: newInquiries, total: totalLeads, color: 'bg-blue-500' },
                      { label: 'Site visit (Viewing in Progress)', count: inSiteVisitStage, total: totalLeads, color: 'bg-amber-500' },
                      { label: 'Follow up (Negotiations)', count: inFollowUp, total: totalLeads, color: 'bg-violet-500' },
                      { label: 'Closure (Deal Booked)', count: inClosure, total: totalLeads, color: 'bg-emerald-500' },
                    ].map((stage) => {
                      const pct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
                      return (
                        <div key={stage.label} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
                            <span>{stage.label}</span>
                            <span>{stage.count} leads ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-3 bg-zinc-50 border border-zinc-100 rounded-full overflow-hidden">
                            <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lead priority levels card */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-5">Lead Priorities</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Hot Leads', count: hotLeads, color: 'bg-rose-500', desc: 'Active buyers with immediate requirements' },
                        { label: 'Warm Leads', count: warmLeads, color: 'bg-amber-500', desc: 'Considering options, in viewing phase' },
                        { label: 'Closed Leads', count: closedLeads, color: 'bg-emerald-500', desc: 'Deals closed successfully' },
                        { label: 'Others', count: totalLeads - (hotLeads + warmLeads + closedLeads), color: 'bg-zinc-400', desc: 'Cold or inactive inquiries' }
                      ].map((prio) => (
                        <div key={prio.label} className="flex items-start gap-3">
                          <div className={`h-3 w-3 rounded-full ${prio.color} mt-1 shrink-0`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-zinc-900">{prio.label}</span>
                              <span className="px-1.5 py-0.2 bg-zinc-100 border border-zinc-200 text-[9px] font-black text-zinc-700 rounded">{prio.count}</span>
                            </div>
                            <p className="text-[10px] text-zinc-450 mt-0.5 font-medium">{prio.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-100 mt-6 flex justify-end">
                    <Link href="/leads/create" className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                      <Plus className="h-4 w-4" /> Add Lead
                    </Link>
                  </div>
                </div>
              </div>

              {/* Lead sources list */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Lead Source Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(
                    leads.reduce<Record<string, number>>((acc, l) => {
                      const src = l.lead_source_id || 'Direct Entry';
                      acc[src] = (acc[src] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([src, count]) => (
                    <div key={src} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-center">
                      <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wide truncate">{src}</p>
                      <p className="text-2xl font-black text-zinc-900 mt-1">{count}</p>
                      <p className="text-[9px] font-bold text-zinc-550 mt-0.5">leads generated</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: PROPERTY PORTFOLIO ── */}
          {activeTab === 'properties' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Properties Status breakdown */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                  <h3 className="text-sm font-bold text-zinc-900 mb-5">Listing Status Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Available Listings', count: availableProperties, color: 'bg-emerald-500', pct: totalProperties > 0 ? (availableProperties / totalProperties) * 100 : 0 },
                      { label: 'Under Offer (In Negotiation)', count: underOffer, color: 'bg-amber-500', pct: totalProperties > 0 ? (underOffer / totalProperties) * 100 : 0 },
                      { label: 'Sold/Rented out', count: soldProperties, color: 'bg-zinc-400', pct: totalProperties > 0 ? (soldProperties / totalProperties) * 100 : 0 }
                    ].map((status) => (
                      <div key={status.label} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
                          <span>{status.label}</span>
                          <span>{status.count} ({status.pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-50 border border-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-full ${status.color} rounded-full`} style={{ width: `${status.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Properties location list */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Listings by Location</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Properties distribution in Pune micro-markets</p>
                    </div>
                    <Link href="/properties/create" className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                      <Plus className="h-4 w-4" /> Add Listing
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(
                      properties.reduce<Record<string, number>>((acc, p) => {
                        const loc = p.location || 'Flexible';
                        acc[loc] = (acc[loc] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([loc, count]) => (
                      <div key={loc} className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-3xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                          <span className="text-xs font-bold text-zinc-800 truncate">{loc}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-zinc-150 border border-zinc-200 text-[10px] font-black text-zinc-700 shrink-0">{count} listings</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: ACTIVITY LOGS ── */}
          {activeTab === 'activity' && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-3xs animate-in fade-in duration-200 max-w-3xl mx-auto">
              <h3 className="text-sm font-bold text-zinc-900 mb-6">Recent ERP Actions Timeline</h3>
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <Clock className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-550 font-bold">No system activities recorded yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-zinc-200 space-y-8">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-zinc-950 ring-4 ring-zinc-50" />
                      
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-900">{log.event}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{new Date(log.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Triggered by <span className="font-bold text-zinc-700">{log.profiles?.full_name || 'System Operator'}</span>
                        </p>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 mt-2 text-[10px] text-zinc-650 font-semibold max-w-lg space-y-1">
                            {Object.entries(log.changes).slice(0, 4).map(([key, val]) => (
                              <div key={key} className="flex justify-between border-b border-zinc-100/55 pb-0.5 last:border-0 last:pb-0">
                                <span className="text-zinc-450 capitalize font-medium">{key.replace('_', ' ')}</span>
                                <span className="text-zinc-800 font-bold max-w-[200px] truncate">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
