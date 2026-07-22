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
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
  Info,
  DollarSign,
  Grid,
  ChevronDown,
  Layout,
  Maximize2,
  Filter
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { useProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
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

// Circular Score Ring component
function CircularScoreRing({ score, size = 44 }: { score: number, size?: number }) {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color based on score
  const strokeColor = score >= 80 ? 'stroke-amber-500' : score >= 60 ? 'stroke-zinc-700' : 'stroke-zinc-400';
  const bgColor = score >= 80 ? 'text-amber-50' : score >= 60 ? 'text-zinc-50' : 'text-zinc-100';

  return (
    <div className="relative select-none shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background track */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          className="text-zinc-100 stroke-current" 
          strokeWidth={strokeWidth} 
          fill="transparent" 
        />
        {/* Progress indicator */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          className={`${strokeColor} stroke-current transition-all duration-700 ease-out`} 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-900">
        {score}%
      </div>
    </div>
  );
}

export default function MatchmakingPage() {
  const profile = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [matchMode, setMatchMode] = useState<'leads' | 'properties'>('leads');
  const [mounted, setMounted] = useState(false);

  // Search, Threshold Slider, and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState<number>(60);
  const [fitFilter, setFitFilter] = useState<'all' | 'strong' | 'good'>('all');

  // Multi-select state
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  // Prevent Recharts hydration warnings in Next.js SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear selections when mode or main filters change
  useEffect(() => {
    setSelectedMatchIds(new Set());
  }, [matchMode, selectedLeadId, selectedPropertyId, multiSelectMode]);

  const handleToggleMatchSelect = (id: string) => {
    setSelectedMatchIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const leadsData = await fetchLeads(profile);
        const propsData = await fetchProperties(profile);

        const finalLeads = leadsData || [];
        const finalProps = propsData || [];

        setLeads(finalLeads);
        setProperties(finalProps);

        if (finalLeads.length > 0) setSelectedLeadId(finalLeads[0].id);
        if (finalProps.length > 0) setSelectedPropertyId(finalProps[0].id);
      } catch (err) {
        console.error("Error loading matchmaking data:", err);
        setLeads([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  // Active Lead (either direct sidebar selection or highlighted match from property mode)
  const currentLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || leads[0];
  }, [leads, selectedLeadId]);

  // Active Property (either direct sidebar selection or highlighted match from lead mode)
  const currentProperty = useMemo(() => {
    return properties.find(p => p.id === selectedPropertyId) || properties[0];
  }, [properties, selectedPropertyId]);

  // Calculate matching stats for a specific Lead <-> Property pair
  const calculateDetailedMatch = (lead: Lead, prop: Property) => {
    if (!lead || !prop) return { totalScore: 0, breakdown: [] as any[], radarData: [] as any[] };

    let totalScore = 0;
    const breakdown: {
      category: string;
      icon: React.ComponentType<{ className?: string }>;
      leadValue: string;
      propValue: string;
      status: 'exact' | 'partial' | 'mismatch';
      statusText: string;
      points: number;
    }[] = [];

    // 1. Budget Match (30 pts)
    let budgetScore = 0;
    let budgetStatus: 'exact' | 'partial' | 'mismatch' = 'mismatch';
    let budgetStatusText = 'Outside Budget';
    
    if (lead.budget_min && lead.budget_max && prop.price) {
      if (prop.price >= lead.budget_min && prop.price <= lead.budget_max) {
        budgetScore = 100;
        totalScore += 30;
        budgetStatus = 'exact';
        budgetStatusText = 'Fits Budget Range';
      } else if (prop.price < lead.budget_min) {
        // Affordable (cheaper than target range)
        budgetScore = 100;
        totalScore += 30;
        budgetStatus = 'exact';
        budgetStatusText = 'Under Budget (Affordable)';
      } else if (prop.price <= lead.budget_max * 1.15) {
        budgetScore = 50;
        totalScore += 15;
        budgetStatus = 'partial';
        budgetStatusText = 'Slightly Over Budget (<15%)';
      }
    } else if (prop.price) {
      budgetScore = 100;
      totalScore += 30;
      budgetStatus = 'exact';
      budgetStatusText = 'Flexible Budget';
    }

    breakdown.push({
      category: 'Budget',
      icon: DollarSign,
      leadValue: lead.budget_max ? `Up to ${formatBudgetAbbreviated(lead.budget_max)}` : 'Flexible',
      propValue: formatBudgetAbbreviated(prop.price),
      status: budgetStatus,
      statusText: budgetStatusText,
      points: budgetStatus === 'exact' ? 30 : budgetStatus === 'partial' ? 15 : 0
    });

    // 2. Location Match (25 pts)
    const isLocationMatched = matchLocation(lead.preferred_location, prop.location);
    let locationScore = isLocationMatched ? 100 : 0;
    if (isLocationMatched) totalScore += 25;

    breakdown.push({
      category: 'Location',
      icon: MapPin,
      leadValue: lead.preferred_location || 'Flexible',
      propValue: prop.location || 'N/A',
      status: isLocationMatched ? 'exact' : 'mismatch',
      statusText: isLocationMatched ? 'Neighborhood Match' : 'Location Mismatch',
      points: isLocationMatched ? 25 : 0
    });

    // 3. Configuration Match (20 pts)
    let configScore = 0;
    let configStatus: 'exact' | 'partial' | 'mismatch' = 'mismatch';
    let configStatusText = 'Layout Mismatch';

    if (lead.configuration && prop.configuration) {
      if (prop.configuration === lead.configuration) {
        configScore = 100;
        totalScore += 20;
        configStatus = 'exact';
        configStatusText = 'Exact BHK Match';
      } else {
        const leadBHK = parseInt(lead.configuration);
        const propBHK = parseInt(prop.configuration);
        if (!isNaN(leadBHK) && !isNaN(propBHK)) {
          if (propBHK > leadBHK) {
            configScore = 80;
            totalScore += 16;
            configStatus = 'partial';
            configStatusText = 'Extra Room (Larger)';
          } else if (propBHK === leadBHK - 1) {
            configScore = 30;
            totalScore += 6;
            configStatus = 'partial';
            configStatusText = '1 BHK Smaller';
          }
        }
      }
    }

    breakdown.push({
      category: 'BHK Layout',
      icon: Layout,
      leadValue: lead.configuration || 'Any',
      propValue: prop.configuration || 'N/A',
      status: configStatus,
      statusText: configStatusText,
      points: configStatus === 'exact' ? 20 : configStatus === 'partial' ? (configScore === 80 ? 16 : 6) : 0
    });

    // 4. Property Type Match (15 pts)
    let typeScore = 0;
    let typeStatus: 'exact' | 'partial' | 'mismatch' = 'mismatch';
    let typeStatusText = 'Type Mismatch';

    if (lead.property_type && prop.property_type) {
      if (prop.property_type.toLowerCase() === lead.property_type.toLowerCase()) {
        typeScore = 100;
        totalScore += 15;
        typeStatus = 'exact';
        typeStatusText = 'Exact Type Match';
      } else if (
        (lead.property_type.toLowerCase().includes('apartment') && prop.property_type.toLowerCase().includes('apartment')) ||
        (lead.property_type.toLowerCase().includes('apartment') && prop.property_type.toLowerCase().includes('penthouse'))
      ) {
        typeScore = 70;
        totalScore += 10;
        typeStatus = 'partial';
        typeStatusText = 'Similar Segment Type';
      }
    }

    breakdown.push({
      category: 'Property Type',
      icon: Home,
      leadValue: lead.property_type || 'Any',
      propValue: prop.property_type || 'N/A',
      status: typeStatus,
      statusText: typeStatusText,
      points: typeStatus === 'exact' ? 15 : typeStatus === 'partial' ? 10 : 0
    });

    // 5. Area Size Match (10 pts)
    let sizeScore = 0;
    let sizeStatus: 'exact' | 'partial' | 'mismatch' = 'mismatch';
    let sizeStatusText = 'Size Mismatch';

    if (lead.required_area && prop.carpet_area) {
      if (prop.carpet_area >= lead.required_area) {
        sizeScore = 100;
        totalScore += 10;
        sizeStatus = 'exact';
        sizeStatusText = 'Sufficient Space (Larger)';
      } else if (prop.carpet_area >= lead.required_area * 0.8) {
        sizeScore = 70;
        totalScore += 7;
        sizeStatus = 'partial';
        sizeStatusText = 'Slightly Smaller (Within 20%)';
      }
    } else {
      sizeScore = 100;
      totalScore += 10;
      sizeStatus = 'exact';
      sizeStatusText = 'Flexible Size';
    }

    breakdown.push({
      category: 'Carpet Area',
      icon: Maximize2,
      leadValue: lead.required_area ? `${lead.required_area} sq ft+` : 'Flexible',
      propValue: prop.carpet_area ? `${prop.carpet_area} sq ft` : 'N/A',
      status: sizeStatus,
      statusText: sizeStatusText,
      points: sizeStatus === 'exact' ? 10 : sizeStatus === 'partial' ? 7 : 0
    });

    // Radar Data mapping (normalized to 100 scale for visual chart)
    const radarData = [
      { subject: 'Budget', score: budgetScore, fullMark: 100 },
      { subject: 'Location', score: locationScore, fullMark: 100 },
      { subject: 'BHK', score: configScore, fullMark: 100 },
      { subject: 'Type', score: typeScore, fullMark: 100 },
      { subject: 'Size', score: sizeScore, fullMark: 100 }
    ];

    return {
      totalScore,
      breakdown,
      radarData
    };
  };

  // List of all property matches for the current lead
  const propertyMatches = useMemo(() => {
    if (!currentLead || properties.length === 0) return [];
    return properties.map(prop => {
      const { totalScore, breakdown, radarData } = calculateDetailedMatch(currentLead, prop);
      return {
        ...prop,
        score: totalScore,
        breakdown,
        radarData
      };
    }).sort((a, b) => b.score - a.score);
  }, [currentLead, properties]);

  // List of all lead matches for the current property
  const leadMatches = useMemo(() => {
    if (!currentProperty || leads.length === 0) return [];
    return leads.map(lead => {
      const { totalScore, breakdown, radarData } = calculateDetailedMatch(lead, currentProperty);
      return {
        ...lead,
        score: totalScore,
        breakdown,
        radarData
      };
    }).sort((a, b) => b.score - a.score);
  }, [currentProperty, leads]);

  // Filtered lists based on search query, threshold slider and match strength filter
  const filteredPropertyMatches = useMemo(() => {
    return propertyMatches.filter(match => {
      const matchesSearch = !searchQuery || 
        match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.location.toLowerCase().includes(searchQuery.toLowerCase());
      const passesThreshold = match.score >= minMatchScore;
      
      if (!passesThreshold || !matchesSearch) return false;
      if (fitFilter === 'strong') return match.score >= 80;
      if (fitFilter === 'good') return match.score >= 60 && match.score < 80;
      return true;
    });
  }, [propertyMatches, searchQuery, minMatchScore, fitFilter]);

  const filteredLeadMatches = useMemo(() => {
    return leadMatches.filter(match => {
      const matchesSearch = !searchQuery || 
        match.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (match.preferred_location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const passesThreshold = match.score >= minMatchScore;

      if (!passesThreshold || !matchesSearch) return false;
      if (fitFilter === 'strong') return match.score >= 80;
      if (fitFilter === 'good') return match.score >= 60 && match.score < 80;
      return true;
    });
  }, [leadMatches, searchQuery, minMatchScore, fitFilter]);

  // Pre-calculate count of active matches for each sidebar item dynamically
  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (matchMode === 'leads') {
      leads.forEach(l => {
        let count = 0;
        properties.forEach(p => {
          if (calculateDetailedMatch(l, p).totalScore >= minMatchScore) {
            count++;
          }
        });
        counts[l.id] = count;
      });
    } else {
      properties.forEach(p => {
        let count = 0;
        leads.forEach(l => {
          if (calculateDetailedMatch(l, p).totalScore >= minMatchScore) {
            count++;
          }
        });
        counts[p.id] = count;
      });
    }
    return counts;
  }, [leads, properties, minMatchScore, matchMode]);

  // Active highlighted match for comparison panel
  const activeMatchData = useMemo(() => {
    if (multiSelectMode) {
      if (selectedMatchIds.size !== 1) return null;
      const singleId = Array.from(selectedMatchIds)[0];
      if (matchMode === 'leads') {
        const prop = properties.find(p => p.id === singleId);
        return prop ? calculateDetailedMatch(currentLead, prop) : null;
      } else {
        const lead = leads.find(l => l.id === singleId);
        return lead ? calculateDetailedMatch(lead, currentProperty) : null;
      }
    } else {
      if (matchMode === 'leads') {
        const activeProp = properties.find(p => p.id === selectedPropertyId) || properties[0];
        return activeProp ? calculateDetailedMatch(currentLead, activeProp) : null;
      } else {
        const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];
        return activeLead ? calculateDetailedMatch(activeLead, currentProperty) : null;
      }
    }
  }, [multiSelectMode, selectedMatchIds, matchMode, currentLead, currentProperty, selectedPropertyId, selectedLeadId, properties, leads]);

  // Compute matched data for all selected items in multi-select mode
  const selectedMatchesData = useMemo(() => {
    if (!multiSelectMode || selectedMatchIds.size === 0) return [];
    if (matchMode === 'leads') {
      return Array.from(selectedMatchIds).map(id => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return null;
        const details = calculateDetailedMatch(currentLead, prop);
        return {
          item: prop,
          details
        };
      }).filter(Boolean) as { item: Property; details: ReturnType<typeof calculateDetailedMatch> }[];
    } else {
      return Array.from(selectedMatchIds).map(id => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return null;
        const details = calculateDetailedMatch(lead, currentProperty);
        return {
          item: lead,
          details
        };
      }).filter(Boolean) as { item: Lead; details: ReturnType<typeof calculateDetailedMatch> }[];
    }
  }, [multiSelectMode, selectedMatchIds, matchMode, currentLead, currentProperty, properties, leads]);

  // Set default comparison node when active list changes
  useEffect(() => {
    if (multiSelectMode) return;
    if (matchMode === 'leads') {
      if (filteredPropertyMatches.length > 0) {
        setSelectedPropertyId(filteredPropertyMatches[0].id);
      }
    } else {
      if (filteredLeadMatches.length > 0) {
        setSelectedLeadId(filteredLeadMatches[0].id);
      }
    }
  }, [matchMode, selectedLeadId, selectedPropertyId, leads, properties, multiSelectMode, filteredPropertyMatches, filteredLeadMatches]);

  const handleBookSingleTour = async () => {
    if (!currentLead || !currentProperty) return;
    
    const todayStr = '2026-06-18';
    try {
      // 1. Insert site_visit record
      await supabase.from('site_visits').insert({
        lead_id: currentLead.id,
        property_id: currentProperty.id,
        visit_date: todayStr,
        visit_time: '02:00 PM',
        status: 'Scheduled',
        outcome: `Scheduled via Matchmaker for ${currentLead.client_name} at ${currentProperty.title}`,
        assigned_to: profile?.id
      });

      // 2. Update lead stage to Site visit
      await supabase.from('leads').update({ stage_id: 'Site visit' }).eq('id', currentLead.id);

      // 3. Log audit event
      await supabase.from('audit_logs').insert({
        user_id: profile?.id || 'e2c5f803-2500-4538-a763-680d7279b4e7',
        event: 'Site visit scheduled via Matchmaker',
        changes: {
          client_name: currentLead.client_name,
          title: currentProperty.title
        }
      });

      alert(`Site visit successfully scheduled in database for ${currentLead.client_name} at ${currentProperty.title}! Check your Site Visits calendar.`);
    } catch (err) {
      console.error('Error booking tour:', err);
    }
  };

  const handleAssignPropertyToLead = async () => {
    if (!currentLead || !currentProperty) return;
    try {
      await supabase.from('leads').update({
        preferred_location: currentProperty.location,
        stage_id: 'Follow up',
        notes: `Matched & Assigned to property: ${currentProperty.title} (${currentProperty.configuration})`
      }).eq('id', currentLead.id);

      alert(`Successfully assigned ${currentProperty.title} to ${currentLead.client_name} and moved stage to Follow Up!`);
    } catch (err) {
      console.error('Error assigning property:', err);
    }
  };

  const handleBookBulkTours = async () => {
    if (selectedMatchesData.length === 0) return;

    const todayStr = '2026-06-18';
    const promises = selectedMatchesData.map(async ({ item, details }) => {
      const isLeadMode = matchMode === 'leads';
      const leadId = isLeadMode ? currentLead?.id : (item as Lead).id;
      const propId = isLeadMode ? (item as Property).id : currentProperty?.id;
      const leadName = isLeadMode ? currentLead?.client_name : (item as Lead).client_name;
      const propTitle = isLeadMode ? (item as Property).title : currentProperty?.title;

      if (!leadId) return;

      // Insert site_visit
      await supabase.from('site_visits').insert({
        lead_id: leadId,
        property_id: propId || null,
        visit_date: todayStr,
        visit_time: '02:00 PM',
        status: 'Scheduled',
        outcome: `Bulk scheduled via Matchmaker for ${leadName} at ${propTitle}`,
        assigned_to: profile?.id
      });

      // Update lead stage
      await supabase.from('leads').update({ stage_id: 'Site visit' }).eq('id', leadId);

      // Audit log
      return supabase.from('audit_logs').insert({
        user_id: profile?.id || 'e2c5f803-2500-4538-a763-680d7279b4e7',
        event: 'Bulk site visit scheduled',
        changes: {
          client_name: leadName,
          title: propTitle
        }
      });
    });

    try {
      await Promise.all(promises);
      const isLeadMode = matchMode === 'leads';
      const targetName = isLeadMode ? currentLead?.client_name : currentProperty?.title;
      alert(`Successfully created ${selectedMatchesData.length} site visit records in database for ${targetName}! Check your Site Visits calendar.`);
      setSelectedMatchIds(new Set());
    } catch (err) {
      console.error('Error bulk booking tours:', err);
    }
  };

  // Filter main sidebar lists by search query
  const sidebarLeads = useMemo(() => {
    if (matchMode !== 'leads') return [];
    return leads.filter(l => 
      l.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.preferred_location || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery, matchMode]);

  const sidebarProperties = useMemo(() => {
    if (matchMode !== 'properties') return [];
    return properties.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [properties, searchQuery, matchMode]);

  // Share via WhatsApp helper
  const sharePropertyToLeadText = (l: Lead, p: Property) => {
    return encodeURIComponent(`👋 Hello ${l.client_name},
We found a premium property matching your requirements!

🏠 *${p.title}*
📍 Location: ${p.location}
💰 Price: ${formatBudgetAbbreviated(p.price)}
🏢 Type: ${p.property_type} (${p.configuration})
📐 Area: ${p.carpet_area} sq ft

Let us know if you would like to schedule a site visit!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
        <p className="text-xs text-zinc-500 font-bold tracking-wide uppercase">Running cross-reference matchmaking engine...</p>
      </div>
    );
  }

  if (!loading && (leads.length === 0 || properties.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white border border-zinc-200 rounded-2xl max-w-xl mx-auto shadow-md">
        <Sparkles className="h-10 w-10 text-zinc-400 mb-3 animate-pulse" />
        <h3 className="text-sm font-extrabold text-zinc-900 mb-1">No Matchmaking Data Available</h3>
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Matchmaking requires at least one active Lead and one active Property listing in your database to calculate affinity scores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900 px-4 md:px-0">
      
      {/* ── TOP HEADER AND MODE TOGGLE ── */}
      <div className="flex items-center bg-white p-3 rounded-2xl border border-zinc-200">
        <div className="flex items-center bg-zinc-50 p-1 rounded-2xl border border-zinc-200 shrink-0">
          <button
            onClick={() => {
              setMatchMode('leads');
              setSearchQuery('');
              setFitFilter('all');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              matchMode === 'leads'
                ? 'bg-white text-zinc-950 font-bold border border-zinc-200 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Match by Client Lead
          </button>
          <button
            onClick={() => {
              setMatchMode('properties');
              setSearchQuery('');
              setFitFilter('all');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              matchMode === 'properties'
                ? 'bg-white text-zinc-950 font-bold border border-zinc-200 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Match by Property Listing
          </button>
        </div>
      </div>

      {/* ── MAIN THREE-COLUMN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: SIDEBAR SELECTOR (Col Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="text" 
                placeholder={matchMode === 'leads' ? 'Search clients...' : 'Search properties...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Threshold Filter Slider */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 text-left">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                <span>Match Threshold</span>
                <span className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">{minMatchScore}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-200 rounded-2xl appearance-none cursor-pointer accent-zinc-900"
              />
            </div>

            {/* Scrollable List */}
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {matchMode === 'leads' ? (
                sidebarLeads.length > 0 ? (
                  sidebarLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        // Reset property match selector to first item of new list
                        const matches = properties.map(p => ({ id: p.id, score: calculateDetailedMatch(lead, p).totalScore })).sort((a,b) => b.score - a.score);
                        if (matches.length > 0) setSelectedPropertyId(matches[0].id);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                        selectedLeadId === lead.id 
                          ? 'bg-[#dbeaff] text-zinc-950 border-zinc-400 font-bold' 
                          : 'bg-white border-zinc-200 hover:border-zinc-355'
                      }`}
                    >
                      <p className="text-xs font-bold truncate pr-6">{lead.client_name}</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] font-medium opacity-80">
                        <span>{lead.preferred_location || 'Flexible'}</span>
                        <span>{formatBudgetAbbreviated(lead.budget_max)}</span>
                      </div>
                      
                      {/* Dynamic Match Count Badge */}
                      {matchCounts[lead.id] > 0 && (
                        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          selectedLeadId === lead.id ? 'bg-white text-zinc-900 border border-zinc-200' : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                        }`}>
                          {matchCounts[lead.id]}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-zinc-400 text-center py-6">No matching leads found.</p>
                )
              ) : (
                sidebarProperties.length > 0 ? (
                  sidebarProperties.map((prop) => (
                    <div 
                      key={prop.id}
                      onClick={() => {
                        setSelectedPropertyId(prop.id);
                        // Reset lead match selector to first item of new list
                        const matches = leads.map(l => ({ id: l.id, score: calculateDetailedMatch(l, prop).totalScore })).sort((a,b) => b.score - a.score);
                        if (matches.length > 0) setSelectedLeadId(matches[0].id);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                        selectedPropertyId === prop.id 
                          ? 'bg-[#dbeaff] text-zinc-950 border-zinc-400 font-bold' 
                          : 'bg-white border-zinc-200 hover:border-zinc-355'
                      }`}
                    >
                      <p className="text-xs font-bold truncate pr-6">{prop.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] font-medium opacity-80">
                        <span>{prop.location}</span>
                        <span>{formatBudgetAbbreviated(prop.price)}</span>
                      </div>

                      {/* Dynamic Match Count Badge */}
                      {matchCounts[prop.id] > 0 && (
                        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          selectedPropertyId === prop.id ? 'bg-white text-zinc-900 border border-zinc-200' : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                        }`}>
                          {matchCounts[prop.id]}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-zinc-400 text-center py-6">No matching properties found.</p>
                )
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2 shadow-md text-left animate-pulse" style={{ animationDuration: '3s' }}>
            <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Dynamic Match Engine
            </h4>
            <p className="text-[9px] text-zinc-400 leading-relaxed font-semibold">
              The engine weighs budget (30%), location (25%), BHK config (20%), property type (15%), and size requirement (10%) to output a real-time matching percentage.
            </p>
          </div>
        </div>

        {/* COLUMN 2: MATCH RESULTS LIST (Col Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Header & Sub-filtering tab */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-left">
              <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                {matchMode === 'leads' ? (
                  <>Matching inventory for <span className="text-zinc-900 font-black">{currentLead?.client_name || '...'}</span></>
                ) : (
                  <>Potential buyers for <span className="text-zinc-900 font-black">{currentProperty?.title || '...'}</span></>
                )}
              </h3>
              <span className="text-[9px] font-bold text-zinc-600 bg-zinc-50 px-2.5 py-0.5 rounded-full border border-zinc-200 shrink-0">
                {matchMode === 'leads' ? filteredPropertyMatches.length : filteredLeadMatches.length} Matches Found
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Quick Match Strength Filter Tabs */}
              <div className="flex items-center bg-zinc-50 p-1 rounded-2xl border border-zinc-200 text-[10px] font-bold max-w-fit">
                <button 
                  onClick={() => setFitFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    fitFilter === 'all' ? 'bg-white text-zinc-950 border border-zinc-200 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFitFilter('strong')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    fitFilter === 'strong' ? 'bg-white text-zinc-950 border border-zinc-200 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <span>Strong</span>
                  <span className="text-[8px] bg-zinc-900 text-white px-1.5 py-0.2 rounded-full font-black">
                    {matchMode === 'leads' 
                      ? propertyMatches.filter(m => m.score >= 80).length 
                      : leadMatches.filter(m => m.score >= 80).length}
                  </span>
                </button>
                <button 
                  onClick={() => setFitFilter('good')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    fitFilter === 'good' ? 'bg-white text-zinc-950 border border-zinc-200 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <span>Good</span>
                  <span className="text-[8px] bg-zinc-50 text-zinc-650 border border-zinc-200 px-1.5 py-0.2 rounded-full font-black">
                    {matchMode === 'leads' 
                      ? propertyMatches.filter(m => m.score >= 60 && m.score < 80).length 
                      : leadMatches.filter(m => m.score >= 60 && m.score < 80).length}
                  </span>
                </button>
              </div>

              {/* Multi-select Toggle */}
              <button
                onClick={() => setMultiSelectMode(!multiSelectMode)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold transition-all rounded-2xl border cursor-pointer ${
                  multiSelectMode
                    ? 'bg-zinc-900 text-white border-[zinc-900] shadow-2xs'
                    : 'bg-white text-zinc-650 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                {multiSelectMode ? 'Multi-select: ON' : 'Multi-select'}
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {matchMode === 'leads' ? (
              filteredPropertyMatches.length > 0 ? (
                filteredPropertyMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => {
                      if (multiSelectMode) {
                        handleToggleMatchSelect(match.id);
                      } else {
                        setSelectedPropertyId(match.id);
                      }
                    }}
                    className={`p-4 bg-white border rounded-2xl transition-all duration-300 text-left cursor-pointer group flex items-center justify-between gap-4 ${
                      multiSelectMode
                        ? selectedMatchIds.has(match.id)
                          ? 'border-zinc-400 bg-[#dbeaff]/20'
                          : 'border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50'
                        : selectedPropertyId === match.id 
                          ? 'border-zinc-400 bg-[#dbeaff]/10' 
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex gap-4 min-w-0 flex-1">
                      {/* Checkbox when in multi-select mode */}
                      {multiSelectMode && (
                        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMatchIds.has(match.id)}
                            onChange={() => handleToggleMatchSelect(match.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl overflow-hidden shrink-0 relative">
                        <img 
                          src={getPropertyImage(match.property_type)} 
                          alt={match.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Meta info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-sm font-extrabold text-zinc-900 truncate">{match.title}</h4>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {match.location}
                          </p>
                        </div>

                        {/* Attribute Badges */}
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-zinc-500">
                          <span className="text-zinc-950 font-black">{formatBudgetAbbreviated(match.price)}</span>
                          <span className="text-zinc-350">•</span>
                          <span>{match.configuration}</span>
                          <span className="text-zinc-300">•</span>
                          <span>{match.property_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Circular Score Ring */}
                    <CircularScoreRing score={match.score} />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                  <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-400">No properties fit the threshold criteria.</p>
                </div>
              )
            ) : (
              filteredLeadMatches.length > 0 ? (
                filteredLeadMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => {
                      if (multiSelectMode) {
                        handleToggleMatchSelect(match.id);
                      } else {
                        setSelectedLeadId(match.id);
                      }
                    }}
                    className={`p-4 bg-white border rounded-2xl transition-all duration-300 text-left cursor-pointer group flex items-center justify-between gap-4 ${
                      multiSelectMode
                        ? selectedMatchIds.has(match.id)
                          ? 'border-zinc-400 bg-[#dbeaff]/20'
                          : 'border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50'
                        : selectedLeadId === match.id 
                          ? 'border-zinc-400 bg-[#dbeaff]/10' 
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex gap-4 min-w-0 flex-1">
                      {/* Checkbox when in multi-select mode */}
                      {multiSelectMode && (
                        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMatchIds.has(match.id)}
                            onChange={() => handleToggleMatchSelect(match.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Circle Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-150 flex items-center justify-center shrink-0">
                        <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
                      </div>

                      {/* Meta info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-sm font-extrabold text-zinc-900 truncate">{match.client_name}</h4>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> Preferred: {match.preferred_location || 'Flexible'}
                          </p>
                        </div>

                        {/* Attribute Badges */}
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-zinc-500">
                          <span className="text-zinc-950 font-black">{formatBudgetAbbreviated(match.budget_max)} Limit</span>
                          <span className="text-zinc-300">•</span>
                          <span>{match.configuration || 'Any'}</span>
                          <span className="text-zinc-300">•</span>
                          <span className="px-1.5 py-0.2 bg-zinc-100 border border-zinc-200 text-[8px] rounded uppercase font-black text-zinc-500">
                            {match.status || 'Hot'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Circular Score Ring */}
                    <CircularScoreRing score={match.score} />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                  <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-400">No leads fit the threshold criteria.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* COLUMN 3: SELECTED MATCH COMPARISON & RADAR (Col Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest text-left px-1">
            Visual Match Analysis
          </h3>

          {multiSelectMode && selectedMatchIds.size > 1 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 space-y-6 text-left">
              
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                <div>
                  <p className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">Bulk Match Comparison</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{selectedMatchIds.size} Items Selected</p>
                </div>
                <button 
                  onClick={() => setSelectedMatchIds(new Set())}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2 py-1 rounded-2xl transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Stacked comparison cards */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedMatchesData.map(({ item, details }, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-zinc-900 text-xs truncate">
                        {matchMode === 'leads' ? (item as Property).title : (item as Lead).client_name}
                      </span>
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-2xl shrink-0">
                        {details.totalScore}% Fit
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px] text-zinc-500 font-semibold pt-2 border-t border-zinc-200/50">
                      {matchMode === 'leads' ? (
                        <>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Price</span>
                            <span className="font-bold text-zinc-600">{formatBudgetAbbreviated((item as Property).price)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Location</span>
                            <span className="font-bold text-zinc-600 truncate block">{(item as Property).location}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">BHK / Type</span>
                            <span className="font-bold text-zinc-600">{(item as Property).configuration} {(item as Property).property_type}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Area</span>
                            <span className="font-bold text-zinc-600">{(item as Property).carpet_area} sq ft</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Budget Max</span>
                            <span className="font-bold text-zinc-600">{formatBudgetAbbreviated((item as Lead).budget_max)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Preferred Location</span>
                            <span className="font-bold text-zinc-600 truncate block">{(item as Lead).preferred_location || 'Flexible'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">BHK / Type</span>
                            <span className="font-bold text-zinc-600">{(item as Lead).configuration || 'Any'} / {(item as Lead).property_type || 'Any'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Status</span>
                            <span className="font-bold text-zinc-600">{(item as Lead).status || 'Warm'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="space-y-2 pt-4 border-t border-zinc-150">
                {matchMode === 'leads' ? (
                  <>
                    <a 
                      href={`https://wa.me/?text=${(() => {
                        let text = `👋 Hello ${currentLead?.client_name},\nWe found some premium properties matching your requirements!\n\n`;
                        selectedMatchesData.forEach(({ item, details }, idx) => {
                          const p = item as Property;
                          text += `🏠 *${idx + 1}. ${p.title}* (${details.totalScore}% Match)\n`;
                          text += `📍 Location: ${p.location}\n`;
                          text += `💰 Price: ${formatBudgetAbbreviated(p.price)}\n`;
                          text += `🏢 Type: ${p.property_type} (${p.configuration})\n`;
                          text += `📐 Area: ${p.carpet_area} sq ft\n\n`;
                        });
                        text += `Let us know if you would like to schedule site visits for any of these!`;
                        return encodeURIComponent(text);
                      })()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp Selected Properties
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => alert(`Brochures for ${selectedMatchIds.size} selected properties sent to ${currentLead?.client_name}!`)}
                        className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-900 transition-all border border-[zinc-900] cursor-pointer shadow-2xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send Details
                      </button>
                      <button 
                        onClick={handleBookBulkTours}
                        className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-white border border-zinc-200 text-zinc-600 text-[11px] font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        Book Tours
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a 
                      href={`https://wa.me/?text=${(() => {
                        let text = `👋 Hello team,\nHere are potential buyers matching *${currentProperty?.title}*:\n\n`;
                        selectedMatchesData.forEach(({ item, details }, idx) => {
                          const l = item as Lead;
                          text += `👤 *${idx + 1}. ${l.client_name}* (${details.totalScore}% Match)\n`;
                          text += `📞 Phone: ${l.phone}\n`;
                          text += `✉️ Email: ${l.email}\n`;
                          text += `💰 Budget Limit: ${formatBudgetAbbreviated(l.budget_max)}\n\n`;
                        });
                        return encodeURIComponent(text);
                      })()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp Selected Clients
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => alert(`Sent details of ${currentProperty?.title} to ${selectedMatchIds.size} client leads!`)}
                        className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-900 transition-all border border-[zinc-900] cursor-pointer shadow-2xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send Details
                      </button>
                      <button 
                        onClick={handleBookBulkTours}
                        className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-white border border-zinc-200 text-zinc-600 text-[11px] font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        Book Tours
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : activeMatchData ? (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-md p-5 space-y-6 text-left">
              
              {/* Radar Chart Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">Spec Fingerprint</p>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {activeMatchData.totalScore}% Fit
                  </span>
                </div>
                
                {/* Radar render */}
                <div className="h-48 w-full flex items-center justify-center">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activeMatchData.radarData}>
                        <PolarGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Match Score"
                          dataKey="score"
                          stroke="#18181b"
                          fill="#d97706"
                          fillOpacity={0.12}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full bg-zinc-50 rounded-2xl flex items-center justify-center text-[10px] text-zinc-400">
                      Loading chart...
                    </div>
                  )}
                </div>
              </div>

              {/* Side by Side Comparative Specification Grid */}
              <div className="space-y-3 pt-4 border-t border-zinc-150">
                <p className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">Spec-by-Spec Comparison</p>
                
                <div className="space-y-2.5">
                  {activeMatchData.breakdown.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-800 text-[11px] flex items-center gap-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-zinc-500" />
                            {item.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase border tracking-wider flex items-center gap-1 ${
                            item.status === 'exact' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.status === 'partial' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              item.status === 'exact' ? 'bg-emerald-500' : item.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {item.statusText}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-medium pt-1 border-t border-zinc-100/50">
                          <div>
                            <p className="text-zinc-400 text-[8px] uppercase tracking-wider">Required</p>
                            <p className="text-zinc-700 font-bold truncate mt-0.5">{item.leadValue}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 text-[8px] uppercase tracking-wider">Available Spec</p>
                            <p className="text-zinc-700 font-bold truncate mt-0.5">{item.propValue}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-zinc-150">
                <a 
                  href={`https://wa.me/?text=${sharePropertyToLeadText(currentLead, currentProperty)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Match Details
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleAssignPropertyToLead}
                    className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Assign Property
                  </button>
                  <button 
                    onClick={handleBookSingleTour}
                    className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 text-[11px] font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                    Book Tour
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-md p-12 text-center text-zinc-400">
              <Info className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-bold">Select a match from the results panel to view detailed visual analysis.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
