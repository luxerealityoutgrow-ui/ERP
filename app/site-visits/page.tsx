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
  const [selectedDay, setSelectedDay] = useState<number>(16); // Default June 16, 2026
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
      client_name: 'Olivia Ryans',
      property_title: 'The Obsidian Villa',
      location: 'Beverly Hills, CA',
      visit_date: 16,
      visit_time: '11:00 AM',
      status: 'Confirmed',
      agent_notes: 'Wants to view the pool deck and automation systems.'
    },
    {
      id: 'visit-2',
      client_name: 'Marcus Vance',
      property_title: 'Elysian Glass Penthouse',
      location: 'Malibu, CA',
      visit_date: 16,
      visit_time: '03:00 PM',
      status: 'Pending',
      agent_notes: 'Awaiting client approval of schedule.'
    },
    {
      id: 'visit-3',
      client_name: 'Sarah Jenkins',
      property_title: 'Minimalist Concrete Haven',
      location: 'Los Angeles, CA',
      visit_date: 18,
      visit_time: '02:00 PM',
      status: 'Confirmed',
      agent_notes: 'Second viewing. Bringing her architect.'
    },
    {
      id: 'visit-4',
      client_name: 'David Kim',
      property_title: 'Serene Coastal Villa',
      location: 'Malibu, CA',
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
    if (dayVisits.some(v => v.status === 'Confirmed')) return 'bg-emerald-400';
    if (dayVisits.some(v => v.status === 'Pending')) return 'bg-amber-400';
    return 'bg-zinc-300';
  };

  // Add site visit
  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !propertyTitle) return;

    const newVisit: SiteVisit = {
      id: `visit-${Date.now()}`,
      client_name: clientName,
      property_title: propertyTitle,
      location: 'Beverly Hills, CA',
      visit_date: selectedDay,
      visit_time: visitTime,
      status: 'Pending',
      agent_notes: notes
    };

    setVisits(prev => [...prev, newVisit]);
    setClientName('');
    setPropertyTitle('');
    setNotes('');
    setIsFormOpen(false);
  };

  // Toggle status
  const updateVisitStatus = (visitId: string, status: 'Confirmed' | 'Pending' | 'Cancelled') => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return { ...v, status };
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-zinc-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-500" />
            Site Visits Schedule
          </h1>
          <p className="text-xs text-zinc-500">
            Coordinate client tours and walkthrough viewings across list properties.
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-xs font-bold text-white hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all"
        >
          <Plus className="h-4 w-4" />
          Schedule Visit
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">June 2026</h3>
              <p className="text-[10px] text-zinc-500">Click on a date grid block to manage appointments.</p>
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="p-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-300 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled className="p-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-300 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Month View */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Weekdays Row */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} className="text-[10px] font-bold text-zinc-400 uppercase py-2">
                {day}
              </span>
            ))}

            {/* Days Grid */}
            {calendarDays.map((day) => {
              const isSelected = selectedDay === day;
              const hasAppts = hasVisits(day);
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square flex flex-col items-center justify-between p-2 rounded-xl border transition-all relative ${
                    isSelected 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold' 
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  {/* Indicator Dot */}
                  {hasAppts && (
                    <span className={`h-1.5 w-1.5 rounded-full ${getDayDotStyle(day)} animate-pulse`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-3.5 border-t border-zinc-100 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Confirmed Tour</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Pending Schedule</span>
            </div>
          </div>

        </div>

        {/* Right Column: Day View Agenda (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Agenda — June {selectedDay}, 2026
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Visits scheduled for selected calendar day.</p>
          </div>

          {/* Agenda Feed */}
          <div className="space-y-3">
            {selectedDayVisits.map((visit) => (
              <div 
                key={visit.id}
                className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 space-y-3.5 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8.5 w-8.5 rounded bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">{visit.client_name}</h4>
                      <p className="text-[9px] text-zinc-500 tracking-wider uppercase">Tours: {visit.property_title}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                    visit.status === 'Confirmed' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : visit.status === 'Pending' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="flex items-center gap-2 text-zinc-600">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    {visit.visit_time} (YTD Appointment)
                  </span>
                  <span className="flex items-center gap-2 text-zinc-600">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    {visit.location}
                  </span>
                  {visit.agent_notes && (
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 italic leading-relaxed">
                      Notes: {visit.agent_notes}
                    </div>
                  )}
                </div>

                {/* Status Interactivity buttons */}
                {visit.status !== 'Cancelled' && (
                  <div className="pt-2 flex items-center gap-2">
                    {visit.status === 'Pending' && (
                      <button 
                        onClick={() => updateVisitStatus(visit.id, 'Confirmed')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="h-3 w-3" />
                        Confirm
                      </button>
                    )}
                    <button 
                      onClick={() => updateVisitStatus(visit.id, 'Cancelled')}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-500 hover:text-red-500 hover:bg-red-50 uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                    >
                      <X className="h-3 w-3" />
                      Cancel visit
                    </button>
                  </div>
                )}
              </div>
            ))}

            {selectedDayVisits.length === 0 && (
              <div className="py-12 text-center text-xs text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                <AlertCircle className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                No viewing tours scheduled for June {selectedDay}.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <form 
            onSubmit={handleCreateVisit}
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900">Schedule Tour (June {selectedDay})</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Client Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Client fullname"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Select Listing Property</label>
                <input 
                  type="text" 
                  required
                  placeholder="Property name (e.g. Obsidian Villa)"
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Visit Time</label>
                  <input 
                    type="text" 
                    required
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Selected Month</label>
                  <span className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-500 block">
                    June {selectedDay}, 2026
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Appointment Notes</label>
                <textarea
                  placeholder="Specific client requirements for visitation tour..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 font-bold text-white hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all"
              >
                Schedule Visit
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
