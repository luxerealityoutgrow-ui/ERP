"use client";

import React, { useState } from 'react';
import { useRoleOverride } from '@/lib/role-context';
import { Shield, Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/permissions';

const roles: { key: UserRole; label: string; desc: string; color: string; bgColor: string }[] = [
  { key: 'SuperAdmin', label: 'SuperAdmin', desc: 'Full access', color: 'bg-violet-500 text-white', bgColor: 'bg-violet-600' },
  { key: 'Admin', label: 'Admin', desc: 'Manage operations', color: 'bg-blue-500 text-white', bgColor: 'bg-blue-600' },
  { key: 'SalesPerson', label: 'SalesPerson', desc: 'Own leads & visits', color: 'bg-zinc-600 text-white', bgColor: 'bg-zinc-700' },
];

export function RoleSwitcher() {
  const { roleOverride, setRoleOverride } = useRoleOverride();
  const [switching, setSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleSwitch = (role: UserRole) => {
    if (roleOverride === role) return;
    setSwitching(true);
    setSwitchingTo(role);
    
    // Set the role override
    setRoleOverride(role);
    
    // Show preloader then reload to apply all permission changes cleanly
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleReset = () => {
    setSwitching(true);
    setSwitchingTo(null);
    setRoleOverride(null);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <>
      {/* Full-screen preloader overlay */}
      {switching && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">
                Switching to {switchingTo || 'default'} view
              </p>
              <p className="text-xs text-zinc-400 mt-1">Applying permissions...</p>
            </div>
          </div>
        </div>
      )}

      {/* Role switcher panel */}
      <div className="fixed bottom-4 right-4 z-[100] bg-white border border-zinc-200 rounded-2xl shadow-2xl p-3 space-y-2 w-56">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Shield className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">View as Role</span>
        </div>
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => handleSwitch(role.key)}
              disabled={switching}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                roleOverride === role.key
                  ? `${role.color} shadow-sm`
                  : 'text-zinc-600 hover:bg-zinc-50 border border-transparent hover:border-zinc-200'
              }`}
            >
              <div>
                <span>{role.label}</span>
                {roleOverride !== role.key && (
                  <span className="block text-[9px] font-medium text-zinc-400 mt-0.5">{role.desc}</span>
                )}
              </div>
              {roleOverride === role.key && (
                <span className="text-[9px] opacity-80">●</span>
              )}
            </button>
          ))}
        </div>
        {roleOverride && (
          <button
            onClick={handleReset}
            disabled={switching}
            className="w-full px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all border border-zinc-100 disabled:opacity-50"
          >
            Reset to actual role
          </button>
        )}
      </div>
    </>
  );
}
