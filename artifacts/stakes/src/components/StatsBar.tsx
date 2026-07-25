import React from 'react';
import { useGetStats } from '@workspace/api-client-react';
import { Activity } from 'lucide-react';

export function StatsBar() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading || !stats) {
    return (
      <div className="h-10 bg-secondary/30 border-t flex items-center justify-center">
        <div className="h-4 w-64 bg-secondary rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-10 bg-secondary/30 border-t flex items-center justify-center px-4">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Activity className="w-3.5 h-3.5 opacity-70" />
        <span>{stats.totalAnalyzed.toLocaleString()} messages analyzed</span>
        <span className="opacity-40 px-1">|</span>
        <span>Most common tactic: <strong className="text-foreground/80">{stats.mostCommonTactic}</strong></span>
      </div>
    </div>
  );
}
