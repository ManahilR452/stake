import { Router, type IRouter } from "express";
import { AnalyzeMessageBody, AnalyzeMessageResponse } from "@workspace/api-zod";
import { TACTICS, EXPOSURES } from "../lib/taxonomy.js";
import { runPrefilter } from "../lib/prefilter.js";
import { validateFlags, deduplicateFlags } from "../lib/validator.js";
import { analyzewithLLM } from "../lib/llm.js";
import { recordAnalysis } from "../lib/db.js";

const router: IRouter = Router();

function computePatternDensity(
  flagCount: number,
  messageLength: number
): "low" | "moderate" | "high" {
  const wordCount = Math.max(1, Math.ceil(messageLength / 5)); // rough word estimate
  const per100 = (flagCount / wordCount) * 100;
  if (per100 >= 4) return "high";
  if (per100 >= 1.5) return "moderate";
  return "low";
}

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message } = parsed.data;

  // Step 1: Regex pre-filter
  const prefilterFlags = runPrefilter(message);

  // Step 2: LLM analysis (with offline fallback)
  const { result: llmResult, source: llmSource } = await analyzewithLLM(message);

  // Step 3: Validate all LLM flags (anti-hallucination)
  const validatedLLMFlags = validateFlags(llmResult.flags, message);

  // Step 4: Build merged flag set with validation source tags
  const mergedFlags: Array<{
    phrase: string;
    startIndex: number;
    endIndex: number;
    tactic: string;
    tacticLabel: string;
    tacticDescription: string;
    technicalExplanation: string;
    plainExplanation: string;
    exposure: string;
    consequence: string;
    severity: "low" | "medium" | "high";
    validationSource: "rule_prefilter" | "llm_taxonomy" | "dual_verified";
  }> = [];

  // Index LLM flags by phrase for dual-signal detection
  const llmPhraseSet = new Set(validatedLLMFlags.map((f) => f.phrase.toLowerCase()));
  const prefilterPhraseSet = new Set(prefilterFlags.map((f) => f.phrase.toLowerCase()));

  // Add LLM flags with source tags
  for (const flag of validatedLLMFlags) {
    const tacticDef = TACTICS[flag.tactic];
    const isDualVerified = prefilterPhraseSet.has(flag.phrase.toLowerCase());

    mergedFlags.push({
      phrase: flag.phrase,
      startIndex: flag.startIndex,
      endIndex: flag.endIndex,
      tactic: flag.tactic,
      tacticLabel: tacticDef?.label ?? flag.tacticLabel,
      tacticDescription: flag.tacticDescription,
      technicalExplanation:
        tacticDef?.technicalExplanation ??
        "This phrase uses a known social engineering technique.",
      plainExplanation:
        tacticDef?.plainExplanation ??
        "This is a manipulation tactic designed to influence your decision-making.",
      exposure: flag.exposure,
      consequence: flag.consequence,
      severity: flag.severity,
      validationSource: isDualVerified ? "dual_verified" : "llm_taxonomy",
    });
  }

  // Add pre-filter flags the LLM missed (high-confidence structural signals only)
  for (const pflag of prefilterFlags) {
    if (pflag.confidence !== "high") continue; // only add LLM-missed for high confidence
    if (llmPhraseSet.has(pflag.phrase.toLowerCase())) continue; // already covered

    const tacticDef = TACTICS[pflag.tactic];
    const exposureDef = pflag.exposure
      ? Object.values(EXPOSURES).find((e) =>
          e.label.toLowerCase().includes(pflag.exposure!.toLowerCase().split(" ")[0])
        )
      : undefined;

    mergedFlags.push({
      phrase: pflag.phrase,
      startIndex: pflag.startIndex,
      endIndex: pflag.endIndex,
      tactic: pflag.tactic,
      tacticLabel: tacticDef?.label ?? pflag.tacticLabel,
      tacticDescription:
        tacticDef?.description ??
        "Detected by rule engine as a high-confidence structural signal.",
      technicalExplanation:
        tacticDef?.technicalExplanation ??
        "This pattern matches a known structural indicator of social engineering.",
      plainExplanation:
        tacticDef?.plainExplanation ??
        "This matches a common scam pattern — treat with caution.",
      exposure: pflag.exposure ?? "Personal information",
      consequence:
        exposureDef?.consequence ??
        "Exercise extreme caution — this pattern is associated with scams.",
      severity: "high",
      validationSource: "rule_prefilter",
    });
  }

  // Step 5: Validate merged set and deduplicate
  const validatedMerged = validateFlags(mergedFlags, message);
  const deduped = deduplicateFlags(validatedMerged);

  // Step 6: Determine final verdict (can only upgrade, never downgrade from LLM)
  let verdict = llmResult.verdict;
  const hasHighSeverity = deduped.some((f) => f.severity === "high");
  const hasIdentityExposure = deduped.some(
    (f) =>
      f.exposure.toLowerCase().includes("otp") ||
      f.exposure.toLowerCase().includes("verification code") ||
      f.exposure.toLowerCase().includes("cnic") ||
      f.exposure.toLowerCase().includes("national id") ||
      f.tactic === "identity_verification"
  );
  if (hasIdentityExposure || (hasHighSeverity && deduped.length >= 2)) {
    verdict = "scam";
  } else if (deduped.length > 0 && verdict === "safe") {
    verdict = "suspicious";
  }

  const patternDensity = computePatternDensity(deduped.length, message.length);

  const finalResult = {
    verdict,
    summary: llmResult.summary,
    flags: deduped,
    messageLength: message.length,
    patternDensity,
    takeaway: llmResult.takeaway ?? null,
  };

  // Step 7: Validate against the Zod schema
  const validated = AnalyzeMessageResponse.safeParse(finalResult);
  if (!validated.success) {
    req.log.error(
      { error: validated.error.message, data: finalResult },
      "Final result failed Zod validation"
    );
    res.status(500).json({ error: "Analysis result had unexpected shape" });
    return;
  }

  // Step 8: Record anonymized stats to Replit DB (fire-and-forget)
  const tacticIds = [...new Set(deduped.map((f) => f.tactic))];
  const exposureIds = [...new Set(deduped.map((f) => f.exposure))];
  recordAnalysis({ tacticIds, exposureIds }).catch((err) => {
    req.log.warn({ err }, "Failed to record stats to Replit DB");
  });

  req.log.info(
    {
      verdict,
      flagCount: deduped.length,
      llmSource,
      dualVerified: deduped.filter((f) => f.validationSource === "dual_verified").length,
    },
    "Analysis complete"
  );

  res.json(validated.data);
});

export default router;
