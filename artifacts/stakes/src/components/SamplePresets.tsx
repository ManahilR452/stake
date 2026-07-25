import React from 'react';

interface SamplePresetsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const PRESETS = [
  {
    label: 'Urgent Bank OTP',
    text: 'URGENT: Your account ending in 4921 has been restricted due to suspicious activity. Your OTP is required immediately to restore access. Enter code 847291 within 5 minutes or your account will be permanently blocked. Do NOT share this with anyone. — Customer Care, National Bank',
  },
  {
    label: 'WhatsApp Scam',
    text: 'Bhai aapka account mein kuch problem hai. Hum bank se bol rahe hain. Aaj hi verify karo warna account band ho jayega. OTP jo aaye usse share karo, kisi ko mat batana.',
  },
  {
    label: 'Fake NADRA Alert',
    text: 'NADRA Alert: Aapka CNIC 42101-xxxxxxx-x expire ho raha hai. Turant renew karein. Fee Rs. 500 EasyPaisa 0300-1234567 per send karein. Verification ke liye WhatsApp pe message karein.',
  },
  {
    label: 'Lottery/Prize Email',
    text: 'Congratulations! You have been selected as the winner of the International Email Lottery. You have won £850,000. To claim your prize, send your full name, address, and a processing fee of £50 via wire transfer. Keep this confidential.',
  },
];

export function SamplePresets({ onSelect, disabled }: SamplePresetsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mr-0.5">
        Samples:
      </span>
      {PRESETS.map((preset, i) => (
        <button
          key={i}
          onClick={() => onSelect(preset.text)}
          disabled={disabled}
          className={`
            text-xs font-medium px-3 py-1 rounded-full border transition-all
            bg-card border-border text-foreground/70
            hover:border-primary/50 hover:text-primary hover:bg-primary/5
            disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          `}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
