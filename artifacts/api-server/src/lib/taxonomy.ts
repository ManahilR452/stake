export interface TacticDefinition {
  id: string;
  label: string;
  description: string;
  technicalExplanation: string;
  plainExplanation: string;
  examples: string[];
  // Regex patterns for the pre-filter (case-insensitive)
  patterns: RegExp[];
}

export const TACTICS: Record<string, TacticDefinition> = {
  urgency: {
    id: "urgency",
    label: "Urgency / Time Pressure",
    description:
      "Creates artificial time pressure to bypass rational thinking and force immediate action before you can verify the request.",
    technicalExplanation:
      "Activates the amygdala's threat-response circuitry, bypassing the prefrontal cortex's deliberative reasoning — a direct application of Cialdini's Scarcity principle. Perceived time constraints suppress skepticism and drive compliance before verification is possible.",
    plainExplanation:
      "It's deliberately trying to stop you from thinking clearly. When you feel rushed, you make worse decisions. That's not an accident — it's the whole point.",
    examples: [
      "act within 10 minutes",
      "account will be blocked today",
      "expires in 24 hours",
      "respond immediately",
      "fawri jawab dein",
      "aaj hi",
    ],
    patterns: [
      /\b(urgent|urgently|immediately|right away|act now|respond now|within \d+ (hour|minute|day)s?|expire[sd]?|deadline|last chance|final (warning|notice)|limited time|today only|aaj hi|fawri|abhi|jaldi)\b/i,
    ],
  },
  fake_authority: {
    id: "fake_authority",
    label: "Fake Authority",
    description:
      "Impersonates a trusted institution — bank, government, police, tax authority — to make compliance feel mandatory.",
    technicalExplanation:
      "Exploits Cialdini's Authority principle. Legitimate-sounding institutional identifiers (logos, department names, badge numbers) trigger automatic deference and lower critical evaluation of the request.",
    plainExplanation:
      "It's pretending to be someone you trust so you stop questioning it. Real banks and government agencies don't ask for your passwords or codes by SMS.",
    examples: [
      "this is your bank",
      "official notice",
      "NADRA alert",
      "FBR department",
      "SBP notification",
      "police cyber crime unit",
    ],
    patterns: [
      /\b(your bank|state bank|federal board|NADRA|FBR|SBP|police|court|legal department|official notice|government (of|notification)|customer care|helpdesk|IT department|verification team)\b/i,
    ],
  },
  secrecy: {
    id: "secrecy",
    label: "Secrecy / Isolation",
    description:
      "Instructs you to keep the interaction private, isolating you from people who might identify the scam.",
    technicalExplanation:
      "Isolation is a core social engineering control. Removing the victim's access to external verification — family, colleagues, second opinions — prevents the social proof that would otherwise trigger disbelief.",
    plainExplanation:
      "If it were legitimate, there'd be no reason to hide it. The secrecy instruction is specifically designed to keep you away from anyone who might tell you it's a scam.",
    examples: [
      "don't tell anyone",
      "keep this confidential",
      "for security purposes do not share",
      "kisi ko mat batana",
      "family ko mat batao",
    ],
    patterns: [
      /\b(don'?t tell|do not (tell|share|disclose|discuss)|keep (this |it )?(confidential|private|secret|between us)|kisi ko mat batana|kisi ko na batain|secret rakhein)\b/i,
    ],
  },
  fear: {
    id: "fear",
    label: "Fear / Threat",
    description:
      "Threatens a serious consequence — arrest, account closure, legal action — to override skepticism with panic.",
    technicalExplanation:
      "Fear appeals hijack the autonomic nervous system's fight-or-flight response, reducing cognitive bandwidth available for critical thinking. Related to Cialdini's loss aversion framing — perceived threats of loss are more motivating than equivalent gains.",
    plainExplanation:
      "Threatening you with something scary — arrest, account block, lawsuit — is designed to make you panic and comply without thinking. Genuine institutions give you time to respond through official channels.",
    examples: [
      "legal action will be taken",
      "account will be suspended",
      "criminal charges",
      "warrant has been issued",
      "account band ho jayega",
    ],
    patterns: [
      /\b(legal action|lawsuit|arrest|warrant|criminal|FIR|court|suspended|blocked|terminated|permanently (closed|blocked)|account (ban|suspend|block)|band ho (jayega|jaye ga)|case darj)\b/i,
    ],
  },
  reciprocity: {
    id: "reciprocity",
    label: "Reciprocity",
    description:
      "Offers something first — a favour, refund, fee waiver — to create a sense of social obligation to give something back.",
    technicalExplanation:
      "Directly implements Cialdini's Reciprocity principle. Receiving an unsolicited gift or favour triggers a deep psychological obligation to return it, which the attacker exploits to extract credentials, payments, or access.",
    plainExplanation:
      "They offer you something — a refund, a waiver, a bonus — so you feel like you owe them something back. The 'gift' is bait.",
    examples: [
      "waiving your processing fee",
      "as a courtesy",
      "we are offering you",
      "special benefit for you",
      "hum aapko refund denge",
    ],
    patterns: [
      /\b(waiv(ing|ed)|as a (courtesy|gesture|goodwill)|complimentary|refund|bonus|special (offer|benefit|discount|reward)|free of charge|hum aapko (de rahe|denge|offer kar rahe))\b/i,
    ],
  },
  too_good: {
    id: "too_good",
    label: "Too Good To Be True",
    description:
      "Offers an implausibly large reward — lottery win, massive salary, inheritance — to cloud judgment with excitement.",
    technicalExplanation:
      "Exploits optimism bias and the affect heuristic. Positive emotional arousal from an unexpected windfall suppresses analytical thinking. Often combined with urgency to prevent the victim from consulting others.",
    plainExplanation:
      "If you didn't enter a lottery, you can't have won one. If someone you've never met wants to share a large sum with you, there's a catch. Real windfalls don't come unsolicited by SMS.",
    examples: [
      "you have won",
      "guaranteed returns",
      "unclaimed inheritance",
      "lottery prize",
      "earn $5000 per week",
      "aapko prize mila hai",
    ],
    patterns: [
      /\b(you (have |'ve )?(won|been selected|been chosen)|lottery|prize|jackpot|inheritance|guaranteed (return|profit|income)|earn \$?\d+|aapko prize|lucky winner|congratulations you)\b/i,
    ],
  },
  false_familiarity: {
    id: "false_familiarity",
    label: "False Familiarity",
    description:
      "Uses personal details or references to previous contact to seem like a known, trusted person and lower your guard.",
    technicalExplanation:
      "Pretexting via false familiarity exploits the mere-exposure effect and social identity cues. References to shared history ('as we discussed', use of your name or location) trigger the same neural pathways as genuine familiarity, reducing threat detection.",
    plainExplanation:
      "It's using your name, a reference to a past conversation, or a detail about you to seem like someone you already know. Real familiarity doesn't need to be announced — scammers use it as a trick.",
    examples: [
      "as we discussed",
      "following up on our conversation",
      "as requested by you",
      "your family member asked us to contact you",
      "we met at",
    ],
    patterns: [
      /\b(as (we |previously |already )?(discussed|agreed|mentioned|spoke)|following up|per (your|our) (request|conversation|discussion)|your (family member|relative|colleague) (asked|requested|told us))\b/i,
    ],
  },
};

export const TACTIC_IDS = Object.keys(TACTICS);

export function getTacticById(id: string): TacticDefinition | undefined {
  return TACTICS[id];
}

// Fixed exposure taxonomy with concrete consequences
export interface ExposureDefinition {
  id: string;
  label: string;
  consequence: string;
}

export const EXPOSURES: Record<string, ExposureDefinition> = {
  otp: {
    id: "otp",
    label: "OTP / verification code",
    consequence:
      "Someone can access your bank account or complete a transaction in your name",
  },
  cnic: {
    id: "cnic",
    label: "CNIC / national ID number",
    consequence:
      "Someone can attempt identity theft or fraudulent account opening in your name",
  },
  bank_details: {
    id: "bank_details",
    label: "Bank account / IBAN details",
    consequence: "Someone can attempt unauthorized transfers from your account",
  },
  upfront_payment: {
    id: "upfront_payment",
    label: "Upfront payment / fee",
    consequence: "You lose that money with no service or refund",
  },
  link_click: {
    id: "link_click",
    label: "Click a link",
    consequence:
      "The link may capture your credentials or install malware on your device",
  },
  personal_details: {
    id: "personal_details",
    label: "Personal / family details",
    consequence:
      "Used to make future scams more convincing — a technique called pretexting",
  },
};
