// app/matchmaking/lead/[id]/page.tsx
"use client";
import { findMatchesForLead } from '@/lib/matchmaking';
import { MatchResultsTable } from '@/components/matchmaking/MatchResultsTable';
import { ShareSelectedProperties } from '@/components/matchmaking/ShareSelectedProperties';
import { useEffect, useState } from 'react';

export default function LeadMatchmakingPage() {
  const [results, setResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leadId = 'demo-lead-id'; // in real app use router.query.id
    findMatchesForLead(leadId)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Matches for Lead</h1>
      {loading && <div>Loading...</div>}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <MatchResultsTable data={results} />
          <ShareSelectedProperties selectedIds={selectedIds} />
        </div>
      )}
    </div>
  );
}
