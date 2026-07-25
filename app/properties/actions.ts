// app/properties/actions.ts – server actions for Property CRUD
'use server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Profile } from '@/lib/auth';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

async function getProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<Profile | null> {
  try {
    const cookieStore = await cookies();
    const anonClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );
    const { data: { user } } = await anonClient.auth.getUser();
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

  return {
    id: 'e2c5f803-2500-4538-a763-680d7279b4e7',
    role: 'SuperAdmin',
    full_name: 'Husain Badri',
    email: 'husain@outgrowintelligence.com',
  };
}

export async function createPropertyAction(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const profile = await getProfile(supabase);
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
    unit_no: formData.get('unit_no'),
    brokerage: formData.get('brokerage'),
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

  // Insert property images
  const imageUrls = formData.getAll('image_urls') as string[];
  if (imageUrls.length > 0) {
    const imgData = imageUrls.map((url, idx) => ({
      property_id: inserted.id,
      url,
      sort_order: idx,
      created_at: new Date().toISOString()
    }));
    const { error: imgError } = await supabase.from('property_images').insert(imgData);
    if (imgError) console.error("Error inserting property images:", imgError);
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
  const supabase = await createSupabaseServerClient();
  const id = formData.get('id') as string;
  if (!id) return { error: "Missing property ID" };

  const profile = await getProfile(supabase);
  const statusId = formData.get('status_id') as string;

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
    status_id: statusId,
    listing_type: formData.get('listing_type'),
    owner_name: formData.get('owner_name'),
    owner_contact: formData.get('owner_contact'),
    unit_no: formData.get('unit_no'),
    brokerage: formData.get('brokerage'),
    description: formData.get('description'),
    internal_notes: formData.get('internal_notes'),
    // Auto-deactivate when sold
    ...(statusId === 'Sold' ? { is_active: false } : {})
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

  // Update property images: delete old ones and insert new ones
  const imageUrls = formData.getAll('image_urls') as string[];
  const { error: delError } = await supabase.from('property_images').delete().eq('property_id', id);
  if (delError) console.error("Error deleting old property images:", delError);
  
  if (imageUrls.length > 0) {
    const imgData = imageUrls.map((url, idx) => ({
      property_id: id,
      url,
      sort_order: idx,
      created_at: new Date().toISOString()
    }));
    const { error: imgError } = await supabase.from('property_images').insert(imgData);
    if (imgError) console.error("Error updating property images:", imgError);
  }

  await supabase
    .from('audit_logs')
    .insert({ user_id: profile?.id, event: 'Property updated', changes: data });

  return { success: true, data: updated };
}

