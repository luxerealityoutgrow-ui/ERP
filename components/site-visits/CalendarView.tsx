"use client";

import React, { useState, useMemo } from 'react';
import { SiteVisit } from '@/lib/siteVisits';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Building,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export function CalendarView({ visits }: { visits: SiteVisit[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get name of the month
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  // Get calendar grid days
  const calendarCells = useMemo(() => {
    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Fill previous month days (greyed out)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Fill current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Fill next month days to complete grid (multiples of 7)
    const remaining = 42 - cells.length; // 6 rows of 7 days
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return cells;
  }, [year, month]);

  // Group visits by date for fast lookup
  const visitsByDate = useMemo(() => {
    const map: Record<string, SiteVisit[]> = {};
    visits.forEach(v => {
      if (v.visit_date) {
        const dStr = v.visit_date.split('T')[0];
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(v);
      }
    });
    return map;
  }, [visits]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Visits scheduled for selected date
  const selectedDateVisits = visitsByDate[selectedDateStr] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-[#1f1f1f]">
      
      {/* ── LEFT PANEL: INTERACTIVE MONTHLY GRID (Col Span 8) ── */}
      <div className="lg:col-span-8 bg-white border border-[#e7e7e7] rounded-[14px] p-5 shadow-xs flex flex-col justify-between">
        
        {/* Calendar Header Nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-lg font-bold text-zinc-900">{monthName} {year}</h2>
            <p className="text-[10px] text-[#888888] font-semibold mt-0.5">Click any day cell to filter scheduled viewings.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 border border-[#e7e7e7] text-zinc-700 hover:bg-[#f6f6f6] rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
            >
              Today
            </button>
            <div className="flex items-center border border-[#e7e7e7] rounded-lg bg-white overflow-hidden">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[#f6f6f6] text-[#5d5d5d] border-r border-[#e7e7e7] transition-all cursor-pointer bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[#f6f6f6] text-[#5d5d5d] transition-all cursor-pointer bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-px text-center mb-1 bg-[#f9fafb] border border-[#e7e7e7] rounded-t-lg py-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <span key={day} className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{day}</span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#e7e7e7] border border-[#e7e7e7] rounded-b-lg overflow-hidden">
          {calendarCells.map((cell, index) => {
            const dayVisits = visitsByDate[cell.dateStr] || [];
            const isSelected = selectedDateStr === cell.dateStr;
            const isTodayCell = new Date().toISOString().split('T')[0] === cell.dateStr;

            return (
              <div
                key={index}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[90px] bg-white p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-zinc-50/50 ${
                  isSelected ? 'ring-2 ring-inset ring-[#d4ad4d]/40 bg-[#fdf6e3]/10' : ''
                }`}
              >
                {/* Day Number Row */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isTodayCell 
                      ? 'h-5 w-5 rounded-full bg-[#d4ad4d] text-white flex items-center justify-center'
                      : cell.isCurrentMonth 
                        ? 'text-zinc-900 font-semibold' 
                        : 'text-zinc-400 font-normal'
                  }`}>
                    {cell.dayNum}
                  </span>
                  
                  {dayVisits.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d4ad4d]" />
                  )}
                </div>

                {/* Day Events stack (dense list) */}
                <div className="space-y-1 mt-2 flex-1 flex flex-col justify-end overflow-hidden">
                  {dayVisits.slice(0, 2).map(v => (
                    <div 
                      key={v.id} 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold truncate ${
                        v.status === 'Completed' || v.status === 'Done'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-[#fdf6e3] text-[#d4ad4d] border border-[#f5e9c4]'
                      }`}
                      title={`${v.leads?.client_name || 'Client'} to see ${v.properties?.title || 'Property'}`}
                    >
                      {v.leads?.client_name || 'Client'}
                    </div>
                  ))}
                  {dayVisits.length > 2 && (
                    <span className="text-[7px] text-[#888888] font-bold block text-left">
                      +{dayVisits.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── RIGHT PANEL: CHOSEN DATE SITE VISITS DETAIL (Col Span 4) ── */}
      <div className="lg:col-span-4 space-y-6 text-left">
        
        {/* Summary Card */}
        <div className="bg-white border border-[#e7e7e7] rounded-[14px] p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider">
              {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Scheduled viewings on this date.</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {selectedDateVisits.map((visit) => (
              <div 
                key={visit.id} 
                className="p-3 bg-[#fdfdfd] border border-[#e7e7e7] rounded-[9px] hover:border-[#d4ad4d] transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    visit.status === 'Completed' || visit.status === 'Done'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-[#fdf6e3] text-[#d4ad4d] border border-[#f5e9c4]'
                  }`}>
                    {visit.status}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#d4ad4d]" />
                    {visit.visit_time || '—'}
                  </span>
                </div>

                {/* Client info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-bold text-zinc-900">{visit.leads?.client_name || 'Unknown Client'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Building className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-700 truncate">{visit.properties?.title || 'Unknown Property'}</span>
                  </div>
                </div>

                {/* Outcome notes */}
                {visit.outcome && (
                  <div className="p-2 bg-[#f6f6f6] rounded-md text-[10px] text-[#5d5d5d] leading-relaxed">
                    <strong>Memo:</strong> {visit.outcome}
                  </div>
                )}

                <div className="pt-2 border-t border-[#e7e7e7] flex justify-end">
                  <Link 
                    href={`/site-visits/${visit.id}`} 
                    className="text-[10px] font-bold text-[#d4ad4d] hover:underline"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </div>
            ))}

            {selectedDateVisits.length === 0 && (
              <div className="text-center py-8 text-zinc-400 space-y-2">
                <CalendarIcon className="h-8 w-8 mx-auto text-zinc-200" />
                <p className="text-[10px] font-bold">No viewings scheduled for this date.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick helper card */}
        <div className="p-4 rounded-[14px] bg-[#1f1f1f] text-white space-y-2 shadow-xs">
          <h4 className="text-[10px] font-bold tracking-wider uppercase text-[#d4ad4d] flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#d4ad4d]" />
             viewing schedules
          </h4>
          <p className="text-[9px] text-zinc-400 leading-relaxed font-semibold">
            Sales Executives see their assigned properties viewings; managers can inspect and override site visit assignments from this dashboard.
          </p>
        </div>

      </div>

    </div>
  );
}
