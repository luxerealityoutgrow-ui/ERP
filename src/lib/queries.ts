// src/lib/queries.ts
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from './auth';

export interface Lead {
  id: string;
  client_name: string;
  phone: string;
  email: string;
  lead_source_id?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  property_type?: string;
  configuration?: string;
  required_area?: number;
  purpose?: string;
  assigned_to?: string;
  stage_id?: string;
  next_followup_date?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export async function fetchLeads(profile: Profile): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', profile.id);
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

export async function fetchProperties(profile: Profile): Promise<Property[]> {
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
