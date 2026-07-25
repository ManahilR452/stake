import React, { useState, forwardRef } from 'react';
import { Flag } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, IdCard, CreditCard, Link2, Banknote, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ExposureCardsProps {
  flags: Flag[];
  activeFlagIndex: number | null;
  onFlagClick: (index: number) => void;
  cardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
}

const ExposureIcon = ({ exposure }: { exposure: string }) => {
  const e = exposure.toLowerCase();
  const cls = 'w-4 h-4';
  if (e.includes('otp') || e.includes('verification code') || e.includes('password')) return <Key className={cls} />;
  if (e.includes('cnic') || e.includes('national id') || e.includes('id')) return <IdCard className={cls} />;
  if (e.includes('bank') || e.includes('iban') || e.includes('account')) return <CreditCard className={cls} />;
  if (e.includes('link') || e.includes('url') || e.includes('click')) return <Link2 className={cls} />;
  if (e.includes('payment') || e.includes('fee') || e.includes('money')) return <Banknote className={cls} />;
  if (e.includes('personal') || e.includes('family') || e.includes('name')) return <User className={cls} />;
  return <ShieldAlert className={cls} />;
};

const SourceBadge = ({ source }: { source: string }) => {
  switch (source) {
    case 'rule_prefilter':
      return (
        <Badge className="font-mono text-[9px] uppercase tracking-wider px-1.5 bg-secondary text-muted-foreground border-border">
          Rule
        </Badge>
      );
    case 'llm_taxonomy':
      return (
        <Badge className="font-mono text-[9px] uppercase tracking-wider px-1.5 bg-primary/10 text-primary border-primary/25">
          AI
        </Badge>
      );
    case 'dual_verified':
      return (
        <Badge className="font-mono text-[9px] uppercase tracking-wider px-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
          Verified ✓
        </Badge>
      );
    default:
      return null;
  }
};

const severityBar: Record<string, string> = {
  high:   'bg-destructive',
  medium: 'bg-amber-500',
  low:    'bg-amber-300 dark:bg-amber-600',
};

const ExposureCard = forwardRef<HTMLDivElement, { flag: Flag; isActive: boolean; onClick: () => void }>(
  ({ flag, isActive, onClick }, ref) => {
    const [showTechnical, setShowTechnical] = useState(false);

    return (
      <Card
        ref={ref}
        onClick={onClick}
        className={`cursor-pointer overflow-hidden transition-all duration-200 ${
          isActive
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/10 border-primary/50'
            : 'hover:shadow-md hover:border-border opacity-85 hover:opacity-100'
        }`}
      >
        <div className="flex">
          {/* Severity stripe */}
          <div className={`w-1 shrink-0 ${severityBar[flag.severity] ?? 'bg-muted'}`} />

          <div className="flex-1 min-w-0">
            {/* Tactic header */}
            <CardHeader className="pb-3 px-4 pt-4 bg-accent/5 dark:bg-accent/8 border-b border-border/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-sm font-bold text-accent-foreground dark:text-accent">
                    {flag.tacticLabel}
                  </CardTitle>
                  <SourceBadge source={flag.validationSource} />
                </div>
                {/* Plain / Tech toggle */}
                <div className="flex bg-muted rounded-md p-0.5 shrink-0 border border-border/50">
                  {(['Plain', 'Tech'] as const).map((label) => {
                    const isTech = label === 'Tech';
                    const active = showTechnical === isTech;
                    return (
                      <button
                        key={label}
                        onClick={(e) => { e.stopPropagation(); setShowTechnical(isTech); }}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                          active
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                {showTechnical ? flag.technicalExplanation : flag.plainExplanation}
              </p>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3 space-y-3">
              {/* Flagged phrase */}
              <div className="font-mono text-xs bg-accent/10 dark:bg-accent/15 border border-accent/25 rounded-md px-3 py-2 italic text-amber-900 dark:text-amber-200 leading-relaxed">
                "{flag.phrase}"
              </div>

              {/* Exposure row */}
              <div className="flex gap-2.5 items-start bg-muted/40 rounded-lg p-3 border border-border/50">
                <div className="bg-secondary rounded-md p-1.5 shrink-0 text-muted-foreground mt-0.5">
                  <ExposureIcon exposure={flag.exposure} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Exposure</p>
                  <p className="text-xs font-medium text-foreground">{flag.exposure}</p>
                </div>
              </div>

              {/* Consequence row */}
              <div className="flex gap-2.5 items-start bg-destructive/6 dark:bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                <div className="bg-destructive/15 rounded-md p-1.5 shrink-0 text-destructive mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-destructive/60 uppercase tracking-wider mb-0.5">Consequence</p>
                  <p className="text-xs font-medium text-destructive dark:text-destructive">{flag.consequence}</p>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }
);

ExposureCard.displayName = 'ExposureCard';

export function ExposureCards({ flags, activeFlagIndex, onFlagClick, cardRefs }: ExposureCardsProps) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-3 pb-12">
      {flags.map((flag, index) => (
        <ExposureCard
          key={`${flag.startIndex}-${index}`}
          ref={(el) => { cardRefs.current[index] = el; }}
          flag={flag}
          isActive={activeFlagIndex === index}
          onClick={() => onFlagClick(index)}
        />
      ))}
    </div>
  );
}
