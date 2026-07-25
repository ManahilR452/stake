import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Shield, BrainCircuit, SearchCheck, BookOpen } from 'lucide-react';

export function HowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground font-mono">
          <Info className="w-4 h-4 mr-2" />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Forensic Engine Architecture
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Stakes does not simply ask an AI "is this a scam?" It uses a structured, multi-stage pipeline to identify psychological manipulation patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
          <div className="flex gap-4 items-start">
            <div className="mt-1 bg-secondary p-2 rounded-md shrink-0">
              <SearchCheck className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-base">1. Pre-filter Engine</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                A rules-based regex engine runs before any AI call. It catches structured data patterns instantly: Pakistani CNIC formats, PK IBANs, OTP sequences, EasyPaisa/JazzCash keywords, shortened URLs, and urgency keywords across English, Urdu, and Roman Urdu.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="mt-1 bg-secondary p-2 rounded-md shrink-0">
              <BrainCircuit className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-base">2. LLM Taxonomy Match</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                If the pre-filter flags the message, it is evaluated against a fixed 7-tactic taxonomy sent to the AI with strict JSON output. The AI is constrained: it cannot invent new tactics, only classify substrings into the existing forensic taxonomy.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="mt-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2 rounded-md shrink-0">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-base">3. Anti-hallucination Guarantee</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Every phrase the AI returns is verified programmatically as an exact verbatim substring of your original message before display. Anything that doesn't match perfectly is discarded silently.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start pt-4 border-t">
            <div className="mt-1 bg-secondary p-2 rounded-md shrink-0">
              <BookOpen className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-base">Research Grounding</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Our taxonomy is grounded in Cialdini's persuasion principles. Scarcity manifests as fake urgency. Authority translates to impersonating officials or bank representatives. Reciprocity is used in prize/lottery scams. Fear Appeals force you to act quickly under threat of losing access or funds.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
