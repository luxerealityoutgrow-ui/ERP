// app/properties/create/page.tsx
import { PropertyForm } from '@/components/properties/PropertyForm';

export default function CreatePropertyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Property</h1>
      <PropertyForm />
    </div>
  );
}
