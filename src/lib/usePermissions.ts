// src/lib/usePermissions.ts
import { useProfile } from './auth';
import { getPermissions, type RolePermissions } from './permissions';

/**
 * Hook that returns the current user's permissions based on their role.
 * Returns null while loading, or SalesPerson permissions as fallback.
 */
export function usePermissions(): RolePermissions & { role: string; loading: boolean } {
  const profile = useProfile();
  const perms = getPermissions(profile?.role);

  return {
    ...perms,
    role: profile?.role || 'SalesPerson',
    loading: profile === null,
  };
}
