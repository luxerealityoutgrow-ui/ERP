"use client";
import React from 'react';
import { LeadForm } from '@/components/leads/LeadForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateLeadPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Leads
      </Link>
      <LeadForm />
    </div>
  );
}
