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
      name: 'Olivia Ryans',
      budget_min: 4000000,
      budget_max: 5000000,
      location: 'Beverly Hills',
      type: 'Villa',
      config: '5 BHK',
      area: 6500
    },
    {
      id: 'lead-2',
      name: 'Marcus Vance',
      budget_min: 3000000,
      budget_max: 3500000,
      location: 'Malibu',
      type: 'Penthouse',
      config: '3 BHK',
      area: 3800
    },
    {
      id: 'lead-3',
      name: 'Sarah Jenkins',
      budget_min: 5000000,
      budget_max: 6000000,
      location: 'Malibu',
      type: 'Villa',
      config: '6 BHK',
      area: 7200
    },
    {
      id: 'lead-4',
      name: 'David Kim',
      budget_min: 2500000,
      budget_max: 3000000,
      location: 'Los Angeles',
      type: 'Modern House',
      config: '4 BHK',
      area: 4100
    }
  ];

  // Properties list
  const properties: MatchProperty[] = [
    {
      id: 'prop-1',
      title: 'The Obsidian Villa',
      price: 4850000,
      location: 'Beverly Hills',
      type: 'Villa',
      config: '5 BHK',
      area: 6500,
      image: '/images/house1.png'
    },
    {
      id: 'prop-2',
      title: 'Elysian Glass Penthouse',
      price: 3200000,
      location: 'Malibu',
      type: 'Penthouse',
      config: '3 BHK',
      area: 3800,
      image: '/images/house2.png'
    },
    {
      id: 'prop-3',
      title: 'Minimalist Concrete Haven',
      price: 2900000,
      location: 'Los Angeles',
      type: 'Modern House',
      config: '4 BHK',
      area: 4100,
      image: '/images/house3.png'
    },
    {
      id: 'prop-4',
      title: 'Serene Coastal Villa',
      price: 5150000,
      location: 'Malibu',
      type: 'Villa',
      config: '6 BHK',
      area: 7200,
      image: '/images/house1.png'
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
      reasons.push({ label: 'Preferred location match', matched: true, score: 25 });
    } else {
      reasons.push({ label: 'Outside preferred location', matched: false, score: 0 });
    }

    // Configuration match (20%)
    const configMatch = prop.config === currentLead.config;
    if (configMatch) {
      score += 20;
      reasons.push({ label: 'Structure layout match', matched: true, score: 20 });
    } else {
      reasons.push({ label: 'Layout configurations differ', matched: false, score: 0 });
    }

    // Property Type match (15%)
    const typeMatch = prop.type === currentLead.type;
    if (typeMatch) {
      score += 15;
      reasons.push({ label: 'Property type match', matched: true, score: 15 });
    } else {
      reasons.push({ label: 'Type mismatch', matched: false, score: 0 });
    }

    // Area match (10%)
    const areaMatch = Math.abs(prop.area - currentLead.area) <= 500;
    if (areaMatch) {
      score += 10;
      reasons.push({ label: 'Dimensions area fit', matched: true, score: 10 });
    } else {
      reasons.push({ label: 'Area differs substantially', matched: false, score: 0 });
    }

    return {
      ...prop,
      score,
      reasons
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            AI Matchmaking
          </h1>
          <p className="text-xs text-zinc-500">
            Dynamically cross-reference lead specifications against catalog properties to find perfect fits.
          </p>
        </div>
      </div>

      {/* Main Grid: Selection Left, Matches Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Select Lead & Specs (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Select Client Lead</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Choose a lead to calculate catalog property scores.</p>
            </div>

            {/* Dropdown Selection */}
            <div className="relative">
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-400 appearance-none cursor-pointer"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id} className="bg-white">
                    {l.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </div>

            {/* Selected Lead Specifications Panel */}
            <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <div className="h-7 w-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  {currentLead.name.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-zinc-700">{currentLead.name} Preferences</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Budget Range:</span>
                  <span className="text-emerald-600 font-bold flex items-center">
                    <DollarSign className="h-3.5 w-3.5" />
                    {currentLead.budget_min.toLocaleString()} - {currentLead.budget_max.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Location:</span>
                  <span className="text-zinc-700 font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                    {currentLead.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Property Type:</span>
                  <span className="text-zinc-700 font-semibold">{currentLead.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Configuration:</span>
                  <span className="text-zinc-700 font-semibold">{currentLead.config}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Area Minimum:</span>
                  <span className="text-zinc-700 font-semibold">{currentLead.area.toLocaleString()} sqft</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Property Matches (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Top Property Recommendations</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Calculated compatibility matching percentages based on client preferences.</p>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {matches.map((match) => (
              <div 
                key={match.id}
                className="bg-white border border-zinc-200 shadow-sm hover:shadow-md rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center transition-all duration-300"
              >
                {/* Photo preview */}
                <div className="h-32 w-full md:w-44 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={match.image} 
                    alt={match.title} 
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Details and Score */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors">
                        {match.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        {match.location} • {match.type} • {match.config}
                      </p>
                    </div>

                    {/* Percentage Score Badge */}
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl self-start">
                      <Award className="h-4 w-4 text-emerald-600 animate-pulse" />
                      <span className="text-xs font-black text-emerald-600">{match.score}% Match</span>
                    </div>
                  </div>

                  {/* Compatibility factors */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-zinc-100 text-[10px]">
                    {match.reasons.map((reason, rIdx) => (
                      <span 
                        key={rIdx} 
                        className={`flex items-center gap-1 font-semibold ${
                          reason.matched ? 'text-emerald-600' : 'text-zinc-400'
                        }`}
                      >
                        {reason.matched ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                        {reason.label}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-zinc-900">
                      ${(match.price).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => alert(`Brochure sent to ${currentLead.name} via Email!`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 uppercase tracking-wider transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Share Details
                      </button>
                      <button 
                        onClick={() => alert(`Site viewing scheduled for ${currentLead.name} at ${match.title}!`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 uppercase tracking-wider transition-colors"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Book Visit
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
