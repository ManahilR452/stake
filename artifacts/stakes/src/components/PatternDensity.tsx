import React from 'react';
import { AnalysisResultPatternDensity } from '@workspace/api-client-react';

interface PatternDensityProps {
  density: AnalysisResultPatternDensity;
}

export function PatternDensity({ density }: PatternDensityProps) {
  const isHigh = density === 'high';
  const isModerate = density === 'moderate';
  const isLow = density === 'low';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono text-muted-foreground">Pattern Density:</span>
      <div className="flex gap-1">
        <div className={`h-2.5 w-6 rounded-sm transition-colors ${isLow || isModerate || isHigh ? 'bg-primary' : 'bg-secondary'}`} />
        <div className={`h-2.5 w-6 rounded-sm transition-colors ${isModerate || isHigh ? 'bg-primary' : 'bg-secondary'}`} />
        <div className={`h-2.5 w-6 rounded-sm transition-colors ${isHigh ? 'bg-primary' : 'bg-secondary'}`} />
      </div>
      <span className={`text-sm font-medium uppercase tracking-wider text-xs ${
        isHigh ? 'text-red-600' : isModerate ? 'text-orange-600' : 'text-primary'
      }`}>
        {density}
      </span>
    </div>
  );
}
