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
import { formatCurrency, formatPriceShort } from '@/lib/formatters';

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
      client_name: 'Ananya Sharma',
      property_preference: 'Vivencia',
      budget: 22000000,
      stage: 'Follow up',
      notes: 'Submitted proposal details. Client reviewing financing option.',
      source: '99 acres',
      lastActive: '10m ago'
    },
    {
      id: 'deal-2',
      client_name: 'Vikram Malhotra',
      property_preference: 'Power Heights',
      budget: 13000000,
      stage: 'Site visit',
      notes: 'Requested site visit. Verified proof of funds.',
      source: 'Referral',
      lastActive: '1h ago'
    },
    {
      id: 'deal-3',
      client_name: 'Rajesh Gupta',
      property_preference: 'Vivencia',
      budget: 31000000,
      stage: 'Follow up',
      notes: 'Offered ₹21.5 Cr. Owner counter-offered ₹22 Cr.',
      source: 'Website',
      lastActive: '3h ago'
    },
    {
      id: 'deal-4',
      client_name: 'Deepika Rao',
      property_preference: 'NYATI Evoque',
      budget: 35000000,
      stage: 'Closure',
      notes: 'Contract signed. Token amount received.',
      source: 'Walk-in',
      lastActive: '1d ago'
    },
    {
      id: 'deal-5',
      client_name: 'Amitabh Kapoor',
      property_preference: 'Baner Mansion',
      budget: 189000000,
      stage: 'New inquiry',
      notes: 'Initial call. Wants a modern compound in Hyderabad.',
      source: 'Instagram',
      lastActive: '2d ago'
    },
    {
      id: 'deal-6',
      client_name: 'Saira Banu',
      property_preference: 'Bandra Sea View Penthouse',
      budget: 142000000,
      stage: 'Follow up',
      notes: 'Sent floorplans and view packages.',
      source: 'Website',
      lastActive: '4h ago'
    }
  ]);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const stages = ['New inquiry', 'Site visit', 'Follow up', 'Closure'];

  // Handle drag and drop logic
  const onDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, stage: string) => {
    const dealId = e.dataTransfer.getData('dealId');
    const updatedDeads = deals.map(d => {
      if (d.id === dealId) return { ...d, stage };
      return d;
    });
    setDeads(updatedDeads);
  };

  // Open deal detail modal
  const openDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setNoteText(deal.notes);
    setIsModalOpen(true);
  };

  // Calculate stats for header
  const totalValue = deals.reduce((acc, d) => acc + d.budget, 0);
  const totalCount = deals.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 text-zinc-900">
      
      {/* Pipeline Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-50 text-zinc-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sales Pipeline</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Visually track deal progression and weighted revenue forecast.</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Pipeline Value</p>
            <p className="text-xl font-black text-zinc-600">{formatPriceShort(totalValue)}</p>
          </div>
          <div className="h-10 w-px bg-zinc-100 hidden md:block" />
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Deals</p>
            <p className="text-xl font-black text-zinc-900">{totalCount}</p>
          </div>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 ml-2"
            onClick={() => {
              const name = prompt("Enter Client Name:") || "New Client";
              const budgetStr = prompt("Enter Budget (₹):") || "10000000";
              const budget = parseInt(budgetStr);
              setDeads([...deals, {
                id: `deal-${Date.now()}`,
                client_name: name,
                property_preference: 'TBD',
                budget: budget,
                stage: 'Prospect',
                notes: 'Newly added lead.',
                source: 'Manual Entry',
                lastActive: 'Just now'
              }]);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((acc, d) => acc + d.budget, 0);

          return (
            <div 
              key={stage}
              className="flex-shrink-0 w-80 flex flex-col gap-4"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{stage}</span>
                  <span className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  {formatPriceShort(stageValue)}
                </span>
              </div>

              {/* Stage Column */}
              <div className="flex-1 bg-zinc-50/50 rounded-2xl p-3 border border-zinc-100/50 min-h-[500px] flex flex-col gap-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, deal.id)}
                    onClick={() => openDeal(deal)}
                    className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-zinc-500/30 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                          {deal.client_name.charAt(0)}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">{deal.client_name}</h4>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600">{formatPriceShort(deal.budget)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium mb-4">
                      <MapPin className="h-3 w-3" />
                      {deal.property_preference}
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{deal.source}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400">
                        <Clock className="h-2.5 w-2.5" />
                        {deal.lastActive}
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-100 rounded-xl py-10">
                    <Briefcase className="h-8 w-8 opacity-20 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No deals in {stage}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Details Modal */}
      {isModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-500 text-white flex items-center justify-center font-bold">
                  {selectedDeal.client_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{selectedDeal.client_name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{selectedDeal.source}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Deal Value</p>
                  <p className="text-sm font-black text-zinc-900">{formatCurrency(selectedDeal.budget)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current Stage</p>
                  <p className="text-sm font-bold text-zinc-600">{selectedDeal.stage}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Building className="h-4 w-4 text-zinc-500" />
                  Property Preference
                </h4>
                <div className="p-4 rounded-2xl border border-zinc-200 font-bold text-sm">
                  {selectedDeal.property_preference}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Deal Notes & History
                </h4>
                <textarea 
                  className="w-full h-32 p-4 rounded-2xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 outline-none transition-all resize-none bg-zinc-50/50"
                  placeholder="Enter updates about this deal..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3">
              <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-white transition-all">
                Close
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10">
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
