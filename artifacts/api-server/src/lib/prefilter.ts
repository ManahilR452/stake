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
  // Numeric OTP (4–8 digit standalone sequences next to relevant words)
  {
    pattern: /\b\d{4,8}\b(?=\s*(is|are|ha[iy]|code|OTP|pin|passcode)|\s*$)/gi,
    tactic: "urgency",
    exposure: "OTP / verification code",
    label: "OTP Code",
  },
  // EasyPaisa / JazzCash / bank transfer keywords
  {
    pattern:
      /\b(EasyPaisa|JazzCash|HBL Pay|UPaisa|Nayapay|Sadapay|wire transfer|bank transfer|send (the )?(amount|money|funds|fee|payment|raqam)|transfer (Rs?\.?\s*\d+|USD|GBP|EUR|£|\$|PKR\s*\d+))\b/gi,
    tactic: "reciprocity",
    exposure: "Upfront payment / fee",
    label: "Payment Request",
  },
  // Shortened / suspicious URLs
  {
    pattern:
      /\b(bit\.ly|tinyurl\.com|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|rb\.gy|shorturl\.at|clck\.ru|qr\.ae|tiny\.cc|lnkd\.in|wp\.me|ift\.tt|dlvr\.it|su\.pr|ff\.im|j\.mp|soo\.gd|bc\.vc|u\.to|x\.co|mcaf\.ee|adf\.ly)\//gi,
    tactic: "fake_authority",
    exposure: "Click a link",
    label: "Shortened URL",
  },
  // Generic links
  {
    pattern: /https?:\/\/[^\s]+/gi,
    tactic: "fake_authority",
    exposure: "Click a link",
    label: "URL",
  },
  // Cryptocurrency wallet addresses / crypto requests
  {
    pattern: /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|T[A-Za-z1-9]{33})\b/g,
    tactic: "too_good",
    exposure: "Upfront payment / fee",
    label: "Crypto Wallet Address",
  },
  // Account numbers (10-16 digits, often presented as bank account)
  {
    pattern: /\baccount\s*(number|no\.?|#)?\s*:?\s*\d{10,16}\b/gi,
    tactic: "false_familiarity",
    exposure: "Bank account / IBAN details",
    label: "Account Number",
  },
];

