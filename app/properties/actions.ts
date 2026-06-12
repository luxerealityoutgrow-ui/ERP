// app/properties/actions.ts – server actions for Property CRUD
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/auth';

async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile as Profile;
}

export async function createPropertyAction(formData: FormData) {
  const profile = await getProfile();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    property_code: formData.get('property_code'),
    location: formData.get('location'),
    address: formData.get('address'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    carpet_area: formData.get('carpet_area'),
    built_up_area: formData.get('built_up_area'),
    price: formData.get('price'),
    status_id: formData.get('status_id'),
    listing_type: formData.get('listing_type'),
    owner_name: formData.get('owner_name'),
    owner_contact: formData.get('owner_contact'),
    description: formData.get('description'),
    internal_notes: formData.get('internal_notes'),
    created_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from('properties')
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Property created', changes: data });

  return inserted;
}

export async function updatePropertyAction(id: string, formData: FormData) {
  const profile = await getProfile();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    property_code: formData.get('property_code'),
    location: formData.get('location'),
    address: formData.get('address'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    carpet_area: formData.get('carpet_area'),
    built_up_area: formData.get('built_up_area'),
    price: formData.get('price'),
    status_id: formData.get('status_id'),
    listing_type: formData.get('listing_type'),
    owner_name: formData.get('owner_name'),
    owner_contact: formData.get('owner_contact'),
    description: formData.get('description'),
    internal_notes: formData.get('internal_notes')
  };

  const { data: updated, error } = await supabase
    .from('properties')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Property updated', changes: data });

  return updated;
}
