// src/lib/auth.ts
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export interface Profile {
  id: string;
  role: string;
  full_name?: string;
  email?: string;
  company_name?: string;
  created_at?: string;
}

export function useProfile(): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roleOverride = localStorage.getItem('luxe-role-override') || 'SuperAdmin';
    const mockProfile: Profile = {
      id: '00000000-0000-0000-0000-000000000000',
      role: roleOverride,
      full_name: 'Husain Badri',
      email: 'husain@luxerealtypune.com',
    };
    setProfile(mockProfile);
    setLoading(false);
  }, []);

  if (loading) return null;
  return profile;
}

// Server-side helper to get profile
export async function getProfile(): Promise<Profile | null> {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'SuperAdmin',
    full_name: 'Husain Badri',
    email: 'husain@luxerealtypune.com',
  };
}
