import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { SiteVisit } from '@/lib/siteVisits';

export function CalendarView({ visits }: { visits: SiteVisit[] }) {
  const events = visits.map((v) => ({
    id: v.id,
    title: `Visit - ${v.status}`,
    start: v.visit_date,
    allDay: true
  }));

  return <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" events={events} />;
}
