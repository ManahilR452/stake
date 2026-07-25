import React from 'react';
import { useGetStats } from '@workspace/api-client-react';
import { Activity, TrendingUp, Database } from 'lucide-react';

export function StatsBar() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="border-t border-border/60 bg-card/50 h-11 flex items-center justify-center px-4">
        <div className="h-3 w-72 bg-muted animate-pulse rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  const topTactics = Object.entries(stats.tacticCounts)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return (
    <div className="border-t border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-6 overflow-x-auto">

        {/* Total analyzed — from Replit DB */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
          <Database className="w-3 h-3 text-primary/60" />
          <span>
            <strong className="text-foreground/70">{stats.totalAnalyzed.toLocaleString()}</strong>
            {' '}messages analyzed
          </span>
        </div>

        <span className="text-border shrink-0">·</span>

        {/* Most common tactic */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
          <TrendingUp className="w-3 h-3 text-accent/80" />
          <span>
            Most common: <strong className="text-foreground/70">{stats.mostCommonTactic}</strong>
          </span>
        </div>

        {/* Top tactics breakdown (only if there's data) */}
        {topTactics.length > 0 && (
          <>
            <span className="text-border shrink-0">·</span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
              <Activity className="w-3 h-3 text-muted-foreground/60" />
              <span className="hidden sm:inline">
                {topTactics.map(([id, count], i) => (
                  <span key={id}>
                    {i > 0 && <span className="opacity-40 mx-1">/</span>}
                    {id.replace('_', ' ')} <strong className="text-foreground/60">×{count}</strong>
                  </span>
                ))}
              </span>
            </div>
          </>
        )}

        {/* Powered by note — right-aligned */}
        <div className="ml-auto text-[10px] font-mono text-muted-foreground/40 shrink-0 hidden md:block">
          Replit DB · live
        </div>
      </div>
    </div>
  );
}
