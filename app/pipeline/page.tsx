"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  MapPin, 
  DollarSign, 
  Users, 
  Briefcase,
  Clock,
  X,
  FileText,
  Building,
  Trash2,
  Target,
  BarChart3,
  Edit2,
  Calendar,
  Layout,
  List,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatPriceShort } from '@/lib/formatters';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';

interface Deal {
  id: string;
  client_name: string;
  property_preference: string;
  budget: number;
  stage: string;
  notes: string;
  source: string;
  lastActive: string;
}

const STAGES = ['New inquiry', 'Site visit', 'Follow up', 'Closure'];

const STAGE_CONFIGS: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  indicatorColor: string;
  probability: number;
}> = {
  'New inquiry': {
    color: 'text-violet-700',
    bgColor: 'bg-violet-50/50',
    borderColor: 'border-violet-100',
    indicatorColor: 'bg-violet-500',
    probability: 0.15
  },
  'Site visit': {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-100',
    indicatorColor: 'bg-blue-500',
    probability: 0.40
  },
  'Follow up': {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-100',
    indicatorColor: 'bg-amber-500',
    probability: 0.70
  },
  'Closure': {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50/50',
    borderColor: 'border-emerald-100',
    indicatorColor: 'bg-emerald-500',
    probability: 1.00
  }
};

const LEAD_SOURCES = ['99 acres', 'Magicbricks', 'Website', 'Instagram', 'Referral', 'Manual Entry'];
const PROPERTY_PREFERENCES = ['Pristine Kyra', 'Power Heights', 'Vivencia Villa', 'NYATI Evoque', 'TBD'];

const mapLeadToDeal = (lead: any): Deal => {
  return {
    id: lead.id,
    client_name: lead.client_name || 'Unnamed',
    property_preference: lead.preferred_location || lead.property_type || lead.configuration || 'Any',
    budget: lead.budget_max || 0,
    stage: lead.stage_id || 'New inquiry',
    notes: lead.notes || '',
    source: lead.lead_source_id || 'Direct Inquiry',
    lastActive: lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'
  };
};

