// app/site-visits/create/page.tsx
import { SiteVisitForm } from '@/components/site-visits/SiteVisitForm';

export default function CreateVisitPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Schedule Site Visit</h1>
      <SiteVisitForm />
    </div>
  );
}
