import { TACTICS } from "./taxonomy.js";

export interface PrefilterFlag {
  phrase: string;
  startIndex: number;
  endIndex: number;
  tactic: string;
  tacticLabel: string;
  exposure: string | null;
  confidence: "high" | "medium";
}

// High-confidence structural patterns (PII, financial instruments, links)
const STRUCTURAL_PATTERNS: Array<{
  pattern: RegExp;
  tactic: string;
  exposure: string;
  label: string;
}> = [
  // Pakistani CNIC: 42101-XXXXXXX-X
  {
    pattern: /\b\d{5}-\d{7}-\d\b/g,
    tactic: "false_familiarity",
    exposure: "CNIC / national ID number",
    label: "CNIC Number",
  },
  // PK IBAN
  {
    pattern: /\bPK\d{2}[A-Z]{4}\d{16}\b/gi,
    tactic: "false_familiarity",
    exposure: "Bank account / IBAN details",
    label: "PK IBAN",
  },
  // Numeric OTP (4–8 digit standalone sequences)
  {
    pattern: /\b\d{4,8}\b(?=\s*(is|are|ha[iy]|code|OTP|pin|passcode)|\s*$)/gi,
    tactic: "urgency",
    exposure: "OTP / verification code",
    label: "OTP Code",
  },
  // EasyPaisa / JazzCash / bank transfer keywords
  {
    pattern:
      /\b(EasyPaisa|JazzCash|wire transfer|bank transfer|send (the )?(amount|money|funds|fee|payment)|transfer (Rs?\.?\s*\d+|USD|GBP|EUR|£|\$))\b/gi,
    tactic: "reciprocity",
    exposure: "Upfront payment / fee",
    label: "Payment Request",
  },
  // Shortened / suspicious URLs
  {
    pattern:
      /\b(bit\.ly|tinyurl\.com|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|rb\.gy|shorturl\.at|clck\.ru|qr\.ae)\//gi,
    tactic: "fake_authority",
    exposure: "Click a link",
    label: "Shortened URL",
  },
  // Generic links in suspicious context (http in SMS/text)
  {
    pattern: /https?:\/\/[^\s]+/gi,
    tactic: "fake_authority",
    exposure: "Click a link",
    label: "URL",
  },
];

// Urgency / threat keywords in English, Urdu, Roman Urdu
const KEYWORD_PATTERNS: Array<{
  pattern: RegExp;
  tactic: string;
  label: string;
}> = [
  // Urgency — English
  {
    pattern:
      /\b(URGENT|IMMEDIATELY|RIGHT AWAY|ACT NOW|LAST CHANCE|FINAL NOTICE|TIME SENSITIVE|EXPIRES?\s+(TODAY|SOON|IN \d+))\b/g,
    tactic: "urgency",
    label: "Urgency Keyword",
  },
  // Urgency — Roman Urdu
  {
    pattern: /\b(fawri|abhi|jaldi|aaj hi|kal tak|phoran|turant|aakhri moka)\b/gi,
    tactic: "urgency",
    label: "Urgency Keyword (Roman Urdu)",
  },
  // Threat — English
  {
    pattern:
      /\b(ACCOUNT (WILL BE |HAS BEEN )?(BLOCKED|SUSPENDED|CLOSED|TERMINATED)|LEGAL ACTION|WARRANT|ARREST|CRIMINAL CHARGES|FIR)\b/g,
    tactic: "fear",
    label: "Threat Keyword",
  },
  // Threat — Roman Urdu
  {
    pattern:
      /\b(account band ho (jayega|jaye ga|ho ga)|block (ho jayega|kiya jayega)|case darj|FIR darj|girftaar)\b/gi,
    tactic: "fear",
    label: "Threat Keyword (Roman Urdu)",
  },
  // Secrecy — English + Roman Urdu
  {
    pattern:
      /\b(DON'?T TELL|DO NOT (TELL|SHARE|DISCLOSE)|KEEP (THIS |IT )?(CONFIDENTIAL|PRIVATE|SECRET)|kisi ko mat batana|kisi ko na batain)\b/gi,
    tactic: "secrecy",
    label: "Secrecy Instruction",
  },
  // OTP request
  {
    pattern:
      /\b(share (your |the )?(OTP|code|PIN|password)|send (the |your )?(OTP|verification code|PIN)|OTP (enter|daalein|dalo|share karo))\b/gi,
    tactic: "urgency",
    label: "OTP Request",
  },
];

/**
 * Run regex pre-filter against the message.
 * Returns validated flags with exact character offsets.
 */
export function runPrefilter(message: string): PrefilterFlag[] {
  const flags: PrefilterFlag[] = [];
  const seen = new Set<string>(); // deduplicate by phrase+tactic

  const addFlag = (
    match: RegExpExecArray,
    tactic: string,
    tacticLabel: string,
    exposure: string | null,
    confidence: "high" | "medium"
  ) => {
    const phrase = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + phrase.length;
    const key = `${startIndex}-${endIndex}-${tactic}`;
    if (seen.has(key)) return;
    seen.add(key);

    const tacticDef = TACTICS[tactic];
    flags.push({
      phrase,
      startIndex,
      endIndex,
      tactic,
      tacticLabel: tacticDef?.label ?? tacticLabel,
      exposure,
      confidence,
    });
  };

  // Structural patterns (high confidence)
  for (const { pattern, tactic, exposure, label } of STRUCTURAL_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(message)) !== null) {
      addFlag(match, tactic, label, exposure, "high");
    }
  }

  // Keyword patterns (medium confidence)
  for (const { pattern, tactic, label } of KEYWORD_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(message)) !== null) {
      addFlag(match, tactic, label, null, "medium");
    }
  }

  // Also run each tactic's own patterns
  for (const [id, tactic] of Object.entries(TACTICS)) {
    for (const pat of tactic.patterns) {
      const re = new RegExp(pat.source, pat.flags.includes("g") ? pat.flags : pat.flags + "g");
      let match: RegExpExecArray | null;
      while ((match = re.exec(message)) !== null) {
        addFlag(match, id, tactic.label, null, "medium");
      }
    }
  }

  return flags.sort((a, b) => a.startIndex - b.startIndex);
}
