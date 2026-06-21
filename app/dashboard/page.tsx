"use client";

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchLeads, fetchProperties, Lead, Property } from '@/lib/queries';
import Link from 'next/link';
import { 
  Users, 
  Home, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  Plus, 
  Calendar, 
  ChevronDown, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2,
  TrendingUp,
  MessageSquare,
  Activity,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatPriceShort } from '@/lib/formatters';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts';
import { ChartTooltipContent } from '@/components/application/charts/charts-base';

export default function DashboardPage() {
  const profile = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLeads(profile).catch(() => []),
      fetchProperties(profile).catch(() => [])
    ])
      .then(([fetchedLeads, fetchedProperties]) => {
        setLeads(fetchedLeads);
        setProperties(fetchedProperties);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  // Combined fallback and live properties
  const displayProperties = properties.length > 0 ? properties.map((p, idx) => ({
    id: p.id,
    title: p.title || 'Luxury Estate',
    price: p.price ? formatCurrency(p.price) : '₹1.25 Cr',
    location: p.address || p.location || 'Kalyani Nagar, Pune',
    type: p.property_type || 'Apartment',
    status: (p as any).status || p.status_id || 'Available',
    image: idx % 4 === 0 ? '/images/luxe-1.webp' : idx % 4 === 1 ? '/images/luxe-2.webp' : idx % 4 === 2 ? '/images/luxe-3.webp' : '/images/luxe-5.webp',
    beds: (p as any).bedrooms || 3,
    baths: (p as any).bathrooms || 3,
    sqft: p.carpet_area || p.built_up_area || 1800
  })).slice(0, 4) : [
    {
      id: '1',
      title: 'Pristine Kyra',
      price: '₹3.1 Cr',
      location: 'Kalyani Nagar, Pune',
      type: 'Penthouse',
      status: 'Available',
      image: '/images/luxe-1.webp',
      beds: 4,
      baths: 5,
      sqft: 4500
    },
    {
      id: '2',
      title: 'Power Heights',
      price: '₹1.3 Cr',
      location: 'Koregaon Park, Pune',
      type: 'Luxury Apartment',
      status: 'Available',
      image: '/images/luxe-2.webp',
      beds: 3,
      baths: 4,
      sqft: 3200
    },
    {
      id: '3',
      title: 'Vivencia',
      price: '₹2.2 Cr',
      location: 'Baner, Pune',
      type: 'Villa',
      status: 'Under Offer',
      image: '/images/luxe-3.webp',
      beds: 5,
      baths: 6,
      sqft: 8500
    },
    {
      id: '4',
      title: 'NYATI Evoque',
      price: '₹3.5 Cr',
      location: 'Viman Nagar, Pune',
      type: 'Apartment',
      status: 'Available',
      image: '/images/luxe-5.webp',
      beds: 3,
      baths: 3,
      sqft: 2400
    }
  ];

  // Pipeline stages chart data
  const pipelineStages = [
    { label: 'New inquiry', value: 120, height: 'h-[100%]', percentage: '120 leads' },
    { label: 'Site visit', value: 85, height: 'h-[71%]', percentage: '85 leads' },
    { label: 'Follow up', value: 62, height: 'h-[52%]', percentage: '62 leads' },
    { label: 'Closure', value: 30, height: 'h-[25%]', percentage: '30 deals' }
  ];

  // Recent client interactions
  const recentInteractions = [
    { id: 1, name: 'Ananya Sharma', action: 'Inquired on Vivencia', status: 'Hot', time: '10m ago', initial: 'AS' },
    { id: 2, name: 'Vikram Malhotra', action: 'Requested Site Visit', status: 'Warm', time: '1h ago', initial: 'VM' },
    { id: 3, name: 'Rajesh Gupta', action: 'Submitted Offer (₹14.7 Cr)', status: 'Closed', time: '3h ago', initial: 'RG' },
    { id: 4, name: 'Deepika Rao', action: 'Inquired on Power Heights', status: 'Warm', time: '5h ago', initial: 'DR' },
    { id: 5, name: 'Sanjay Kapoor', action: 'Signed Contract', status: 'Closed', time: '1d ago', initial: 'SK' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-zinc-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Rahul'}! Today&apos;s Overview
          </h1>
          <p className="text-xs text-zinc-500">
            Real-time visual monitoring of your listings, leads, and sales conversion pipelines.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-center">
          {/* TEMP SEED BUTTON */}
          <button 
            onClick={async () => {
              try {
                const tokenStr = localStorage.getItem('sb-sjnwbezerwxdreyhdpci-auth-token');
                if (!tokenStr) return alert('Not logged in!');
                const token = JSON.parse(tokenStr).access_token;
                
                const res = await fetch('/api/seed-db', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) window.location.reload();
                else alert('Failed to seed: ' + await res.text());
              } catch (e) {
                alert('Error: ' + e);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Seed Dummy Data
          </button>

          {/* Date Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-600 font-medium hover:bg-zinc-50 cursor-pointer transition-colors">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span>Last 30 Days</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </div>

          {/* Quick CTA Actions */}
          <Link href="/leads/create">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-all">
              <Plus className="h-4 w-4 text-zinc-400" />
              Add Lead
            </button>
          </Link>
          <Link href="/properties/create">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-zinc-500 to-teal-400 text-xs font-bold text-zinc-950 hover:brightness-110 shadow-md shadow-zinc-500/10 transition-all">
              <Plus className="h-4 w-4" />
              Add Property
            </button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Active Leads */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Active Leads</span>
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">1,248</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-zinc-600">
                <ArrowUpRight className="h-3 w-3" />
                +12% vs last month
              </span>
            </div>
            {/* SVG Sparkline */}
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full text-zinc-500 stroke-2 fill-none">
                <path d="M0,25 Q15,5 30,22 T60,8 T90,2" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 2: Open Listings */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Open Listings</span>
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-600">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">315</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-zinc-600">
                <ArrowUpRight className="h-3 w-3" />
                +8% vs last week
              </span>
            </div>
            {/* SVG Sparkline */}
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full text-zinc-500 stroke-2 fill-none">
                <path d="M0,20 Q15,8 30,18 T60,25 T90,5" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 3: Closed Deals */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Closed Deals (YTD)</span>
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">₹36.7 Cr</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-zinc-600">
                <ArrowUpRight className="h-3 w-3" />
                +24% vs last Qtr
              </span>
            </div>
            {/* SVG Sparkline */}
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full text-zinc-500 stroke-2 fill-none">
                <path d="M0,28 Q15,20 30,5 T60,15 T90,2" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 4: Client Retention */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Client Retention</span>
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">91%</h3>
              <span className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-zinc-600">
                <ArrowUpRight className="h-3 w-3" />
                +4.5% vs last year
              </span>
            </div>
            {/* SVG Sparkline */}
            <div className="w-20 h-10">
              <svg viewBox="0 0 100 30" className="w-full h-full text-zinc-500 stroke-2 fill-none">
                <path d="M0,22 Q15,10 30,12 T60,8 T90,6" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Property Listings Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-800 tracking-tight">Property Listings Overview</h2>
              <p className="text-xs text-zinc-500">A curated portfolio of high-value luxury real estate properties.</p>
            </div>
            <Link href="/properties" className="text-xs font-bold text-zinc-600 hover:text-zinc-700 hover:underline flex items-center gap-1">
              View All Properties
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayProperties.map((prop) => (
              <div 
                key={prop.id} 
                className="bg-white border border-zinc-200 shadow-sm hover:shadow-md rounded-2xl overflow-hidden hover:translate-y-[-2px] transition-all duration-300 group"
              >
                {/* House Photo Section */}
                <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={prop.image} 
                    alt={prop.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Status Overlay Badge */}
                  <span className={`absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                    prop.status === 'Available' 
                      ? 'bg-zinc-50 text-zinc-600 border-zinc-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {prop.status}
                  </span>
                  {/* Type Overlay Badge */}
                  <span className="absolute bottom-3.5 left-3.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/80 border border-zinc-200 text-zinc-700 tracking-wider uppercase">
                    {prop.type}
                  </span>
                </div>

                {/* Listing Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-500" />
                      {prop.location}
                    </h4>
                    <h3 className="text-base font-bold text-zinc-800 truncate mt-1 group-hover:text-zinc-600 transition-colors">
                      {prop.title}
                    </h3>
                  </div>

                  {/* Pricing and Attributes */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                    <span className="text-base font-extrabold text-zinc-600">{prop.price}</span>
                    <div className="flex items-center gap-3.5 text-zinc-500 text-xs font-medium">
                      <span className="flex items-center gap-1" title="Bedrooms">
                        <BedDouble className="h-3.5 w-3.5 text-zinc-400" />
                        {prop.beds}
                      </span>
                      <span className="flex items-center gap-1" title="Bathrooms">
                        <Bath className="h-3.5 w-3.5 text-zinc-400" />
                        {prop.baths}
                      </span>
                      <span className="flex items-center gap-1" title="Area Sqft">
                        <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                        {prop.sqft.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Pipeline & Client Interactions */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* Sales Pipeline stages */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-800 tracking-tight">Sales Pipeline Stages</h2>
              <p className="text-xs text-zinc-500">Active deal tracking across the sales funnel stages.</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineStages} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)', radius: 4 }} />
                    <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Client Interactions */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-800 tracking-tight">Recent Client Interactions</h2>
              <p className="text-xs text-zinc-500">Chronological feed of database updates and client actions.</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm divide-y divide-zinc-100">
              {recentInteractions.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between first:pt-1 last:pb-1 group">
                  <div className="flex items-center gap-3">
                    {/* Initials Circle */}
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 flex items-center justify-center group-hover:bg-zinc-50 transition-colors">
                      {log.initial}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">{log.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{log.action}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge & Time */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] text-zinc-500 font-medium">{log.time}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${
                      log.status === 'Hot' 
                        ? 'bg-red-50 text-red-600 border-red-100' 
                        : log.status === 'Warm' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : 'bg-zinc-50 text-zinc-600 border-zinc-100'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
