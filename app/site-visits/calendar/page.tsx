// app/site-visits/calendar/page.tsx
"use client";
import { useProfile } from '@/lib/auth';
import { fetchSiteVisits, SiteVisit } from '@/lib/siteVisits';
import { CalendarView } from '@/components/site-visits/CalendarView';
import { useEffect, useState } from 'react';

export default function SiteVisitsCalendarPage() {
  const profile = useProfile();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteVisits(profile)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Site Visits Calendar</h1>
      {loading && <div>Loading calendar...</div>}
      {!loading && <CalendarView visits={visits} />}
    </div>
  );
}
