// src/lib/queries.ts
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from './auth';

export interface Lead {
  id: string;
  client_name: string;
  phone: string;
  email: string;
  lead_source_id: string;
  budget_min: number;
  budget_max: number;
  preferred_location: string;
  property_type: string;
  configuration: string;
  category: string; // 'Commercial' | 'Residential'
  transaction_type: string; // 'Rent' | 'Outright'
  required_area?: number;
  purpose?: string;
  assigned_to?: string;
  stage_id?: string;
  next_followup_date?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export async function fetchLeads(profile: Profile | null): Promise<Lead[]> {
  let query = supabase.from('leads').select('*');
  if (profile) {
    query = query.eq('assigned_to', profile.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export interface Property {
  id: string;
  title: string;
  property_code: string;
  location: string;
  address: string;
  property_type: string;
  configuration: string;
  carpet_area?: number;
  built_up_area?: number;
  price?: number;
  status_id?: string;
  listing_type: string;
  owner_name?: string;
  owner_contact?: string;
  description?: string;
  internal_notes?: string;
  created_at?: string;
}

export async function fetchProperties(profile: Profile | null): Promise<Property[]> {
  // Sales managers see all; execs see only properties they have access to (join via share)
  const { data, error } = await supabase
    .from('properties')
    .select('*');
  if (error) throw error;
  return data as Property[];
}

export async function fetchProperty(id: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Property;
}

export async function fetchSetting(id: string): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('id', id)
    .single();
  if (error) return '';
  return data.value;
}

export async function updateSetting(id: string, value: string) {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
