"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { fetchProperty, Property } from '@/lib/queries';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { Building2, Loader2 } from 'lucide-react';

function EditPropertyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.replace('/properties');
      return;
    }
    fetchProperty(id)
      .then(data => setProperty(data))
      .catch(err => {
        console.error('Error fetching property:', err);
        router.replace('/properties');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-10 w-10 text-zinc-300 mb-3" />
        <h2 className="text-lg font-bold text-zinc-900">Property not found</h2>
        <p className="text-xs text-zinc-500 mt-1">The property you&apos;re trying to edit doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div>
      <PropertyForm initialValues={property} mode="edit" />
    </div>
  );
}

export default function EditPropertyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
      </div>
    }>
      <EditPropertyContent />
    </Suspense>
  );
}
