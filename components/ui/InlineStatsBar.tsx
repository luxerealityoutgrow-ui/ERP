// components/ui/InlineStatsBar.tsx
import React from 'react';

interface StatItem {
  label: string;
  count: number | string;
  colorClass: string;
}

interface InlineStatsBarProps {
  stats: StatItem[];
}

export function InlineStatsBar({ stats }: InlineStatsBarProps) {
  return (
    <div className="dc-stats-inline">
      {stats.map((stat, idx) => (
        <div key={idx} className="dc-stat">
          <div className={`dc-stat-dot ${stat.colorClass}`} />
          <span className="dc-stat-num">{stat.count}</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
