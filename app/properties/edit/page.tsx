// app/properties/edit/page.tsx
import { PropertyForm } from '@/components/properties/PropertyForm';

export default function EditPropertyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Property</h1>
      <PropertyForm />
    </div>
  );
}
