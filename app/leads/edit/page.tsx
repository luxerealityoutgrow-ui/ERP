"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { LeadForm } from '@/components/leads/LeadForm';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lead } from '@/lib/queries';
import { useProfile } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';

function EditLeadContent() {
  const profile = useProfile();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !profile) return;

    const fetchLeadData = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          const perms = getPermissions(profile.role);
          if (!perms.canViewAllLeads && data.assigned_to !== profile.id) {
            setError("You do not have permission to edit this lead");
          } else {
            setLead(data);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch lead");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [id, profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <p className="text-xs text-zinc-500 font-medium">Loading lead details...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-semibold">
          Error: {error || "Lead not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <LeadForm initialValues={lead} />
    </div>
  );
}

export default function EditLeadPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <p className="text-xs text-zinc-500 font-medium">Loading...</p>
      </div>
    }>
      <EditLeadContent />
    </Suspense>
  );
}
