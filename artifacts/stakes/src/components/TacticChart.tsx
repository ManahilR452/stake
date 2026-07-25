import React from 'react';
import { useGetStats } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const TACTIC_LABELS: Record<string, string> = {
  urgency:          'Urgency',
  fake_authority:   'Fake Authority',
  secrecy:          'Secrecy',
  fear:             'Fear / Threat',
  reciprocity:      'Reciprocity',
  too_good:         'Too Good To Be True',
  false_familiarity:'False Familiarity',
};

const TACTIC_COLORS: Record<string, string> = {
  urgency:          'bg-red-500',
  fake_authority:   'bg-violet-500',
  secrecy:          'bg-slate-500',
  fear:             'bg-orange-500',
  reciprocity:      'bg-blue-500',
  too_good:         'bg-emerald-500',
  false_familiarity:'bg-amber-500',
};

export function TacticChart() {
  const { data: stats, isLoading } = useGetStats();

  const rows = stats
    ? Object.entries(stats.tacticCounts)
        .map(([id, count]) => ({ id, count, label: TACTIC_LABELS[id] ?? id }))
        .sort((a, b) => b.count - a.count)
    : [];

  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BarChart3 className="w-4 h-4 text-primary/60" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest">Pattern Library — Live DB Stats</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 h-3 bg-muted rounded animate-pulse" />
              <div className="flex-1 h-3 bg-muted rounded animate-pulse" style={{ width: `${40 + i * 8}%` }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs font-mono">
          No analyses recorded yet — run one to populate the chart.
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="space-y-2.5">
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-3 group">
              <div className="w-28 shrink-0 text-right">
                <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate block">
                  {row.label}
                </span>
              </div>
              <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${TACTIC_COLORS[row.id] ?? 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.07 }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground w-6 text-right shrink-0">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && total > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
          {total} tactic detections across {stats?.totalAnalyzed ?? 0} messages · Replit DB
        </p>
      )}
    </div>
  );
}
