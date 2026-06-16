"use client";

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/auth';
import { fetchLeads, Lead } from '@/lib/queries';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  Edit3, 
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function LeadsPage() {
  const profile = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Fetch leads on load
  useEffect(() => {
    if (!profile) return;
    fetchLeads(profile)
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  // Fallback mock leads if DB is empty
  const mockLeads: Lead[] = [
    {
      id: 'mock-1',
      client_name: 'Olivia Ryans',
      phone: '+1 (555) 019-9231',
      email: 'olivia@gmail.com',
      budget_min: 400000,
      budget_max: 500000,
      preferred_location: 'Beverly Hills, CA',
      property_type: 'Villa',
      configuration: '3 BHK',
      stage_id: 'New',
      status: 'New',
      notes: 'Prefers modern architectural designs. Needs spacious lawn.',
      created_at: '2026-06-15T12:00:00Z',
      lead_source_id: 'Zillow Portal'
    },
    {
      id: 'mock-2',
      client_name: 'Marcus Vance',
      phone: '+1 (555) 014-8842',
      email: 'marcus.v@vancecorp.com',
      budget_min: 800000,
      budget_max: 1000000,
      preferred_location: 'Malibu, CA',
      property_type: 'Penthouse',
      configuration: '4 BHK',
      stage_id: 'Contacted',
      status: 'Contacted',
      notes: 'Corporate client. Wants high-floor penthouse with ocean views.',
      created_at: '2026-06-14T09:30:00Z',
      lead_source_id: 'Web Referral'
    },
    {
      id: 'mock-3',
      client_name: 'Sarah Jenkins',
      phone: '+1 (555) 017-7756',
      email: 'sarah.jenkins@outlook.com',
      budget_min: 1200000,
      budget_max: 1500000,
      preferred_location: 'Los Angeles, CA',
      property_type: 'Villa',
      configuration: '5 BHK',
      stage_id: 'Negotiating',
      status: 'Negotiating',
      notes: 'Has visited Obsidian Villa twice. Discussing pricing and payment schedules.',
      created_at: '2026-06-12T14:15:00Z',
      lead_source_id: 'Direct Call'
    },
    {
      id: 'mock-4',
      client_name: 'David Kim',
      phone: '+1 (555) 018-4491',
      email: 'dkim@gmail.com',
      budget_min: 300000,
      budget_max: 400000,
      preferred_location: 'Pasadena, CA',
      property_type: 'Apartment',
      configuration: '2 BHK',
      stage_id: 'Closed',
      status: 'Closed',
      notes: 'Deal closed for Pasadena Penthouse. Contract signed.',
      created_at: '2026-06-10T10:00:00Z',
      lead_source_id: 'Walk-in'
    },
    {
      id: 'mock-5',
      client_name: 'Elena Rostova',
      phone: '+1 (555) 019-1144',
      email: 'elena.rostov@luxmail.ru',
      budget_min: 2000000,
      budget_max: 2500000,
      preferred_location: 'Malibu, CA',
      property_type: 'Villa',
      configuration: '6 BHK',
      stage_id: 'Closed',
      status: 'Closed',
      notes: 'VVIP customer looking for beachside compound.',
      created_at: '2026-06-08T16:00:00Z',
      lead_source_id: 'Social Media'
    }
  ];

  const displayLeads = leads.length > 0 ? leads : mockLeads;

  // Filter and search logic
  const filteredLeads = displayLeads.filter(lead => {
    const matchesSearch = 
      lead.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.preferred_location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && (lead.status || lead.stage_id) === activeTab;
  });

  // Handle lead select
  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setNoteText(lead.notes || '');
    setIsDrawerOpen(true);
  };

  // Update lead status in state
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, status: newStatus, stage_id: newStatus };
    setSelectedLead(updated);
    
    // Update main list
    setLeads(prev => {
      const idx = prev.findIndex(l => l.id === selectedLead.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
    
    // Update local mocks
    const idxMock = mockLeads.findIndex(l => l.id === selectedLead.id);
    if (idxMock !== -1) {
      mockLeads[idxMock] = updated;
    }
  };

  // Save new note locally
  const handleSaveNotes = () => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, notes: noteText };
    setSelectedLead(updated);
    
    // Update main state
    setLeads(prev => {
      const idx = prev.findIndex(l => l.id === selectedLead.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-500" />
            Leads Management
          </h1>
          <p className="text-xs text-zinc-500">
            Track and nurture potential clients from capture to final closing contract.
          </p>
        </div>
        <Link href="/leads/create">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-xs font-bold text-zinc-950 hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all">
            <Plus className="h-4 w-4" />
            Add New Lead
          </button>
        </Link>
      </div>

      {/* Tabs and search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1">
          {['All', 'New', 'Contacted', 'Negotiating', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === tab 
                  ? 'bg-white text-emerald-600 border border-zinc-200 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
          />
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Requirements</th>
                <th className="px-6 py-4">Budget Range</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                  onClick={() => handleOpenLead(lead)}
                >
                  {/* Client name and avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-extrabold text-emerald-600 flex items-center justify-center">
                        {lead.client_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors">{lead.client_name}</h4>
                        <span className="text-[9px] text-zinc-500 tracking-wider uppercase">Lead ID: {lead.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  {/* Email & Phone */}
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-zinc-400" />
                        {lead.email || '-'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-zinc-400" />
                        {lead.phone || '-'}
                      </span>
                    </div>
                  </td>
                  {/* Location & property preference */}
                  <td className="px-6 py-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-zinc-800 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        {lead.preferred_location || 'Not Specified'}
                      </span>
                      <span className="text-zinc-500 text-[10px] pl-4">
                        {lead.property_type || 'Any Property'} • {lead.configuration || 'Any'}
                      </span>
                    </div>
                  </td>
                  {/* Budget */}
                  <td className="px-6 py-4 text-xs font-bold text-emerald-600">
                    {lead.budget_max 
                      ? `$${Number(lead.budget_min || 0).toLocaleString()} - $${Number(lead.budget_max).toLocaleString()}` 
                      : 'No Budget Spec'}
                  </td>
                  {/* Stage badge */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${
                      lead.status === 'New' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : lead.status === 'Contacted' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : lead.status === 'Negotiating' 
                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {lead.status || lead.stage_id || 'New'}
                    </span>
                  </td>
                  {/* Source */}
                  <td className="px-6 py-4 text-[10px] font-semibold text-zinc-500 tracking-wider">
                    {lead.lead_source_id || 'Unknown'}
                  </td>
                  {/* Open details CTA */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenLead(lead); }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 transition-all inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      <span>View</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-zinc-500">
                    No leads found matching query or tab selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Slide-Over Details Drawer */}
      {isDrawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-xs">
          {/* Back click close */}
          <div className="flex-1 cursor-default" onClick={() => setIsDrawerOpen(false)} />
          
          {/* Drawer container */}
          <div className="w-full max-w-md bg-white border-l border-zinc-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-400/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-lg">
                    {selectedLead.client_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{selectedLead.client_name}</h3>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Leads Dashboard</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status Update Actions */}
              <div className="py-4 space-y-2 border-b border-zinc-200">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Update Pipeline Stage</h4>
                <div className="grid grid-cols-4 gap-1.5">
                  {['New', 'Contacted', 'Negotiating', 'Closed'].map((stage) => (
                    <button
                      key={stage}
                      onClick={() => handleUpdateStatus(stage)}
                      className={`py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedLead.status === stage
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details fields */}
              <div className="py-5 space-y-4 text-xs border-b border-zinc-200">
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</span>
                    <a href={`mailto:${selectedLead.email}`} className="text-zinc-700 font-semibold flex items-center gap-1.5 hover:text-emerald-600">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedLead.email || 'None'}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Phone Number</span>
                    <a href={`tel:${selectedLead.phone}`} className="text-zinc-700 font-semibold flex items-center gap-1.5 hover:text-emerald-600">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedLead.phone || 'None'}
                    </a>
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Target Budget</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      {selectedLead.budget_max 
                        ? `${Number(selectedLead.budget_min).toLocaleString()} - ${Number(selectedLead.budget_max).toLocaleString()}`
                        : 'Any Budget'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Location Preference</span>
                    <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedLead.preferred_location || 'Any'}
                    </span>
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Required Setup</span>
                    <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedLead.property_type || 'Villa'} ({selectedLead.configuration || '3 BHK'})
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Source</span>
                    <span className="text-zinc-500 font-semibold">
                      {selectedLead.lead_source_id || 'Direct Inquiry'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes panel */}
              <div className="py-4 space-y-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Interactions Notes</span>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type updates, view details or follow up schedules..."
                  className="w-full h-32 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 resize-none"
                />
                <button 
                  onClick={handleSaveNotes}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold text-zinc-700 uppercase tracking-wider transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-zinc-200 flex items-center gap-2">
              <button 
                onClick={() => alert(`Connecting call to ${selectedLead.client_name}...`)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all"
              >
                Log Call
              </button>
              <button 
                onClick={() => alert(`Emailing brochure to ${selectedLead.email}...`)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
              >
                Send Brochure
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
