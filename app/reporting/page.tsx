"use client";

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar,
  Award,
  Target,
  Activity
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Revenue bar chart data (In Crores)
const revenueData = [
  { month: 'Jan', revenue: 1.2, deals: 3 },
  { month: 'Feb', revenue: 1.8, deals: 4 },
  { month: 'Mar', revenue: 2.4, deals: 6 },
  { month: 'Apr', revenue: 1.9, deals: 5 },
  { month: 'May', revenue: 3.1, deals: 8 },
  { month: 'Jun', revenue: 2.7, deals: 7 },
  { month: 'Jul', revenue: 3.8, deals: 9 },
  { month: 'Aug', revenue: 2.2, deals: 6 },
  { month: 'Sep', revenue: 4.1, deals: 10 },
  { month: 'Oct', revenue: 3.5, deals: 8 },
  { month: 'Nov', revenue: 4.8, deals: 12 },
  { month: 'Dec', revenue: 5.2, deals: 14 },
];

const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

// Lead sources
const leadSources = [
  { label: '99acres', value: 38, color: 'bg-zinc-500' },
  { label: 'MagicBricks', value: 24, color: 'bg-blue-500' },
  { label: 'Social Media', value: 18, color: 'bg-violet-500' },
  { label: 'Direct Call', value: 12, color: 'bg-amber-500' },
  { label: 'Walk-In', value: 8, color: 'bg-rose-500' },
];

// Top agents
const topAgents = [
  { name: 'Rahul Sharma', deals: 14, revenue: '₹5.2 Cr', conversion: '82%', rank: 1 },
  { name: 'Ananya Patel', deals: 11, revenue: '₹4.1 Cr', conversion: '74%', rank: 2 },
  { name: 'Sanjay Gupta', deals: 9, revenue: '₹3.4 Cr', conversion: '71%', rank: 3 },
  { name: 'Priya Sharma', deals: 7, revenue: '₹2.8 Cr', conversion: '68%', rank: 4 },
  { name: 'Vikram Singh', deals: 6, revenue: '₹2.1 Cr', conversion: '60%', rank: 5 },
];

// Property type breakdown
const propertyTypes = [
  { label: 'Villa', count: 18, percentage: 42 },
  { label: 'Penthouse', count: 12, percentage: 28 },
  { label: 'Apartment', count: 13, percentage: 30 },
];

export default function ReportingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('YTD');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-zinc-500" />
            Sales Reporting & Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Comprehensive performance metrics and revenue tracking across your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            {['MTD', 'QTD', 'YTD'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === p
                    ? 'bg-white text-zinc-600 shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm">
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* High-level Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-zinc-50 text-zinc-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Revenue</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">₹36.7 Cr</h3>
          <div className="flex items-center gap-1 mt-2 text-zinc-600 font-bold text-[10px]">
            <ArrowUpRight className="h-3 w-3" />
            <span>+14.2%</span>
            <span className="text-zinc-400 font-medium ml-1">vs prev period</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Target className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Conversion Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">24.8%</h3>
          <div className="flex items-center gap-1 mt-2 text-zinc-600 font-bold text-[10px]">
            <ArrowUpRight className="h-3 w-3" />
            <span>+2.1%</span>
            <span className="text-zinc-400 font-medium ml-1">vs prev period</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Avg Deal Value</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">₹3.9 Cr</h3>
          <div className="flex items-center gap-1 mt-2 text-rose-500 font-bold text-[10px]">
            <ArrowDownRight className="h-3 w-3" />
            <span>-5.4%</span>
            <span className="text-zinc-400 font-medium ml-1">vs prev period</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Pipeline</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">142 Leads</h3>
          <div className="flex items-center gap-1 mt-2 text-zinc-600 font-bold text-[10px]">
            <ArrowUpRight className="h-3 w-3" />
            <span>+18%</span>
            <span className="text-zinc-400 font-medium ml-1">vs prev period</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Revenue Performance</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Monthly revenue in Crores (Cr) vs deal count</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500">Revenue (Cr)</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {revenueData.map((d) => {
              const heightPct = (d.revenue / maxRevenue) * 100;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{d.revenue} Cr
                  </div>
                  <div 
                    className="w-full bg-zinc-500/10 border-t-2 border-zinc-500 rounded-t-sm group-hover:bg-zinc-500/20 transition-all cursor-pointer"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="mt-3 text-[10px] font-bold text-zinc-400">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-900 mb-6">Lead Source Distribution</h3>
          
          <div className="space-y-6">
            <div className="h-4 w-full bg-zinc-50 rounded-full flex overflow-hidden">
              {leadSources.map((s) => (
                <div 
                  key={s.label}
                  style={{ width: `${s.value}%` }}
                  className={`${s.color} h-full rounded-full first:rounded-l-full last:rounded-r-full border-r border-white last:border-0`}
                />
              ))}
            </div>

            <div className="space-y-4">
              {leadSources.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color} shrink-0`} />
                    <span className="text-xs font-bold text-zinc-600">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-900">{s.value}%</span>
                    <div className="w-24 h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                      <div className={`${s.color} h-full rounded-full`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Agents */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Leaderboard: Top Executives
            </h3>
            <button className="text-[10px] font-bold text-zinc-600 hover:text-zinc-500">View All</button>
          </div>

          <div className="space-y-3">
            {topAgents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${
                    agent.rank === 1 ? 'bg-amber-100 text-amber-600' :
                    agent.rank === 2 ? 'bg-zinc-100 text-zinc-600' :
                    agent.rank === 3 ? 'bg-orange-100 text-orange-600' :
                    'bg-zinc-50 text-zinc-400'
                  }`}>
                    {agent.rank}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{agent.name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{agent.deals} deals closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-600">{agent.revenue}</p>
                  <p className="text-[10px] text-zinc-400 font-medium">{agent.conversion} conv.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Type Mix */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-900 mb-6">Inventory Mix & Demand</h3>
          
          <div className="space-y-6">
            {propertyTypes.map((pt) => (
              <div key={pt.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">{pt.label}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[9px] font-bold text-zinc-500">{pt.count} properties</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-900">{pt.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${pt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Trend Analysis</p>
              <p className="text-[10px] text-zinc-700/80 font-medium mt-0.5 leading-relaxed">
                Villas continue to drive the highest revenue per deal (avg ₹12.5 Cr), while Apartments show the highest velocity in the Koregaon Park market.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
