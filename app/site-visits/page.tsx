"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Home,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SiteVisit {
  id: string;
  lead_id?: string;
  property_id?: string;
  client_name: string;
  property_title: string;
  location: string;
  visit_date: number; // day of June 2026
  visit_time: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  agent_notes: string;
}

export default function SiteVisitsPage() {
  const [selectedDay, setSelectedDay] = useState<number>(17); // Default June 17, 2026
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form input states
  const [visitTime, setVisitTime] = useState('02:00 PM');
  const [notes, setNotes] = useState('');

  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: visitsData } = await supabase
          .from('site_visits')
          .select(`
            *,
            leads (
              id,
              client_name
            ),
            properties (
              id,
              title,
              location
            )
          `)
          .order('visit_date', { ascending: true });

        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, client_name')
          .eq('is_active', true)
          .order('client_name');

        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, location')
          .eq('is_active', true)
          .order('title');

        if (leadsData) setLeadsList(leadsData);
        if (propsData) setPropertiesList(propsData);

        if (visitsData) {
          const mapped: SiteVisit[] = visitsData.map((v: any) => {
            const dateParts = v.visit_date ? v.visit_date.split('-') : [];
            const dayNum = dateParts.length === 3 ? parseInt(dateParts[2], 10) : 17;
            return {
              id: v.id,
              lead_id: v.lead_id,
              property_id: v.property_id,
              client_name: v.leads?.client_name || 'Unknown Client',
              property_title: v.properties?.title || 'Unknown Property',
              location: v.properties?.location || 'TBD',
              visit_date: dayNum,
              visit_time: v.visit_time || '02:00 PM',
              status: (v.status === 'Confirmed' || v.status === 'Scheduled' ? 'Confirmed' : (v.status === 'Cancelled' ? 'Cancelled' : 'Pending')) as 'Confirmed' | 'Pending' | 'Cancelled',
              agent_notes: v.outcome || v.client_feedback || 'No additional notes.'
            };
          });
          setVisits(mapped);
        } else {
          setVisits([]);
        }
      } catch (err) {
        console.error('Error loading site visits:', err);
        setVisits([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateStatus = async (visitId: string, newStatus: 'Confirmed' | 'Cancelled') => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
    try {
      await supabase
        .from('site_visits')
        .update({ status: newStatus })
        .eq('id', visitId);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // June 2026 calendar configuration
  // June 1, 2026 is a Monday. June has 30 days.
  const daysInJune = 30;
  const calendarOffset = 0; // Monday starts at index 0 in our layout

  const calendarDays = Array.from({ length: daysInJune }, (_, i) => i + 1);

  // Get visits for selected day
  const selectedDayVisits = visits.filter(v => v.visit_date === selectedDay);

  // Check if a day has any visits
  const hasVisits = (day: number) => {
    return visits.some(v => v.visit_date === day);
  };

  // Check status color for dots
  const getDayDotStyle = (day: number) => {
    const dayVisits = visits.filter(v => v.visit_date === day);
    if (dayVisits.some(v => v.status === 'Cancelled')) return 'bg-rose-500';
    if (dayVisits.some(v => v.status === 'Pending')) return 'bg-amber-500';
    return 'bg-zinc-500';
  };

  // Handle visit submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedPropertyId) return;

    const leadObj = leadsList.find(l => l.id === selectedLeadId);
    const propObj = propertiesList.find(p => p.id === selectedPropertyId);
    const formattedDate = `2026-06-${selectedDay.toString().padStart(2, '0')}`;

    const newVisitData = {
      lead_id: selectedLeadId,
      property_id: selectedPropertyId,
      visit_date: formattedDate,
      visit_time: visitTime,
      status: 'Pending',
      outcome: notes
    };

    try {
      const { data, error } = await supabase
        .from('site_visits')
        .insert([newVisitData])
        .select(`
          *,
          leads (
            id,
            client_name
          ),
          properties (
            id,
            title,
            location
          )
        `)
        .single();

      if (data) {
        const mappedNew = {
          id: data.id,
          lead_id: data.lead_id,
          property_id: data.property_id,
          client_name: data.leads?.client_name || leadObj?.client_name || 'Unknown',
          property_title: data.properties?.title || propObj?.title || 'Unknown',
          location: data.properties?.location || propObj?.location || 'TBD',
          visit_date: selectedDay,
          visit_time: data.visit_time,
          status: 'Pending' as const,
          agent_notes: data.outcome || 'No additional notes.'
        };
        setVisits(prev => [...prev, mappedNew]);
      }
    } catch (err) {
      console.error('Error scheduling visit:', err);
    }

    setIsFormOpen(false);
    setSelectedLeadId('');
    setSelectedPropertyId('');
    setVisitTime('02:00 PM');
    setNotes('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-zinc-900">
      


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px]">
        {/* Calendar View */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-zinc-900">June 2026</h3>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <div key={`${day}-${idx}`} className="h-8 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square flex flex-col items-center justify-between p-2 rounded-xl border transition-all relative ${
                  selectedDay === day 
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-900/10' 
                    : 'bg-white border-transparent hover:border-zinc-200 text-zinc-600'
                }`}
              >
                <span className="text-xs font-bold">{day}</span>
                {hasVisits(day) && (
                  <span className={`h-1.5 w-1.5 rounded-full ${getDayDotStyle(day)} animate-pulse`} />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-zinc-500" />
              Confirmed Viewing
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              Pending Confirmation
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              Cancelled Visit
            </div>
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">
              Agenda for June {selectedDay}, 2026
            </h3>
            <span className="text-[10px] font-bold text-zinc-600">{selectedDayVisits.length} viewings scheduled</span>
          </div>

          <div className="space-y-3">
            {selectedDayVisits.map((visit) => (
              <div 
                key={visit.id}
                className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:border-zinc-500/30 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-50 transition-colors">
                      <Clock className="h-6 w-6 text-zinc-400 group-hover:text-zinc-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-zinc-900">{visit.visit_time}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                          visit.status === 'Confirmed' ? 'bg-zinc-50 text-zinc-600 border border-zinc-100' :
                          visit.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {visit.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        {visit.client_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 md:px-8">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 mb-1">
                      <Home className="h-3.5 w-3.5 text-zinc-500" />
                      {visit.property_title}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      {visit.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(visit.id, 'Confirmed')}
                      className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-500 hover:border-zinc-500 transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(visit.id, 'Cancelled')}
                      className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {visit.agent_notes && (
                  <div className="mt-5 pt-5 border-t border-zinc-50 flex gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic">
                      &quot;{visit.agent_notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}

            {selectedDayVisits.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 text-zinc-300">
                <Calendar className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">No viewings scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900">Schedule New Viewing</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Client Lead</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {leadsList.map(l => (
                    <option key={l.id} value={l.id}>{l.client_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Property Listing</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all cursor-pointer"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">Select a listing...</option>
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Date</label>
                  <div className="w-full px-4 py-3 rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-bold text-zinc-500 cursor-not-allowed">
                    June {selectedDay}, 2026
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Time</label>
                  <input 
                    type="text" 
                    required
                    placeholder="10:00 AM"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Special Instructions</label>
                <textarea 
                  className="w-full h-24 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all resize-none"
                  placeholder="Any specific focus areas for the viewing?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-zinc-600 text-white text-xs font-bold hover:bg-zinc-500 transition-all shadow-lg shadow-zinc-500/20"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
