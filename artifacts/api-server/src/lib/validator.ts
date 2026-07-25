/**
 * validator.ts
 * Anti-hallucination layer: every phrase returned by the LLM must be verified
 * as a verbatim substring of the original message BEFORE rendering.
 * Discards anything that doesn't match exactly.
 */

export interface ValidatedPhrase {
  phrase: string;
  startIndex: number;
  endIndex: number;
  valid: boolean;
}

/**
 * Verify that `phrase` is a verbatim substring of `message`.
 * Returns corrected startIndex/endIndex if found, or marks as invalid.
 *
 * The LLM may return slightly wrong offsets — we trust the phrase text
 * over the offsets, and re-derive the indices from the actual message.
 */
export function validatePhrase(
  phrase: string,
  claimedStart: number,
  claimedEnd: number,
  message: string
): ValidatedPhrase {
  if (!phrase || phrase.length === 0) {
    return { phrase, startIndex: claimedStart, endIndex: claimedEnd, valid: false };
  }

  // First: check if the claimed offsets are correct
  const claimedSlice = message.slice(claimedStart, claimedEnd);
  if (claimedSlice === phrase) {
    return { phrase, startIndex: claimedStart, endIndex: claimedEnd, valid: true };
  }

  // Second: try to find the phrase anywhere in the message (verbatim)
  const idx = message.indexOf(phrase);
  if (idx !== -1) {
    return {
      phrase,
      startIndex: idx,
      endIndex: idx + phrase.length,
      valid: true,
    };
  }

  // Third: try case-insensitive search and return the original casing from message
  const lower = message.toLowerCase();
  const phraseL = phrase.toLowerCase();
  const idxCI = lower.indexOf(phraseL);
  if (idxCI !== -1) {
    const realPhrase = message.slice(idxCI, idxCI + phrase.length);
    return {
      phrase: realPhrase,
      startIndex: idxCI,
      endIndex: idxCI + phrase.length,
      valid: true,
    };
  }

  // Not found — discard this finding
  return { phrase, startIndex: claimedStart, endIndex: claimedEnd, valid: false };
}

/**
 * Validate a batch of flags. Returns only those with valid phrases,
 * with corrected offsets.
 */
export function validateFlags<
  T extends { phrase: string; startIndex: number; endIndex: number }
>(flags: T[], message: string): T[] {
  const validated: T[] = [];
  for (const flag of flags) {
    const result = validatePhrase(flag.phrase, flag.startIndex, flag.endIndex, message);
    if (result.valid) {
      validated.push({
        ...flag,
        phrase: result.phrase,
        startIndex: result.startIndex,
        endIndex: result.endIndex,
      });
    }
  }
  return validated;
}

/**
 * Remove overlapping flags, keeping the one with the higher severity
 * (or the first one if equal).
 */
export function deduplicateFlags<
  T extends { startIndex: number; endIndex: number; severity?: string }
>(flags: T[]): T[] {
  const sorted = [...flags].sort((a, b) => a.startIndex - b.startIndex);
  const result: T[] = [];
  let lastEnd = -1;

  for (const flag of sorted) {
    if (flag.startIndex >= lastEnd) {
      result.push(flag);
      lastEnd = flag.endIndex;
    }
    // Overlapping flag: skip (the earlier one wins)
  }

  return result;
}
