"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  MapPin, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Briefcase,
  Clock,
  X,
  FileText,
  Building
} from 'lucide-react';

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

export default function PipelinePage() {
  // Initial pipeline deals state
  const [deals, setDeads] = useState<Deal[]>([
    {
      id: 'deal-1',
      client_name: 'Olivia Ryans',
      property_preference: 'Obsidian Villa',
      budget: 4850000,
      stage: 'Proposal',
      notes: 'Submitted proposal details. Client reviewing financing option.',
      source: 'Zillow Portal',
      lastActive: '10m ago'
    },
    {
      id: 'deal-2',
      client_name: 'Marcus Vance',
      property_preference: 'Elysian Penthouse',
      budget: 3200000,
      stage: 'Qualify',
      notes: 'Requested site visit. Verified proof of funds.',
      source: 'Web Referral',
      lastActive: '1h ago'
    },
    {
      id: 'deal-3',
      client_name: 'Sarah Jenkins',
      property_preference: 'Coastal Villa',
      budget: 5150000,
      stage: 'Negotiate',
      notes: 'Offered $4.95M. Owner counter-offered $5.05M.',
      source: 'Direct Call',
      lastActive: '3h ago'
    },
    {
      id: 'deal-4',
      client_name: 'David Kim',
      property_preference: 'Pasadena Penthouse',
      budget: 350000,
      stage: 'Won',
      notes: 'Contract signed. Commission escrow opened.',
      source: 'Walk-in',
      lastActive: '1d ago'
    },
    {
      id: 'deal-5',
      client_name: 'Michael Chang',
      property_preference: 'Beverly Hills Mansion',
      budget: 8900000,
      stage: 'Prospect',
      notes: 'Initial call. Wants a modern compound.',
      source: 'Social Media',
      lastActive: '2d ago'
    },
    {
      id: 'deal-6',
      client_name: 'Sophia Loren',
      property_preference: 'Glass Penthouse',
      budget: 4200000,
      stage: 'Proposal',
      notes: 'Sent floorplans and view packages.',
      source: 'Cold Outreach',
      lastActive: '4h ago'
    }
  ]);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const stages = ['Prospect', 'Qualify', 'Proposal', 'Negotiate', 'Won'];

  // Move deal stages
  const moveDeal = (dealId: string, direction: 'left' | 'right') => {
    setDeads(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal;
      const currentIdx = stages.indexOf(deal.stage);
      let newIdx = currentIdx;
      if (direction === 'left' && currentIdx > 0) newIdx--;
      if (direction === 'right' && currentIdx < stages.length - 1) newIdx++;
      return { ...deal, stage: stages[newIdx] };
    }));
  };

  // Open deal details
  const openDealDetails = (deal: Deal) => {
    setSelectedDeal(deal);
    setNoteText(deal.notes);
    setIsModalOpen(true);
  };

  // Save deal notes
  const saveDealNotes = () => {
    if (!selectedDeal) return;
    setDeads(prev => prev.map(deal => {
      if (deal.id !== selectedDeal.id) return deal;
      return { ...deal, notes: noteText };
    }));
    setSelectedDeal(prev => prev ? { ...prev, notes: noteText } : null);
  };

  // Add a new deal
  const addNewDeal = () => {
    const name = prompt("Enter Client Name:");
    if (!name) return;
    const prop = prompt("Enter Property Preference:") || "Luxury Estate";
    const budgetStr = prompt("Enter Budget Max ($):") || "1000000";
    const budget = parseFloat(budgetStr.replace(/[^0-9]/g, '')) || 1000000;
    
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      client_name: name,
      property_preference: prop,
      budget: budget,
      stage: 'Prospect',
      notes: 'Deal generated in pipeline.',
      source: 'Direct Client',
      lastActive: 'Just now'
    };

    setDeads(prev => [...prev, newDeal]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            Sales Pipeline
          </h1>
          <p className="text-xs text-zinc-500">
            Monitor transaction stages, value counts, and progress deals toward completion.
          </p>
        </div>
        <button 
          onClick={addNewDeal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-xs font-bold text-zinc-950 hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create New Deal
        </button>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.budget, 0);

          return (
            <div key={stage} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4 flex flex-col min-h-[500px]">
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{stage}</h3>
                  <span className="text-[10px] text-emerald-600 font-extrabold mt-0.5 block">
                    ${(stageValue / 1000000).toFixed(2)}M
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    onClick={() => openDealDetails(deal)}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 p-4 rounded-xl space-y-3 cursor-pointer group hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors">
                        {deal.client_name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                        <Building className="h-3 w-3 text-zinc-500" />
                        {deal.property_preference}
                      </p>
                    </div>

                    {/* Budget & Last Active Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                      <span className="font-bold text-emerald-600">${(deal.budget / 1000).toFixed(0)}k</span>
                      <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {deal.lastActive}
                      </span>
                    </div>

                    {/* Column Shift Interactivity controls */}
                    <div className="flex items-center justify-between pt-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => moveDeal(deal.id, 'left')}
                        disabled={stage === 'Prospect'}
                        className="p-1 rounded bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Shift Stage</span>
                      <button 
                        onClick={() => moveDeal(deal.id, 'right')}
                        disabled={stage === 'Won'}
                        className="p-1 rounded bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="py-8 text-center text-[10px] text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                    No deals here.
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Deal Details Modal overlay */}
      {isModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{selectedDeal.client_name}</h3>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Deal Details</span>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Details Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Property Target</span>
                  <span className="text-zinc-700 font-semibold mt-0.5 block">{selectedDeal.property_preference}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Deal Value</span>
                  <span className="text-emerald-600 font-bold mt-0.5 block flex items-center gap-0.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {selectedDeal.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Source</span>
                  <span className="text-zinc-500 font-semibold mt-0.5 block">{selectedDeal.source}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Current Stage</span>
                  <span className="text-zinc-700 font-semibold mt-0.5 block uppercase tracking-wider">{selectedDeal.stage}</span>
                </div>
              </div>

              {/* Notes block */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Negotiation Progress Notes</span>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => { saveDealNotes(); setIsModalOpen(false); }}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-600 transition-all"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
