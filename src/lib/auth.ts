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
    const fetchProfile = async () => {
      try {
        // Check for role override first (demo/dev mode)
        const roleOverride = typeof window !== 'undefined' ? localStorage.getItem('luxe-role-override') : null;

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // No auth user — create a dev profile with role override or default SuperAdmin
          const devProfile: Profile = {
            id: 'dev-user',
            role: roleOverride || 'SuperAdmin',
            full_name: 'Husain Badri',
            email: 'husain@luxerealty.in',
          };
          setProfile(devProfile);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          // User exists in auth but no profile — create fallback
          const fallbackProfile: Profile = {
            id: user.id,
            role: roleOverride || 'SuperAdmin',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
          };
          setProfile(fallbackProfile);
        } else {
          const profileData = data as Profile;
          // Apply role override if set
          if (roleOverride && ['SuperAdmin', 'Admin', 'SalesPerson'].includes(roleOverride)) {
            profileData.role = roleOverride;
          }
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        // Even on error, provide a working dev profile
        const roleOverride = typeof window !== 'undefined' ? localStorage.getItem('luxe-role-override') : null;
        setProfile({
          id: 'dev-user',
          role: roleOverride || 'SuperAdmin',
          full_name: 'Husain Badri',
          email: 'husain@luxerealty.in',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return null;
  return profile;
}

// Server-side helper to get profile
export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as Profile;
}
