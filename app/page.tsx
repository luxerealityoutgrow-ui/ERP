"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPermissions } from '@/lib/permissions';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check role override from localStorage for immediate redirect
    const roleOverride = localStorage.getItem('luxe-role-override');
    const perms = getPermissions(roleOverride);
    
    if (perms.canViewDashboard) {
      router.replace('/dashboard');
    } else {
      router.replace('/leads');
    }
  }, [router]);

  return null;
}
