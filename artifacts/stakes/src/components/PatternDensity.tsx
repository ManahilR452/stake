import React from 'react';
import { AnalysisResultPatternDensity } from '@workspace/api-client-react';

const LEVELS = [
  { key: 'low',      label: 'Low',      activeClass: 'bg-emerald-500 dark:bg-emerald-400' },
  { key: 'moderate', label: 'Moderate', activeClass: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'high',     label: 'High',     activeClass: 'bg-destructive' },
] as const;

const ORDER = ['low', 'moderate', 'high'] as const;

const labelColor: Record<AnalysisResultPatternDensity, string> = {
  low:      'text-emerald-600 dark:text-emerald-400',
  moderate: 'text-amber-600 dark:text-amber-400',
  high:     'text-destructive',
};

interface PatternDensityProps {
  density: AnalysisResultPatternDensity;
}

export function PatternDensity({ density }: PatternDensityProps) {
  const activeIndex = ORDER.indexOf(density);

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Density</span>
      <div className="flex gap-1">
        {LEVELS.map((level, i) => (
          <div
            key={level.key}
            className={`h-2 w-7 rounded-full transition-all duration-300 ${
              i <= activeIndex ? level.activeClass : 'bg-muted-border dark:bg-muted'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-bold uppercase tracking-wider font-mono ${labelColor[density]}`}>
        {density}
      </span>
    </div>
  );
}
