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

const SYSTEM_PROMPT = `You are a social engineering analyst. Your ONLY job is to identify psychological manipulation tactics in messages. Do not judge the sender's morality — just identify the mechanism and the concrete exposure.

FIXED TACTIC TAXONOMY (use ONLY these ids, no others):
${TACTIC_LIST}

FIXED EXPOSURE TAXONOMY (map "exposure" to one of these exact labels):
${EXPOSURE_LIST}

Instructions:
1. Read the message.
2. For every phrase using one of the above tactics, return:
   - "phrase": EXACT verbatim substring from the message, character-for-character
   - "startIndex": 0-indexed character offset where phrase starts in the original message
   - "endIndex": character offset where phrase ends (exclusive, like String.slice)
   - "tactic": one tactic id from the list above
   - "tacticLabel": the human-readable label for that tactic
   - "tacticDescription": one sentence — why THIS specific phrase is the tactic
   - "exposure": one of the exposure labels above (pick the closest match)
   - "consequence": verbatim consequence string from the exposure taxonomy above
   - "severity": "low" | "medium" | "high"
3. Set "verdict":
   - "scam": multiple high-severity flags, or any identity_verification / otp exposure present
   - "suspicious": 1–3 moderate flags without identity extraction
   - "safe": no tactics found
4. Write "summary": 1–2 plain-English sentences about the overall message.
5. Write "takeaway": if flags found, one closing sentence naming the main tactic combo. Otherwise null.
6. Set "messageLength": the character count of the input message.

CRITICAL: Every phrase must be a verbatim substring. Do not paraphrase. Copy exactly including punctuation and capitalisation.

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
 * Produces a conservative but reliable result.
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
        { role: "user", content: `Analyze this message:\n\n${message}` },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(rawContent) as LLMResult & { messageLength?: number };

    // Ensure messageLength is set
    if (!parsed.messageLength) parsed.messageLength = message.length as unknown as undefined;

    return { result: parsed, source: "llm" };
  } catch (err) {
    logger.warn({ err }, "LLM call failed, using offline fallback");
    return { result: offlineFallback(message), source: "offline" };
  }
}
