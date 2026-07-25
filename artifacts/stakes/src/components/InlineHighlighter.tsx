import React from 'react';
import { Flag } from '@workspace/api-client-react';

interface InlineHighlighterProps {
  message: string;
  flags: Flag[];
  activeFlagIndex: number | null;
  onFlagClick: (index: number) => void;
}

export function InlineHighlighter({ message, flags, activeFlagIndex, onFlagClick }: InlineHighlighterProps) {
  const sortedFlags = [...flags].map((f, i) => ({ ...f, originalIndex: i })).sort((a, b) => a.startIndex - b.startIndex);
  
  const nodes = [];
  let lastIndex = 0;

  sortedFlags.forEach((flag, i) => {
    if (flag.startIndex > lastIndex) {
      nodes.push(<span key={`text-${i}`}>{message.slice(lastIndex, flag.startIndex)}</span>);
    }
    
    if (flag.endIndex > flag.startIndex && flag.startIndex >= lastIndex) {
      const isActive = activeFlagIndex === flag.originalIndex;
      nodes.push(
        <mark
          key={`flag-${flag.originalIndex}`}
          onClick={() => onFlagClick(flag.originalIndex)}
          className={`tactic-highlight ${isActive ? 'active' : ''} px-1 rounded-sm`}
        >
          {message.slice(flag.startIndex, flag.endIndex)}
        </mark>
      );
      lastIndex = flag.endIndex;
    }
  });

  if (lastIndex < message.length) {
    nodes.push(<span key="text-end">{message.slice(lastIndex)}</span>);
  }

  return (
    <div className="font-mono text-base leading-relaxed whitespace-pre-wrap p-6 bg-card rounded-lg border shadow-sm">
      {nodes}
    </div>
  );
}
