"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useProfile } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchLeads, fetchProperties, Lead, Property } from '@/lib/queries';
import { fetchSiteVisits, SiteVisit } from '@/lib/siteVisits';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  Home, 
  Plus, 
  Calendar, 
  MapPin,
  Clock,
  Activity,
  ArrowRight,
  ChevronRight,
  Briefcase,
  TrendingUp,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  DollarSign,
  Download,
  FileText
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
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filter: today | 7d | 30d | 90d | ytd | all
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'ytd' | 'all'>('today');
  const [detailModal, setDetailModal] = useState<{ type: string; title: string; items: any[] } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__dashboardRange) {
        setDateRange((window as any).__dashboardRange);
      } else {
        (window as any).__dashboardRange = 'today';
      }
    }

    const handleRangeEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setDateRange(customEvent.detail);
    };
    window.addEventListener('dashboard-range-change', handleRangeEvent);
    return () => {
      window.removeEventListener('dashboard-range-change', handleRangeEvent);
    };
  }, []);

  const handleRangeChange = (range: string) => {
    setDateRange(range as any);
    if (typeof window !== 'undefined') {
      (window as any).__dashboardRange = range;
      window.dispatchEvent(new CustomEvent('dashboard-range-change', { detail: range }));
    }
  };

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
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(15);

        const { data: fetchedProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role');

        // Husain and the Outgrow dev team access the CRM under @letsoutgrow.com /
        // @outgrowintelligence.com accounts to build and test it -- that activity isn't real
        // sales work and shouldn't show up as if it were a team member's performance. Every
        // genuine Luxe Realty staff account is on @luxerealtypune.com, so that's the one
        // signal that reliably tells real usage apart from developer/testing activity.
        const isRealTeamMember = (email?: string | null) => (email || '').toLowerCase().endsWith('@luxerealtypune.com');

        setLeads(fetchedLeads);
        setProperties(fetchedProperties);
        setSiteVisits(fetchedVisits);
        setAuditLogs((fetchedLogs || []).filter((log: any) => isRealTeamMember(log.profiles?.email)));
        setTeamProfiles((fetchedProfiles || []).filter((p: any) => isRealTeamMember(p.email)));
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
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'ytd': return new Date(now.getFullYear(), 0, 1);
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

  const filteredLogs = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return auditLogs;
    return auditLogs.filter(l => l.created_at && new Date(l.created_at) >= cutoff);
  }, [auditLogs, dateRange]);

  // Operational KPI Calculations
  const totalLeadsCount = filteredLeads.length;
  const hotLeads = filteredLeads.filter(l => l.status === 'Hot');
  const warmLeads = filteredLeads.filter(l => l.status === 'Warm');
  const coldLeads = filteredLeads.filter(l => l.status !== 'Hot' && l.status !== 'Warm');
  
  const hotPipelineValue = hotLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
  const totalPipelineValue = filteredLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);

  const totalPropertiesCount = properties.length;
  const totalAssetValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
  const availableProperties = properties.filter(p => p.status_id === 'Available' || !p.status_id);
  const underOfferProperties = properties.filter(p => p.status_id === 'Under Offer');
  const soldProperties = properties.filter(p => p.status_id === 'Sold');

  const totalVisitsCount = filteredVisits.length;
  const pendingVisits = filteredVisits.filter(v => v.status === 'Scheduled' || v.status === 'Pending');
  const confirmedVisits = filteredVisits.filter(v => v.status === 'Confirmed');
  const completedVisits = filteredVisits.filter(v => v.status === 'Completed' || v.status === 'Done');
  const cancelledVisits = filteredVisits.filter(v => v.status === 'Cancelled');

  const closedDeals = filteredLeads.filter(l => l.status === 'Closed' || l.stage_id === 'Closure');
  const closedRevenue = closedDeals.reduce((sum, l) => sum + (l.budget_max || 0), 0);
  const estimatedCommission = closedRevenue * 0.02;

  // Agent Efficiency Matrix Data Mapping -- computed entirely from real leads/profiles data.
  // No fabricated fallback roster and no response-time metric, since the app doesn't track
  // response timestamps anywhere; that column shows "--" rather than inventing a number.
  const agentScorecards = useMemo(() => {
    return teamProfiles.map(member => {
      const assignedLeads = leads.filter(l => l.assigned_to === member.id);
      const memberClosed = assignedLeads.filter(l => l.status === 'Closed' || l.stage_id === 'Closure');
      const closedVal = memberClosed.reduce((sum, l) => sum + (l.budget_max || 0), 0);
      const convRate = assignedLeads.length > 0 ? (memberClosed.length / assignedLeads.length) * 100 : 0;

      const score = Math.min(100, Math.round(convRate * 2 + (assignedLeads.length * 3) + 40));
      const grade = score >= 90 ? 'EXCELLENT' : score >= 80 ? 'GOLD' : score >= 70 ? 'STRONG' : 'AVERAGE';

      return {
        id: member.id,
        name: member.full_name || 'Agent',
        role: member.role || 'SalesPerson',
        assigned: assignedLeads.length,
        closedVal,
        convRate: convRate.toFixed(1),
        score,
        grade
      };
    });
  }, [teamProfiles, leads]);

  const teamAvgEfficiency = agentScorecards.length > 0
    ? Math.round(agentScorecards.reduce((sum, a) => sum + a.score, 0) / agentScorecards.length)
    : null;

  // Lead Source Attribution, computed from the real lead_source_id on each lead
  const leadSourceAttribution = useMemo(() => {
    const counts = new Map<string, number>();
    filteredLeads.forEach(l => {
      const source = l.lead_source_id || 'Unspecified';
      counts.set(source, (counts.get(source) || 0) + 1);
    });
    const total = filteredLeads.length;
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  const handleExportReport = () => {
    const timestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const userName = profile?.full_name || 'Rahul Sharma';
    const watermarkText = `CONFIDENTIAL REPORT · Downloaded by ${userName} · ${timestamp} · Luxe Realty Pune ERP`;

    const printContent = `
      <html>
        <head>
          <title>Executive Operations Summary Report — Luxe Realty ERP</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; position: relative; }
            .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 20px; font-weight: 900; color: rgba(212, 173, 77, 0.18); text-transform: uppercase; text-align: center; pointer-events: none; width: 100%; letter-spacing: 2px; }
            .header { border-bottom: 2px solid #d4ad4d; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: 800; }
            .meta { font-size: 11px; color: #666; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #fafaf8; }
            .kpi-title { font-size: 10px; font-weight: 800; color: #888; text-transform: uppercase; }
            .kpi-val { font-size: 22px; font-weight: 900; color: #111; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ebebeb; padding: 10px; text-align: left; }
            th { background: #f4f4f2; font-size: 10px; text-transform: uppercase; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">${watermarkText}</div>
          <div class="header">
            <div>
              <div class="title">LUXE REALTY PUNE — EXECUTIVE OPERATIONS REPORT</div>
              <div class="meta">Period Scope: ${dateRange.toUpperCase()} · Generated on ${timestamp}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; font-size:12px;">Luxe Realty ERP System</div>
              <div style="font-size:10px; color:#d4ad4d; font-weight:700;">Downloaded by: ${userName}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="kpi-title">Total Inbound Leads</div>
              <div class="kpi-val">${totalLeadsCount}</div>
            </div>
            <div class="card">
              <div class="kpi-title">Active Pipeline Value</div>
              <div class="kpi-val">₹${(totalPipelineValue / 10000000).toFixed(2)} Cr</div>
            </div>
            <div class="card">
              <div class="kpi-title">Site Tours Scheduled</div>
              <div class="kpi-val">${totalVisitsCount} Visits</div>
            </div>
            <div class="card">
              <div class="kpi-title">Closed Revenue</div>
              <div class="kpi-val">₹${(closedRevenue / 10000000).toFixed(2)} Cr</div>
            </div>
          </div>

          <h3 style="font-size:14px; font-weight:800; margin-top:20px;">Sales Team Efficiency Scorecards</h3>
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Role</th>
                <th>Assigned Leads</th>
                <th>Deals Closed (₹)</th>
                <th>Tour Conv. Rate</th>
                <th>Efficiency Rating</th>
              </tr>
            </thead>
            <tbody>
              ${agentScorecards.map(a => `
                <tr>
                  <td><strong>${a.name}</strong></td>
                  <td>${a.role}</td>
                  <td>${a.assigned} Leads</td>
                  <td>₹${(a.closedVal / 10000000).toFixed(2)} Cr</td>
                  <td>${a.convRate}%</td>
                  <td><strong>${a.score}/100 (${a.grade})</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Official Executive Record · Luxe Realty Pune</div>
            <div>${watermarkText}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (profile && !perms.canViewDashboard) {
    return null;
  }

  return (
    <div className="w-full space-y-6 pb-20 text-zinc-900 text-left">
      
      {/* Dashboard Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-[17px] font-extrabold text-zinc-900 tracking-tight" style={{ letterSpacing: '-0.3px' }}>Dashboard Overview</h1>
            <p className="text-[10px] text-zinc-400 font-medium">Luxe Realty Pune CRM metrics</p>
          </div>
          <button
            type="button"
            onClick={handleExportReport}
            className="dc-btn gold font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Mobile-only Segmented Control (Hidden on desktop) */}
        <div className="block lg:hidden self-start w-full sm:w-auto">
          <div className="flex items-center gap-0.5 p-0.5 bg-white border border-[#e8e7e4] rounded-lg relative overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto justify-between sm:justify-start">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: 'ytd', label: 'YTD' },
              { key: 'all', label: 'All' },
            ].map((opt) => {
              const isSelected = dateRange === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleRangeChange(opt.key)}
                  className={`relative flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-[9px] md:text-[10px] font-black transition-colors cursor-pointer select-none z-10 text-center ${
                    isSelected ? 'text-zinc-950 font-extrabold' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="dashboard-mobile-active-pill"
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
      </div>
      
      {/* ── UNIFIED PORCELAIN CARD FRAME (Editorial Command Cabinet) ── */}
      <div className="bg-white border border-[#e8e7e4] rounded-[20px] shadow-xs overflow-hidden">
        
        {/* ── TOP 5 FINANCIAL & VOLUME METRIC RIBBON (Connected to Granular Details!) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 border-b border-[#ebebeb] bg-[#ebebeb] gap-px">
          
          {/* Total Inbound Leads */}
          <div 
            onClick={() => setDetailModal({ type: 'leads', title: `Total Inbound Leads (${totalLeadsCount})`, items: filteredLeads })}
            className="p-5 bg-white hover:bg-[#fafaf8] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Total Inbound Leads</span>
              <Users className="h-4 w-4 text-zinc-400 group-hover:text-[#d4ad4d] transition-colors" />
            </div>
            <div className="text-[22px] font-black text-zinc-900 mt-1">{totalLeadsCount}</div>
            <div className="text-[10px] font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span>{hotLeads.length} Hot · {warmLeads.length} Warm · {coldLeads.length} Other</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Active Pipeline Value */}
          <div 
            onClick={() => setDetailModal({ type: 'leads', title: `Hot Pipeline Leads (${hotLeads.length})`, items: hotLeads })}
            className="p-5 bg-white hover:bg-[#fafaf8] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Active Pipeline Value</span>
              <TrendingUp className="h-4 w-4 text-zinc-400 group-hover:text-[#d4ad4d] transition-colors" />
            </div>
            <div className="text-[22px] font-black text-zinc-900 mt-1">₹{(totalPipelineValue / 10000000).toFixed(1)} Cr</div>
            <div className="text-[10px] font-extrabold text-[#b8922e] mt-0.5 flex items-center gap-1">
              <span>{hotLeads.length} Hot Leads (₹{(hotPipelineValue / 10000000).toFixed(1)} Cr)</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Site Tours Scheduled */}
          <div 
            onClick={() => setDetailModal({ type: 'visits', title: `Scheduled Site Tours (${totalVisitsCount})`, items: filteredVisits })}
            className="p-5 bg-white hover:bg-[#fafaf8] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Site Tours Scheduled</span>
              <Calendar className="h-4 w-4 text-zinc-400 group-hover:text-[#d4ad4d] transition-colors" />
            </div>
            <div className="text-[22px] font-black text-zinc-900 mt-1">{totalVisitsCount} Visits</div>
            <div className="text-[10px] font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span>{confirmedVisits.length} Confirmed · {pendingVisits.length} Pending</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Portfolio Inventory */}
          <div 
            onClick={() => setDetailModal({ type: 'properties', title: `Property Portfolio Inventory (${totalPropertiesCount})`, items: properties })}
            className="p-5 bg-white hover:bg-[#fafaf8] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Portfolio Inventory</span>
              <Home className="h-4 w-4 text-zinc-400 group-hover:text-[#d4ad4d] transition-colors" />
            </div>
            <div className="text-[22px] font-black text-zinc-900 mt-1">{totalPropertiesCount} Units</div>
            <div className="text-[10px] font-extrabold text-zinc-500 mt-0.5 flex items-center gap-1">
              <span>₹{(totalAssetValue / 10000000).toFixed(1)} Cr Total Value</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Closed Revenue & Fees */}
          <div 
            onClick={() => setDetailModal({ type: 'leads', title: `Closed Deals (${closedDeals.length})`, items: closedDeals })}
            className="p-5 bg-white hover:bg-[#fafaf8] transition-all cursor-pointer group col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Closed Revenue & Fee</span>
              <DollarSign className="h-4 w-4 text-zinc-400 group-hover:text-[#d4ad4d] transition-colors" />
            </div>
            <div className="text-[22px] font-black text-zinc-900 mt-1">₹{(closedRevenue / 10000000).toFixed(1)} Cr</div>
            <div className="text-[10px] font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span>₹{(estimatedCommission / 100000).toFixed(1)}L Fee (2%)</span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

        </div>

        {/* ── SPLIT MAIN WORKSPACE GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* Main Workspace Left Column (8 cols) */}
          <div className="lg:col-span-8 p-6 md:p-8 border-r-0 lg:border-r border-b lg:border-b-0 border-[#ebebeb] space-y-6">
            
            {/* 1. SALES PIPELINE FUNNEL CONVERSION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-extrabold text-zinc-900">Sales Pipeline Velocity & Stage Distribution</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Click any stage card to filter granular deal list</p>
                </div>
                <span className="text-[10px] font-extrabold text-[#b8922e] bg-[#f4ebd0]/60 border border-[#e8d5a3] px-2.5 py-1 rounded-lg">
                  {closedDeals.length} Deals Closed ({dateRange.toUpperCase()})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { stage: 'New inquiry', label: 'NEW INQUIRIES', items: filteredLeads.filter(l => l.stage_id === 'New inquiry' || !l.stage_id) },
                  { stage: 'Site visit', label: 'SITE VISITS', items: filteredLeads.filter(l => l.stage_id === 'Site visit') },
                  { stage: 'Follow up', label: 'FOLLOW UP', items: filteredLeads.filter(l => l.stage_id === 'Follow up') },
                  { stage: 'Negotiation', label: 'NEGOTIATION', items: filteredLeads.filter(l => l.stage_id === 'Negotiation') },
                  { stage: 'Closure', label: 'DEALS CLOSED', items: closedDeals, highlight: true },
                ].map((stg) => {
                  const val = stg.items.reduce((s, l) => s + (l.budget_max || 0), 0);
                  return (
                    <div
                      key={stg.stage}
                      onClick={() => setDetailModal({ type: 'leads', title: `Stage: ${stg.label} (${stg.items.length})`, items: stg.items })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        stg.highlight
                          ? 'bg-[#fffdf5] border-[#d4ad4d] hover:border-[#b8922e]'
                          : 'bg-[#fafaf8] border-[#ebebeb] hover:border-zinc-300'
                      }`}
                    >
                      <div className={`text-[8.5px] font-extrabold ${stg.highlight ? 'text-[#b8922e]' : 'text-zinc-400'}`}>
                        {stg.label}
                      </div>
                      <div className={`text-[15px] font-black mt-1 ${stg.highlight ? 'text-[#b8922e]' : 'text-zinc-900'}`}>
                        {stg.items.length} Leads
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-400 mt-0.5">
                        ₹{(val / 10000000).toFixed(1)} Cr
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SALES TEAM EFFICIENCY & PERFORMANCE SCORECARD MATRIX */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-extrabold text-zinc-900">Sales Team Efficiency & Performance Matrix</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Assigned leads, closed deal valuations & efficiency ratings</p>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {teamAvgEfficiency !== null ? `Team Avg Efficiency: ${teamAvgEfficiency}%` : 'No Team Data'}
                </span>
              </div>

              <div className="border border-[#e8e7e4] rounded-xl bg-white overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-[#fafaf8] border-b border-[#ebebeb] text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Agent Name</th>
                      <th className="py-2.5 px-3.5">Assigned Leads</th>
                      <th className="py-2.5 px-3.5">Deals Closed (₹)</th>
                      <th className="py-2.5 px-3.5">Tour Conv. Rate</th>
                      <th className="py-2.5 px-3.5 text-right">Efficiency Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f3]">
                    {agentScorecards.map((agent) => (
                      <tr 
                        key={agent.name}
                        onClick={() => {
                          const agentLeads = leads.filter(l => l.assigned_to === (agent as any).id);
                          setDetailModal({ type: 'leads', title: `Assigned Leads · ${agent.name} (${agentLeads.length})`, items: agentLeads });
                        }}
                        className="hover:bg-[#fafaf8] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="font-extrabold text-zinc-900">{agent.name}</div>
                          <div className="text-[9.5px] text-zinc-400 font-medium">{agent.role}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-zinc-800">{agent.assigned} Leads</td>
                        <td className="py-2.5 px-3.5 font-black text-[#b8922e]">₹{(agent.closedVal / 10000000).toFixed(1)} Cr</td>
                        <td className="py-2.5 px-3.5 font-extrabold text-emerald-700">{agent.convRate}%</td>
                        <td className="py-2.5 px-3.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                            agent.grade === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            agent.grade === 'GOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-zinc-50 text-zinc-600 border-zinc-200'
                          }`}>
                            {agent.score}/100 ({agent.grade})
                          </span>
                        </td>
                      </tr>
                    ))}
                    {agentScorecards.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 px-3.5 text-center text-zinc-400 font-medium">No team members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. LIVE INBOUND LEADS ROSTER WITH EMPLOYEE ATTRIBUTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-extrabold text-zinc-900">Live Inbound Leads Roster</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Recent client inquiries with assigned employee attribution</p>
                </div>
                <Link href="/leads" className="text-[10.5px] font-extrabold text-[#d4ad4d] hover:underline flex items-center gap-1">
                  View All Leads →
                </Link>
              </div>

              <div className="border border-[#e8e7e4] rounded-xl bg-white overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-[#fafaf8] border-b border-[#ebebeb] text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Client Name</th>
                      <th className="py-2.5 px-3.5">Requirement</th>
                      <th className="py-2.5 px-3.5">Max Budget</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Assigned Agent (Employee)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f3]">
                    {filteredLeads.slice(0, 5).map((lead) => {
                      const assignedUser = teamProfiles.find(p => p.id === lead.assigned_to)?.full_name || 'Unassigned';
                      return (
                        <tr 
                          key={lead.id} 
                          onClick={() => router.push('/leads')}
                          className="hover:bg-[#fafaf8] transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-3.5">
                            <div className="font-extrabold text-zinc-900">{lead.client_name}</div>
                            <div className="text-[9.5px] text-zinc-400 font-medium">{lead.phone}</div>
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-zinc-700">
                            {lead.configuration || '3 BHK'} · {lead.preferred_location || 'Kalyani Nagar'}
                          </td>
                          <td className="py-2.5 px-3.5 font-black text-[#b8922e]">
                            ₹{((lead.budget_max || 0) / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${
                              lead.status === 'Hot' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              lead.status === 'Warm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-zinc-50 text-zinc-500 border-zinc-200'
                            }`}>
                              {lead.status || 'Hot'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <span className="text-[10px] font-bold text-zinc-800 bg-[#fafaf8] border border-[#e8e7e4] px-2 py-0.5 rounded-md">
                              👤 {assignedUser}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sidebar Column Right (4 cols) */}
          <div className="lg:col-span-4 p-6 md:p-8 bg-[#fafaf8]/50 space-y-6">
            
            {/* 1. TODAY'S SITE TOURS AGENDA WITH EMPLOYEE CREATOR ATTRIBUTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-extrabold text-zinc-900">Today's Site Tours Agenda</h3>
                <Link href="/site-visits" className="text-[10px] font-extrabold text-[#d4ad4d] hover:underline">
                  Calendar →
                </Link>
              </div>

              <div className="space-y-2">
                {filteredVisits.slice(0, 4).map((visit) => {
                  const assignedUser = teamProfiles.find(p => p.id === visit.assigned_to)?.full_name || 'Unassigned';
                  return (
                    <div 
                      key={visit.id}
                      onClick={() => router.push('/site-visits')}
                      className={`p-3 bg-white border rounded-xl transition-all cursor-pointer space-y-1 ${
                        visit.status === 'Confirmed' ? 'border-emerald-300 border-l-4 border-l-emerald-500' :
                        visit.status === 'Cancelled' ? 'border-rose-200 border-l-4 border-l-rose-400' :
                        'border-amber-200 border-l-4 border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-zinc-900">
                        <span>{visit.visit_time || '02:30 PM'} · {(visit as any).client_name || 'Client'}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                          visit.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          visit.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {visit.status || 'Pending'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        {(visit as any).property_title || 'Nyati Evoque (Kalyani Nagar)'}
                      </div>
                      <div className="text-[9px] font-extrabold text-[#967420] bg-[#f4ebd0]/40 px-2 py-0.5 rounded w-fit border border-[#e8d5a3]/50">
                        Added / Handled by: {assignedUser}
                      </div>
                    </div>
                  );
                })}
                {filteredVisits.length === 0 && (
                  <p className="text-[10px] text-zinc-400 text-center py-4 font-medium">No site visits scheduled for this range.</p>
                )}
              </div>
            </div>

            {/* 1.5. SCHEDULED CALL & FOLLOW-UP AGENDA (PER SALESPERSON) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-extrabold text-zinc-900">Scheduled Call & Follow-ups</h3>
                <Link href="/leads" className="text-[10px] font-extrabold text-[#d4ad4d] hover:underline">
                  Leads →
                </Link>
              </div>

              <div className="space-y-2">
                {leads.filter(l => l.next_followup_date || l.status === 'Hot').slice(0, 4).map((lead) => {
                  const assignedUser = teamProfiles.find(p => p.id === lead.assigned_to)?.full_name || 'Unassigned';
                  return (
                    <div 
                      key={lead.id}
                      onClick={() => router.push('/leads')}
                      className="p-3 bg-white border border-amber-200 border-l-4 border-l-[#d4ad4d] rounded-xl transition-all cursor-pointer space-y-1 hover:shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-zinc-900">
                        <span>📞 {lead.client_name}</span>
                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          {lead.next_followup_date || 'Due Today'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        {lead.phone} · {lead.configuration || '3 BHK'} ({lead.preferred_location || 'Kalyani Nagar'})
                      </div>
                      <div className="text-[9px] font-extrabold text-[#b8922e] bg-[#fafaf8] px-2 py-0.5 rounded w-fit border border-[#e8e7e4]">
                        Assigned To: {assignedUser}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. LEAD SOURCE ATTRIBUTION & CONVERSION RATIOS */}
            <div className="p-4 bg-white border border-[#e8e7e4] rounded-xl space-y-3">
              <h4 className="text-[10.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Lead Source Attribution</h4>
              <div className="space-y-2 text-xs">
                {leadSourceAttribution.length === 0 && (
                  <p className="text-[10px] text-zinc-400 font-medium py-2">No leads in this range.</p>
                )}
                {leadSourceAttribution.map(src => (
                  <div key={src.name} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-600">{src.name}</span>
                    <span className="font-extrabold text-zinc-900">{src.count} Leads ({src.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. LIVE SYSTEM OPERATIONS & AUDIT LOG STREAM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-extrabold text-zinc-900">Live System Operations Stream</h3>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  LIVE
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredLogs.slice(0, 6).map((log) => {
                  const operator = log.profiles?.full_name || 'Team Member';
                  return (
                    <div key={log.id} className="p-2.5 bg-white border border-[#ebebeb] rounded-xl text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-zinc-900">👤 {operator}</span>
                        <span className="text-[8.5px] text-zinc-400">
                          {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-zinc-600 font-medium">
                        Executed event <strong className="text-zinc-800">{log.event || 'System Update'}</strong>
                      </p>
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <p className="text-[10px] text-zinc-400 text-center py-4 font-medium">No team activity in this range yet.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── GRANULAR DEEP-DIVE MODAL DRAWER ── */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border border-[#e8e7e4] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafaf8]">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">{detailModal.title}</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Itemized granular database records</p>
              </div>
              <button 
                type="button" 
                onClick={() => setDetailModal(null)} 
                className="p-1.5 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-400 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[460px] overflow-y-auto space-y-3">
              {detailModal.items.length === 0 ? (
                <p className="text-center py-8 text-xs text-zinc-400 font-medium">No records found for this selection.</p>
              ) : (
                detailModal.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 border border-[#ebebeb] rounded-xl flex items-center justify-between hover:bg-[#fafaf8] transition-colors">
                    <div>
                      <p className="text-[12px] font-extrabold text-zinc-900">
                        {item.client_name || item.title || item.property_title || `Record #${idx + 1}`}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {item.phone || item.location || item.visit_date || 'Luxe ERP Record'}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.budget_max && (
                        <div className="text-[12px] font-black text-[#b8922e]">
                          ₹{(item.budget_max / 10000000).toFixed(2)} Cr
                        </div>
                      )}
                      {item.price && (
                        <div className="text-[12px] font-black text-[#b8922e]">
                          ₹{(item.price / 10000000).toFixed(2)} Cr
                        </div>
                      )}
                      {item.status && (
                        <span className="inline-block px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border bg-zinc-50 text-zinc-700 border-zinc-200 mt-0.5">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#ebebeb] bg-[#fafaf8] flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-extrabold hover:bg-zinc-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
