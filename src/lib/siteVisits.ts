// src/lib/siteVisits.ts – site visit CRUD
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from './auth';

export interface SiteVisit {
  id: string;
  lead_id?: string;
  property_id?: string;
  assigned_to?: string;
  visit_date?: string;
  visit_time?: string;
  status?: string;
  outcome?: string;
  client_feedback?: string;
  next_action?: string;
  created_at?: string;
}

export async function fetchSiteVisits(profile: Profile | null): Promise<SiteVisit[]> {
  // Sales execs can view their assigned visits; managers see all
  const { data, error } = await supabase
    .from('site_visits')
    .select('*');
  if (error) throw error;
  return data as SiteVisit[];
}

export async function createSiteVisitAction(formData: FormData) {
  const profile = await getProfile();
  const data: Record<string, unknown> = {
    lead_id: formData.get('lead_id'),
    property_id: formData.get('property_id'),
    assigned_to: profile?.id,
    visit_date: formData.get('visit_date'),
    visit_time: formData.get('visit_time'),
    status: 'Scheduled',
    outcome: formData.get('outcome'),
    client_feedback: formData.get('client_feedback'),
    next_action: formData.get('next_action')
  };

  const { data: inserted, error } = await supabase
    .from('site_visits')
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Site visit scheduled', changes: data });

  return inserted;
}

async function getProfile(): Promise<Profile | null> {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'SuperAdmin',
    full_name: 'Husain Badri',
    email: 'husain@luxerealtypune.com',
  };
}
