# Stakes

A forensic scam message analyzer for HackSummer'26 (theme: "Trust Me"). Paste any suspicious message — SMS, email, WhatsApp, call transcript — and get back: the exact phrases being used to manipulate you, the named psychological tactic, what you'd actually lose, and a rewritten clean version so you see what legitimate looks like.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/stakes run dev` — frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks + Zod schemas after spec changes

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Wouter
- API: Express 5
- AI: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- Pattern Library stats: Replit DB (KV store via `REPLIT_DB_URL`)
- Validation: Zod, Orval codegen from OpenAPI spec

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (single source of truth)
- `artifacts/stakes/src/` — React frontend
  - `components/InlineHighlighter.tsx` — highlights flagged phrases with amber; annotation panel with Tech/Plain toggle
  - `components/ExposureCards.tsx` — consequence cards with icons + validation source badges
  - `components/SamplePresets.tsx` — 1-click presets (English, Roman Urdu, Urdu mix)
  - `components/HowItWorksModal.tsx` — explains pre-filter, LLM taxonomy, anti-hallucination, Cialdini grounding
  - `components/PatternDensity.tsx` — qualitative dot/bar density gauge (Low/Moderate/High)
  - `components/StatsBar.tsx` — anonymous aggregate stats from Replit DB
  - `pages/Analyzer.tsx` — main page orchestration
- `artifacts/api-server/src/lib/`
  - `taxonomy.ts` — 7-tactic taxonomy with technical + plain explanations
  - `prefilter.ts` — regex pre-filter (CNIC, IBAN, OTP, EasyPaisa, Urdu/Roman Urdu keywords)
  - `validator.ts` — anti-hallucination: verifies every LLM phrase is a verbatim substring
  - `llm.ts` — OpenAI call with offline regex fallback
  - `db.ts` — Replit KV store for anonymized Pattern Library stats
- `artifacts/api-server/src/routes/`
  - `analyze.ts` — dual-signal analysis (regex + LLM merged, validated, deduplicated)
  - `tactics.ts` — static taxonomy endpoint
  - `stats.ts` — aggregate stats from Replit DB
  - `rewrite.ts` — "What Legitimate Looks Like" rewriter

## Architecture decisions

- **Dual-signal analysis**: regex pre-filter runs first, then LLM. Both outputs are merged and cross-validated. High-confidence structural regex hits (CNIC, IBAN, OTPs) that the LLM missed are surfaced tagged "Rule Pre-filter". Phrases found by both are tagged "Dual-Signal Verified".
- **Anti-hallucination**: every phrase returned by the LLM is checked as a verbatim substring of the original message before rendering. Discarded silently if not found.
- **Fixed taxonomy**: 7 tactic IDs are baked into both the system prompt and the server — the LLM cannot invent new ones. This prevents drift.
- **Stateless analysis**: no DB row per analysis. Only anonymized tactic/exposure type counts go to Replit KV — no message text, no PII ever stored.
- **Offline fallback**: if OpenAI is unavailable, the regex-only engine still produces useful results.
- **Tech/Plain toggle**: two explanation strings per tactic in `taxonomy.ts`, swapped client-side — no extra API call.
- **Rewrite cache**: "What Legitimate Looks Like" result is cached per-analysis in React state — toggling off/on doesn't re-call the API.

## Product

Users paste any suspicious message. Stakes returns:
1. Verdict: safe / suspicious / scam (never a numeric score)
2. Amber-highlighted phrases inline with clickable annotation panels
3. Consequence cards per flag: icon, tactic, exposure, real-world consequence, validation source badge
4. Tech/Plain explanation toggle per flag
5. Pattern Density visual (qualitative, not numeric)
6. "What Legitimate Looks Like" — side-by-side rewritten clean version
7. "Pattern Recognized" takeaway closing line
8. Anonymous aggregate stats ("X messages analyzed, most common tactic: Urgency")
9. Persistent disclaimer near results

## Tactic taxonomy

urgency, fake_authority, secrecy, fear, reciprocity, too_good, false_familiarity

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, run codegen before touching routes or frontend.
- `lib/integrations-openai-ai-react` needs `@types/react` + `jsx: "preserve"` in its tsconfig for `tsc --build` to pass.
- Replit DB (`REPLIT_DB_URL`) gracefully skips in environments where it's not set — stats will read as all-zero.
- Route index uses `.js` extensions for ESM compatibility (`import ... from "./analyze.js"`).
