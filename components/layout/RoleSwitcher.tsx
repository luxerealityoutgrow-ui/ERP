"use client";

import React, { useState } from 'react';
import { useRoleOverride } from '@/lib/role-context';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/permissions';

const roles: { key: UserRole; label: string; activeColor: string }[] = [
  { key: 'SuperAdmin', label: 'SuperAdmin', activeColor: 'bg-violet-500 text-white border-violet-500' },
  { key: 'Admin', label: 'Admin', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { key: 'SalesPerson', label: 'Sales Exec', activeColor: 'bg-zinc-700 text-white border-zinc-700' },
];

export function RoleSwitcher() {
  const { roleOverride, setRoleOverride } = useRoleOverride();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = (role: UserRole) => {
    if (roleOverride === role) return;
    setSwitching(true);
    setRoleOverride(role);
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      {/* Full-screen preloader */}
      {switching && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <p className="text-xs font-bold text-white">Switching view...</p>
          </div>
        </div>
      )}

      {/* Pill switcher - fixed bottom center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]">
        <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-full shadow-lg">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => handleSwitch(role.key)}
              disabled={switching}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all disabled:opacity-50 ${
                roleOverride === role.key
                  ? role.activeColor
                  : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
