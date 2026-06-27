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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          // Check for role override in localStorage (demo mode)
          const roleOverride = typeof window !== 'undefined' ? localStorage.getItem('luxe-role-override') : null;
          const profileData = data as Profile;
          if (roleOverride && ['SuperAdmin', 'Admin', 'SalesPerson'].includes(roleOverride)) {
            profileData.role = roleOverride;
          }
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Listen for storage changes (role switcher)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'luxe-role-override') {
        fetchProfile();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
