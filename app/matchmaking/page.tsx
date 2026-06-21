"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Calendar, 
  Home, 
  User,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPriceShort } from '@/lib/formatters';

interface MatchLead {
  id: string;
  name: string;
  budget_min: number;
  budget_max: number;
  location: string;
  type: string;
  config: string;
  area: number;
}

interface MatchProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  config: string;
  area: number;
  image: string;
}

export default function MatchmakingPage() {
  const [selectedLeadId, setSelectedLeadId] = useState('lead-1');

  // Leads list
  const leads: MatchLead[] = [
    {
      id: 'lead-1',
      name: 'Ananya Sharma',
      budget_min: 40000000,
      budget_max: 50000000,
      location: 'Kalyani Nagar',
      type: 'Apartment',
      config: '3 BHK',
      area: 2500
    },
    {
      id: 'lead-2',
      name: 'Vikram Malhotra',
      budget_min: 80000000,
      budget_max: 100000000,
      location: 'Koregaon Park',
      type: 'Penthouse',
      config: '4 BHK',
      area: 4200
    },
    {
      id: 'lead-3',
      name: 'Rajesh Gupta',
      budget_min: 200000000,
      budget_max: 250000000,
      location: 'Baner',
      type: 'Villa',
      config: '5 BHK',
      area: 8500
    },
    {
      id: 'lead-4',
      name: 'Deepika Rao',
      budget_min: 25000000,
      budget_max: 35000000,
      location: 'Viman Nagar',
      type: 'Apartment',
      config: '3 BHK',
      area: 2400
    }
  ];

  // Properties list
  const properties: MatchProperty[] = [
    {
      id: 'prop-1',
      title: 'Pristine Kyra',
      price: 31000000,
      location: 'Kalyani Nagar',
      type: 'Penthouse',
      config: '4 BHK',
      area: 4500,
      image: '/images/luxe-1.webp'
    },
    {
      id: 'prop-2',
      title: 'Power Heights',
      price: 13000000,
      location: 'Koregaon Park',
      type: 'Luxury Apartment',
      config: '3 BHK',
      area: 3200,
      image: '/images/luxe-2.webp'
    },
    {
      id: 'prop-3',
      title: 'Vivencia',
      price: 22000000,
      location: 'Baner',
      type: 'Villa',
      config: '5 BHK',
      area: 8500,
      image: '/images/luxe-3.webp'
    },
    {
      id: 'prop-4',
      title: 'NYATI Evoque',
      price: 35000000,
      location: 'Viman Nagar',
      type: 'Apartment',
      config: '3 BHK',
      area: 2400,
      image: '/images/luxe-5.webp'
    }
  ];

  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  // Match calculations
  const matches = properties.map(prop => {
    let score = 0;
    const reasons: { label: string; matched: boolean; score: number }[] = [];

    // Budget match (30%)
    const budgetMatch = prop.price >= currentLead.budget_min && prop.price <= currentLead.budget_max;
    if (budgetMatch) {
      score += 30;
      reasons.push({ label: 'Budget fits within range', matched: true, score: 30 });
    } else {
      reasons.push({ label: 'Price exceeds budget', matched: false, score: 0 });
    }

    // Location match (25%)
    const locationMatch = prop.location.toLowerCase() === currentLead.location.toLowerCase();
    if (locationMatch) {
      score += 25;
      reasons.push({ label: 'Preferred location matched', matched: true, score: 25 });
    } else {
      reasons.push({ label: 'Different neighborhood', matched: false, score: 0 });
    }

    // Type match (20%)
    if (prop.type === currentLead.type) {
      score += 20;
      reasons.push({ label: 'Property type matched', matched: true, score: 20 });
    } else {
      reasons.push({ label: 'Different property type', matched: false, score: 0 });
    }

    // Configuration match (15%)
    if (prop.config === currentLead.config) {
      score += 15;
      reasons.push({ label: 'Configuration matched', matched: true, score: 15 });
    } else {
      reasons.push({ label: 'Different layout/BHK', matched: false, score: 0 });
    }

    // Area match (10%)
    const areaMatch = prop.area >= currentLead.area * 0.9;
    if (areaMatch) {
      score += 10;
      reasons.push({ label: 'Area requirements met', matched: true, score: 10 });
    } else {
      reasons.push({ label: 'Smaller than requested', matched: false, score: 0 });
    }

    return {
      ...prop,
      score,
      reasons
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-zinc-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-500 text-white shadow-lg shadow-zinc-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Property Matchmaking</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Automated requirement-to-inventory cross-referencing system.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10">
            Run Global Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Active Leads</h3>
          <div className="space-y-2">
            {leads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                  selectedLeadId === lead.id 
                    ? 'bg-zinc-50 border-zinc-500 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      selectedLeadId === lead.id ? 'bg-zinc-500 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {lead.name.charAt(0)}
                    </div>
                    <span className={`text-xs font-bold ${selectedLeadId === lead.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {lead.name}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    selectedLeadId === lead.id ? 'text-zinc-500 translate-x-0.5' : 'text-zinc-300'
                  }`} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-100 text-[9px] font-bold text-zinc-600">
                    {formatPriceShort(lead.budget_max)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-100 text-[9px] font-bold text-zinc-600">
                    {lead.location}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-4">
            <h4 className="text-xs font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-zinc-400" />
              Agent Tip
            </h4>
            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
              Based on recent trends, clients in <span className="text-white font-bold">{currentLead.location}</span> are showing increased interest in properties with larger carpet areas.
            </p>
          </div>
        </div>

        {/* Matching Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
              Top Matches for <span className="text-zinc-900">{currentLead.name}</span>
            </h3>
            <span className="text-[10px] font-bold text-zinc-600">{matches.length} matches found</span>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <div 
                key={match.id}
                className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-zinc-500/5 transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-56 h-48 bg-zinc-100 relative overflow-hidden">
                    <img src={match.image} alt={match.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-black">
                      {match.score}% MATCH
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                            {match.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {match.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-zinc-600">
                            {formatPriceShort(match.price)}
                          </p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{match.config}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {match.reasons.map((reason, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold ${
                              reason.matched 
                                ? 'bg-zinc-50 border-zinc-100 text-zinc-600' 
                                : 'bg-zinc-50 border-zinc-100 text-zinc-400 opacity-60'
                            }`}
                          >
                            {reason.matched ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {reason.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-zinc-50">
                      <button 
                        onClick={() => alert(`Brochure sent to ${currentLead.name} via Email!`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-800 transition-all"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send Brochure
                      </button>
                      <button 
                        onClick={() => alert(`Site viewing scheduled for ${currentLead.name} at ${match.title}!`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-[10px] font-bold hover:bg-zinc-50 transition-all"
                      >
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        Schedule Visit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                <Sparkles className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No strong matches found</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
