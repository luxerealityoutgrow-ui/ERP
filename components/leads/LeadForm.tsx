"use client";
import { useFormState } from 'react-dom';
import { createLeadAction } from '@/app/leads/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function LeadForm({ initialValues = {} }: { initialValues?: Partial<any> }) {
  const [state, formAction] = useFormState(createLeadAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Client Name</label>
        <Input name="client_name" defaultValue={initialValues.client_name ?? ''} required/>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input name="phone" defaultValue={initialValues.phone ?? ''} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input type="email" name="email" defaultValue={initialValues.email ?? ''} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <Textarea name="notes" defaultValue={initialValues.notes ?? ''} rows={3} />
      </div>
      <Button type="submit">Save Lead</Button>
    </form>
  );
}
