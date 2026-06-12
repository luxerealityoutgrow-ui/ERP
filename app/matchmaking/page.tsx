// app/matchmaking/page.tsx
"use client";
import { useProfile } from '@/lib/auth';
import { findMatchesForLead } from '@/lib/matchmaking';
import { MatchResultsTable } from '@/components/matchmaking/MatchResultsTable';
import { useEffect, useState } from 'react';

export default function MatchmakingPage() {
  const profile = useProfile();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    // For demonstration, match the first lead assigned to the user
    // In a real app, you would have a UI to select a lead
    const leadId = 'demo-lead-id';
    findMatchesForLead(leadId)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Matchmaking Results</h1>
      {loading && <div>Loading matches...</div>}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <MatchResultsTable data={results} />
        </div>
      )}
    </div>
  );
}
