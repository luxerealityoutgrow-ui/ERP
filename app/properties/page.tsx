// app/properties/page.tsx
"use client";
import { useProfile } from '@/lib/auth';
import { fetchProperties } from '@/lib/queries';
import { PropertyTable } from '@/components/properties/PropertyTable';
import { useEffect, useState } from 'react';

export default function PropertyInventoryPage() {
  const profile = useProfile();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchProperties(profile)
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <div>Loading properties...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Property Inventory</h1>
      <PropertyTable data={properties} />
    </div>
  );
}
