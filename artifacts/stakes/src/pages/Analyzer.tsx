import React, { useState, useRef } from 'react';
import { useAnalyzeMessage, useListTactics, AnalysisResultVerdict } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShieldCheck, Search, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { InlineHighlighter } from '@/components/InlineHighlighter';
import { ExposureCards } from '@/components/ExposureCards';
import { SamplePresets } from '@/components/SamplePresets';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { PatternDensity } from '@/components/PatternDensity';
import { StatsBar } from '@/components/StatsBar';
import { useRewriteMessage } from '@workspace/api-client-react';

const ScannerAnimation = () => (
  <div className="relative w-full h-full min-h-[300px] bg-secondary/20 rounded-lg overflow-hidden border border-dashed flex flex-col items-center justify-center">
    <motion.div
      className="absolute inset-0 bg-primary/5"
      initial={{ top: "-100%" }}
      animate={{ top: "100%" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]" />
    <Search className="w-10 h-10 text-primary opacity-50 mb-4 z-10 animate-pulse" />
    <div className="z-10 text-center px-4">
      <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-primary mb-2">Forensic Scan Active</h3>
      <p className="text-xs text-muted-foreground font-mono">Running pre-filter heuristics and LLM taxonomy match...</p>
    </div>
  </div>
);

const RewriteSection = ({ originalMessage }: { originalMessage: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rewriteMutation = useRewriteMessage();

  const handleToggle = () => {
    if (!isOpen && !rewriteMutation.data && !rewriteMutation.isPending) {
      rewriteMutation.mutate({ data: { message: originalMessage } });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-8 pt-8 border-t border-dashed">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg">What Legitimate Looks Like</h3>
          <p className="text-sm text-muted-foreground">See how this message would be written without manipulation tactics.</p>
        </div>
        <Button onClick={handleToggle} variant={isOpen ? "secondary" : "outline"} className="font-mono text-sm">
          {isOpen ? "Hide Comparison" : "Rewrite Message"}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {rewriteMutation.isPending && (
              <div className="p-8 bg-secondary/20 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
                <Search className="w-6 h-6 text-muted-foreground animate-spin mb-3" />
                <p className="font-mono text-sm text-muted-foreground">Removing manipulation tactics...</p>
              </div>
            )}
            {rewriteMutation.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg border p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Flagged Original
                  </div>
                  <div className="font-mono text-sm whitespace-pre-wrap opacity-70 leading-relaxed">
                    {rewriteMutation.data.original}
                  </div>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Clean Rewrite
                  </div>
                  <div className="font-mono text-sm whitespace-pre-wrap text-emerald-950 dark:text-emerald-100 leading-relaxed">
                    {rewriteMutation.data.rewritten}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Analyzer() {
  const [message, setMessage] = useState('');
  const [activeFlagIndex, setActiveFlagIndex] = useState<number | null>(null);
  const [showTactics, setShowTactics] = useState(false);
  
  const { data: tactics } = useListTactics();
  const analyzeMutation = useAnalyzeMessage();
  const result = analyzeMutation.data;

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleAnalyze = () => {
    if (!message.trim()) return;
    setActiveFlagIndex(null);
    analyzeMutation.mutate({ data: { message } });
  };

  const handleFlagClick = (index: number) => {
    setActiveFlagIndex(index);
    if (cardRefs.current[index]) {
      cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getVerdictColor = (verdict: AnalysisResultVerdict) => {
    switch (verdict) {
      case 'safe': return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900';
      case 'suspicious': return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900';
      case 'scam': return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900';
    }
  };

  const getVerdictIcon = (verdict: AnalysisResultVerdict) => {
    switch (verdict) {
      case 'safe': return <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />;
      case 'suspicious': return <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />;
      case 'scam': return <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Stakes</span>
            <span className="text-muted-foreground ml-2 text-sm font-mono hidden sm:inline-block">/ Forensic Message Analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            <HowItWorksModal />
            <Button 
              variant={showTactics ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setShowTactics(!showTactics)} 
              className="text-muted-foreground font-mono hidden md:flex"
            >
              {showTactics ? "Hide taxonomy" : "What we look for"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 mt-4 md:mt-8 mb-12">
        
        {/* Left Column: Input / Result Highlight */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!result || analyzeMutation.isPending ? (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Analyze a message</h1>
                <p className="text-muted-foreground text-lg">Paste a suspicious text, email, or transcript below to dissect it.</p>
              </div>
              
              <div className="mt-4">
                <SamplePresets onSelect={setMessage} disabled={analyzeMutation.isPending} />
                {analyzeMutation.isPending ? (
                  <ScannerAnimation />
                ) : (
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. 'URGENT: Your account ending in 4921 has been restricted due to suspicious activity. Click here to verify your identity within 24 hours...'"
                    className="min-h-[300px] resize-y text-base p-6 font-mono leading-relaxed transition-all focus-visible:ring-primary focus-visible:border-primary border-muted bg-card shadow-sm"
                    disabled={analyzeMutation.isPending}
                  />
                )}
              </div>

              {!analyzeMutation.isPending && (
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto self-end font-mono uppercase tracking-wider mt-2" 
                  onClick={handleAnalyze}
                  disabled={!message.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Message
                </Button>
              )}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold mb-3">Forensic Breakdown</h2>
                  <PatternDensity density={result.patternDensity} />
                </div>
                <Button variant="outline" onClick={() => {
                  analyzeMutation.reset();
                  setMessage('');
                  setActiveFlagIndex(null);
                }}>
                  Analyze Another
                </Button>
              </div>

              <InlineHighlighter 
                message={message} 
                flags={result.flags} 
                activeFlagIndex={activeFlagIndex}
                onFlagClick={handleFlagClick}
              />

              <div className="bg-secondary/40 border border-secondary p-4 rounded-lg flex gap-3 text-sm text-muted-foreground items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  No flags found doesn't mean this message is 100% safe — always verify requests for money or codes through a separate, trusted channel.
                </p>
              </div>

              {result.takeaway && (
                <div className="bg-primary text-primary-foreground p-5 rounded-lg flex items-start gap-4 mt-2 shadow-sm">
                  <div className="bg-background/20 p-2 rounded-full shrink-0">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Pattern Recognized</h4>
                    <p className="font-medium leading-relaxed">{result.takeaway}</p>
                  </div>
                </div>
              )}

              {result.flags.length > 0 && (
                <RewriteSection originalMessage={message} />
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column: Tactics Taxonomy OR Consequence Cards */}
        <div className="lg:col-span-5 relative">
          <AnimatePresence mode="wait">
            {showTactics && tactics ? (
              <motion.div 
                key="tactics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card rounded-xl p-6 border shadow-sm h-[calc(100vh-8rem)] overflow-y-auto sticky top-24"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h3 className="font-bold text-lg font-mono">Taxonomy of Deception</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowTactics(false)}>
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="space-y-8">
                  {tactics.map((t) => (
                    <div key={t.id} className="relative">
                      <div className="absolute left-0 top-1.5 bottom-0 w-1 bg-amber-200 dark:bg-amber-900/50 rounded-full" />
                      <div className="pl-5">
                        <h4 className="font-bold text-base mb-1 text-foreground">{t.label}</h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{t.description}</p>
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Examples</span>
                          {t.examples.map((ex, i) => (
                            <div key={i} className="text-xs font-mono bg-secondary/50 px-3 py-2 rounded-md border text-muted-foreground">
                              "{ex}"
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Verdict Card */}
                <Card className={`border-2 shadow-sm ${getVerdictColor(result.verdict)}`}>
                  <CardContent className="p-6 flex gap-4 items-start">
                    <div className="shrink-0 mt-1">
                      {getVerdictIcon(result.verdict)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl uppercase tracking-wider mb-1">
                        {result.verdict}
                      </h3>
                      <p className="text-sm font-medium opacity-90 leading-relaxed">{result.summary}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Flags Header */}
                {result.flags.length > 0 ? (
                  <div className="flex items-center gap-2 mb-2 pt-2">
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-bold text-lg">Detected Flags</h3>
                    <Badge variant="secondary" className="ml-auto font-mono">
                      {result.flags.length} found
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center p-10 bg-secondary/30 rounded-xl border border-dashed mt-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-80" />
                    <p className="font-bold text-lg mb-1">No manipulation tactics detected.</p>
                    <p className="text-sm text-muted-foreground">Stay vigilant, but this message appears clean from common forensic markers.</p>
                  </div>
                )}

                <ExposureCards 
                  flags={result.flags} 
                  activeFlagIndex={activeFlagIndex} 
                  onFlagClick={handleFlagClick} 
                  cardRefs={cardRefs} 
                />
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full hidden lg:flex flex-col items-center justify-center text-center p-10 bg-secondary/20 rounded-xl border border-dashed min-h-[400px]"
              >
                <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mb-6" />
                <h3 className="font-medium text-lg text-muted-foreground">Awaiting Input</h3>
                <p className="text-sm text-muted-foreground/70 mt-3 max-w-sm leading-relaxed">
                  Paste a message to see a forensic breakdown of its psychological tactics and real-world consequences.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <StatsBar />
    </div>
  );
}
