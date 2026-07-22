// components/ui/AvatarCell.tsx
import React from 'react';

interface AvatarCellProps {
  name: string;
  subtext?: string;
  avatarBg?: string;
}

export function AvatarCell({ name, subtext, avatarBg }: AvatarCellProps) {
  const getInitials = (n: string) => {
    if (!n) return '??';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBgClass = (n: string) => {
    if (avatarBg) return avatarBg;
    const colors = [
      'bg-red-50 text-red-700 border border-red-100',
      'bg-blue-50 text-blue-700 border border-blue-100',
      'bg-emerald-50 text-emerald-700 border border-emerald-100',
      'bg-amber-50 text-amber-700 border border-amber-100',
      'bg-purple-50 text-purple-700 border border-purple-100',
      'bg-pink-50 text-pink-700 border border-pink-100',
      'bg-indigo-50 text-indigo-700 border border-indigo-100',
      'bg-teal-50 text-teal-700 border border-teal-100',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgClass = getBgClass(name);

  return (
    <div className="dc-name-cell">
      <div className={`dc-avatar ${bgClass}`}>
        {initials}
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span className="font-bold text-zinc-900 text-xs truncate leading-snug">{name}</span>
        {subtext && <span className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{subtext}</span>}
      </div>
    </div>
  );
}
