"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Calendar, 
  Home, 
  Award,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { fetchLeads, fetchProperties, Lead, Property } from '@/lib/queries';

// Helper to abbreviate currency values into Indian units
function formatBudgetAbbreviated(value: number | undefined | null) {
  if (!value) return "Flexible";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(2)} L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

// Map property type to a premium image
function getPropertyImage(type: string | undefined | null) {
  const t = (type || '').toLowerCase();
  if (t.includes('villa')) return '/images/luxe-3.webp';
  if (t.includes('penthouse')) return '/images/luxe-1.webp';
  if (t.includes('apartment')) return '/images/luxe-2.webp';
  return '/images/luxe-5.webp';
}

// Robust location matchmaking parser
function matchLocation(loc1: string | undefined | null, loc2: string | undefined | null) {
  if (!loc1 || !loc2) return false;
  const clean1 = loc1.toLowerCase().replace(/,?\s*pune/gi, '').trim();
  const clean2 = loc2.toLowerCase().replace(/,?\s*pune/gi, '').trim();
  return clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1);
}

export default function MatchmakingPage() {
  const profile = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [matchMode, setMatchMode] = useState<'leads' | 'properties'>('leads');

  // Fallback mock leads from app/leads/page.tsx
  const mockLeads: Lead[] = [
    {
      id: 'mock-1',
      client_name: 'Ananya Sharma',
      phone: '+91 98200 11223',
      email: 'ananya.s@gmail.com',
      budget_min: 40000000,
      budget_max: 50000000,
      preferred_location: 'Kalyani Nagar, Pune',
      property_type: 'Apartment',
      configuration: '3 BHK',
      category: 'Residential',
      transaction_type: 'Outright',
      stage_id: 'New inquiry',
      status: 'Hot',
      notes: 'Prefers modern architectural designs. Needs sea view.',
      created_at: '2026-06-15T12:00:00Z',
      lead_source_id: '99 acres'
    },
    {
      id: 'mock-2',
      client_name: 'Vikram Malhotra',
      phone: '+91 99100 55443',
      email: 'vikram.m@corporatespace.in',
      budget_min: 80000000,
      budget_max: 100000000,
      preferred_location: 'Koregaon Park, Pune',
      property_type: 'Penthouse',
      configuration: '4 BHK',
      category: 'Residential',
      transaction_type: 'Outright',
      stage_id: 'Site visit',
      status: 'Warm',
      notes: 'Corporate client. Wants high-floor penthouse with city skyline views.',
      created_at: '2026-06-14T09:30:00Z',
      lead_source_id: 'Referral'
    },
    {
      id: 'mock-3',
      client_name: 'Rajesh Gupta',
      phone: '+91 94400 88776',
      email: 'rajesh.gupta@outlook.com',
      budget_min: 120000000,
      budget_max: 150000000,
      preferred_location: 'Baner, Pune',
      property_type: 'Villa',
      configuration: '5 BHK',
      category: 'Residential',
      transaction_type: 'Outright',
      stage_id: 'Follow up',
      status: 'No answer',
      notes: 'Has visited Heritage Villa twice. Discussing pricing and payment schedules.',
      created_at: '2026-06-12T14:15:00Z',
      lead_source_id: 'Website'
    },
    {
      id: 'mock-4',
      client_name: 'Deepika Rao',
      phone: '+91 80500 44332',
      email: 'deepika.rao@tech-leads.in',
      budget_min: 25000000,
      budget_max: 35000000,
      preferred_location: 'Viman Nagar, Pune',
      property_type: 'Apartment',
      configuration: '3 BHK',
      category: 'Residential',
      transaction_type: 'Outright',
      stage_id: 'Site visit',
      status: 'Warm',
      notes: 'Looking for property near ITPL. Primary interest in ready-to-move projects.',
      created_at: '2026-06-10T11:00:00Z',
      lead_source_id: 'Magicbricks'
    }
  ];

  // Fallback mock properties from app/properties/page.tsx
  const mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'Pristine Kyra',
      property_code: 'PROP-KYR-01',
      location: 'Kalyani Nagar',
      address: 'Pristine Kyra, Kalyani Nagar, Pune, Maharashtra 411006',
      property_type: 'Penthouse',
      configuration: '4 BHK',
      price: 31000000,
      carpet_area: 4500,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Vikram Seth',
      owner_contact: '+91 98200 12345',
      description: 'Stunning organic modern architectural masterpiece in the heart of Pune. Features full-height glass walls, infinity edge balcony, and state-of-the-art home automation.'
    },
    {
      id: 'prop-2',
      title: 'Power Heights',
      property_code: 'PROP-POW-02',
      location: 'Koregaon Park',
      address: 'Power Heights, North Main Road, Koregaon Park, Maharashtra 411001',
      property_type: 'Luxury Apartment',
      configuration: '3 BHK',
      price: 13000000,
      carpet_area: 3200,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Aditya Birla',
      owner_contact: '+91 99100 54321',
      description: 'Exclusive double-height glass ceiling penthouse offering panoramic views of the city skyline. Includes private terrace pool and dedicated concierge services.'
    },
    {
      id: 'prop-3',
      title: 'Vivencia',
      property_code: 'PROP-VIV-03',
      location: 'Baner',
      address: 'Vivencia, Baner Road, Pune, Maharashtra 411045',
      property_type: 'Villa',
      configuration: '5 BHK',
      price: 22000000,
      carpet_area: 8500,
      status_id: 'Under Offer',
      listing_type: 'Sale',
      owner_name: 'Nagarjuna Reddy',
      owner_contact: '+91 94400 98765',
      description: 'Minimalist contemporary villa blended with traditional Indian architectural elements. Features large courtyards and expansive landscaped gardens.'
    },
    {
      id: 'prop-4',
      title: 'NYATI Evoque',
      property_code: 'PROP-NYA-04',
      location: 'Viman Nagar',
      address: 'NYATI Evoque, Viman Nagar, Pune, Maharashtra 411014',
      property_type: 'Apartment',
      configuration: '3 BHK',
      price: 35000000,
      carpet_area: 2400,
      status_id: 'Available',
      listing_type: 'Sale',
      owner_name: 'Rohan Murthy',
      owner_contact: '+91 80500 11223',
      description: 'Modern high-rise apartment with premium finishes and smart home features. Located in the tech hub of the city with excellent connectivity.'
    }
  ];

  // Fetch leads and properties on load
  useEffect(() => {
    const loadData = async () => {
      try {
        const leadsData = await fetchLeads(profile);
        const propsData = await fetchProperties(profile);

        const finalLeads = leadsData && leadsData.length > 0 ? leadsData : mockLeads;
        const finalProps = propsData && propsData.length > 0 ? propsData : mockProperties;

        setLeads(finalLeads);
        setProperties(finalProps);

        if (finalLeads.length > 0) setSelectedLeadId(finalLeads[0].id);
        if (finalProps.length > 0) setSelectedPropertyId(finalProps[0].id);
      } catch (err) {
        console.error("Error loading matchmaking data:", err);
        setLeads(mockLeads);
        setProperties(mockProperties);
        setSelectedLeadId(mockLeads[0].id);
        setSelectedPropertyId(mockProperties[0].id);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  const currentLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || leads[0];
  }, [leads, selectedLeadId]);

  const currentProperty = useMemo(() => {
    return properties.find(p => p.id === selectedPropertyId) || properties[0];
  }, [properties, selectedPropertyId]);

  // Match Calculation: Properties matching current Lead
  const propertyMatches = useMemo(() => {
    if (!currentLead || properties.length === 0) return [];

    return properties.map(prop => {
      let score = 0;
      const reasons: { label: string; matched: boolean; score: number }[] = [];

      // 1. Budget match (30 points)
      const budgetMatch = currentLead.budget_min && currentLead.budget_max && prop.price
        ? (prop.price >= currentLead.budget_min && prop.price <= currentLead.budget_max)
        : false;
      
      if (budgetMatch) {
        score += 30;
        reasons.push({ label: 'Budget fits range', matched: true, score: 30 });
      } else {
        reasons.push({ label: 'Price outside budget', matched: false, score: 0 });
      }

      // 2. Location match (25 points)
      const locationMatch = matchLocation(currentLead.preferred_location, prop.location);
      
      if (locationMatch) {
        score += 25;
        reasons.push({ label: 'Preferred location matches', matched: true, score: 25 });
      } else {
        reasons.push({ label: 'Different location', matched: false, score: 0 });
      }

      // 3. Configuration match (20 points)
      const configMatch = currentLead.configuration && prop.configuration
        ? (prop.configuration === currentLead.configuration)
        : false;

      if (configMatch) {
        score += 20;
        reasons.push({ label: 'Configuration matches', matched: true, score: 20 });
      } else {
        reasons.push({ label: 'Different layout/BHK', matched: false, score: 0 });
      }

      // 4. Property Type match (15 points)
      const typeMatch = currentLead.property_type && prop.property_type
        ? (prop.property_type.toLowerCase() === currentLead.property_type.toLowerCase())
        : false;

      if (typeMatch) {
        score += 15;
        reasons.push({ label: 'Property type matches', matched: true, score: 15 });
      } else {
        reasons.push({ label: 'Different property type', matched: false, score: 0 });
      }

      // 5. Area match (10 points)
      const areaMatch = currentLead.required_area && prop.carpet_area
        ? (Math.abs(currentLead.required_area - prop.carpet_area) <= 200)
        : false;

      if (areaMatch) {
        score += 10;
        reasons.push({ label: 'Size matches requirement', matched: true, score: 10 });
      } else {
        reasons.push({ label: 'Different size footprint', matched: false, score: 0 });
      }

      return {
        ...prop,
        score,
        reasons
      };
    }).sort((a, b) => b.score - a.score);
  }, [currentLead, properties]);

  // Match Calculation: Leads matching current Property
  const leadMatches = useMemo(() => {
    if (!currentProperty || leads.length === 0) return [];

    return leads.map(lead => {
      let score = 0;
      const reasons: { label: string; matched: boolean; score: number }[] = [];

      // 1. Budget match (30 points)
      const budgetMatch = lead.budget_min && lead.budget_max && currentProperty.price
        ? (currentProperty.price >= lead.budget_min && currentProperty.price <= lead.budget_max)
        : false;

      if (budgetMatch) {
        score += 30;
        reasons.push({ label: 'Price fits budget range', matched: true, score: 30 });
      } else {
        reasons.push({ label: 'Price outside client budget', matched: false, score: 0 });
      }

      // 2. Location match (25 points)
      const locationMatch = matchLocation(lead.preferred_location, currentProperty.location);

      if (locationMatch) {
        score += 25;
        reasons.push({ label: 'Matches location preference', matched: true, score: 25 });
      } else {
        reasons.push({ label: 'Different preferred neighborhood', matched: false, score: 0 });
      }

      // 3. Configuration match (20 points)
      const configMatch = lead.configuration && currentProperty.configuration
        ? (currentProperty.configuration === lead.configuration)
        : false;

      if (configMatch) {
        score += 20;
        reasons.push({ label: 'Matches configuration (BHK)', matched: true, score: 20 });
      } else {
        reasons.push({ label: 'Different layout required', matched: false, score: 0 });
      }

      // 4. Property Type match (15 points)
      const typeMatch = lead.property_type && currentProperty.property_type
        ? (currentProperty.property_type.toLowerCase() === lead.property_type.toLowerCase())
        : false;

      if (typeMatch) {
        score += 15;
        reasons.push({ label: 'Matches property type preference', matched: true, score: 15 });
      } else {
        reasons.push({ label: 'Different property type preference', matched: false, score: 0 });
      }

      // 5. Area match (10 points)
      const areaMatch = lead.required_area && currentProperty.carpet_area
        ? (Math.abs(lead.required_area - currentProperty.carpet_area) <= 200)
        : false;

      if (areaMatch) {
        score += 10;
        reasons.push({ label: 'Matches area footprint', matched: true, score: 10 });
      } else {
        reasons.push({ label: 'Size footprint mismatch', matched: false, score: 0 });
      }

      return {
        ...lead,
        score,
        reasons
      };
    }).sort((a, b) => b.score - a.score);
  }, [currentProperty, leads]);

  // Formatted whatsapp text for property share
  const sharePropertyToLeadText = (l: Lead, p: Property) => {
    return encodeURIComponent(`👋 Hello ${l.client_name},
We found a property matching your requirements!

🏠 *${p.title}*
📍 Location: ${p.location}
💰 Price: ${formatBudgetAbbreviated(p.price)}
🏢 Type: ${p.property_type} (${p.configuration})
📐 Area: ${p.carpet_area} sq ft

Let us know if you would like to schedule a site visit!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-2">
        <svg className="animate-spin h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-zinc-500 font-semibold">Running cross-reference matchmaking engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              Property Matchmaking
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Automated requirement-to-inventory cross-referencing system.
            </p>
          </div>
        </div>

        {/* Match Mode Selector Toggle */}
        <div className="flex items-center bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
          <button
            onClick={() => setMatchMode('leads')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              matchMode === 'leads'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Match by Lead
          </button>
          <button
            onClick={() => setMatchMode('properties')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              matchMode === 'properties'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Match by Property
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">
            {matchMode === 'leads' ? 'Active Customer Leads' : 'Active Properties'}
          </h3>
          
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {matchMode === 'leads' ? (
              leads.map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    selectedLeadId === lead.id 
                      ? 'bg-zinc-50 border-zinc-500 shadow-xs' 
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedLeadId === lead.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {lead.client_name?.charAt(0) || '?'}
                      </div>
                      <span className={`text-xs font-bold ${selectedLeadId === lead.id ? 'text-zinc-900' : 'text-zinc-600'}`}>
                        {lead.client_name}
                      </span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      selectedLeadId === lead.id ? 'text-zinc-900 translate-x-0.5' : 'text-zinc-300'
                    }`} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-150 text-[9px] font-bold text-zinc-500">
                      {formatBudgetAbbreviated(lead.budget_max)} limit
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-150 text-[9px] font-bold text-zinc-500">
                      {lead.preferred_location || 'Flexible'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              properties.map((prop) => (
                <div 
                  key={prop.id}
                  onClick={() => setSelectedPropertyId(prop.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    selectedPropertyId === prop.id 
                      ? 'bg-zinc-50 border-zinc-500 shadow-xs' 
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedPropertyId === prop.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <Home className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-bold ${selectedPropertyId === prop.id ? 'text-zinc-900' : 'text-zinc-600'}`}>
                        {prop.title}
                      </span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      selectedPropertyId === prop.id ? 'text-zinc-900 translate-x-0.5' : 'text-zinc-300'
                    }`} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-150 text-[9px] font-bold text-zinc-500">
                      {formatBudgetAbbreviated(prop.price)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-150 text-[9px] font-bold text-zinc-500">
                      {prop.location}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-3 shadow-md shadow-zinc-900/10">
            <h4 className="text-xs font-extrabold flex items-center gap-2">
              <Award className="h-4 w-4 text-zinc-400" />
              ERP Matching Engine
            </h4>
            <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
              Matchmaker instantly weights client preferences against listed property attributes to give a dynamic priority index, saving hundreds of viewing hours.
            </p>
          </div>
        </div>

        {/* Matchmaking Results list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
              {matchMode === 'leads' ? (
                <>Top Property Matches for <span className="text-zinc-900">{currentLead?.client_name || '...'}</span></>
              ) : (
                <>Top Lead Matches for <span className="text-zinc-900">{currentProperty?.title || '...'}</span></>
              )}
            </h3>
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
              {matchMode === 'leads' ? propertyMatches.length : leadMatches.length} Matches Found
            </span>
          </div>

          <div className="space-y-4">
            {matchMode === 'leads' ? (
              // Display properties matching selected lead
              propertyMatches.map((match) => (
                <div 
                  key={match.id}
                  className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:shadow-zinc-500/5 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-56 h-48 bg-zinc-100 relative overflow-hidden shrink-0">
                      <img 
                        src={getPropertyImage(match.property_type)} 
                        alt={match.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider">
                        {match.score}% MATCH
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between mb-2 gap-4">
                          <div className="min-w-0">
                            <h3 className="text-base font-extrabold text-zinc-950 truncate">
                              {match.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 mt-0.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {match.location}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-zinc-900">
                              {formatBudgetAbbreviated(match.price)}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{match.configuration || 'N/A'} • {match.property_type}</p>
                          </div>
                        </div>

                        {/* Attribute Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {match.reasons.map((reason, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold transition-all ${
                                reason.matched 
                                  ? 'bg-zinc-50 border-zinc-200 text-zinc-700' 
                                  : 'bg-zinc-50/50 border-zinc-100 text-zinc-400 opacity-60'
                              }`}
                            >
                              {reason.matched ? <CheckCircle2 className="h-3 w-3 text-zinc-700" /> : <AlertCircle className="h-3 w-3" />}
                              {reason.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-zinc-100">
                        <button 
                          onClick={() => alert(`Property brochure sent to ${currentLead.client_name}!`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Brochure
                        </button>
                        <button 
                          onClick={() => alert(`Scheduling site visit for ${currentLead.client_name} at ${match.title}...`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-950 text-[10px] font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          Schedule Visit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Display leads matching selected property
              leadMatches.map((match) => (
                <div 
                  key={match.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:shadow-zinc-500/5 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                          {match.client_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-zinc-950 truncate flex items-center gap-2">
                            {match.client_name}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {match.status || 'Hot'}
                            </span>
                          </h3>
                          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3 w-3" /> Preferred: {match.preferred_location || 'Flexible'}
                          </p>
                        </div>
                      </div>

                      {/* Requirement Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50/50 border border-zinc-100 rounded-xl p-3 text-[10px] font-semibold text-zinc-600">
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Max Budget</p>
                          <p className="text-zinc-900 font-bold mt-0.5">{formatBudgetAbbreviated(match.budget_max)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">BHK / Layout</p>
                          <p className="text-zinc-900 font-bold mt-0.5">{match.configuration || 'Any'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Req Size</p>
                          <p className="text-zinc-900 font-bold mt-0.5">{match.required_area ? `${match.required_area} sq ft` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Type Preference</p>
                          <p className="text-zinc-900 font-bold mt-0.5">{match.property_type || 'Residential'}</p>
                        </div>
                      </div>

                      {/* Reason tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {match.reasons.map((reason, idx) => (
                          <span 
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                              reason.matched 
                                ? 'bg-zinc-50 border-zinc-200 text-zinc-700' 
                                : 'bg-zinc-50/20 border-zinc-100 text-zinc-400 opacity-60'
                            }`}
                          >
                            {reason.matched ? <CheckCircle2 className="h-2.5 w-2.5 text-zinc-700" /> : <AlertCircle className="h-2.5 w-2.5" />}
                            {reason.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between shrink-0 gap-4">
                      {/* Match Score Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-black tracking-widest text-center self-start sm:self-auto shadow-xs">
                        {match.score}% MATCH
                      </div>

                      {/* Client Call / Contact actions */}
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`tel:${match.phone}`}
                          className="rounded-lg p-2 border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
                          title="Call Lead"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        <a 
                          href={`mailto:${match.email}`}
                          className="rounded-lg p-2 border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
                          title="Send Email"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                        <a 
                          href={`https://wa.me/?text=${sharePropertyToLeadText(match, currentProperty)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 border border-zinc-200 bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shadow-xs"
                          title="WhatsApp Details"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {((matchMode === 'leads' && propertyMatches.length === 0) || 
              (matchMode === 'properties' && leadMatches.length === 0)) && (
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
