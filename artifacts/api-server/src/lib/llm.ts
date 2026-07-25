import { openai } from "@workspace/integrations-openai-ai-server";
import { TACTICS, EXPOSURES } from "./taxonomy.js";
import { runPrefilter } from "./prefilter.js";
import { logger } from "../lib/logger.js";

export interface LLMFlag {
  phrase: string;
  startIndex: number;
  endIndex: number;
  tactic: string;
  tacticLabel: string;
  tacticDescription: string;
  exposure: string;
  consequence: string;
  severity: "low" | "medium" | "high";
}

export interface LLMResult {
  verdict: "safe" | "suspicious" | "scam";
  summary: string;
  takeaway: string | null;
  flags: LLMFlag[];
}

const TACTIC_LIST = Object.values(TACTICS)
  .map((t) => `- ${t.id}: ${t.description}`)
  .join("\n");

const EXPOSURE_LIST = Object.values(EXPOSURES)
  .map((e) => `- "${e.label}" → ${e.consequence}`)
  .join("\n");

const SYSTEM_PROMPT = `You are an expert social engineering analyst specialising in Pakistani digital scams. You analyse SMS, WhatsApp, email, and call transcripts in English, Urdu, and Roman Urdu (Urdu written in Latin script).

Your ONLY job is to identify psychological manipulation tactics and what real-world harm they lead to. Be specific, be accurate, and never invent phrases.

═══════════════════════════════════════
FIXED TACTIC TAXONOMY — use ONLY these ids:
═══════════════════════════════════════
${TACTIC_LIST}

═══════════════════════════════════════
FIXED EXPOSURE TAXONOMY — map "exposure" to one of these exact labels:
═══════════════════════════════════════
${EXPOSURE_LIST}

═══════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════
1. Read the entire message carefully before flagging anything.

2. For EVERY manipulative phrase, extract ONE flag:
   - "phrase": EXACT verbatim substring from the message — copy-paste, character for character, including original punctuation and capitalisation. Do NOT paraphrase, translate, or summarise.
   - "startIndex": 0-based character offset where the phrase starts in the original message
   - "endIndex": character offset where phrase ends (exclusive, like String.slice — message.slice(startIndex, endIndex) === phrase)
   - "tactic": one id from the taxonomy above (never invent a new id)
   - "tacticLabel": human-readable label for that tactic
   - "tacticDescription": one specific sentence explaining WHY this exact phrase is the named tactic
   - "exposure": one label from the exposure taxonomy (pick the most concrete match)
   - "consequence": verbatim consequence string from the exposure taxonomy
   - "severity": "low" | "medium" | "high"

3. SEVERITY CALIBRATION:
   - "high": requests OTP / PIN / password / CNIC / account credentials; threatens arrest, FIR, criminal charges, or immediate account block; makes a financial payment demand; contains a suspicious link
   - "medium": urgency keywords (URGENT, fawri, abhi, jaldi); threats of suspension that don't mention specific legal action; secrecy instructions; fake authority claims
   - "low": minor flattery, vague promises, mild familiarity claims

4. VERDICT rules — apply these strictly:
   - "scam": ANY of the following: OTP/PIN/password/CNIC request present; financial payment demanded (EasyPaisa, JazzCash, bank transfer, fee); arrest/FIR/criminal/warrant language; multiple (3+) high-severity flags; suspicious URL + urgency together
   - "suspicious": 1–2 medium/high flags without meeting scam criteria above
   - "safe": zero tactics found

5. "summary": 2–3 plain-English sentences describing what this message is trying to get you to do and why it is dangerous. Mention specific phrases where possible.

6. "takeaway": If flags were found — one closing sentence naming the tactic combination and the real-world risk. Format: "This message uses [tactic combo] to [goal] — do not [specific action]." If no flags, return null.

7. "messageLength": character count of the input message.

═══════════════════════════════════════
ROMAN URDU GUIDANCE
═══════════════════════════════════════
Messages may mix English, Urdu script, and Roman Urdu freely. Treat the following as equivalent to their English counterparts:
- fawri / abhi / jaldi / aaj hi / turant / phoran → urgency
- band ho jayega / block kar denge / case darj / FIR / girftaar → fear/threat
- kisi ko mat batana / secret rakhein / family ko mat batao → secrecy
- aapko prize mila / lucky winner / selected ho gaye → too_good
- OTP bata dein / code share karo / pin daalein → OTP request (urgency)
- processing fee / advance payment / nominal charge → reciprocity
- NADRA / FBR / SBP / Ehsaas / BISP / bank helpdesk → fake_authority

═══════════════════════════════════════
COMMON PAKISTANI SCAM PATTERNS — be alert for:
═══════════════════════════════════════
- NADRA/FBR/SBP impersonation demanding CNIC verification
- Bank helpdesk calling to "verify" or "unblock" account, asking for OTP
- Ehsaas/BISP program saying recipient has unclaimed money, asking for registration fee
- Prize bond / lottery win requiring tax payment or processing fee first
- Job offer (work from home, daily payment, task-based) requiring registration fee
- Investment scheme promising guaranteed returns or crypto profits
- WhatsApp account verification messages asking for 6-digit code
- SIM upgrade scam asking recipient to press keys or share codes

═══════════════════════════════════════
CRITICAL ANTI-HALLUCINATION RULES
═══════════════════════════════════════
- NEVER quote a phrase that isn't a verbatim substring of the message
- NEVER translate or paraphrase a phrase — copy it exactly
- NEVER invent a tactic id not in the taxonomy
- If you are uncertain whether something is manipulative, do NOT flag it
- Verify startIndex and endIndex: message.slice(startIndex, endIndex) must equal phrase exactly

Respond ONLY with valid JSON. No markdown fences. No text outside the JSON object.

JSON schema:
{
  "verdict": "safe" | "suspicious" | "scam",
  "summary": string,
  "takeaway": string | null,
  "flags": [
    {
      "phrase": string,
      "startIndex": number,
      "endIndex": number,
      "tactic": string,
      "tacticLabel": string,
      "tacticDescription": string,
      "exposure": string,
      "consequence": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "messageLength": number
}`;

