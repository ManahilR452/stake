/**
 * db.ts — Replit DB (key-value store) integration for anonymized Pattern Library stats.
 *
 * Uses REPLIT_DB_URL environment variable.
 * Stores ONLY tactic types and exposure types found — no message text, no PII.
 *
 * Key schema:
 *   stats:total          → integer (total analyses run)
 *   stats:tactic:{id}    → integer (count per tactic)
 *   stats:exposure:{id}  → integer (count per exposure label)
 */

const DB_URL = process.env.REPLIT_DB_URL;

async function dbGet(key: string): Promise<string | null> {
  if (!DB_URL) return null;
  const res = await fetch(`${DB_URL}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`DB GET failed: ${res.status}`);
  return res.text();
}

async function dbSet(key: string, value: string): Promise<void> {
  if (!DB_URL) return;
  const body = new URLSearchParams({ [key]: value });
  const res = await fetch(DB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`DB SET failed: ${res.status}`);
}

async function dbIncrement(key: string): Promise<number> {
  const current = await dbGet(key);
  const next = (parseInt(current ?? "0", 10) || 0) + 1;
  await dbSet(key, String(next));
  return next;
}

async function dbGetInt(key: string): Promise<number> {
  const val = await dbGet(key);
  return parseInt(val ?? "0", 10) || 0;
}

export interface RecordedStats {
  tacticIds: string[];
  exposureIds: string[];
}

/**
 * Record an anonymized analysis result to Replit DB.
 * Only stores tactic IDs and exposure labels — no message content, no PII.
 */
export async function recordAnalysis(stats: RecordedStats): Promise<void> {
  if (!DB_URL) return; // gracefully skip in environments without Replit DB

  await dbIncrement("stats:total");

  for (const tacticId of stats.tacticIds) {
    await dbIncrement(`stats:tactic:${tacticId}`);
  }

  for (const exposureId of stats.exposureIds) {
    // Sanitize exposure label to be a safe key
    const key = exposureId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    await dbIncrement(`stats:exposure:${key}`);
  }
}

export interface AggregateStats {
  totalAnalyzed: number;
  mostCommonTactic: string;
  tacticCounts: Record<string, number>;
  exposureCounts: Record<string, number>;
}

const KNOWN_TACTIC_IDS = [
  "urgency",
  "fake_authority",
  "secrecy",
  "fear",
  "reciprocity",
  "too_good",
  "false_familiarity",
];

const KNOWN_EXPOSURE_KEYS = [
  "otp___verification_code",
  "cnic___national_id_number",
  "bank_account___iban_details",
  "upfront_payment___fee",
  "click_a_link",
  "personal___family_details",
];

const TACTIC_LABELS: Record<string, string> = {
  urgency: "Urgency / Time Pressure",
  fake_authority: "Fake Authority",
  secrecy: "Secrecy / Isolation",
  fear: "Fear / Threat",
  reciprocity: "Reciprocity",
  too_good: "Too Good To Be True",
  false_familiarity: "False Familiarity",
};

/**
 * Read aggregate stats from Replit DB.
 */
export async function getAggregateStats(): Promise<AggregateStats> {
  const totalAnalyzed = DB_URL ? await dbGetInt("stats:total") : 0;

  const tacticCounts: Record<string, number> = {};
  for (const id of KNOWN_TACTIC_IDS) {
    if (DB_URL) {
      tacticCounts[id] = await dbGetInt(`stats:tactic:${id}`);
    } else {
      tacticCounts[id] = 0;
    }
  }

  const exposureCounts: Record<string, number> = {};
  for (const key of KNOWN_EXPOSURE_KEYS) {
    if (DB_URL) {
      exposureCounts[key] = await dbGetInt(`stats:exposure:${key}`);
    } else {
      exposureCounts[key] = 0;
    }
  }

  // Find most common tactic
  const mostCommonTacticId = Object.entries(tacticCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? "urgency";
  const mostCommonTactic = TACTIC_LABELS[mostCommonTacticId] ?? mostCommonTacticId;

  return {
    totalAnalyzed,
    mostCommonTactic,
    tacticCounts,
    exposureCounts,
  };
}
