// app/site-visits/page.tsx
"use client";
import { useProfile } from '@/lib/auth';
import { fetchSiteVisits } from '@/lib/siteVisits';
import { SiteVisitTable } from '@/components/site-visits/SiteVisitTable';
import { useEffect, useState } from 'react';

export default function SiteVisitsPage() {
  const profile = useProfile();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchSiteVisits(profile)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Site Visits</h1>
      {loading && <div>Loading visits...</div>}
      {!loading && <SiteVisitTable data={visits} />}
    </div>
  );
}
