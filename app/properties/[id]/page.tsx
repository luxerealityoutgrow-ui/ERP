// app/properties/[id]/page.tsx
import { PropertyImageGallery } from '@/components/properties/PropertyImageGallery';

export default function PropertyDetailPage() {
  // Replace with useParams or useSearchParams
  const id = 'placeholder-id';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Property Details</h1>
      <PropertyImageGallery propertyId={id} />
    </div>
  );
}
