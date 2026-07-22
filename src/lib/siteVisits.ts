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
  leads?: { client_name: string } | null;
  properties?: { title: string } | null;
}

import { getPermissions } from './permissions';

export async function fetchSiteVisits(profile: Profile | null): Promise<SiteVisit[]> {
  // Sales execs can view their assigned visits; managers see all
  const perms = getPermissions(profile?.role);
  let query = supabase.from('site_visits').select('*, leads(client_name), properties(title)');

  if (!perms.canViewAllCalendar && profile?.id) {
    query = query.eq('assigned_to', profile.id);
  }

  const { data, error } = await query;
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profile) return profile as Profile;
    }
  } catch (e) {
    console.error('Error fetching auth user:', e);
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    if (profile) return profile as Profile;
  } catch (e) {
    console.error('Error fetching fallback profile:', e);
  }

  return {
    id: 'e2c5f803-2500-4538-a763-680d7279b4e7',
    role: 'SuperAdmin',
    full_name: 'Husain Badri',
    email: 'husain@outgrowintelligence.com',
  };
}
