// src/lib/permissions.ts
// Role-based access control configuration

export type UserRole = 'SuperAdmin' | 'Admin' | 'SalesPerson';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewLeads: boolean;
  canViewAllLeads: boolean; // false = only own leads
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canViewProperties: boolean;
  canCreateProperties: boolean;
  canEditProperties: boolean;
  canDeleteProperties: boolean;
  canViewPipeline: boolean;
  canViewAllPipeline: boolean; // false = only own deals
  canViewMatchmaking: boolean;
  canViewCalendar: boolean;
  canViewAllCalendar: boolean; // false = only own visits
  canViewReporting: boolean;
  canViewSettings: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  canExportData: boolean;
  canBulkDelete: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SuperAdmin: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewAllLeads: true,
    canCreateLeads: true,
    canEditLeads: true,
    canDeleteLeads: true,
    canViewProperties: true,
    canCreateProperties: true,
    canEditProperties: true,
    canDeleteProperties: true,
    canViewPipeline: true,
    canViewAllPipeline: true,
    canViewMatchmaking: true,
    canViewCalendar: true,
    canViewAllCalendar: true,
    canViewReporting: true,
    canViewSettings: true,
    canManageUsers: true,
    canManageIntegrations: true,
    canExportData: true,
    canBulkDelete: true,
  },
  Admin: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewAllLeads: true,
    canCreateLeads: true,
    canEditLeads: true,
    canDeleteLeads: true,
    canViewProperties: true,
    canCreateProperties: true,
    canEditProperties: true,
    canDeleteProperties: true,
    canViewPipeline: true,
    canViewAllPipeline: true,
    canViewMatchmaking: true,
    canViewCalendar: true,
    canViewAllCalendar: true,
    canViewReporting: true,
    canViewSettings: true,
    canManageUsers: false,
    canManageIntegrations: true,
    canExportData: true,
    canBulkDelete: true,
  },
  SalesPerson: {
    canViewDashboard: false,
    canViewLeads: true,
    canViewAllLeads: false, // Sales execs only see their assigned leads
    canCreateLeads: true,
    canEditLeads: true,
    canDeleteLeads: false, // Only admin can delete leads
    canViewProperties: true,
    canCreateProperties: true, // Client says properties can be added by all
    canEditProperties: true,
    canDeleteProperties: false, // Only Admin/SuperAdmin can delete properties
    canViewPipeline: true,
    canViewAllPipeline: false, // Sales execs only see their own pipeline deals
    canViewMatchmaking: true,
    canViewCalendar: true,
    canViewAllCalendar: false, // Sales execs only see their assigned site visits
    canViewReporting: false,
    canViewSettings: false,
    canManageUsers: false,
    canManageIntegrations: false,
    canExportData: false, // Only admin can export
    canBulkDelete: false,
  },
};

/**
 * Get permissions for a given role string.
 * Falls back to SalesPerson if role is unrecognized.
 */
export function getPermissions(role: string | undefined | null): RolePermissions {
  if (!role) return ROLE_PERMISSIONS.SalesPerson;

  // Normalize role string for matching
  const normalized = role.trim();
  if (normalized in ROLE_PERMISSIONS) {
    return ROLE_PERMISSIONS[normalized as UserRole];
  }

  // Legacy role mapping
  const lower = normalized.toLowerCase();
  if (lower.includes('superadmin') || lower.includes('super_admin') || lower.includes('super admin')) {
    return ROLE_PERMISSIONS.SuperAdmin;
  }
  if (lower.includes('admin') || lower.includes('manager')) {
    return ROLE_PERMISSIONS.Admin;
  }

  return ROLE_PERMISSIONS.SalesPerson;
}

/**
 * Check if a role has access to a specific navigation route.
 */
export function canAccessRoute(role: string | undefined | null, route: string): boolean {
  const perms = getPermissions(role);

  const routePermMap: Record<string, keyof RolePermissions> = {
    '/dashboard': 'canViewDashboard',
    '/leads': 'canViewLeads',
    '/properties': 'canViewProperties',
    '/pipeline': 'canViewPipeline',
    '/matchmaking': 'canViewMatchmaking',
    '/site-visits': 'canViewCalendar',
    '/reporting': 'canViewReporting',
    '/settings': 'canViewSettings',
    '/users': 'canManageUsers',
  };

  const permKey = routePermMap[route];
  if (!permKey) return true; // Unknown route, allow by default
  return perms[permKey] as boolean;
}

export { ROLE_PERMISSIONS };
