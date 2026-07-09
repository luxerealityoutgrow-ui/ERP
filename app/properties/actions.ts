// app/properties/actions.ts – server actions for Property CRUD
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/auth';

async function getProfile(): Promise<Profile | null> {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'SuperAdmin',
    full_name: 'Husain Badri',
    email: 'husain@luxerealtypune.com',
  };
}

export async function createPropertyAction(prevState: any, formData: FormData) {
  const profile = await getProfile();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    property_code: formData.get('property_code'),
    location: formData.get('location'),
    address: formData.get('address'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    carpet_area: formData.get('carpet_area') || null,
    built_up_area: formData.get('built_up_area') || null,
    price: formData.get('price') || null,
    status_id: formData.get('status_id') || 'Available',
    listing_type: formData.get('listing_type'),
    owner_name: formData.get('owner_name'),
    owner_contact: formData.get('owner_contact'),
    description: formData.get('description'),
    internal_notes: formData.get('internal_notes'),
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from('properties')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Insert property error:", error);
    return { error: error.message };
  }

  // Auto-add new locations to the locations table
  if (data.location) {
    const locations = String(data.location).split(',').map(l => l.trim()).filter(Boolean);
    for (const loc of locations) {
      await supabase.from('locations').upsert({ name: loc }, { onConflict: 'name' });
    }
  }

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Property created', changes: data });

  return { success: true, data: inserted };
}

export async function updatePropertyAction(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return { error: "Missing property ID" };

  const profile = await getProfile();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    property_code: formData.get('property_code'),
    location: formData.get('location'),
    address: formData.get('address'),
    property_type: formData.get('property_type'),
    configuration: formData.get('configuration'),
    carpet_area: formData.get('carpet_area') || null,
    built_up_area: formData.get('built_up_area') || null,
    price: formData.get('price') || null,
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

  if (error) {
    console.error("Update property error:", error);
    return { error: error.message };
  }

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Property updated', changes: data });

  return { success: true, data: updated };
}
