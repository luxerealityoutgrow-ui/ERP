// app/leads/actions.ts – server actions for CRUD
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/auth';

export async function createLeadAction(prevState: any, formData: FormData) {
  const profile = await useProfile();
  const data: Record<string, unknown> = {
    client_name: formData.get('client_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    lead_source_id: formData.get('lead_source_id'),
    budget_min: formData.get('budget_min') || null,
    budget_max: formData.get('budget_max') || null,
    preferred_location: formData.get('preferred_location'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    category: formData.get('category'),
    transaction_type: formData.get('transaction_type'),
    required_area: formData.get('required_area') || null,
    purpose: formData.get('purpose'),
    assigned_to: profile?.id,
    stage_id: formData.get('stage_id') || 'New inquiry',
    next_followup_date: formData.get('next_followup_date') || null,
    status: formData.get('status') || 'Hot',
    notes: formData.get('notes'),
    created_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Insert lead error:", error);
    return { error: error.message };
  }

  // Trigger Apps Script Integration if configured
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'apps_script_url')
      .single();
    
    if (setting?.value) {
      // Fire and forget integration call
      fetch(setting.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'new_lead',
          lead: inserted,
          triggered_by: profile?.email
        }),
      }).catch(err => console.error('Apps Script Sync Error:', err));
    }
  } catch (err) {
    console.error('Integration check failed:', err);
  }

  // Audit log
  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Lead created', changes: data });

  return { success: true, data: inserted };
}

export async function updateLeadAction(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return { error: "Missing lead ID" };

  const profile = await useProfile();
  const data: Record<string, unknown> = {
    client_name: formData.get('client_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    lead_source_id: formData.get('lead_source_id'),
    budget_min: formData.get('budget_min') || null,
    budget_max: formData.get('budget_max') || null,
    preferred_location: formData.get('preferred_location'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    category: formData.get('category'),
    transaction_type: formData.get('transaction_type'),
    required_area: formData.get('required_area') || null,
    purpose: formData.get('purpose'),
    assigned_to: profile?.id,
    stage_id: formData.get('stage_id'),
    next_followup_date: formData.get('next_followup_date') || null,
    status: formData.get('status'),
    notes: formData.get('notes')
  };

  const { data: updated, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Update lead error:", error);
    return { error: error.message };
  }

  // Audit log
  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Lead updated', changes: data });

  return { success: true, data: updated };
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
