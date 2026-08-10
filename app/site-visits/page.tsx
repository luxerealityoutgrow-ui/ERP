"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Home,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';

interface SiteVisit {
  id: string;
  lead_id?: string;
  property_id?: string;
  client_name: string;
  property_title: string;
  location: string;
  visit_date_raw: string; // YYYY-MM-DD
  visit_time: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  agent_notes: string;
  reschedule_reason?: string;
}

interface FollowUp {
  id: string; // lead id
  client_name: string;
  phone: string;
  followup_date_raw: string; // YYYY-MM-DD
  status: string; // lead status: Hot / Warm / etc
  assigned_to?: string;
  notes: string;
}

// Utility: format Date object to YYYY-MM-DD string
function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SiteVisitsPage() {
  const profile = useProfile();
  const perms = getPermissions(profile?.role);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'all' | 'followups'>('calendar');

  // Reschedule Modal State
  const [rescheduleVisit, setRescheduleVisit] = useState<SiteVisit | null>(null);
  const [rescheduleDateStr, setRescheduleDateStr] = useState(() => formatDateKey(new Date()));
  const [rescheduleTime, setRescheduleTime] = useState('03:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Follow-Up Reschedule Modal State
  const [rescheduleFollowup, setRescheduleFollowup] = useState<FollowUp | null>(null);
  const [rescheduleFollowupDateStr, setRescheduleFollowupDateStr] = useState(() => formatDateKey(new Date()));
  
  // Form input states
  const [newVisitDateStr, setNewVisitDateStr] = useState(() => formatDateKey(new Date()));
  const [visitTime, setVisitTime] = useState('02:00 PM');
  const [notes, setNotes] = useState('');

  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Synchronize new visit date str with selected date
  useEffect(() => {
    setNewVisitDateStr(formatDateKey(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      setLoading(true);
      try {
        const isManager = perms.canViewAllCalendar || profile.role === 'Admin' || profile.role === 'SuperAdmin';

        // 1. Fetch site visits based on role
        let visitsQuery = supabase
          .from('site_visits')
          .select(`
            *,
            leads (
              id,
              client_name,
              assigned_to
            ),
            properties (
              id,
              title,
              location
            )
          `)
          .order('visit_date', { ascending: true });

        if (!isManager && profile.id) {
          visitsQuery = visitsQuery.eq('assigned_to', profile.id);
        }

        const { data: visitsData } = await visitsQuery;

        // 2. Fetch leads for dropdown based on role
        let leadsQuery = supabase
          .from('leads')
          .select('id, client_name, assigned_to')
          .eq('is_active', true)
          .order('client_name');

        if (!isManager && profile.id) {
          leadsQuery = leadsQuery.eq('assigned_to', profile.id);
        }

        const { data: leadsData } = await leadsQuery;

        // 2b. Fetch leads with a scheduled follow-up date, same role scoping as visits/leads above
        let followupsQuery = supabase
          .from('leads')
          .select('id, client_name, phone, next_followup_date, status, assigned_to, notes')
          .not('next_followup_date', 'is', null)
          .order('next_followup_date', { ascending: true });

        if (!isManager && profile.id) {
          followupsQuery = followupsQuery.eq('assigned_to', profile.id);
        }

        const { data: followupsData } = await followupsQuery;

        if (followupsData) {
          setFollowUps(followupsData.map((l: any) => ({
            id: l.id,
            client_name: l.client_name,
            phone: l.phone || '',
            followup_date_raw: l.next_followup_date,
            status: l.status || 'Hot',
            assigned_to: l.assigned_to,
            notes: l.notes || ''
          })));
        } else {
          setFollowUps([]);
        }

        // 3. Fetch properties for dropdown
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, title, location')
          .eq('is_active', true)
          .order('title');

        if (leadsData) setLeadsList(leadsData);
        if (propsData) setPropertiesList(propsData);

        if (visitsData) {
          const mapped: SiteVisit[] = visitsData.map((v: any) => {
            return {
              id: v.id,
              lead_id: v.lead_id,
              property_id: v.property_id,
              client_name: v.leads?.client_name || 'Unknown Client',
              property_title: v.properties?.title || 'Unknown Property',
              location: v.properties?.location || 'TBD',
              visit_date_raw: v.visit_date || '2026-06-17',
              visit_time: v.visit_time || '02:00 PM',
              status: (v.status === 'Confirmed' || v.status === 'Scheduled' ? 'Confirmed' : (v.status === 'Cancelled' ? 'Cancelled' : 'Pending')) as 'Confirmed' | 'Pending' | 'Cancelled',
              agent_notes: v.outcome || v.client_feedback || 'No additional notes.',
              reschedule_reason: v.next_action || ''
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
  }, [profile, perms.canViewAllCalendar]);

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

  const handleOpenReschedule = (visit: SiteVisit) => {
    setRescheduleVisit(visit);
    setRescheduleDateStr(visit.visit_date_raw || formatDateKey(new Date()));
    setRescheduleTime(visit.visit_time || '03:00 PM');
    setRescheduleReason(visit.reschedule_reason || '');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleVisit) return;

    // Optimistic update
    setVisits(prev => prev.map(v => v.id === rescheduleVisit.id ? {
      ...v,
      visit_date_raw: rescheduleDateStr,
      visit_time: rescheduleTime,
      reschedule_reason: rescheduleReason,
      agent_notes: rescheduleReason ? `Rescheduled: ${rescheduleReason}` : v.agent_notes
    } : v));

    try {
      await supabase
        .from('site_visits')
        .update({
          visit_date: rescheduleDateStr,
          visit_time: rescheduleTime,
          next_action: rescheduleReason,
          outcome: rescheduleReason ? `Rescheduled to ${rescheduleDateStr}. Reason: ${rescheduleReason}` : rescheduleVisit.agent_notes
        })
        .eq('id', rescheduleVisit.id);
    } catch (err) {
      console.error('Error rescheduling visit:', err);
    }

    setRescheduleVisit(null);
  };

  const handleMarkFollowupDone = async (leadId: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== leadId));
    try {
      await supabase.from('leads').update({ next_followup_date: null }).eq('id', leadId);
    } catch (err) {
      console.error('Error clearing follow-up date:', err);
    }
  };

  const handleOpenRescheduleFollowup = (item: FollowUp) => {
    setRescheduleFollowup(item);
    setRescheduleFollowupDateStr(item.followup_date_raw || formatDateKey(new Date()));
  };

  const handleRescheduleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleFollowup) return;

    setFollowUps(prev => prev.map(f => f.id === rescheduleFollowup.id ? { ...f, followup_date_raw: rescheduleFollowupDateStr } : f));

    try {
      await supabase
        .from('leads')
        .update({ next_followup_date: rescheduleFollowupDateStr })
        .eq('id', rescheduleFollowup.id);
    } catch (err) {
      console.error('Error rescheduling follow-up:', err);
    }

    setRescheduleFollowup(null);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), monthIndex, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentMonthDate(prev => new Date(year, prev.getMonth(), 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // ── DYNAMIC CALENDAR GRID COMPUTATION ──
  const currYear = currentMonthDate.getFullYear();
  const currMonth = currentMonthDate.getMonth();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(currYear, currMonth, 1).getDay();
  // Monday start offset: 0 for Mon, 1 for Tue, ..., 6 for Sun
  const startOffset = (firstDayIndex + 6) % 7;

  const totalDaysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(currYear, currMonth, 0).getDate();

  interface CalendarCell {
    date: Date;
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
  }

  const calendarGrid: CalendarCell[] = [];

  // Previous month padding cells
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = totalDaysInPrevMonth - i;
    const date = new Date(currYear, currMonth - 1, dayNum);
    calendarGrid.push({
      date,
      dateStr: formatDateKey(date),
      dayNum,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const date = new Date(currYear, currMonth, dayNum);
    calendarGrid.push({
      date,
      dateStr: formatDateKey(date),
      dayNum,
      isCurrentMonth: true
    });
  }

  // Next month padding cells to complete 35 or 42 grid cells
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const date = new Date(currYear, currMonth + 1, dayNum);
    calendarGrid.push({
      date,
      dateStr: formatDateKey(date),
      dayNum,
      isCurrentMonth: false
    });
  }

  // Selected date matching
  const selectedDateStr = formatDateKey(selectedDate);
  const selectedDayVisits = visits.filter(v => v.visit_date_raw === selectedDateStr);
  const selectedDayFollowups = followUps.filter(f => f.followup_date_raw === selectedDateStr);

  const hasVisitsOnDate = (dateStr: string) => {
    return visits.some(v => v.visit_date_raw === dateStr);
  };

  const hasFollowupsOnDate = (dateStr: string) => {
    return followUps.some(f => f.followup_date_raw === dateStr);
  };

  const getDayDotStyle = (dateStr: string) => {
    const dayVisits = visits.filter(v => v.visit_date_raw === dateStr);
    if (dayVisits.some(v => v.status === 'Cancelled')) return 'bg-rose-500';
    if (dayVisits.some(v => v.status === 'Pending')) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  // Handle visit submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedPropertyId) return;

    const leadObj = leadsList.find(l => l.id === selectedLeadId);
    const propObj = propertiesList.find(p => p.id === selectedPropertyId);

    const newVisitData = {
      lead_id: selectedLeadId,
      property_id: selectedPropertyId,
      visit_date: newVisitDateStr,
      visit_time: visitTime,
      status: 'Pending',
      outcome: notes
    };

    try {
      const { data } = await supabase
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
        const mappedNew: SiteVisit = {
          id: data.id,
          lead_id: data.lead_id,
          property_id: data.property_id,
          client_name: data.leads?.client_name || leadObj?.client_name || 'Unknown Client',
          property_title: data.properties?.title || propObj?.title || 'Unknown Property',
          location: data.properties?.location || propObj?.location || 'TBD',
          visit_date_raw: data.visit_date || newVisitDateStr,
          visit_time: data.visit_time || visitTime,
          status: 'Pending',
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

  // Years array for selector (2024 to 2030)
  const availableYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="w-full space-y-6 pb-20 text-zinc-900 text-left">
      
      {/* ── UNIFIED PORCELAIN CARD FRAME (Direction C Signature) ── */}
      <div className="bg-white border border-[#e8e7e4] rounded-[20px] shadow-xs overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 md:px-8 border-b border-[#ebebeb] flex items-center justify-end gap-4">
          <div className="flex items-center gap-3">
            {/* View Mode Segmented Controls */}
            <div className="flex bg-[#f0f0ee] p-1 rounded-xl border border-[#e5e5e3]">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Calendar View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                All Visits ({visits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('followups')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'followups'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Follow-Ups ({followUps.length})
              </button>
            </div>

            {/* Schedule New Visit Action Button */}
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="dc-btn gold font-extrabold text-[11px] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Schedule Visit
            </button>
          </div>
        </div>

        {/* ── CALENDAR VIEW MODE ── */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            
            {/* Column 1: Month Calendar Navigator (4 cols) */}
            <div className="lg:col-span-4 border-r border-[#ebebeb] p-6 flex flex-col justify-between bg-white">
              <div>
                
                {/* Month & Year Selectors Bar */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5">
                    {/* Month Select */}
                    <select
                      value={currMonth}
                      onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                      className="text-[13px] font-extrabold text-zinc-900 bg-transparent border-none focus:outline-none cursor-pointer hover:text-[#b8922e] transition-colors"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>

                    {/* Year Select */}
                    <select
                      value={currYear}
                      onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                      className="text-[13px] font-extrabold text-zinc-600 bg-transparent border-none focus:outline-none cursor-pointer hover:text-zinc-900 transition-colors"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleJumpToToday}
                      className="px-2 py-1 text-[9.5px] font-extrabold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors mr-1"
                      title="Jump to Today"
                    >
                      Today
                    </button>
                    <button 
                      type="button" 
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
                      title="Next Month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Labels (Monday start) */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <div key={`${day}-${idx}`} className="h-7 flex items-center justify-center text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarGrid.map((cell, idx) => {
                    const isSelected = selectedDateStr === cell.dateStr;
                    const dayHasVisits = hasVisitsOnDate(cell.dateStr);
                    const dayHasFollowups = hasFollowupsOnDate(cell.dateStr);

                    return (
                      <button
                        key={`${cell.dateStr}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cell.date);
                          if (!cell.isCurrentMonth) {
                            setCurrentMonthDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                          }
                        }}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all relative ${
                          isSelected
                            ? 'bg-[#fffdf5] border-[#d4ad4d] text-[#b8922e] font-extrabold shadow-2xs'
                            : cell.isCurrentMonth
                            ? 'bg-white border-[#f0f0ee] hover:border-zinc-300 text-zinc-800 font-bold'
                            : 'bg-zinc-50/60 border-transparent text-zinc-300 font-medium'
                        }`}
                      >
                        <span className="text-[11px]">{cell.dayNum}</span>
                        {(dayHasVisits || dayHasFollowups) && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {dayHasVisits && <div className={`w-1.5 h-1.5 rounded-full ${getDayDotStyle(cell.dateStr)}`} />}
                            {dayHasFollowups && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Legend */}
              <div className="mt-8 pt-5 border-t border-[#f5f5f3] space-y-2.5">
                <div className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-widest mb-1">Status Legend</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  Confirmed Viewing
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Pending Confirmation (Default)
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Cancelled Visit
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Lead Follow-Up Due
                </div>
              </div>
            </div>

            {/* Column 2: Selected Day Agenda & Action Toolbar (8 cols) */}
            <div className="lg:col-span-8 p-6 md:p-8 bg-[#fafaf8]/50 space-y-5">
              
              <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
                <div>
                  <h3 className="text-[13px] font-extrabold text-zinc-900 uppercase tracking-wider">
                    Agenda · {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    Showing all property tours scheduled for this date
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white border border-[#e8e7e4] text-[#d4ad4d]">
                  {selectedDayVisits.length} {selectedDayVisits.length === 1 ? 'tour' : 'tours'} scheduled
                </span>
              </div>

              {/* Agenda Cards List */}
              <div className="space-y-4">
                {selectedDayVisits.map((visit) => (
                  <div 
                    key={visit.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-4 hover:border-[#d4ad4d]/40 ${
                      visit.status === 'Confirmed' ? 'border-l-4 border-l-emerald-600 border-t border-r border-b border-[#e8e7e4]' :
                      visit.status === 'Cancelled' ? 'border-l-4 border-l-rose-500 border-t border-r border-b border-[#e8e7e4]' :
                      'border-l-4 border-l-amber-500 border-t border-r border-b border-[#e8e7e4]'
                    }`}
                  >
                    {/* Top Row: Time & Status Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span className="text-[13px] font-extrabold text-zinc-900">{visit.visit_time}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                        visit.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        visit.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {visit.status === 'Confirmed' ? '✓ Confirmed Viewing' :
                         visit.status === 'Cancelled' ? '✕ Cancelled Visit' :
                         '● Pending Confirmation'}
                      </span>
                    </div>

                    {/* Middle Grid: Client Lead + Property details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y border-[#f5f5f3]">
                      <div className="space-y-1">
                        <div className="text-[8.5px] font-extrabold text-zinc-300 uppercase tracking-wider">Client Lead</div>
                        <div className="text-[12px] font-extrabold text-zinc-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {visit.client_name}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[8.5px] font-extrabold text-zinc-300 uppercase tracking-wider">Property Listing</div>
                        <div className="text-[12px] font-extrabold text-zinc-900 flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5 text-zinc-400" />
                          {visit.property_title}
                        </div>
                        <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-300" />
                          {visit.location}
                        </div>
                      </div>
                    </div>

                    {/* Notes Box */}
                    {visit.agent_notes && (
                      <div className="bg-[#fafaf8] border border-[#ebebeb] rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10.5px] text-zinc-600 font-medium italic leading-relaxed">
                          &quot;{visit.agent_notes}&quot;
                        </p>
                      </div>
                    )}

                    {/* Bottom Action Bar: Confirm, Reschedule, Cancel */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[9px] font-extrabold text-zinc-300 uppercase tracking-wider">Viewing Controls</span>
                      <div className="flex items-center gap-2">
                        {visit.status !== 'Confirmed' && (
                          <button 
                            type="button"
                            onClick={() => handleUpdateStatus(visit.id, 'Confirmed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-extrabold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm Visit
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleOpenReschedule(visit)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#e8e7e4] text-zinc-700 text-[10.5px] font-extrabold hover:bg-zinc-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-[#d4ad4d]" />
                          Reschedule
                        </button>
                        {visit.status !== 'Cancelled' && (
                          <button 
                            type="button"
                            onClick={() => handleUpdateStatus(visit.id, 'Cancelled')}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-extrabold hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}

                {selectedDayVisits.length === 0 && selectedDayFollowups.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-[#ebebeb] text-zinc-400 space-y-2">
                    <CalendarIcon className="h-10 w-10 text-zinc-300" />
                    <p className="text-[12px] font-bold text-zinc-600">No viewings or follow-ups scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[10px] text-zinc-400">Click &quot;Schedule Visit&quot; above to add a new client tour</p>
                  </div>
                )}
              </div>

              {/* Lead Follow-Ups Due This Day */}
              {selectedDayFollowups.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-[#ebebeb] pt-4">
                    <h4 className="text-[11px] font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Lead Follow-Ups Due
                    </h4>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white border border-[#e8e7e4] text-blue-700">
                      {selectedDayFollowups.length} due
                    </span>
                  </div>
                  {selectedDayFollowups.map((f) => (
                    <div key={f.id} className="bg-white border border-l-4 border-l-blue-500 border-t-[#e8e7e4] border-r-[#e8e7e4] border-b-[#e8e7e4] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[12px] font-extrabold text-zinc-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {f.client_name}
                        </div>
                        <div className="text-[10px] font-medium text-zinc-400 mt-0.5">{f.phone} · Status: {f.status}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMarkFollowupDone(f.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-extrabold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark Done
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRescheduleFollowup(f)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#e8e7e4] text-zinc-700 text-[10.5px] font-extrabold hover:bg-zinc-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-[#d4ad4d]" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ── ALL VISITS TABLE VIEW MODE ── */}
        {activeTab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#ebebeb]">
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Client Lead</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Property Listing</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Instructions</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f3]">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-[#fafaf8]/80 transition-colors">
                    <td className="py-4 px-6 text-[11.5px] font-extrabold text-zinc-900">
                      {v.visit_date_raw}
                      <div className="text-[10px] font-medium text-zinc-400">{v.visit_time}</div>
                    </td>
                    <td className="py-4 px-6 text-[11.5px] font-extrabold text-zinc-900">
                      {v.client_name}
                    </td>
                    <td className="py-4 px-6 text-[11.5px] font-extrabold text-zinc-900">
                      {v.property_title}
                      <div className="text-[10px] font-medium text-zinc-400">{v.location}</div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={v.status}
                        onChange={(e) => handleUpdateStatus(v.id, e.target.value as 'Confirmed' | 'Cancelled')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border cursor-pointer focus:outline-none ${
                          v.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          v.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="Pending">Pending Confirmation</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-[10.5px] font-medium text-zinc-500 max-w-xs truncate">
                      {v.agent_notes}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(v)}
                          className="px-2.5 py-1 rounded-lg border border-[#e8e7e4] text-zinc-700 text-[10px] font-bold hover:bg-zinc-50"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(v.id, 'Cancelled')}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── LEAD FOLLOW-UPS TABLE VIEW MODE ── */}
        {activeTab === 'followups' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf8] border-b border-[#ebebeb]">
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Follow-Up Date</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Client Lead</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f3]">
                {followUps.map((f) => {
                  const isOverdue = f.followup_date_raw < formatDateKey(new Date());
                  return (
                    <tr key={f.id} className="hover:bg-[#fafaf8]/80 transition-colors">
                      <td className={`py-4 px-6 text-[11.5px] font-extrabold ${isOverdue ? 'text-rose-600' : 'text-zinc-900'}`}>
                        {f.followup_date_raw}
                        {isOverdue && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mt-0.5">Overdue</div>}
                      </td>
                      <td className="py-4 px-6 text-[11.5px] font-extrabold text-zinc-900">{f.client_name}</td>
                      <td className="py-4 px-6 text-[11px] font-medium text-zinc-500">{f.phone}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">
                          {f.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/leads/${f.id}`}
                            className="px-2.5 py-1 rounded-lg border border-[#e8e7e4] text-zinc-700 text-[10px] font-bold hover:bg-zinc-50"
                          >
                            View Lead
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenRescheduleFollowup(f)}
                            className="px-2.5 py-1 rounded-lg border border-[#e8e7e4] text-zinc-700 text-[10px] font-bold hover:bg-zinc-50"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkFollowupDone(f.id)}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100"
                          >
                            Mark Done
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {followUps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-xs font-semibold text-zinc-400">
                      No lead follow-ups scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── SCHEDULE NEW VIEWING FORM MODAL ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#e8e7e4] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafaf8]">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">Schedule New Site Tour</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Tour will be saved as Pending Confirmation by default</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Client Lead *</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {leadsList.map(l => (
                    <option key={l.id} value={l.id}>{l.client_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Property Listing *</label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">Select a listing...</option>
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Tour Date *</label>
                  <input
                    type="date"
                    required
                    value={newVisitDateStr}
                    onChange={(e) => setNewVisitDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Tour Time *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="02:30 PM"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Instructions / Focus Areas</label>
                <textarea 
                  className="w-full h-20 px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-medium text-zinc-800 focus:outline-none focus:border-[#d4ad4d] resize-none"
                  placeholder="E.g., Client wants to inspect parking bay & clubhouse..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Explicit Default Status note */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-extrabold text-amber-800">
                  Initial Status: Pending Confirmation
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ebebeb]">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#e8e7e4] text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#d4ad4d] text-white text-xs font-extrabold hover:bg-[#b8922e] transition-all shadow-2xs"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE VIEWING MODAL ── */}
      {rescheduleVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#e8e7e4] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafaf8]">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">Reschedule Site Viewing</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Updating viewing date for {rescheduleVisit.client_name}</p>
              </div>
              <button type="button" onClick={() => setRescheduleVisit(null)} className="p-1.5 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Property Listing</label>
                <div className="px-3 py-2 rounded-xl bg-[#fafaf8] border border-[#e8e7e4] text-xs font-bold text-zinc-700">
                  {rescheduleVisit.property_title} ({rescheduleVisit.location})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">New Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDateStr}
                    onChange={(e) => setRescheduleDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">New Time *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">Reschedule Reason / Next Steps</label>
                <textarea 
                  className="w-full h-20 px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-medium text-zinc-800 focus:outline-none focus:border-[#d4ad4d] resize-none"
                  placeholder="E.g., Client requested afternoon postponement..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ebebeb]">
                <button 
                  type="button"
                  onClick={() => setRescheduleVisit(null)}
                  className="px-4 py-2 rounded-xl border border-[#e8e7e4] text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#d4ad4d] text-white text-xs font-extrabold hover:bg-[#b8922e] transition-all shadow-2xs"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE FOLLOW-UP MODAL ── */}
      {rescheduleFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#e8e7e4] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafaf8]">
              <div>
                <h3 className="text-[14px] font-extrabold text-zinc-900">Reschedule Lead Follow-Up</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Updating follow-up date for {rescheduleFollowup.client_name}</p>
              </div>
              <button type="button" onClick={() => setRescheduleFollowup(null)} className="p-1.5 hover:bg-zinc-200/50 rounded-lg transition-colors text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleFollowupSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase tracking-wider">New Follow-Up Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleFollowupDateStr}
                  onChange={(e) => setRescheduleFollowupDateStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e7e4] text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#d4ad4d]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ebebeb]">
                <button
                  type="button"
                  onClick={() => setRescheduleFollowup(null)}
                  className="px-4 py-2 rounded-xl border border-[#e8e7e4] text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#d4ad4d] text-white text-xs font-extrabold hover:bg-[#b8922e] transition-all shadow-2xs"
                >
                  Save Follow-Up Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
