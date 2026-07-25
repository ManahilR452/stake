import React, { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Flag {
  phrase: string;
  tacticLabel: string;
  consequence: string;
  severity: string;
}

interface CopyShareBarProps {
  message: string;
  verdict: string;
  summary: string;
  flags: Flag[];
  takeaway: string | null;
}

function buildReport(verdict: string, summary: string, flags: Flag[], takeaway: string | null): string {
  const lines: string[] = [
    '═══════════════════════════════',
    '  STAKES — Forensic Analysis',
    '═══════════════════════════════',
    '',
    `VERDICT: ${verdict.toUpperCase()}`,
    `SUMMARY: ${summary}`,
    '',
  ];

  if (flags.length > 0) {
    lines.push(`FLAGS DETECTED: ${flags.length}`);
    lines.push('');
    flags.forEach((f, i) => {
      lines.push(`[${i + 1}] "${f.phrase}"`);
      lines.push(`    Tactic:      ${f.tacticLabel}`);
      lines.push(`    Consequence: ${f.consequence}`);
      lines.push(`    Severity:    ${f.severity.toUpperCase()}`);
      lines.push('');
    });
  } else {
    lines.push('No manipulation tactics detected.');
    lines.push('');
  }

  if (takeaway) {
    lines.push(`PATTERN RECOGNIZED: ${takeaway}`);
    lines.push('');
  }

  lines.push('───────────────────────────────');
  lines.push('Analyzed by Stakes · stakes.replit.app');
  lines.push('Always verify requests through trusted channels.');

  return lines.join('\n');
}

export function CopyShareBar({ message, verdict, summary, flags, takeaway }: CopyShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const report = buildReport(verdict, summary, flags, takeaway);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareText = `Stakes Analysis · ${verdict.toUpperCase()}\n\n${summary}${takeaway ? `\n\n${takeaway}` : ''}\n\nAnalyzed at stakes.replit.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Stakes Forensic Analysis', text: shareText });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border/50">
      <span className="text-xs font-mono text-muted-foreground mr-1">Export:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="font-mono text-xs gap-1.5 h-7"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy Report'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="font-mono text-xs gap-1.5 h-7"
      >
        {shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
        {shared ? 'Shared!' : 'Share'}
      </Button>
    </div>
  );
}