/**
 * Offline fallback: use only the regex pre-filter when the LLM is unavailable.
 */
function offlineFallback(message: string): LLMResult {
  const prefilterFlags = runPrefilter(message);

  if (prefilterFlags.length === 0) {
    return {
      verdict: "safe",
      summary:
        "No manipulation patterns detected by the rule engine. AI analysis was unavailable.",
      takeaway: null,
      flags: [],
    };
  }

  const flags: LLMFlag[] = prefilterFlags.map((pf) => {
    const tactic = TACTICS[pf.tactic];
    return {
      phrase: pf.phrase,
      startIndex: pf.startIndex,
      endIndex: pf.endIndex,
      tactic: pf.tactic,
      tacticLabel: tactic?.label ?? pf.tactic,
      tacticDescription: tactic?.description ?? "Suspicious pattern detected by rule engine.",
      exposure: pf.exposure ?? "Personal information",
      consequence: "Exercise caution — this pattern is associated with scams.",
      severity: pf.confidence === "high" ? "high" : "medium",
    };
  });

  const highCount = flags.filter((f) => f.severity === "high").length;
  const verdict: "scam" | "suspicious" | "safe" =
    highCount >= 2 ? "scam" : flags.length > 0 ? "suspicious" : "safe";

  const tacticLabels = [...new Set(flags.map((f) => f.tacticLabel))].join(", ");

  return {
    verdict,
    summary: `Rule-based analysis detected ${flags.length} suspicious pattern(s): ${tacticLabels}. AI analysis was unavailable — treat with caution.`,
    takeaway: flags.length > 0
      ? `Pattern recognized: ${tacticLabels} — classic social engineering combination.`
      : null,
    flags,
  };
}

/**
 * Call the LLM with the fixed taxonomy. Falls back to offline regex if AI fails.
 */
export async function analyzewithLLM(message: string): Promise<{
  result: LLMResult;
  source: "llm" | "offline";
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this message for social engineering tactics. Be thorough — check every sentence.\n\nMESSAGE:\n${message}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(rawContent) as LLMResult & { messageLength?: number };

    if (!parsed.messageLength) parsed.messageLength = message.length as unknown as undefined;

    return { result: parsed, source: "llm" };
  } catch (err) {
    logger.warn({ err }, "LLM call failed, using offline fallback");
    return { result: offlineFallback(message), source: "offline" };
  }
}
