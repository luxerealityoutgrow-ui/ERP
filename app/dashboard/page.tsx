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
  Activity
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

  // Date range filter (synced with global if available)
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');

  // Redirect SalesPerson away from dashboard
  useEffect(() => {
    if (profile && !perms.canViewDashboard) {
      router.replace('/leads');
    }
  }, [profile, perms.canViewDashboard, router]);

  useEffect(() => {
    Promise.all([
      fetchLeads(profile).catch(() => []),
      fetchProperties(profile).catch(() => []),
      fetchSiteVisits(profile).catch(() => [])
    ])
      .then(([fetchedLeads, fetchedProperties, fetchedVisits]) => {
        setLeads(fetchedLeads);
        setProperties(fetchedProperties);
        setSiteVisits(fetchedVisits);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  // Revenue from sold properties (estimated)
  const soldRevenue = properties
    .filter(p => p.status_id === 'Sold' && p.price)
    .reduce((sum, p) => sum + (p.price || 0), 0);

  // Conversion rate: closed leads / total leads
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Today's visits
  const today = new Date().toISOString().split('T')[0];
  const todaysVisits = siteVisits.filter(v => v.visit_date === today);

  // Leads needing followup today
  const leadsNeedingFollowup = leads.filter(l => l.next_followup_date === today);

  // Recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 6);

  // Pipeline stage data for visual
  const pipelineData = [
    { label: 'New Inquiry', count: newInquiries, color: 'bg-blue-500' },
    { label: 'Site Visit', count: inSiteVisitStage, color: 'bg-amber-500' },
    { label: 'Follow Up', count: inFollowUp, color: 'bg-violet-500' },
    { label: 'Closure', count: inClosure, color: 'bg-emerald-500' },
  ];
  const maxPipeline = Math.max(...pipelineData.map(d => d.count), 1);

  // Don't render dashboard for SalesPerson (they get redirected)
  if (profile && !perms.canViewDashboard) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: 'All Time' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDateRange(opt.key as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  dateRange === opt.key 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-28 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Leads */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Leads</span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{totalLeads}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-rose-600">{hotLeads} Hot</span>
                  <span className="text-[10px] font-bold text-amber-600">{warmLeads} Warm</span>
                  <span className="text-[10px] font-bold text-emerald-600">{closedLeads} Closed</span>
                </div>
              </div>
            </div>

            {/* Properties */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Properties</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Home className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{totalProperties}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-emerald-600">{availableProperties} Available</span>
                  <span className="text-[10px] font-bold text-amber-600">{underOffer} Under Offer</span>
                  <span className="text-[10px] font-bold text-zinc-500">{soldProperties} Sold</span>
                </div>
              </div>
            </div>

            {/* Site Visits */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Site Visits</span>
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{totalVisits}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-blue-600">{scheduledVisits} Scheduled</span>
                  <span className="text-[10px] font-bold text-emerald-600">{completedVisits} Completed</span>
                </div>
              </div>
            </div>

            {/* Revenue / Deals Closed */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Revenue (Sold)</span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{formatPriceShort(soldRevenue)}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-zinc-600">{soldProperties} deals closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">{conversionRate}%</p>
                <p className="text-[10px] font-medium text-zinc-500">Conversion Rate</p>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">{todaysVisits.length}</p>
                <p className="text-[10px] font-medium text-zinc-500">Visits Today</p>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">{leadsNeedingFollowup.length}</p>
                <p className="text-[10px] font-medium text-zinc-500">Follow-ups Due</p>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">{newInquiries}</p>
                <p className="text-[10px] font-medium text-zinc-500">New Inquiries</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pipeline + Today's Schedule */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pipeline Funnel */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Sales Pipeline</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Lead progression through stages</p>
                  </div>
                  <Link href="/pipeline" className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                    View Pipeline <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {pipelineData.map((stage) => (
                    <div key={stage.label} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-600 w-20 shrink-0">{stage.label}</span>
                      <div className="flex-1 h-7 bg-zinc-100 rounded-lg overflow-hidden relative">
                        <div 
                          className={`h-full ${stage.color} rounded-lg transition-all duration-500`}
                          style={{ width: `${(stage.count / maxPipeline) * 100}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600">
                          {stage.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Today&apos;s Schedule</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <Link href="/site-visits" className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                    All Visits <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {todaysVisits.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No site visits scheduled for today.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaysVisits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                            <Eye className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Site Visit</p>
                            <p className="text-[10px] text-zinc-500">{visit.visit_time || 'TBD'}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          visit.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {visit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-ups Due Today */}
              {leadsNeedingFollowup.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">Follow-ups Due Today ({leadsNeedingFollowup.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {leadsNeedingFollowup.slice(0, 5).map((lead) => (
                      <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-amber-100 hover:bg-white transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                            {lead.client_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{lead.client_name}</p>
                            <p className="text-[10px] text-zinc-500">{lead.phone}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700">{lead.stage_id}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Recent Leads + Property Stats */}
            <div className="lg:col-span-5 space-y-6">
              {/* Recent Leads */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Recent Leads</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Latest inquiries and client entries</p>
                  </div>
                  <Link href="/leads" className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                    All Leads <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {recentLeads.length === 0 ? (
                  <div className="py-6 text-center">
                    <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No leads yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLeads.map((lead) => (
                      <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            lead.status === 'Hot' ? 'bg-rose-100 text-rose-700' :
                            lead.status === 'Warm' ? 'bg-amber-100 text-amber-700' :
                            lead.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>
                            {lead.client_name?.split(' ').map(n => n[0]).join('') || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{lead.client_name}</p>
                            <p className="text-[10px] text-zinc-500">{lead.preferred_location || 'Flexible'} • {lead.property_type || 'Any'}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          lead.status === 'Hot' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          lead.status === 'Warm' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          lead.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {lead.status || 'New'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Breakdown by Type */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Properties by Type</h3>
                <div className="space-y-2">
                  {Object.entries(
                    properties.reduce<Record<string, number>>((acc, p) => {
                      const type = p.property_type || 'Other';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <span className="text-xs font-medium text-zinc-700">{type}</span>
                      <span className="text-xs font-bold text-zinc-900">{count}</span>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">No properties data</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
