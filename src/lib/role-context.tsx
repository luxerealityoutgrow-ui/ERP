"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole } from './permissions';

interface RoleOverrideContextType {
  roleOverride: UserRole | null;
  setRoleOverride: (role: UserRole | null) => void;
}

const RoleOverrideContext = createContext<RoleOverrideContextType>({
  roleOverride: null,
  setRoleOverride: () => {},
});

export function RoleOverrideProvider({ children }: { children: ReactNode }) {
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  // Persist override to localStorage for consistency across page nav
  useEffect(() => {
    const saved = localStorage.getItem('luxe-role-override');
    if (saved && (saved === 'SuperAdmin' || saved === 'Admin' || saved === 'SalesPerson')) {
      setRoleOverride(saved as UserRole);
    }
  }, []);

  const handleSetRole = (role: UserRole | null) => {
    setRoleOverride(role);
    if (role) {
      localStorage.setItem('luxe-role-override', role);
    } else {
      localStorage.removeItem('luxe-role-override');
    }
  };

  return (
    <RoleOverrideContext.Provider value={{ roleOverride, setRoleOverride: handleSetRole }}>
      {children}
    </RoleOverrideContext.Provider>
  );
}

export function useRoleOverride() {
  return useContext(RoleOverrideContext);
}
