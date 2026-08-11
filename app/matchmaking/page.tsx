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
  Filter,
  Copy
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

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  // Dedicated, single-purpose state for which card's analysis is shown in the drawer.
  // Deliberately separate from selectedLeadId/selectedPropertyId, which are also used
  // for the left sidebar focus, booking, and sharing -- so nothing else can ever affect it.
  const [analysisTargetId, setAnalysisTargetId] = useState<string>('');

  const handleOpenBookingModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingNotes(`Scheduled via Matchmaker for ${currentLead?.client_name || 'Client'} at ${currentProperty?.title || 'Property'}`);
    setIsBookingModalOpen(true);
  };

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

    // 1. Budget Match (30 pts) -- gated on budget_max, the only budget field the lead form
    // actually collects (budget_min is never set through the UI). Previously this required
    // BOTH budget_min AND budget_max to run a real comparison, so it always fell through to
    // the "Flexible Budget" branch and handed every property full budget points regardless
    // of price -- the root cause of "100% matches" showing properties way outside budget.
    let budgetScore = 0;
    let budgetStatus: 'exact' | 'partial' | 'mismatch' = 'mismatch';
    let budgetStatusText = 'Outside Budget';

    if (lead.budget_max && prop.price) {
      if (prop.price <= lead.budget_max) {
        budgetScore = 100;
        totalScore += 30;
        budgetStatus = 'exact';
        budgetStatusText = lead.budget_min && prop.price < lead.budget_min ? 'Under Budget (Affordable)' : 'Fits Budget Range';
      } else if (prop.price <= lead.budget_max * 1.15) {
        budgetScore = 50;
        totalScore += 15;
        budgetStatus = 'partial';
        budgetStatusText = 'Slightly Over Budget (<15%)';
      }
    } else if (prop.price && !lead.budget_max) {
      // Lead genuinely has no budget cap on file -- treat as flexible rather than mismatch.
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

  // The specific property/lead the analysis drawer is showing. Resolved directly from
  // analysisTargetId (set only by a card click / "View Analysis" click) rather than from
  // selectedPropertyId/selectedLeadId, which are shared with the left sidebar, booking,
  // and sharing logic elsewhere on this page.
  const analysisTargetItem = useMemo(() => {
    if (matchMode === 'leads') {
      return properties.find(p => p.id === analysisTargetId) || null;
    }
    return leads.find(l => l.id === analysisTargetId) || null;
  }, [matchMode, analysisTargetId, properties, leads]);

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
        return analysisTargetItem ? calculateDetailedMatch(currentLead, analysisTargetItem as Property) : null;
      } else {
        return analysisTargetItem ? calculateDetailedMatch(analysisTargetItem as Lead, currentProperty) : null;
      }
    }
  }, [multiSelectMode, selectedMatchIds, matchMode, currentLead, currentProperty, analysisTargetItem, properties, leads]);

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

  // Set default comparison node when the active match list changes (e.g. switching
  // which lead/property is focused, or the match threshold). Deliberately does NOT
  // depend on selectedLeadId/selectedPropertyId themselves — those are also used to
  // track which match card the user has clicked in the grid below, and including them
  // here would reset that selection back to the first card on every click.
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
  }, [matchMode, leads, properties, multiSelectMode, filteredPropertyMatches, filteredLeadMatches]);

  const handleBookSingleTour = () => {
    handleOpenBookingModal();
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead || !currentProperty) return;
    
    try {
      // 1. Insert site_visit record
      await supabase.from('site_visits').insert({
        lead_id: currentLead.id,
        property_id: currentProperty.id,
        visit_date: bookingDate,
        visit_time: bookingTime,
        status: 'Scheduled',
        outcome: bookingNotes,
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
          title: currentProperty.title,
          visit_date: bookingDate,
          visit_time: bookingTime
        }
      });

      setIsBookingModalOpen(false);
      alert(`Site visit successfully scheduled for ${currentLead.client_name} at ${currentProperty.title} on ${bookingDate} at ${bookingTime}!`);
    } catch (err) {
      console.error('Error booking tour:', err);
      alert('Failed to schedule site visit.');
    }
  };

  const handleAssignPropertyToLead = async () => {
    // Use the drawer's own target (analysisTargetItem) rather than currentLead/currentProperty,
    // which track the left sidebar focus and can differ from whichever card the drawer is showing.
    const targetLead = matchMode === 'leads' ? currentLead : (analysisTargetItem as Lead | null);
    const targetProperty = matchMode === 'leads' ? (analysisTargetItem as Property | null) : currentProperty;
    if (!targetLead || !targetProperty) return;
    try {
      await supabase.from('leads').update({
        preferred_location: targetProperty.location,
        stage_id: 'Follow up',
        notes: `Matched & Assigned to property: ${targetProperty.title} (${targetProperty.configuration})`
      }).eq('id', targetLead.id);

      alert(`Successfully assigned ${targetProperty.title} to ${targetLead.client_name} and moved stage to Follow Up!`);
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

  // Share via WhatsApp helper -- plain text, no emojis or match-percentage, fields always in
  // Society Name / Location / Type / Area / Price order to match what staff send everywhere.
  const sharePropertyToLeadText = (l: Lead, p: Property) => {
    const cleanTitle = (p.title || '').replace(/\s*\(\s*null\s*\)/gi, '').trim();
    return encodeURIComponent(`Hello ${l.client_name},
We found a premium property matching your requirements!

${cleanTitle}
Location: ${p.location}
Type: ${p.configuration || p.property_type}
Carpet Area: ${p.carpet_area ? `${p.carpet_area} sq ft` : 'N/A'}
Built-up Area: ${p.built_up_area ? `${p.built_up_area} sq ft` : 'N/A'}
Price: ${formatBudgetAbbreviated(p.price)}
For ${p.listing_type || 'Sale'}

Let us know if you would like to schedule a site visit!`);
  };

  // Shared plain-text builder for the multi-select toolbar's WhatsApp link and Copy button,
  // so both always produce identical content instead of two copies of the same formatting.
  const buildBulkMatchesText = (): string => {
    if (matchMode === 'leads') {
      let text = `Hello ${currentLead?.client_name},\nWe found some premium properties matching your requirements!\n\n`;
      selectedMatchesData.forEach(({ item }, idx) => {
        const p = item as Property;
        text += `${idx + 1}. ${p.title}\n`;
        text += `Location: ${p.location}\n`;
        text += `Type: ${p.property_type} (${p.configuration})\n`;
        text += `Carpet Area: ${p.carpet_area ? `${p.carpet_area} sq ft` : 'N/A'}\n`;
        text += `Built-up Area: ${p.built_up_area ? `${p.built_up_area} sq ft` : 'N/A'}\n`;
        text += `Price: ${formatBudgetAbbreviated(p.price)}\n\n`;
      });
      text += `Let us know if you would like to schedule site visits for any of these!`;
      return text;
    }
    let text = `Hello team,\nHere are potential buyers matching ${currentProperty?.title}:\n\n`;
    selectedMatchesData.forEach(({ item }, idx) => {
      const l = item as Lead;
      text += `${idx + 1}. ${l.client_name}\n`;
      text += `Phone: ${l.phone}\n`;
      text += `Budget Limit: ${formatBudgetAbbreviated(l.budget_max)}\n\n`;
    });
    return text;
  };

  const handleCopyBulkMatches = async () => {
    try {
      await navigator.clipboard.writeText(buildBulkMatchesText());
      alert(`Copied details for ${selectedMatchesData.length} ${matchMode === 'leads' ? 'propert' + (selectedMatchesData.length === 1 ? 'y' : 'ies') : 'lead' + (selectedMatchesData.length === 1 ? '' : 's')} to clipboard!`);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy to clipboard.');
    }
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
    <div className="w-full pb-20 text-zinc-900 text-left">
      
      {/* ── MAIN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: SIDEBAR TARGET SELECTOR & SETTINGS (Col Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Match Mode Toggle */}
          <div className="bg-white p-1 rounded-xl border border-[#e8e7e4] flex shadow-2xs">
            <button
              onClick={() => {
                setMatchMode('leads');
                setSearchQuery('');
                setFitFilter('all');
              }}
              className={`flex-1 text-center py-2 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                matchMode === 'leads'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              By Client Lead
            </button>
            <button
              onClick={() => {
                setMatchMode('properties');
                setSearchQuery('');
                setFitFilter('all');
              }}
              className={`flex-1 text-center py-2 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                matchMode === 'properties'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              By Listing
            </button>
          </div>

          {/* Search, Threshold and Selector Panel */}
          <div className="bg-white p-4 rounded-2xl border border-[#e8e7e4] space-y-4 shadow-sm">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300" />
              <input 
                type="text" 
                placeholder={matchMode === 'leads' ? 'Search clients...' : 'Search properties...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-white border border-[#e8e7e4] rounded-lg pl-9 pr-8 text-[12px] font-medium text-zinc-800 focus:outline-none focus:border-[#d4ad4d] focus:ring-2 focus:ring-[#d4ad4d]/15 transition-all placeholder:text-zinc-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-zinc-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Threshold Filter Slider */}
            <div className="space-y-2 pt-3 border-t border-[#f5f5f3] text-left">
              <div className="flex justify-between items-center text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-[0.08em]">
                <span>Match Threshold</span>
                <span className="bg-zinc-50 border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded font-black text-[9px]">{minMatchScore}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                className="w-full h-1 bg-[#e8e7e4] rounded-full appearance-none cursor-pointer accent-[#d4ad4d]"
              />
            </div>

            {/* Target Selectors scroll List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {matchMode === 'leads' ? (
                sidebarLeads.length > 0 ? (
                  sidebarLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        const matches = properties.map(p => ({ id: p.id, score: calculateDetailedMatch(lead, p).totalScore })).sort((a,b) => b.score - a.score);
                        if (matches.length > 0) setSelectedPropertyId(matches[0].id);
                      }}
                      className={`p-3 rounded-xl border text-left relative cursor-pointer transition-all ${
                        selectedLeadId === lead.id 
                          ? 'border-[#d4ad4d] bg-[#fffdf5]' 
                          : 'border-[#e8e7e4] hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <p className={`text-[11.5px] font-extrabold truncate pr-8 ${selectedLeadId === lead.id ? 'text-[#b8922e]' : 'text-zinc-800'}`}>
                        {lead.client_name}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[9.5px] font-semibold text-zinc-400">
                        <span>{lead.preferred_location || 'Flexible'}</span>
                        <span>{formatBudgetAbbreviated(lead.budget_max)}</span>
                      </div>
                      
                      {matchCounts[lead.id] > 0 && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-500 px-1.5 py-0.2 rounded-full">
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
                        const matches = leads.map(l => ({ id: l.id, score: calculateDetailedMatch(l, prop).totalScore })).sort((a,b) => b.score - a.score);
                        if (matches.length > 0) setSelectedLeadId(matches[0].id);
                      }}
                      className={`p-3 rounded-xl border text-left relative cursor-pointer transition-all ${
                        selectedPropertyId === prop.id 
                          ? 'border-[#d4ad4d] bg-[#fffdf5]' 
                          : 'border-[#e8e7e4] hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <p className={`text-[11.5px] font-extrabold truncate pr-8 ${selectedPropertyId === prop.id ? 'text-[#b8922e]' : 'text-zinc-800'}`}>
                        {prop.title}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[9.5px] font-semibold text-zinc-400">
                        <span>{prop.location}</span>
                        <span>{formatBudgetAbbreviated(prop.price)}</span>
                      </div>

                      {matchCounts[prop.id] > 0 && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-500 px-1.5 py-0.2 rounded-full">
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

        </div>

        {/* COLUMN 2: MATCH RESULTS MATRIX CANVAS (Col Span 9) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Controls & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-[#e8e7e4] space-y-3.5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block">Selected Target profile</span>
                {matchMode === 'leads' ? (
                  <h3 className="text-[13px] font-extrabold text-zinc-900 mt-0.5">
                    Matches for <span className="text-[#b8922e] font-black">{currentLead?.client_name || 'No Lead selected'}</span>
                  </h3>
                ) : (
                  <h3 className="text-[13px] font-extrabold text-zinc-900 mt-0.5">
                    Matches for <span className="text-[#b8922e] font-black">{currentProperty?.title || 'No Property selected'}</span>
                  </h3>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap pt-3 border-t border-[#f5f5f3]">
              
              {/* Strength Filter Tabs */}
              <div className="flex items-center bg-zinc-50 p-0.5 rounded-lg border border-zinc-200 text-[10px] font-bold">
                <button 
                  onClick={() => setFitFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    fitFilter === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  All Matches ({matchMode === 'leads' ? propertyMatches.length : leadMatches.length})
                </button>
                <button 
                  onClick={() => setFitFilter('strong')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    fitFilter === 'strong' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <span>Strong (80%+)</span>
                  <span className="text-[8px] bg-zinc-900 text-white px-1.5 py-0.2 rounded-full font-black">
                    {matchMode === 'leads' 
                      ? propertyMatches.filter(m => m.score >= 80).length 
                      : leadMatches.filter(m => m.score >= 80).length}
                  </span>
                </button>
                <button 
                  onClick={() => setFitFilter('good')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    fitFilter === 'good' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <span>Good (60%-80%)</span>
                  <span className="text-[8px] bg-zinc-150 text-zinc-600 px-1.5 py-0.2 rounded-full font-black border border-zinc-200">
                    {matchMode === 'leads' 
                      ? propertyMatches.filter(m => m.score >= 60 && m.score < 80).length 
                      : leadMatches.filter(m => m.score >= 60 && m.score < 80).length}
                  </span>
                </button>
              </div>

              {/* Multi-select controls */}
              <div className="flex items-center gap-2">
                {multiSelectMode && selectedMatchIds.size > 0 && (
                  <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    <button
                      onClick={handleBookBulkTours}
                      className="px-2.5 py-1 text-[9.5px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-all cursor-pointer"
                    >
                      Book Tours ({selectedMatchIds.size})
                    </button>
                    <button
                      onClick={handleCopyBulkMatches}
                      className="px-2.5 py-1 text-[9.5px] font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(buildBulkMatchesText())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3" /> WhatsApp
                    </a>
                  </div>
                )}
                
                <button
                  onClick={() => setMultiSelectMode(!multiSelectMode)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    multiSelectMode
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" />
                  {multiSelectMode ? 'Multi-select: ON' : 'Multi-select'}
                </button>
              </div>
            </div>
          </div>

          {/* Match Grid Canvas - 2 Columns of Premium Cards */}
          {matchMode === 'leads' ? (
            filteredPropertyMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPropertyMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => {
                      if (multiSelectMode) {
                        handleToggleMatchSelect(match.id);
                      } else {
                        setSelectedPropertyId(match.id);
                        setAnalysisTargetId(match.id);
                      }
                    }}
                    className={`bg-white border rounded-2xl p-4 text-left cursor-pointer transition-all duration-200 hover:border-zinc-350 hover:shadow-sm relative ${
                      multiSelectMode && selectedMatchIds.has(match.id)
                        ? 'border-zinc-900 ring-2 ring-zinc-900/5'
                        : selectedPropertyId === match.id
                        ? 'border-[#d4ad4d] ring-2 ring-[#d4ad4d]/5'
                        : 'border-[#e8e7e4]'
                    }`}
                  >
                    
                    {/* Thumbnail & Title section */}
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-150">
                        <img 
                          src={getPropertyImage(match.property_type)} 
                          alt={match.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-[12px] font-extrabold text-zinc-800 truncate pr-1 group-hover:text-zinc-900 transition-colors">
                            {match.title}
                          </h4>
                          <span className="text-[12px] font-extrabold text-[#d4ad4d] shrink-0 leading-tight">
                            {match.score}%
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-300" /> {match.location}
                        </p>
                      </div>
                    </div>

                    {/* Specs layout row */}
                    <div className="flex items-center gap-2 mt-3.5 text-[9.5px] font-bold text-zinc-500 border-t border-[#f5f5f3] pt-3">
                      <span className="text-zinc-950 font-extrabold">{formatBudgetAbbreviated(match.price)}</span>
                      <span className="text-zinc-300">•</span>
                      <span>{match.configuration}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="truncate">{match.property_type}</span>
                    </div>

                    {/* Multi-select check slots or card action buttons */}
                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#f5f5f3] pt-3.5">
                      {multiSelectMode ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMatchIds.has(match.id)}
                            onChange={() => handleToggleMatchSelect(match.id)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-[#d4ad4d]"
                          />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Select for Bulk</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-[#f0f0ee] p-0.5 rounded-lg border border-zinc-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPropertyId(match.id);
                              handleBookSingleTour();
                            }}
                            className="px-2 py-1 text-[9px] font-bold text-zinc-600 hover:text-zinc-900 bg-white hover:shadow-xs rounded transition-all cursor-pointer"
                          >
                            Book Tour
                          </button>
                          <a
                            href={`https://wa.me/?text=${sharePropertyToLeadText(currentLead, match)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 text-[9px] font-bold bg-[#eefdf4] text-emerald-700 hover:bg-[#e1fbe9] rounded transition-all flex items-center gap-0.5 cursor-pointer"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPropertyId(match.id);
                          setAnalysisTargetId(match.id);
                          setIsAnalysisOpen(true);
                        }}
                        className="text-[9.5px] font-bold text-[#d4ad4d] hover:text-[#b8922e] transition-colors"
                      >
                        View Analysis →
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-dashed border-[#e8e7e4] rounded-2xl">
                <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-400">No properties fit the match criteria.</p>
              </div>
            )
          ) : (
            filteredLeadMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLeadMatches.map((match) => (
                  <div 
                    key={match.id}
                    onClick={() => {
                      if (multiSelectMode) {
                        handleToggleMatchSelect(match.id);
                      } else {
                        setSelectedLeadId(match.id);
                        setAnalysisTargetId(match.id);
                      }
                    }}
                    className={`bg-white border rounded-2xl p-4 text-left cursor-pointer transition-all duration-200 hover:border-zinc-350 hover:shadow-sm relative ${
                      multiSelectMode && selectedMatchIds.has(match.id)
                        ? 'border-zinc-900 ring-2 ring-zinc-900/5'
                        : selectedLeadId === match.id
                        ? 'border-[#d4ad4d] ring-2 ring-[#d4ad4d]/5'
                        : 'border-[#e8e7e4]'
                    }`}
                  >
                    
                    {/* Avatar & Title section */}
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-zinc-50 rounded-full overflow-hidden shrink-0 border border-zinc-150 flex items-center justify-center font-bold text-zinc-600 text-xs">
                        {match.client_name.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-[12px] font-extrabold text-zinc-800 truncate pr-1 group-hover:text-zinc-900 transition-colors">
                            {match.client_name}
                          </h4>
                          <span className="text-[12px] font-extrabold text-[#d4ad4d] shrink-0 leading-tight">
                            {match.score}%
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-300" /> Preferred: {match.preferred_location || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    {/* Specs layout row */}
                    <div className="flex items-center gap-2 mt-3.5 text-[9.5px] font-bold text-zinc-500 border-t border-[#f5f5f3] pt-3">
                      <span className="text-zinc-950 font-extrabold">{formatBudgetAbbreviated(match.budget_max)} Limit</span>
                      <span className="text-zinc-300">•</span>
                      <span>{match.configuration || 'Any'}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="px-1.5 py-0.2 bg-zinc-100 border border-zinc-200 text-[8px] rounded uppercase font-black text-zinc-500">
                        {match.status || 'Warm'}
                      </span>
                    </div>

                    {/* Multi-select check slots or card action buttons */}
                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#f5f5f3] pt-3.5">
                      {multiSelectMode ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMatchIds.has(match.id)}
                            onChange={() => handleToggleMatchSelect(match.id)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-[#d4ad4d]"
                          />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Select for Bulk</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-[#f0f0ee] p-0.5 rounded-lg border border-zinc-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(match.id);
                              handleBookSingleTour();
                            }}
                            className="px-2 py-1 text-[9px] font-bold text-zinc-600 hover:text-zinc-900 bg-white hover:shadow-xs rounded transition-all cursor-pointer"
                          >
                            Book Tour
                          </button>
                          <a
                            href={`https://wa.me/?text=${sharePropertyToLeadText(match, currentProperty)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 text-[9px] font-bold bg-[#eefdf4] text-emerald-700 hover:bg-[#e1fbe9] rounded transition-all flex items-center gap-0.5 cursor-pointer"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(match.id);
                          setAnalysisTargetId(match.id);
                          setIsAnalysisOpen(true);
                        }}
                        className="text-[9.5px] font-bold text-[#d4ad4d] hover:text-[#b8922e] transition-colors"
                      >
                        View Analysis →
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-dashed border-[#e8e7e4] rounded-2xl">
                <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-400">No client leads fit the match criteria.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* ── VISUAL ANALYSIS SIDE DRAWER DIALOG (Direction B signature overlay) ── */}
      {/* pointer-events-none on the overlay + backdrop lets clicks pass through to the
          match cards underneath, so switching to a different card while the drawer is
          open works in one click instead of the click being swallowed by the backdrop
          (which would just close the drawer without selecting anything). */}
      {isAnalysisOpen && activeMatchData && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm pointer-events-none" />
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto">
            
            {/* Gold band at top */}
            <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg, #d4ad4d, #e8c96e, #d4ad4d)' }} />

            {/* Header info */}
            <div className="px-5 py-4 border-b border-[#ebebeb] flex items-center justify-between shrink-0">
              <div className="text-left">
                <span className="text-[8.5px] font-extrabold text-zinc-400 uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
                  Compatibility fingerprint
                </span>
                <h3 className="text-sm font-extrabold text-zinc-800 mt-1.5">Match compatibility breakdown</h3>
              </div>
              <button 
                onClick={() => setIsAnalysisOpen(false)} 
                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors shrink-0"
              >
                <X className="h-4 w-4 text-zinc-450" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
              
              {/* Radar Chart Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Radar Specification Map</p>
                  <span className="text-[11.5px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {activeMatchData.totalScore}% Fit
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center border border-zinc-150 bg-zinc-50/50 rounded-xl p-2">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activeMatchData.radarData}>
                        <PolarGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Match Score"
                          dataKey="score"
                          stroke="#b8922e"
                          fill="#d4ad4d"
                          fillOpacity={0.12}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-[10px] text-zinc-400">Loading chart...</div>
                  )}
                </div>
              </div>

              {/* Point-by-point breakdown list */}
              <div className="space-y-3 pt-4 border-t border-[#f5f5f3]">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Category Breakdown</p>
                
                <div className="space-y-2.5">
                  {activeMatchData.breakdown.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="p-3 bg-[#fafaf8] border border-[#e8e7e4] rounded-xl space-y-1.5 text-[11px] font-semibold text-zinc-650">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                            <IconComponent className="h-3.5 w-3.5 text-zinc-450" />
                            {item.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            item.status === 'exact' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : item.status === 'partial' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.statusText}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-[9.5px] font-semibold pt-1.5 border-t border-zinc-200/50">
                          <div>
                            <p className="text-zinc-400 block text-[8px] uppercase tracking-wider">Required</p>
                            <p className="text-zinc-700 font-bold truncate mt-0.5">{item.leadValue}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400 block text-[8px] uppercase tracking-wider">Available Spec</p>
                            <p className="text-zinc-700 font-bold truncate mt-0.5">{item.propValue}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Quick Actions Footer */}
            <div className="p-5 border-t border-[#ebebeb] flex items-center gap-2 shrink-0">
              <a
                href={`https://wa.me/?text=${sharePropertyToLeadText(
                  (matchMode === 'leads' ? currentLead : analysisTargetItem) as Lead,
                  (matchMode === 'leads' ? analysisTargetItem : currentProperty) as Property
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp details
              </a>
              <button 
                onClick={handleAssignPropertyToLead}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Assign Property
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── SCHEDULE SITE VISIT MODAL (Notion Style) ── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white border border-[#e8e7e4] rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-zinc-400 hover:text-zinc-700 hover:bg-[#f6f6f6] rounded-lg transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-left">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">Schedule Site Viewing</h3>
                <p className="text-[10px] text-[#888888] mt-0.5 font-medium">
                  Confirm the visit date and details for client <strong>{currentLead?.client_name}</strong> to view <strong>{currentProperty?.title}</strong>.
                </p>
              </div>

              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">Visit Date</label>
                <input 
                  type="date" 
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#fdfdfd] border border-[#e8e7e4] rounded-lg px-3 py-2 text-xs text-zinc-900 font-bold focus:outline-none focus:border-[#d4ad4d]"
                />
              </div>

              {/* Time Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">Visit Time</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-[#fdfdfd] border border-[#e8e7e4] rounded-lg px-3 py-2 text-xs text-zinc-900 font-bold focus:outline-none focus:border-[#d4ad4d]"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                  <option value="07:00 PM">07:00 PM</option>
                </select>
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">Instructions / Notes</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#fdfdfd] border border-[#e8e7e4] rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:outline-none focus:border-[#d4ad4d] placeholder:text-zinc-300 resize-none"
                  placeholder="E.g., Client prefers afternoon visit..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8e7e4]">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 border border-[#e8e7e4] text-zinc-700 hover:bg-[#f5f5f3] rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#d4ad4d] text-white hover:bg-[#b8922e] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border-none"
                >
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
