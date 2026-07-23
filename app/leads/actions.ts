// app/leads/actions.ts – server actions for CRUD
'use server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Profile } from '@/lib/auth';

function createSupabaseServerClient() {
  const cookieStore = cookies();
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

export async function createLeadAction(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const profile = await useProfile(supabase);
  
  const phoneRaw = String(formData.get('phone') || '').trim();
  const cleanPhone = phoneRaw.replace(/[^0-9]/g, '').slice(-10);

  // Check duplicate mobile number in active CRM leads
  if (cleanPhone.length >= 7) {
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, client_name, phone, assigned_to')
      .eq('is_active', true);

    const matched = existingLeads?.find(l => {
      const p = String(l.phone || '').replace(/[^0-9]/g, '').slice(-10);
      return p && p === cleanPhone;
    });

    if (matched) {
      let assigneeName = 'Unassigned';
      if (matched.assigned_to) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', matched.assigned_to)
          .single();
        if (prof?.full_name) assigneeName = prof.full_name;
      }

      return {
        success: false,
        duplicate: true,
        error: `DUPLICATE_LEAD`,
        existingLead: {
          id: matched.id,
          client_name: matched.client_name,
          phone: matched.phone,
          assigneeName
        },
        data: null
      };
    }
  }

  const assignedTo = String(formData.get('assigned_to') || '').trim() || profile?.id || null;

  const data: Record<string, unknown> = {
    client_name: formData.get('client_name'),
    phone: phoneRaw,
    email: formData.get('email') || null,
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
    assigned_to: assignedTo,
    stage_id: formData.get('stage_id') || 'New inquiry',
    next_followup_date: formData.get('next_followup_date') || null,
    status: formData.get('status') || 'Hot',
    notes: formData.get('notes'),
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Insert lead error:", error);
    return { error: error.message, success: false, duplicate: false, existingLead: null, data: null };
  }

  // Trigger Apps Script Integration if configured
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'apps_script_url')
      .single();
    
    if (setting?.value) {
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
  const supabase = createSupabaseServerClient();
  const id = formData.get('id') as string;
  if (!id) return { error: "Missing lead ID" };

  const profile = await useProfile(supabase);
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
    assigned_to: formData.get('assigned_to') || profile?.id || null,
    stage_id: formData.get('stage_id'),
    status: formData.get('status'),
    next_followup_date: formData.get('next_followup_date') || null,
    notes: formData.get('notes'),
    is_active: formData.get('is_active') === 'true'
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

// Helper to get signed in profile using service role (bypasses RLS for profile lookup)
async function useProfile(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<Profile | null> {
  try {
    const cookieStore = cookies();
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