// Urgency / threat / manipulation keywords across languages
const KEYWORD_PATTERNS: Array<{
  pattern: RegExp;
  tactic: string;
  label: string;
}> = [
  // === URGENCY — English ===
  {
    pattern:
      /\b(URGENT|URGENTLY|IMMEDIATELY|RIGHT AWAY|ACT NOW|RESPOND NOW|LAST CHANCE|FINAL NOTICE|FINAL WARNING|TIME SENSITIVE|EXPIRES?\s+(TODAY|SOON|IN \d+\s*(HOUR|MIN|DAY)S?)|WITHIN \d+\s*(HOUR|MINUTE|DAY)S?|LIMITED TIME|TODAY ONLY|DO NOT DELAY|NO TIME TO WASTE|DEADLINE)\b/gi,
    tactic: "urgency",
    label: "Urgency Keyword",
  },
  // === URGENCY — Roman Urdu ===
  {
    pattern:
      /\b(fawri|abhi|jaldi|aaj hi|aaj tak|kal tak|phoran|turant|aakhri moka|aakhri chance|waqt kam hai|der mat karo|usi waqt|bilkul abhi)\b/gi,
    tactic: "urgency",
    label: "Urgency Keyword (Roman Urdu)",
  },
  // === FEAR / THREAT — English ===
  {
    pattern:
      /\b(ACCOUNT (WILL BE |HAS BEEN )?(BLOCKED|SUSPENDED|CLOSED|TERMINATED|FROZEN)|LEGAL ACTION|LAWSUIT|WARRANT|ARREST|CRIMINAL CHARGES?|FIR|POLICE COMPLAINT|CYBER CRIME|PROSECUTION|COURT ORDER|BLACKLISTED|PENALT(Y|IES)|FINE OF (RS?\.?\s*)?\d+)\b/gi,
    tactic: "fear",
    label: "Threat Keyword",
  },
  // === FEAR / THREAT — Roman Urdu ===
  {
    pattern:
      /\b(account band ho (jayega|jaye ga|ho ga|gaya)|block (ho jayega|kiya jayega|kar diya jayega)|case darj (hoga|ho ga|kar denge)|FIR darj|girftaar (kiya|hoga)|jail ho sakti|adalat|karyawahi|police aa jayegi|band kar denge|blacklist ho jayega)\b/gi,
    tactic: "fear",
    label: "Threat Keyword (Roman Urdu)",
  },
  // === SECRECY — English + Roman Urdu ===
  {
    pattern:
      /\b(DON'?T (TELL|SHARE|SHOW|MENTION)|DO NOT (TELL|SHARE|DISCLOSE|DISCUSS|INFORM|REVEAL)|KEEP (THIS |IT )?(CONFIDENTIAL|PRIVATE|SECRET|BETWEEN US)|FOR SECURITY (REASONS?|PURPOSES?)?,?\s*(DO NOT|NEVER) (SHARE|TELL|DISCLOSE)|kisi ko mat batana|kisi ko na batain|secret rakhein|kisi se mat kehna|family ko mat batao|apne aap rakhein|dusron ko mat batao)\b/gi,
    tactic: "secrecy",
    label: "Secrecy Instruction",
  },
  // === OTP REQUEST — English + Roman Urdu ===
  {
    pattern:
      /\b(share (your |the )?(OTP|code|PIN|password|passcode)|send (the |your )?(OTP|verification code|PIN|one.?time|passcode)|OTP (enter|daalein|dalo|share karo|bhejein|bata dein)|verification code (dein|share karen|batao)|code bata dein|pin share karo|password de dein|apna code batao)\b/gi,
    tactic: "urgency",
    label: "OTP Request",
  },
  // === FAKE AUTHORITY — Pakistani institutions ===
  {
    pattern:
      /\b(NADRA|FBR|SBP|State Bank|Federal Board|BISP|Ehsaas|HEC|PEMRA|PTA|SECP|NAB|NTN|police (cyber|cybercrime|department)|cybercrime (unit|wing|authority)|Income Tax|Tax (Department|Authority|Notice)|Government of Pakistan|Prime Minister('?s)? (Office|Fund)|Ministry of|Court Notice|Supreme Court|High Court|Customs (Department|Authority)|Drug Regulatory|OGRA|NEPRA)\b/gi,
    tactic: "fake_authority",
    label: "Fake Authority (Pakistani Institution)",
  },
  // === FAKE AUTHORITY — Banks ===
  {
    pattern:
      /\b((your |the )?(bank('?s)?|HBL|MCB|UBL|Allied Bank|ABL|Meezan|Faysal|Bank Alfalah|NBP|National Bank|Standard Chartered|Habib Bank|JS Bank|Silk Bank|Soneri|Bank of Punjab|BOP) (team|helpdesk|support|alert|department|official|officer|representative|calling)|(from|on behalf of) (your bank|HBL|MCB|UBL|Meezan|Bank Alfalah|NBP|Habib Bank))\b/gi,
    tactic: "fake_authority",
    label: "Fake Bank Authority",
  },
  // === TOO GOOD TO BE TRUE — English + Roman Urdu ===
  {
    pattern:
      /\b(you (have |'?ve )?(won|been selected|been chosen|qualified|been approved)|lottery|jackpot|prize (money|bond|amount)|unclaimed (inheritance|funds|prize)|guaranteed (return|profit|income|earnings)|earn \$?\d+(\s*(per|a)\s*(day|week|month))?|double your (money|investment)|high returns?|aapko prize (mila|milega)|lucky winner|congratulations (you|aap)|selected for (prize|reward|benefit)|muft mein|free (gift|prize|reward)|grant (mila|milegi)|scholarship mila)\b/gi,
    tactic: "too_good",
    label: "Too Good To Be True",
  },
  // === RECIPROCITY / PAYMENT TRAP ===
  {
    pattern:
      /\b(processing fee|registration fee|delivery charges?|admin(istration)? fee|handling fee|activation fee|small (fee|amount|charge)|nominal (fee|charge|amount)|advance (fee|payment|amount)|security deposit|refundable (fee|deposit|amount)|waiv(ing|ed) (the |your )?(fee|charges?)|as a courtesy|complimentary (gift|offer|service)|hum aapko (de rahe|denge|offer kar rahe)|aapke liye (special|free))\b/gi,
    tactic: "reciprocity",
    label: "Fee Trap / Reciprocity",
  },
  // === FALSE FAMILIARITY ===
  {
    pattern:
      /\b(as (we |previously |already )?(discussed|agreed|mentioned|spoke|talked)|following up (on )?our|per (your|our) (request|conversation|discussion|last call)|your (family member|relative|colleague|friend|reference) (asked|requested|told us|gave your number)|we (spoke|talked|met) (earlier|before|last week|recently)|as per your application|aapki request par|aapne khud kaha tha|hamari pehli baat|pehle baat hui thi)\b/gi,
    tactic: "false_familiarity",
    label: "False Familiarity",
  },
  // === JOB SCAM patterns ===
  {
    pattern:
      /\b(work from home|part.?time job|no experience (needed|required)|earn from (home|mobile|phone)|online (earning|income|job) opportunity|daily payment|instant (payment|transfer|earning)|Rs\.?\s*\d{3,}\/?(day|hour|task)|task.?based (earning|income|payment)|complete (task|tasks) and (earn|get paid)|payment (per|for each) (task|click|like|follow))\b/gi,
    tactic: "too_good",
    label: "Job / Task Scam",
  },
  // === INVESTMENT SCAM ===
  {
    pattern:
      /\b(invest (Rs?\.?\s*)?\d+|investment (opportunity|plan|scheme)|guaranteed profit|no risk|risk.?free (investment|return|earning)|double (your )?(money|investment) in|crypto (investment|profit|earning)|forex (trading|earning)|trading (bot|signal|group)|join (our|the) (group|channel|team) (for|to) earn|referral (bonus|income|program))\b/gi,
    tactic: "too_good",
    label: "Investment Scam",
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
