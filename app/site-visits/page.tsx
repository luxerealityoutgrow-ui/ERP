"use client";

import React, { useState } from 'react';
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

interface SiteVisit {
  id: string;
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
  const [clientName, setClientName] = useState('');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [visitTime, setVisitTime] = useState('02:00 PM');
  const [notes, setNotes] = useState('');

  // Initial visits state (for June 2026)
  const [visits, setVisits] = useState<SiteVisit[]>([
    {
      id: 'visit-1',
      client_name: 'Ananya Sharma',
      property_title: 'Vivencia',
      location: 'Kalyani Nagar, Pune',
      visit_date: 17,
      visit_time: '11:00 AM',
      status: 'Confirmed',
      agent_notes: 'Wants to view the pool deck and automation systems.'
    },
    {
      id: 'visit-2',
      client_name: 'Vikram Malhotra',
      property_title: 'Power Heights Penthouse',
      location: 'Koregaon Park, Pune',
      visit_date: 17,
      visit_time: '03:00 PM',
      status: 'Pending',
      agent_notes: 'Awaiting client approval of schedule.'
    },
    {
      id: 'visit-3',
      client_name: 'Rajesh Gupta',
      property_title: 'Vivencia',
      location: 'Baner, Pune',
      visit_date: 18,
      visit_time: '02:00 PM',
      status: 'Confirmed',
      agent_notes: 'Second viewing. Bringing his architect.'
    },
    {
      id: 'visit-4',
      client_name: 'Deepika Rao',
      property_title: 'NYATI Evoque',
      location: 'Viman Nagar, Pune',
      visit_date: 20,
      visit_time: '10:30 AM',
      status: 'Cancelled',
      agent_notes: 'Rescheduled due to client flight conflict.'
    }
  ]);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit: SiteVisit = {
      id: `visit-${Date.now()}`,
      client_name: clientName,
      property_title: propertyTitle,
      location: 'TBD',
      visit_date: selectedDay,
      visit_time: visitTime,
      status: 'Pending',
      agent_notes: notes
    };
    setVisits([...visits, newVisit]);
    setIsFormOpen(false);
    // Reset form
    setClientName('');
    setPropertyTitle('');
    setVisitTime('02:00 PM');
    setNotes('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-900 text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Site Viewing Schedule</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">June 2026 • Manage and track property tours for your high-intent leads.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-600 text-white rounded-xl text-xs font-bold hover:bg-zinc-500 transition-all shadow-md shadow-zinc-500/10"
        >
          <Plus className="h-4 w-4" />
          Schedule Visit
        </button>
      </div>

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
                    <button className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-500 hover:border-zinc-500 transition-all">
                      <Check className="h-4 w-4" />
                    </button>
                    <button className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:border-rose-500 transition-all">
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Client Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Property</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Vivencia"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                />
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
