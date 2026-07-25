import React, { useState, useRef } from 'react';
import { useAnalyzeMessage, useListTactics, AnalysisResultVerdict } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, ShieldCheck, Search, CheckCircle2, AlertTriangle,
  XCircle, ShieldAlert, BrainCircuit, Scan, ArrowLeft,
  Moon, Sun, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { InlineHighlighter } from '@/components/InlineHighlighter';
import { ExposureCards } from '@/components/ExposureCards';
import { SamplePresets } from '@/components/SamplePresets';
import { PatternDensity } from '@/components/PatternDensity';
import { StatsBar } from '@/components/StatsBar';
import { RiskGauge, computeRiskScore } from '@/components/RiskGauge';
import { TacticChart } from '@/components/TacticChart';
import { CopyShareBar } from '@/components/CopyShareBar';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { useRewriteMessage } from '@workspace/api-client-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAnalysisHistory, HistoryEntry } from '@/hooks/useAnalysisHistory';

/* ── Radar sweep animation ─────────────────────────────────────────── */
const ScannerAnimation = () => (
  <div className="relative w-full min-h-[300px] rounded-xl overflow-hidden border border-primary/20 bg-primary/5 flex flex-col items-center justify-center">
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
      initial={{ top: '0%' }}
      animate={{ top: '100%' }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
    />
    <motion.div
      className="absolute left-0 right-0 h-16 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"
      initial={{ top: '0%' }}
      animate={{ top: '100%' }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
    <div className="z-10 flex flex-col items-center gap-3 px-6 text-center">
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Scan className="w-10 h-10 text-primary" />
      </motion.div>
      <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-primary">Forensic Scan Active</h3>
      <p className="text-xs font-mono text-muted-foreground max-w-xs">
        Running pre-filter heuristics · cross-referencing LLM tactic taxonomy · validating phrase offsets
      </p>
      <div className="flex gap-1 mt-2">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ── Rewrite comparison ────────────────────────────────────────────── */
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
    <div className="mt-6 pt-6 border-t border-dashed border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">What Legitimate Looks Like</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            See how this message reads without manipulation tactics.
          </p>
        </div>
        <Button onClick={handleToggle} variant={isOpen ? 'secondary' : 'outline'} size="sm"
          className="font-mono text-xs shrink-0">
          {isOpen ? 'Hide' : 'Rewrite'}
        </Button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {rewriteMutation.isPending && (
              <div className="p-8 bg-primary/5 rounded-xl border border-primary/20 flex flex-col items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <Search className="w-5 h-5 text-primary" />
                </motion.div>
                <p className="font-mono text-xs text-muted-foreground">Removing manipulation tactics…</p>
              </div>
            )}
            {rewriteMutation.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-destructive/70 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Flagged Original
                  </div>
                  <div className="font-mono text-xs whitespace-pre-wrap opacity-75 leading-relaxed">
                    {rewriteMutation.data.original}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Clean Rewrite
                  </div>
                  <div className="font-mono text-xs whitespace-pre-wrap text-emerald-900 dark:text-emerald-100 leading-relaxed">
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

/* ── Verdict helpers ───────────────────────────────────────────────── */
const getVerdictStyle = (verdict: AnalysisResultVerdict) => {
  switch (verdict) {
    case 'safe':       return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50';
    case 'suspicious': return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50';
    case 'scam':       return 'text-destructive bg-destructive/8 border-destructive/30';
  }
};

const getVerdictIcon = (verdict: AnalysisResultVerdict) => {
  switch (verdict) {
    case 'safe':       return <ShieldCheck className="w-7 h-7 text-emerald-500" />;
    case 'suspicious': return <AlertTriangle className="w-7 h-7 text-amber-500" />;
    case 'scam':       return <XCircle className="w-7 h-7 text-destructive" />;
  }
};

/* ── Main page ─────────────────────────────────────────────────────── */
export default function Analyzer() {
  const [message, setMessage] = useState('');
  const [activeFlagIndex, setActiveFlagIndex] = useState<number | null>(null);
  const [showTactics, setShowTactics] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { dark, toggle: toggleDark } = useDarkMode();
  const { history, addEntry, removeEntry, clearAll } = useAnalysisHistory();

  const { data: tactics } = useListTactics();
  const analyzeMutation = useAnalyzeMessage();
  const result = analyzeMutation.data;
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleAnalyze = () => {
    if (!message.trim()) return;
    setActiveFlagIndex(null);
    analyzeMutation.mutate({ data: { message } }, {
      onSuccess: (data) => {
        addEntry(message, {
          verdict: data.verdict,
          flags: data.flags,
          patternDensity: data.patternDensity,
          takeaway: data.takeaway ?? null,
        });
      },
    });
  };

  const handleFlagClick = (index: number) => {
    setActiveFlagIndex(index);
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRestore = (entry: HistoryEntry) => {
    setMessage(entry.message);
    analyzeMutation.mutate({ data: { message: entry.message } });
    setActiveFlagIndex(null);
  };

  const riskScore = result
    ? computeRiskScore(result.verdict, result.patternDensity, result.flags as Array<{ severity: string }>)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <ShieldAlert className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">Stakes</span>
            <span className="text-muted-foreground text-xs font-mono hidden sm:inline-block opacity-60 ml-1">
              / Forensic Message Analyzer
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant={showTactics ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setShowTactics(!showTactics)}
              className="text-xs font-mono text-muted-foreground hidden md:flex">
              {showTactics ? 'Hide taxonomy' : 'What we look for'}
            </Button>

            {/* History button */}
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}
              className="relative gap-1.5 text-xs font-mono text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </Button>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon" onClick={toggleDark} className="w-8 h-8 text-muted-foreground">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 mb-16">

        {/* Left: Input / Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!result || analyzeMutation.isPending ? (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-5">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-1.5">Analyze a message</h1>
                  <p className="text-muted-foreground">
                    Paste a suspicious text, email, or call transcript to dissect its tactics.
                  </p>
                </div>

                <SamplePresets onSelect={setMessage} disabled={analyzeMutation.isPending} />

                {analyzeMutation.isPending ? <ScannerAnimation /> : (
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={"e.g. 'URGENT: Your account ending in 4921 has been restricted…'"}
                    className="min-h-[280px] resize-y text-sm p-5 font-mono leading-relaxed focus-visible:ring-primary focus-visible:border-primary border-border bg-card shadow-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                  />
                )}

                {!analyzeMutation.isPending && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-mono hidden sm:block opacity-60">Ctrl+Enter to analyze</p>
                    <Button size="default" onClick={handleAnalyze} disabled={!message.trim()}
                      className="font-mono uppercase tracking-wider text-sm px-6 shadow-md shadow-primary/20 ml-auto">
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Message
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Forensic Breakdown</h2>
                    <PatternDensity density={result.patternDensity} />
                  </div>
                  <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground"
                    onClick={() => { analyzeMutation.reset(); setMessage(''); setActiveFlagIndex(null); }}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    New analysis
                  </Button>
                </div>

                <InlineHighlighter message={message} flags={result.flags}
                  activeFlagIndex={activeFlagIndex} onFlagClick={handleFlagClick} />

                {/* Disclaimer */}
                <div className="bg-muted/50 border border-border/60 rounded-lg px-4 py-3 flex gap-2.5 text-xs text-muted-foreground items-start">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                  <p>No flags found doesn't mean this message is 100% safe. Always verify requests for money or codes through a separate, trusted channel.</p>
                </div>

                {/* Pattern Recognized */}
                {result.takeaway && (
                  <div className="bg-primary text-primary-foreground rounded-xl px-5 py-4 flex items-start gap-4 shadow-lg shadow-primary/20">
                    <div className="bg-white/20 p-2 rounded-lg shrink-0">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Pattern Recognized</p>
                      <p className="text-sm font-medium leading-relaxed">{result.takeaway}</p>
                    </div>
                  </div>
                )}

                {/* Copy / Share */}
                <CopyShareBar
                  message={message}
                  verdict={result.verdict}
                  summary={result.summary}
                  flags={result.flags}
                  takeaway={result.takeaway ?? null}
                />

                {result.flags.length > 0 && <RewriteSection originalMessage={message} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Tactics / Results / Empty+Chart */}
        <div className="lg:col-span-5 relative">
          <AnimatePresence mode="wait">
            {showTactics && tactics ? (
              <motion.div key="tactics" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="bg-card rounded-xl border border-border shadow-sm h-[calc(100vh-7rem)] overflow-y-auto sticky top-20 p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
                  <h3 className="font-bold font-mono text-xs uppercase tracking-wider text-primary">Taxonomy of Deception</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTactics(false)}>
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="space-y-7">
                  {tactics.map((t) => (
                    <div key={t.id} className="relative pl-4">
                      <div className="absolute left-0 top-1.5 bottom-0 w-0.5 rounded-full bg-accent/50" />
                      <h4 className="font-semibold text-sm mb-1">{t.label}</h4>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t.description}</p>
                      <div className="space-y-1.5">
                        {t.examples.map((ex, i) => (
                          <div key={i} className="text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-md text-muted-foreground border border-border/50">
                            "{ex}"
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="verdict" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-4 sticky top-20">

                {/* Verdict + Risk Gauge side by side */}
                <Card className={`border-2 ${getVerdictStyle(result.verdict)}`}>
                  <CardContent className="p-5 flex gap-4 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getVerdictIcon(result.verdict)}
                        <h3 className="font-bold text-xl uppercase tracking-wider">{result.verdict}</h3>
                      </div>
                      <p className="text-sm opacity-85 leading-relaxed">{result.summary}</p>
                    </div>
                    <div className="shrink-0 border-l border-current/20 pl-4">
                      <RiskGauge score={riskScore} verdict={result.verdict} />
                    </div>
                  </CardContent>
                </Card>

                {/* Flags header */}
                {result.flags.length > 0 ? (
                  <div className="flex items-center gap-2 px-1">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Detected Flags</h3>
                    <Badge className="ml-auto font-mono text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                      {result.flags.length} found
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center py-10 px-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">No manipulation tactics detected.</p>
                    <p className="text-xs text-muted-foreground">This message appears clean. Stay vigilant.</p>
                  </div>
                )}

                <ExposureCards flags={result.flags} activeFlagIndex={activeFlagIndex}
                  onFlagClick={handleFlagClick} cardRefs={cardRefs} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="hidden lg:flex flex-col gap-6 sticky top-20">
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-muted/20 min-h-[180px]">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-primary/40" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground mb-1.5">Awaiting Input</h3>
                  <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
                    Paste a message to see a forensic breakdown of its psychological tactics and real-world consequences.
                  </p>
                </div>

                {/* Tactic chart from live DB */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                  <TacticChart />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <StatsBar />

      {/* History drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onRestore={handleRestore}
        onRemove={removeEntry}
        onClearAll={clearAll}
      />
    </div>
  );
}
