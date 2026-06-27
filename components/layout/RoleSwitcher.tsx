"use client";

import React from 'react';
import { useRoleOverride } from '@/lib/role-context';
import { Shield } from 'lucide-react';
import type { UserRole } from '@/lib/permissions';

const roles: { key: UserRole; label: string; color: string }[] = [
  { key: 'SuperAdmin', label: 'SuperAdmin', color: 'bg-violet-500 text-white' },
  { key: 'Admin', label: 'Admin', color: 'bg-blue-500 text-white' },
  { key: 'SalesPerson', label: 'SalesPerson', color: 'bg-zinc-500 text-white' },
];

export function RoleSwitcher() {
  const { roleOverride, setRoleOverride } = useRoleOverride();

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-white border border-zinc-200 rounded-2xl shadow-2xl p-3 space-y-2 w-56">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
        <Shield className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">View as Role</span>
      </div>
      <div className="space-y-1">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => setRoleOverride(role.key)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              roleOverride === role.key
                ? `${role.color} shadow-sm`
                : 'text-zinc-600 hover:bg-zinc-50 border border-transparent hover:border-zinc-200'
            }`}
          >
            {role.label}
            {roleOverride === role.key && (
              <span className="text-[9px] opacity-80">Active</span>
            )}
          </button>
        ))}
      </div>
      {roleOverride && (
        <button
          onClick={() => setRoleOverride(null)}
          className="w-full px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all border border-zinc-100"
        >
          Reset to actual role
        </button>
      )}
    </div>
  );
}
