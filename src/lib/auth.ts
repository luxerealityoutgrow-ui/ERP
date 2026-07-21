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
          // Not authenticated — redirect to login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        let profileData: Profile;
        if (error || !data) {
          // User in auth but no profile — fallback
          profileData = {
            id: user.id,
            role: 'SalesPerson',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
          };
        } else {
          profileData = { ...data } as Profile;
        }

        // Apply role override if set (demo mode)
        const roleOverride = localStorage.getItem('luxe-role-override');
        if (roleOverride && ['SuperAdmin', 'Admin', 'SalesPerson'].includes(roleOverride)) {
          profileData.role = roleOverride;
        }

        // Apply user ID override if set
        const userIdOverride = localStorage.getItem('luxe-user-override');
        if (userIdOverride) {
          profileData.id = userIdOverride;
        }

        const userNameOverride = localStorage.getItem('luxe-user-name-override');
        if (userNameOverride) {
          profileData.full_name = userNameOverride;
        }

        const userEmailOverride = localStorage.getItem('luxe-user-email-override');
        if (userEmailOverride) {
          profileData.email = userEmailOverride;
        }

        setProfile(profileData);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setProfile(null);
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
