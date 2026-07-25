# Stakes — Forensic Message Analyzer

> **HackSummer'26** · Theme: *"Trust Me"*

Stakes dissects suspicious messages — SMS, email, WhatsApp, call transcripts — and tells you **exactly which phrase** is manipulating you, **what psychological tactic** it uses, and **what you'd actually lose** if you comply. Instead of a red/green verdict, it teaches you to recognize the pattern yourself next time.

---

## ⭐ Team Name : Commute X

## ⭐ Team Members
- Maira Jamal
- Manahil Rehan
- Amna Asif

---

## Features

- **Inline phrase highlighting** — amber highlights over exact flagged substrings, click to expand
- **7-tactic forensic taxonomy** — Urgency, Fake Authority, Secrecy, Fear, Reciprocity, Too Good To Be True, False Familiarity
- **Dual-signal analysis** — regex pre-filter + LLM taxonomy, cross-validated
- **Anti-hallucination guarantee** — every phrase verified as a verbatim substring before display
- **Tech / Plain toggle** — Cialdini-grounded technical explanation or plain-English per flag
- **"What Legitimate Looks Like"** — AI rewrites the message without the manipulation tactics
- **Pattern Density** — qualitative Low / Moderate / High indicator
- **Pattern Library stats** — anonymous aggregate counts via Replit DB (no PII stored)
- **4 one-click sample presets** — English, Roman Urdu, English/Urdu mix, Lottery email
- **Offline fallback** — regex-only engine still works if AI is unavailable

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express 5, TypeScript, Zod |
| AI | OpenAI via Replit AI Integrations |
| Stats store | Replit DB (KV) |
| API contract | OpenAPI 3.1 → Orval codegen (React Query + Zod) |
| Monorepo | pnpm workspaces |

---

## How It Works

1. **Pre-filter** — regex patterns run instantly, catching Pakistani CNICs, PK IBANs, OTP sequences, EasyPaisa/JazzCash keywords, shortened URLs, and urgency/threat keywords in English, Urdu, and Roman Urdu.
2. **LLM Taxonomy** — a fixed 7-tactic taxonomy is sent to the AI with strict JSON output; the model cannot invent new tactics.
3. **Validator** — every phrase returned by the AI is verified as a verbatim substring of your original message. Anything that doesn't match is discarded silently.
4. **Merge** — both signal sets are combined and deduplicated. Each flag is tagged `Rule Pre-filter`, `AI Taxonomy`, or `Dual-Signal Verified`.

---

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/stakes run dev        # Frontend
```

Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables.
