// app/site-visits/[id]/page.tsx
import { SiteVisitForm } from '@/components/site-visits/SiteVisitForm';

export default function EditVisitPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Site Visit</h1>
      <SiteVisitForm />
    </div>
  );
}
