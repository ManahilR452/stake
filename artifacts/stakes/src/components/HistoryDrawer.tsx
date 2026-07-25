import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HistoryEntry, relativeTime } from '@/hooks/useAnalysisHistory';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const VerdictIcon = ({ verdict }: { verdict: string }) => {
  if (verdict === 'safe')       return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
  if (verdict === 'suspicious') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
};

const verdictBadge: Record<string, string> = {
  safe:       'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
  suspicious: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  scam:       'bg-destructive/8 text-destructive border-destructive/25',
};

export function HistoryDrawer({ open, onClose, history, onRestore, onRemove, onClearAll }: HistoryDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary/60" />
                <h2 className="font-bold text-sm">Analysis History</h2>
                <Badge className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20 ml-1">
                  {history.length}/10
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2" onClick={onClearAll}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear all
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                  <Clock className="w-10 h-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No analyses yet.</p>
                  <p className="text-xs text-muted-foreground/60">Each analysis you run will appear here.</p>
                </div>
              )}

              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="group bg-background border border-border/60 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <VerdictIcon verdict={entry.verdict} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${verdictBadge[entry.verdict] ?? ''}`}>
                        {entry.verdict}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{entry.flagCount} flag{entry.flagCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground/50">{relativeTime(entry.timestamp)}</span>
                      <button
                        onClick={() => onRemove(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Message preview */}
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {entry.preview}
                  </p>

                  {/* Restore button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-mono gap-1.5 text-primary hover:bg-primary/10 px-2 w-full"
                    onClick={() => { onRestore(entry); onClose(); }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore this analysis
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border/40 text-[10px] font-mono text-muted-foreground/40 text-center">
              Stored locally · no data sent to server
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
