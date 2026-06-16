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

// Revenue bar chart data
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
  { label: 'Zillow Portal', value: 38, color: 'bg-emerald-500' },
  { label: 'Web Referral', value: 24, color: 'bg-blue-500' },
  { label: 'Social Media', value: 18, color: 'bg-violet-500' },
  { label: 'Direct Call', value: 12, color: 'bg-amber-500' },
  { label: 'Walk-In', value: 8, color: 'bg-rose-500' },
];

// Top agents
const topAgents = [
  { name: 'David Thompson', deals: 14, revenue: '$5.2M', conversion: '82%', rank: 1 },
  { name: 'Jessica Monroe', deals: 11, revenue: '$4.1M', conversion: '74%', rank: 2 },
  { name: 'Ryan Caldwell', deals: 9, revenue: '$3.4M', conversion: '71%', rank: 3 },
  { name: 'Priya Sharma', deals: 7, revenue: '$2.8M', conversion: '68%', rank: 4 },
  { name: 'Chris Nguyen', deals: 6, revenue: '$2.1M', conversion: '60%', rank: 5 },
];

// Property type breakdown
const propertyTypes = [
  { label: 'Villa', count: 18, percentage: 42 },
  { label: 'Penthouse', count: 12, percentage: 28 },
  { label: 'Modern House', count: 8, percentage: 19 },
  { label: 'Apartment', count: 5, percentage: 11 },
];

export default function ReportingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('YTD');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
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
                    ? 'bg-white text-emerald-600 shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Export Button */}
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm transition-all">
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Revenue (YTD)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">$36.7M</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                +22% vs last year
              </span>
            </div>
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-2 fill-none text-emerald-400">
                <path d="M0,25 Q20,15 40,10 T70,5 T100,2" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Deals */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Deals Closed (YTD)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">94</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                +18% vs last year
              </span>
            </div>
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-2 fill-none text-blue-400">
                <path d="M0,28 Q20,20 40,14 T70,8 T100,3" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Avg Deal Value */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Avg. Deal Value</span>
            <div className="p-2 rounded-lg bg-violet-50 text-violet-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">$3.9M</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                +9% vs last Qtr
              </span>
            </div>
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-2 fill-none text-violet-400">
                <path d="M0,20 Q20,18 40,15 T70,10 T100,5" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Lead Conversion Rate</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">71%</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                +5.2% vs last Qtr
              </span>
            </div>
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-2 fill-none text-amber-400">
                <path d="M0,22 Q20,18 40,14 T70,9 T100,6" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-800">Monthly Revenue Trend</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Closed deal revenue by calendar month in 2026.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" /> Revenue</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-44 px-1 border-b border-zinc-100 pb-2 relative gap-1">
            {/* Grid lines */}
            <div className="absolute inset-x-0 bottom-1/4 border-t border-zinc-100 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-2/4 border-t border-zinc-100 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-3/4 border-t border-zinc-100 pointer-events-none" />

            {revenueData.map((d) => {
              const heightPct = Math.round((d.revenue / maxRevenue) * 100);
              return (
                <div key={d.month} className="flex flex-col items-center flex-1 group/bar">
                  <span className="text-[9px] font-bold text-emerald-600 opacity-0 group-hover/bar:opacity-100 transition-opacity mb-1 bg-white px-1.5 py-0.5 rounded border border-zinc-200 shadow-sm">
                    ${d.revenue}M
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-5 sm:w-7 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md hover:brightness-110 cursor-pointer transition-all duration-300 shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="flex justify-between px-1 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
            {revenueData.map(d => (
              <span key={d.month} className="flex-1 text-center truncate">{d.month}</span>
            ))}
          </div>
        </div>

        {/* Lead Sources Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-800">Lead Sources</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Where your highest-quality clients originate from.</p>
          </div>

          {/* Stacked Bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5">
            {leadSources.map((s) => (
              <div
                key={s.label}
                style={{ width: `${s.value}%` }}
                className={`${s.color} h-full rounded-full first:rounded-l-full last:rounded-r-full`}
              />
            ))}
          </div>

          {/* Legend Items */}
          <div className="space-y-2.5 pt-1">
            {leadSources.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color} shrink-0`} />
                  <span className="text-xs text-zinc-600 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`${s.color} h-full rounded-full`} style={{ width: `${s.value}%` }} />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 w-8 text-right">{s.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Agents + Property Types */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Top Agents Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-800">Top Performing Agents</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Leaderboard ranked by revenue closed this year.</p>
            </div>
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Deals</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topAgents.map((agent) => (
                <tr key={agent.name} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${
                      agent.rank === 1 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      agent.rank === 2 ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                      agent.rank === 3 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                      'bg-zinc-50 text-zinc-400 border border-zinc-200'
                    }`}>
                      #{agent.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 flex items-center justify-center">
                        {agent.name.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-800 group-hover:text-emerald-600 transition-colors">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-zinc-700">{agent.deals}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">{agent.revenue}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: agent.conversion }}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-700">{agent.conversion}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Property Type Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-800">Property Type Distribution</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Breakdown of sold inventory by category type.</p>
          </div>

          <div className="space-y-4 pt-1">
            {propertyTypes.map((pt) => (
              <div key={pt.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-zinc-400" />
                    {pt.label}
                  </span>
                  <span className="font-bold text-zinc-800">{pt.count} sold <span className="text-zinc-400 font-medium">({pt.percentage}%)</span></span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-emerald-700">43</p>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">Total Sold</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-zinc-800">51</p>
              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">Still Listed</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
