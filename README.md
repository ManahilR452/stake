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

### Core Analysis
- **Inline phrase highlighting** — amber highlights over exact flagged substrings, click to expand annotation panel
- **7-tactic forensic taxonomy** — Urgency, Fake Authority, Secrecy, Fear, Reciprocity, Too Good To Be True, False Familiarity
- **Dual-signal analysis** — regex pre-filter + LLM taxonomy, cross-validated and merged
- **Anti-hallucination guarantee** — every phrase verified as a verbatim substring before display
- **Tech / Plain toggle** — Cialdini-grounded technical explanation or plain-English per flag
- **Pattern Density gauge** — qualitative Low / Moderate / High indicator

### New Features
- **🌙 Dark mode toggle** — one-click light/dark switch, persists across sessions
- **🕐 Analysis history** — last 10 analyses saved locally; click any entry to restore it instantly
- **📋 Copy report** — exports full forensic analysis as formatted plain text to clipboard
- **🔗 Share** — native share sheet on mobile, clipboard fallback on desktop
- **📊 Risk Score Gauge** — animated semicircle gauge (0–100) derived from verdict, pattern density, and flag severity
- **📈 Live Tactic Chart** — animated bar chart showing tactic frequency pulled from Replit DB in real time
- **✏️ "What Legitimate Looks Like"** — AI rewrites the scam message as a clean, non-manipulative version for comparison
- **4 one-click sample presets** — English, Roman Urdu, English/Urdu mix, Lottery email
- **Pattern Library stats** — anonymous aggregate counts via Replit DB (no PII stored)
- **Offline fallback** — regex-only engine still works if AI is unavailable

---

## Screenshots

| Input Screen | After Analysis |
|---|---|
| Live tactic chart from Replit DB on the right | Risk gauge + verdict card + flagged exposure cards |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express 5, TypeScript, Zod |
| AI | OpenAI (`gpt-5.6-terra`) via Replit AI Integrations |
| Stats store | Replit DB (KV) — tactic & exposure counts, no PII |
| API contract | OpenAPI 3.1 → Orval codegen (React Query + Zod) |
| Monorepo | pnpm workspaces |

---

## How It Works

```
Message Input
     │
     ▼
┌─────────────────────────┐
│   Regex Pre-filter      │  ← CNIC, IBAN, OTP, EasyPaisa, shortened URLs,
│                         │    urgency/threat keywords (EN + UR + Roman UR)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   LLM Taxonomy Match    │  ← Fixed 7-tactic taxonomy in system prompt,
│   (gpt-5.6-terra)       │    strict JSON output — no hallucinated tactics
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Phrase Validator      │  ← Every phrase verified as verbatim substring;
│                         │    mismatches silently discarded
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Merge & Deduplicate   │  ← Tags: Rule Pre-filter / AI Taxonomy /
│                         │    Dual-Signal Verified
└───────────┬─────────────┘
            │
            ▼
     Forensic Report
```

---

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/stakes run dev        # Frontend
```

Requires:
```
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...
```

---

## Tactic Taxonomy

| ID | Label | Cialdini Principle |
|---|---|---|
| `urgency` | Urgency / Time Pressure | Scarcity |
| `fake_authority` | Fake Authority | Authority |
| `secrecy` | Secrecy / Isolation | Social Proof (inverse) |
| `fear` | Fear / Threat | Loss Aversion |
| `reciprocity` | Reciprocity | Reciprocity |
| `too_good` | Too Good To Be True | Optimism Bias |
| `false_familiarity` | False Familiarity | Liking / Mere Exposure |

---

## Architecture Notes

- **Stateless analysis** — no DB row per message; only anonymized tactic/exposure type counts go to Replit KV
- **Offline fallback** — if OpenAI is unavailable, the regex pre-filter engine produces conservative results
- **Rewrite cache** — "What Legitimate Looks Like" is cached per-analysis in React state; toggling off/on doesn't re-call the API
- **History** — stored in `localStorage` only; never sent to the server