export default function PipelinePage() {
  const profile = useProfile();
  const [deals, setDeads] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Raw leads and properties list for dropdown selectors
  const [rawLeadsList, setRawLeadsList] = useState<any[]>([]);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const [siteVisitDeal, setSiteVisitDeal] = useState<Deal | null>(null);
  const [siteVisitPropId, setSiteVisitPropId] = useState('');
  const [siteVisitDate, setSiteVisitDate] = useState('2026-06-18');
  const [siteVisitTime, setSiteVisitTime] = useState('02:00 PM');
  const [siteVisitNotes, setSiteVisitNotes] = useState('');

  // Fetch real deals and properties from Supabase
  useEffect(() => {
    if (!profile) return;
    async function loadDeals() {
      setLoading(true);
      try {
        let query = supabase
          .from('leads')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        const perms = getPermissions(profile?.role);
        if (!perms.canViewAllPipeline && profile?.id) {
          query = query.eq('assigned_to', profile.id);
        }

        const { data, error } = await query;
        if (data) {
          setRawLeadsList(data);
          setDeads(data.map(mapLeadToDeal));
          if (data.length > 0) {
            setSelectedLeadId(data[0].id);
            setClientName(data[0].client_name || '');
            if (data[0].budget_max) setBudget(data[0].budget_max.toString());
          }
        } else {
          setDeads([]);
        }

        // Fetch properties for site visit scheduling & new deal dropdown
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, location, price, configuration')
          .eq('is_active', true)
          .order('title');
        if (propsData) {
          setPropertiesList(propsData);
          if (propsData.length > 0) {
            setSiteVisitPropId(propsData[0].id);
            setSelectedPropertyId(propsData[0].id);
            setPropertyPref(propsData[0].title);
          }
        }
      } catch (err) {
        console.error('Error loading deals:', err);
        setDeads([]);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, [profile]);

  // Modal and Form States
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new-deal') {
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  // Form Field States
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState('');
  const [propertyPref, setPropertyPref] = useState('TBD');
  const [source, setSource] = useState('Manual Entry');
  const [stage, setStage] = useState('New inquiry');
  const [notes, setNotes] = useState('');

  // Drag and Drop Dragged Item Track State
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Handle Drag and Drop Actions
  const onDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const onDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const onDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    if (dragOverStage !== stageName) {
      setDragOverStage(stageName);
    }
  };

  const onDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      const targetDeal = deals.find(d => d.id === dealId);
      if (targetStage === 'Site visit' && targetDeal) {
        setSiteVisitDeal(targetDeal);
        setSiteVisitNotes(`Site visit requested via pipeline drag for ${targetDeal.client_name}`);
        setDraggedDealId(null);
        setDragOverStage(null);
        return;
      }

      // Optimistic update for other stages
      setDeads(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage, lastActive: 'Just now' } : d));
      try {
        await supabase
          .from('leads')
          .update({ stage_id: targetStage })
          .eq('id', dealId);
      } catch (err) {
        console.error('Error updating stage:', err);
      }
    }
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleConfirmSiteVisitFromPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteVisitDeal) return;
    const targetId = siteVisitDeal.id;

    // Optimistic update
    setDeads(prev => prev.map(d => d.id === targetId ? { ...d, stage: 'Site visit', lastActive: 'Just now' } : d));

    try {
      await supabase.from('site_visits').insert({
        lead_id: targetId,
        property_id: siteVisitPropId || null,
        visit_date: siteVisitDate,
        visit_time: siteVisitTime,
        status: 'Scheduled',
        outcome: siteVisitNotes,
        assigned_to: profile?.id
      });

      await supabase.from('leads').update({ stage_id: 'Site visit' }).eq('id', targetId);

      await supabase.from('audit_logs').insert({
        user_id: profile?.id,
        event: 'Site visit scheduled via Pipeline',
        changes: { client_name: siteVisitDeal.client_name, visit_date: siteVisitDate, visit_time: siteVisitTime }
      });
    } catch (err) {
      console.error('Error scheduling site visit from pipeline:', err);
    }

    setSiteVisitDeal(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setClientName(deal.client_name);
    setBudget(deal.budget.toString());
    setPropertyPref(deal.property_preference);
    setSource(deal.source);
    setStage(deal.stage);
    setNotes(deal.notes);
    setIsEditModalOpen(true);
  };

  // Save Edit Deal Action
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    const updatedDeal = {
      client_name: clientName,
      budget_max: parseInt(budget) || 0,
      preferred_location: propertyPref,
      lead_source_id: source,
      stage_id: stage,
      notes: notes
    };

    // Optimistic update
    setDeads(prev => prev.map(d => d.id === selectedDeal.id ? { 
      ...d, 
      client_name: clientName,
      budget: parseInt(budget) || 0,
      property_preference: propertyPref,
      source: source,
      stage: stage,
      notes: notes,
      lastActive: 'Just now'
    } : d));
    setIsEditModalOpen(false);

    try {
      await supabase
        .from('leads')
        .update(updatedDeal)
        .eq('id', selectedDeal.id);
    } catch (err) {
      console.error('Error saving deal:', err);
    }
    setSelectedDeal(null);
    resetForm();
  };

  // Add New Deal Action
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLeadData = {
      client_name: clientName || 'Unnamed Client',
      phone: '',
      email: '',
      budget_max: parseInt(budget) || 0,
      lead_source_id: source,
      stage_id: stage,
      notes: notes || 'New inquiry details.',
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLeadData])
        .select()
        .single();
      if (data) {
        setDeads(prev => [mapLeadToDeal(data), ...prev]);
      }
    } catch (err) {
      console.error('Error adding deal:', err);
    }
    setIsAddModalOpen(false);
    resetForm();
  };

  // Delete Deal Action
  const handleDeleteDeal = async (dealId: string) => {
    if (confirm("Are you sure you want to delete this deal from the pipeline?")) {
      // Optimistic update
      setDeads(prev => prev.filter(d => d.id !== dealId));
      setIsEditModalOpen(false);
      try {
        await supabase
          .from('leads')
          .update({ is_active: false })
          .eq('id', dealId);
      } catch (err) {
        console.error('Error deleting deal:', err);
      }
      setSelectedDeal(null);
      resetForm();
    }
  };

  // Form Reset Helper
  const resetForm = () => {
    setClientName('');
    setBudget('');
    setPropertyPref('TBD');
    setSource('Manual Entry');
    setStage('New inquiry');
    setNotes('');
  };

  // Compute Metrics & Targets
  const metrics = useMemo(() => {
    let pipelineTotal = 0;
    let weightedTotal = 0;
    let closedTotal = 0;

    deals.forEach(d => {
      pipelineTotal += d.budget;
      const config = STAGE_CONFIGS[d.stage];
      if (config) {
        weightedTotal += d.budget * config.probability;
      }
      if (d.stage === 'Closure') {
        closedTotal += d.budget;
      }
    });

    const targetGoal = 200000000; // ₹20 Cr Target Goal
    const progressPercent = Math.min(Math.round((closedTotal / targetGoal) * 100), 100);

    return {
      pipelineTotal,
      weightedTotal,
      closedTotal,
      progressPercent,
      targetGoal
    };
  }, [deals]);

  return (
    <div className="w-full pb-20 text-zinc-900 text-left">
      
      {/* Unified Direction C Frame Card */}
      <div className="overflow-hidden bg-white border border-[#e8e7e4] rounded-2xl shadow-sm">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-6 py-5 border-b border-[#ebebeb]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900" style={{ letterSpacing: '-0.4px' }}>
                Sales Deal Pipeline
              </h1>
              <span className="bg-zinc-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {deals.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Track active opportunities, forecasts, and target progress</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle (Segmented control) */}
            <div className="flex items-center gap-1 bg-[#f0f0ee] p-0.5 rounded-lg border border-[#e5e5e3]">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                List
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setClientName('');
                setBudget('');
                setPropertyPref('TBD');
                setSource('Manual Entry');
                setStage('New inquiry');
                setNotes('');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4ad4d] text-white text-[11px] font-bold hover:bg-[#b8922e] transition-all shadow-[0_2px_8px_rgba(212,173,77,.35)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Deal
            </button>
          </div>
        </div>

        {/* Inline Stats Bar - Glued directly under the header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#fafaf8] border-b border-[#ebebeb]">
          <div className="px-6 py-4 border-r border-[#ebebeb] text-left">
            <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest block">Gross Pipeline</span>
            <span className="text-[15px] font-black text-zinc-900 mt-1 block">{formatPriceShort(metrics.pipelineTotal)}</span>
            <span className="text-[9.5px] text-zinc-400 font-medium block mt-0.5">{deals.length} Active Opportunities</span>
          </div>
          
          <div className="px-6 py-4 border-r border-[#ebebeb] text-left">
            <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest block">Weighted Forecast</span>
            <span className="text-[15px] font-black text-zinc-900 mt-1 block">{formatPriceShort(metrics.weightedTotal)}</span>
            <span className="text-[9.5px] text-zinc-400 font-medium block mt-0.5">Based on stage probabilities</span>
          </div>

          <div className="px-6 py-4 border-r border-[#ebebeb] text-left">
            <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest block">Closed Target Progress</span>
            <span className="text-[15px] font-black text-zinc-900 mt-1 block">
              {formatPriceShort(metrics.closedTotal)}
              <span className="text-[11px] text-zinc-400 font-bold ml-1">/ {formatPriceShort(metrics.targetGoal)}</span>
            </span>
            <span className="text-[9.5px] text-zinc-400 font-medium block mt-0.5">Closed deals value</span>
          </div>

          <div className="px-6 py-4 flex flex-col justify-center text-left">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-widest">Achieved</span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">{metrics.progressPercent}%</span>
            </div>
            <div className="w-full bg-[#e8e7e4] h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Board/List Area inside the single card */}
        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white divide-y md:divide-y-0 md:divide-x divide-[#ebebeb]">
            {STAGES.map((stageName) => {
              const stageDeals = deals.filter(d => d.stage === stageName);
              const stageValue = stageDeals.reduce((acc, d) => acc + d.budget, 0);
              const config = STAGE_CONFIGS[stageName];
              const isDraggingOver = dragOverStage === stageName;

              return (
                <div 
                  key={stageName}
                  className="flex flex-col min-h-[580px] bg-white text-left"
                  onDragOver={(e) => onDragOver(e, stageName)}
                  onDrop={(e) => onDrop(e, stageName)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f3] bg-[#fafaf8]/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${config.indicatorColor}`} />
                      <span className="text-[10px] font-extrabold text-zinc-800 uppercase tracking-wider truncate">{stageName}</span>
                      <span className="bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-400 px-1.5 py-0.2 rounded-full shrink-0">
                        {stageDeals.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-zinc-900 ml-2">
                      {formatPriceShort(stageValue)}
                    </span>
                  </div>

                  {/* Column Dropzone / Cards list */}
                  <div 
                    className={`flex-1 p-4 flex flex-col gap-3 transition-colors duration-250 ${
                      isDraggingOver ? 'bg-[#fafaf8]' : 'bg-white'
                    }`}
                  >
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, deal.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => handleOpenEditModal(deal)}
                        className="bg-white border border-[#e8e7e4] p-4 rounded-xl shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-zinc-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2.5 gap-2">
                          <h4 className="text-[11.5px] font-extrabold text-zinc-900 tracking-tight leading-tight select-none">
                            {deal.client_name}
                          </h4>
                          <span className="text-[11px] font-extrabold text-[#d4ad4d] shrink-0 leading-tight">
                            {formatPriceShort(deal.budget)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 font-semibold mb-3">
                          <Building className="h-3 w-3 text-zinc-300 shrink-0" />
                          <span className="truncate">Preference: <span className="text-zinc-650">{deal.property_preference}</span></span>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#f5f5f3] pt-2.5 text-[9px] font-bold text-zinc-400">
                          <span className="bg-[#f5f5f3] text-zinc-500 px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase scale-95 origin-left">
                            {deal.source}
                          </span>
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 text-zinc-300" />
                            {deal.lastActive}
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#e8e7e4] rounded-xl py-12 px-4 bg-zinc-50/10 min-h-[160px]">
                        <Briefcase className="h-6 w-6 text-zinc-300 opacity-60 mb-2" />
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-300">Drag Deals Here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white text-left overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#ebebeb]">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Client Name</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Budget</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Stage</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Property Preference</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Source</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Last Active</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f3]">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs font-semibold text-zinc-400">
                      No active deals found in the pipeline.
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => {
                    const config = STAGE_CONFIGS[deal.stage] || STAGE_CONFIGS['New inquiry'];
                    return (
                      <tr 
                        key={deal.id}
                        className="hover:bg-[#fafaf8] transition-colors group cursor-pointer"
                        onClick={() => handleOpenEditModal(deal)}
                      >
                        <td className="px-6 py-3.5">
                          <p className="text-xs font-bold text-zinc-900 group-hover:text-[#d4ad4d] transition-colors">
                            {deal.client_name}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs font-bold text-zinc-900">
                            {formatCurrency(deal.budget)}
                          </p>
                        </td>
                        <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={deal.stage}
                            onChange={async (e) => {
                              const newStage = e.target.value;
                              setDeads(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage, lastActive: 'Just now' } : d));
                              try {
                                await supabase
                                  .from('leads')
                                  .update({ stage_id: newStage })
                                  .eq('id', deal.id);
                              } catch (err) {
                                console.error('Error updating stage:', err);
                              }
                            }}
                            className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded border outline-none cursor-pointer transition-colors ${config.color} ${config.bgColor} ${config.borderColor}`}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold">
                            <Building className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                            {deal.property_preference}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-[9.5px] font-bold text-zinc-500 bg-[#f5f5f3] px-2 py-0.5 rounded uppercase tracking-wider">
                            {deal.source}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                            {deal.lastActive}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(deal)}
                              className="text-[10px] font-bold text-[#d4ad4d] hover:text-[#b8922e] transition-colors px-2 py-1 whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="p-1 rounded text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD DEAL MODAL (Direction A — Floating Split-Pane Modal) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-[20px] shadow-2xl border border-[#e8e7e4] overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200 text-left grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Summary Pane (5 cols) */}
            <div className="md:col-span-5 p-6 bg-[#fafaf8] border-r-0 border-b md:border-r md:border-b-0 border-[#ebebeb] flex flex-col justify-between space-y-6">
              <div>
                <span className="px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-[#f4ebd0] text-[#967420] border border-[#e8d5a3] uppercase tracking-wider">
                  DEAL SUMMARY PREVIEW
                </span>
                <h3 className="text-[16px] font-extrabold text-zinc-900 mt-2 tracking-tight">New Sales Deal</h3>
                <p className="text-[10.5px] text-zinc-400 font-medium mt-0.5">
                  Link a qualified lead to an active property listing from the inventory.
                </p>
              </div>

              {/* Dynamic Live Preview Box */}
              <div className="bg-white border border-[#e8e7e4] rounded-xl p-4 space-y-3 shadow-2xs">
                <div>
                  <span className="text-[8.5px] font-extrabold text-zinc-400 uppercase tracking-wider block">SELECTED CLIENT</span>
                  <div className="text-[13px] font-extrabold text-zinc-900 mt-0.5">
                    {rawLeadsList.find(l => l.id === selectedLeadId)?.client_name || clientName || 'Select Client Below'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {rawLeadsList.find(l => l.id === selectedLeadId)?.phone || 'Phone'} · 
                    <span className="ml-1 text-rose-600 font-bold">
                      {rawLeadsList.find(l => l.id === selectedLeadId)?.status || 'Hot Lead'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#f5f5f3] pt-2.5">
                  <span className="text-[8.5px] font-extrabold text-zinc-400 uppercase tracking-wider block">MATCHED PROPERTY LISTING</span>
                  <div className="text-[13px] font-extrabold text-zinc-900 mt-0.5">
                    {propertiesList.find(p => p.id === selectedPropertyId)?.title || propertyPref || 'Select Property Below'}
                  </div>
                  <div className="text-[10px] font-extrabold text-[#b8922e] mt-0.5">
                    {propertiesList.find(p => p.id === selectedPropertyId)?.location || 'Pune'} · 
                    ₹{((propertiesList.find(p => p.id === selectedPropertyId)?.price || parseInt(budget) || 0) / 10000000).toFixed(2)} Cr
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-zinc-400 font-semibold">
                Luxe ERP Pipeline Engine
              </div>
            </div>

            {/* Right Form Controls Pane (7 cols) */}
            <div className="md:col-span-7 p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#f5f5f3] pb-3">
                <h4 className="text-[13px] font-extrabold text-zinc-900">Deal Parameters</h4>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="space-y-4">
                {/* Client Name Type-able & Searchable Autocomplete Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Client Name (Type or Select Lead) *
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      list="leads-datalist"
                      placeholder="Type client name to search leads..."
                      value={clientName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClientName(val);
                        const matched = rawLeadsList.find(l => 
                          l.client_name?.toLowerCase() === val.toLowerCase() ||
                          `${l.client_name} (${l.phone})`.toLowerCase().includes(val.toLowerCase())
                        );
                        if (matched) {
                          setSelectedLeadId(matched.id);
                          if (matched.budget_max) setBudget(matched.budget_max.toString());
                        }
                      }}
                      className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all"
                    />
                    <datalist id="leads-datalist">
                      {rawLeadsList.map(l => (
                        <option key={l.id} value={l.client_name}>
                          {l.phone ? `${l.phone} · ` : ''}{l.status || 'Hot'}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Property Name Type-able & Searchable Autocomplete Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Property Name (Type or Select Listing) *
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      list="properties-datalist"
                      placeholder="Type property title or location..."
                      value={propertyPref}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPropertyPref(val);
                        const matched = propertiesList.find(p => 
                          p.title?.toLowerCase() === val.toLowerCase() ||
                          `${p.title} (${p.location})`.toLowerCase().includes(val.toLowerCase())
                        );
                        if (matched) {
                          setSelectedPropertyId(matched.id);
                          if (matched.price) setBudget(matched.price.toString());
                        }
                      }}
                      className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all"
                    />
                    <datalist id="properties-datalist">
                      {propertiesList.map(p => (
                        <option key={p.id} value={p.title}>
                          {p.location} · ₹{((p.price || 0) / 10000000).toFixed(2)} Cr
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Budget Value */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Agreed Deal Value (₹) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 25000000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all"
                  />
                </div>

                {/* Stage & Source Grid */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Initial Stage *</label>
                    <div className="relative">
                      <select 
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Lead Source</label>
                    <div className="relative">
                      <select 
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer"
                      >
                        {LEAD_SOURCES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Deal Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter special requirements or terms..."
                    className="w-full h-20 px-3.5 py-2.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f5f5f3]">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#e8e7e4] text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#d4ad4d] text-white text-xs font-extrabold hover:bg-[#b8922e] transition-all shadow-md cursor-pointer"
                  >
                    Create Deal
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ── EDIT DEAL MODAL ── */}
      {isEditModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => {
            setIsEditModalOpen(false);
            setSelectedDeal(null);
          }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150 text-left">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                  <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Edit Deal Details</h3>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Update prospect profile</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedDeal(null);
                }} 
                className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4">
                
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Client Name</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Budget Value (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all"
                  />
                </div>

                {/* Property Preference & Stage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Property Pref</label>
                    <div className="relative">
                      <select 
                        value={propertyPref}
                        onChange={(e) => setPropertyPref(e.target.value)}
                        className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer"
                      >
                        {PROPERTY_PREFERENCES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Current Stage</label>
                    <div className="relative">
                      <select 
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Lead Source</label>
                  <div className="relative">
                    <select 
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full h-10 px-3.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all appearance-none cursor-pointer"
                    >
                      {LEAD_SOURCES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-20 px-3.5 py-2.5 bg-[#fafaf8] border border-zinc-200/80 rounded-xl text-base md:text-xs font-semibold text-[#2d2d2d] placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-[#d4ad4d] focus:ring-4 focus:ring-[#d4ad4d]/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
                {/* Delete Deal Button */}
                <button 
                  type="button"
                  onClick={() => handleDeleteDeal(selectedDeal.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Deal
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedDeal(null);
                    }}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-2xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Visit Schedule Modal on Drag to Site Visit Stage */}
      {siteVisitDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setSiteVisitDeal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900">Schedule Site Visit</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Moving {siteVisitDeal.client_name} to Site Visit Stage</p>
              </div>
              <button onClick={() => setSiteVisitDeal(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmSiteVisitFromPipeline} className="p-6 space-y-5">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Select Property</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  value={siteVisitPropId}
                  onChange={(e) => setSiteVisitPropId(e.target.value)}
                >
                  <option value="">Select a property listing...</option>
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={siteVisitDate}
                    onChange={(e) => setSiteVisitDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Visit Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={siteVisitTime}
                    onChange={(e) => setSiteVisitTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Instructions / Notes</label>
                <textarea
                  className="w-full h-24 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all resize-none"
                  placeholder="Notes for site viewing..."
                  value={siteVisitNotes}
                  onChange={(e) => setSiteVisitNotes(e.target.value)}
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSiteVisitDeal(null)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
                >
                  Confirm & Block Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
