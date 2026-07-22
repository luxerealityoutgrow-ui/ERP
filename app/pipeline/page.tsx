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
  List
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

  // Properties list for site visit scheduling
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
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
          setDeads(data.map(mapLeadToDeal));
        } else {
          setDeads([]);
        }

        // Fetch properties for site visit scheduling
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, location')
          .eq('is_active', true)
          .order('title');
        if (propsData) {
          setPropertiesList(propsData);
          if (propsData.length > 0) setSiteVisitPropId(propsData[0].id);
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
        setClientName('');
        setBudget('');
        setPropertyPref('TBD');
        setSource('Manual Entry');
        setStage('New inquiry');
        setNotes('');
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10 text-zinc-900 px-4 md:px-0">
      
      {/* ── PIPELINE HEADER ── */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 text-left">
        {/* ── KPI METRICS BOARD ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Total Pipeline */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gross Pipeline Value</p>
              <p className="text-lg font-black text-zinc-900 mt-0.5">{formatPriceShort(metrics.pipelineTotal)}</p>
              <p className="text-[9px] font-bold text-zinc-400 mt-0.5">{deals.length} Active Deals</p>
            </div>
          </div>

          {/* Card 2: Weighted Revenue */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Weighted Forecast (15%-100%)</p>
              <p className="text-lg font-black text-zinc-900 mt-0.5">{formatPriceShort(metrics.weightedTotal)}</p>
              <p className="text-[9px] font-bold text-zinc-400 mt-0.5">Based on Stage Probabilities</p>
            </div>
          </div>

          {/* Card 3: Target Progress */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Closed Target Progress</p>
                <p className="text-lg font-black text-zinc-900 mt-0.5">{formatPriceShort(metrics.closedTotal)} <span className="text-xs font-bold text-zinc-400">/ {formatPriceShort(metrics.targetGoal)}</span></p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">{metrics.progressPercent}%</span>
            </div>
            {/* Linear Progress Bar */}
            <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── VIEW TOGGLE BAR ── */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white text-zinc-900 font-bold border border-zinc-200 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            Board View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-zinc-900 font-bold border border-zinc-200 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List View
          </button>
        </div>

        <button
          onClick={() => {
            setClientName('');
            setBudget('');
            setPropertyPref('TBD');
            setSource('Manual Entry');
            setStage('New inquiry');
            setNotes('');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-900 text-white px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Deal
        </button>
      </div>

      {/* ── PIPELINE MAIN VIEW CONTENT ── */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full pb-6">
        {STAGES.map((stageName) => {
          const stageDeals = deals.filter(d => d.stage === stageName);
          const stageValue = stageDeals.reduce((acc, d) => acc + d.budget, 0);
          const config = STAGE_CONFIGS[stageName];
          const isDraggingOver = dragOverStage === stageName;

          return (
            <div 
              key={stageName}
              className="w-full flex flex-col gap-4 text-left"
              onDragOver={(e) => onDragOver(e, stageName)}
              onDrop={(e) => onDrop(e, stageName)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${config.indicatorColor}`} />
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{stageName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-[9px] font-bold text-zinc-500">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-900">
                  {formatPriceShort(stageValue)}
                </span>
              </div>

              {/* Column Dropzone */}
              <div 
                className={`flex-1 rounded-2xl p-3 border transition-all duration-200 min-h-[520px] flex flex-col gap-3 ${
                  isDraggingOver 
                    ? 'bg-zinc-50 border-zinc-400 border-dashed' 
                    : 'bg-zinc-50/50 border-zinc-200'
                }`}
              >
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, deal.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => handleOpenEditModal(deal)}
                    className="bg-white border border-zinc-200 p-4 rounded-2xl transition-all cursor-grab active:cursor-grabbing group select-none hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Circular Avatar */}
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                          <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors truncate">
                          {deal.client_name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-950 shrink-0">
                        {formatPriceShort(deal.budget)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold mb-4">
                      <Building className="h-3.5 w-3.5 text-zinc-400" />
                      Preference: <span className="text-zinc-700">{deal.property_preference}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[9px] font-bold text-zinc-400">
                      <span className="uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-500 text-[8px] font-bold scale-95 origin-left">
                        {deal.source}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {deal.lastActive}
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border border-dashed border-zinc-200 rounded-2xl py-12 px-4">
                    <Briefcase className="h-8 w-8 opacity-20 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Drag Deals Here</span>
                  </div>
                )}
              </div>
            </div>
          );
      })}
    </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-md overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Property Preference</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
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
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                        onClick={() => handleOpenEditModal(deal)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                              <img src="/lead-avatar.png" alt="" className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                              {deal.client_name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-zinc-950">
                            {formatCurrency(deal.budget)}
                          </p>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border outline-none cursor-pointer transition-colors ${config.color} ${config.bgColor} ${config.borderColor}`}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-semibold">
                            <Building className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            {deal.property_preference}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {deal.source}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-550 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            {deal.lastActive}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(deal)}
                              className="p-1.5 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all bg-white cursor-pointer"
                              title="Edit Deal"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="p-1.5 rounded-2xl border border-zinc-200 text-red-500 hover:text-red-650 hover:bg-zinc-50 transition-all bg-white cursor-pointer"
                              title="Delete Deal"
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
        </div>
      )}

      {/* ── ADD DEAL MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150 text-left">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Add New Deal</h3>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Enter prospect details</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div className="p-6 space-y-4">
                
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Client Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Bajaj"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Budget Value (₹)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 35000000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                  />
                </div>

                {/* Property Preference & Stage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Property Pref</label>
                    <select 
                      value={propertyPref}
                      onChange={(e) => setPropertyPref(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                    >
                      {PROPERTY_PREFERENCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Initial Stage</label>
                    <select 
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Source</label>
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                  >
                    {LEAD_SOURCES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter deal notes..."
                    className="w-full h-20 bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-900 transition-all shadow-2xs cursor-pointer"
                >
                  Create Deal
                </button>
              </div>
            </form>
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
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Client Name</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Budget Value (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 transition-all"
                  />
                </div>

                {/* Property Preference & Stage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Property Pref</label>
                    <select 
                      value={propertyPref}
                      onChange={(e) => setPropertyPref(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                    >
                      {PROPERTY_PREFERENCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Current Stage</label>
                    <select 
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Source</label>
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                  >
                    {LEAD_SOURCES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-20 bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all resize-none"
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
