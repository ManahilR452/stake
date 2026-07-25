import React, { useState, forwardRef } from 'react';
import { Flag } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, IdCard, CreditCard, Link2, Banknote, User, ShieldAlert, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExposureCardsProps {
  flags: Flag[];
  activeFlagIndex: number | null;
  onFlagClick: (index: number) => void;
  cardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
}

const ExposureIcon = ({ exposure }: { exposure: string }) => {
  const e = exposure.toLowerCase();
  if (e.includes('otp') || e.includes('verification code') || e.includes('password')) return <Key className="w-5 h-5 text-muted-foreground" />;
  if (e.includes('cnic') || e.includes('national id') || e.includes('id')) return <IdCard className="w-5 h-5 text-muted-foreground" />;
  if (e.includes('bank') || e.includes('iban') || e.includes('account')) return <CreditCard className="w-5 h-5 text-muted-foreground" />;
  if (e.includes('link') || e.includes('url') || e.includes('click')) return <Link2 className="w-5 h-5 text-muted-foreground" />;
  if (e.includes('payment') || e.includes('fee') || e.includes('money') || e.includes('rs') || e.includes('£')) return <Banknote className="w-5 h-5 text-muted-foreground" />;
  if (e.includes('personal') || e.includes('family') || e.includes('name')) return <User className="w-5 h-5 text-muted-foreground" />;
  return <ShieldAlert className="w-5 h-5 text-muted-foreground" />;
};

const SourceBadge = ({ source }: { source: string }) => {
  switch (source) {
    case 'rule_prefilter':
      return <Badge variant="outline" className="font-mono text-[10px] uppercase bg-secondary">Rule</Badge>;
    case 'llm_taxonomy':
      return <Badge variant="outline" className="font-mono text-[10px] uppercase bg-secondary text-primary">AI</Badge>;
    case 'dual_verified':
      return <Badge variant="outline" className="font-mono text-[10px] uppercase bg-emerald-50 text-emerald-700 border-emerald-200">Verified ✓</Badge>;
    default:
      return null;
  }
};

const ExposureCard = forwardRef<HTMLDivElement, { flag: Flag; isActive: boolean; onClick: () => void }>(({ flag, isActive, onClick }, ref) => {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <Card 
      ref={ref}
      className={`transition-all duration-300 cursor-pointer overflow-hidden ${
        isActive ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-md border-primary' : 'opacity-80 hover:opacity-100'
      }`}
      onClick={onClick}
    >
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${flag.severity === 'high' ? 'bg-red-500' : flag.severity === 'medium' ? 'bg-orange-500' : 'bg-amber-400'}`} />
        <div className="flex-1">
          <CardHeader className="pb-3 px-5 pt-5 bg-amber-50/50 dark:bg-amber-950/10">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="text-amber-900 dark:text-amber-500">{flag.tacticLabel}</span>
                  <SourceBadge source={flag.validationSource} />
                </CardTitle>
              </div>
              <div className="flex bg-secondary/50 rounded-md p-1 border">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTechnical(false); }}
                  className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${!showTechnical ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Plain
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTechnical(true); }}
                  className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${showTechnical ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Tech
                </button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground min-h-[40px]">
              {showTechnical ? flag.technicalExplanation : flag.plainExplanation}
            </p>
          </CardHeader>
          
          <CardContent className="px-5 pb-5 pt-4 border-t">
            <div className="bg-muted/50 p-3 rounded border font-mono text-sm mb-5 italic border-l-2 border-l-amber-400">
              "{flag.phrase}"
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-background rounded-lg p-3 border flex gap-3 items-start">
                <div className="mt-0.5 bg-secondary p-1.5 rounded-md">
                  <ExposureIcon exposure={flag.exposure} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 block">Exposure</span>
                  <div className="font-medium text-sm text-foreground">
                    {flag.exposure}
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-3 border bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 flex gap-3 items-start">
                <div className="mt-0.5 bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-800/60 dark:text-red-300/60 uppercase tracking-wider mb-0.5 block">Consequence</span>
                  <div className="font-medium text-sm text-red-900 dark:text-red-300">
                    {flag.consequence}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
});

ExposureCard.displayName = 'ExposureCard';

export function ExposureCards({ flags, activeFlagIndex, onFlagClick, cardRefs }: ExposureCardsProps) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-4 pb-12">
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
