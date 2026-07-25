import React from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;        // 0–100
  verdict: string;
}

function scoreColor(score: number): { stroke: string; text: string; label: string } {
  if (score >= 66) return { stroke: 'hsl(0 84% 57%)', text: 'text-destructive', label: 'High Risk' };
  if (score >= 33) return { stroke: 'hsl(38 96% 50%)', text: 'text-amber-500', label: 'Moderate Risk' };
  return { stroke: 'hsl(142 71% 45%)', text: 'text-emerald-500', label: 'Low Risk' };
}

export function computeRiskScore(verdict: string, patternDensity: string, flags: Array<{ severity: string }>): number {
  const base = verdict === 'scam' ? 72 : verdict === 'suspicious' ? 38 : 8;
  const densityBonus = patternDensity === 'high' ? 14 : patternDensity === 'moderate' ? 6 : 0;
  const flagBonus = Math.min((flags?.length ?? 0) * 2, 10);
  const highBonus = Math.min(flags.filter((f) => f.severity === 'high').length * 4, 12);
  return Math.min(100, Math.round(base + densityBonus + flagBonus + highBonus));
}

export function RiskGauge({ score, verdict }: RiskGaugeProps) {
  const { stroke, text, label } = scoreColor(score);
  const size = 120;
  const strokeW = 9;
  const r = (size - strokeW) / 2;
  // Semicircle: goes from 180° to 0° (left to right along top)
  const circumference = Math.PI * r;   // half circumference
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size / 2 + strokeW }}>
        <svg
          width={size}
          height={size / 2 + strokeW}
          viewBox={`0 0 ${size} ${size / 2 + strokeW}`}
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d={`M ${strokeW / 2},${size / 2} A ${r},${r} 0 0 1 ${size - strokeW / 2},${size / 2}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* Animated fill */}
          <motion.path
            d={`M ${strokeW / 2},${size / 2} A ${r},${r} 0 0 1 ${size - strokeW / 2},${size / 2}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <motion.span
            className={`font-mono font-bold text-2xl leading-none ${text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-xs font-bold uppercase tracking-wider font-mono ${text}`}>{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Risk Score / 100</p>
      </div>
    </div>
  );
}
