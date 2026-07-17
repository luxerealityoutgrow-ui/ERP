"use client";
import { useActionState } from 'react';
import { createSiteVisitAction } from '@/lib/siteVisits';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function SiteVisitForm() {
  const [state, formAction] = useActionState(createSiteVisitAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Lead ID</label>
        <Input name="lead_id" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Property ID</label>
        <Input name="property_id" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Visit Date</label>
        <Input type="date" name="visit_date" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Visit Time</label>
        <Input type="time" name="visit_time" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Outcome</label>
        <Input name="outcome" />
      </div>
      <Button type="submit">Schedule Visit</Button>
    </form>
  );
}
