// app/leads/actions.ts – server actions for CRUD
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/auth';

export async function createLeadAction(formData: FormData) {
  const profile = await useProfile();
  const data: Record<string, unknown> = {
    client_name: formData.get('client_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    lead_source_id: formData.get('lead_source_id'),
    budget_min: formData.get('budget_min'),
    budget_max: formData.get('budget_max'),
    preferred_location: formData.get('preferred_location'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    required_area: formData.get('required_area'),
    purpose: formData.get('purpose'),
    assigned_to: profile?.id,
    stage_id: formData.get('stage_id'),
    next_followup_date: formData.get('next_followup_date'),
    status: 'New',
    notes: formData.get('notes'),
    created_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Audit log
  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Lead created', changes: data });

  return inserted;
}

export async function updateLeadAction(id: string, formData: FormData) {
  const profile = await useProfile();
  const data: Record<string, unknown> = {
    client_name: formData.get('client_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    lead_source_id: formData.get('lead_source_id'),
    budget_min: formData.get('budget_min'),
    budget_max: formData.get('budget_max'),
    preferred_location: formData.get('preferred_location'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    required_area: formData.get('required_area'),
    purpose: formData.get('purpose'),
    assigned_to: profile?.id,
    stage_id: formData.get('stage_id'),
    next_followup_date: formData.get('next_followup_date'),
    status: formData.get('status'),
    notes: formData.get('notes')
  };

  const { data: updated, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Audit log
  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Lead updated', changes: data });

  return updated;
}

// Helper to get signed in profile – returns promise of Profile or null
async function useProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile;
}
