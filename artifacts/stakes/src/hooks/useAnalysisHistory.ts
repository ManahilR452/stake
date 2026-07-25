import { useState, useEffect, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  message: string;
  preview: string;          // first 80 chars
  verdict: string;
  flagCount: number;
  patternDensity: string;
  takeaway: string | null;
  timestamp: number;        // Date.now()
  result: unknown;          // full AnalysisResult — stored as-is
}

const STORAGE_KEY = 'stakes-history';
const MAX_ENTRIES = 10;

function load(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(load);

  // Keep in sync across tabs
  useEffect(() => {
    const handler = () => setHistory(load());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addEntry = useCallback((message: string, result: {
    verdict: string;
    flags: unknown[];
    patternDensity: string;
    takeaway: string | null;
  }) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      preview: message.trim().slice(0, 80) + (message.length > 80 ? '…' : ''),
      verdict: result.verdict,
      flagCount: Array.isArray(result.flags) ? result.flags.length : 0,
      patternDensity: result.patternDensity,
      takeaway: result.takeaway,
      timestamp: Date.now(),
      result,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearAll };
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
