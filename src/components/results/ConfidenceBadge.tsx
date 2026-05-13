import React from 'react';
import type { Recommendation } from '@/types';

type Confidence = Recommendation['confidence'];

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

const CONFIDENCE_CLASS_MAP: Record<Confidence, string> = {
  HIGH: 'bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-200',
  MEDIUM: 'bg-amber-100/85 text-amber-800 ring-1 ring-amber-200',
  LOW: 'bg-slate-200/90 text-slate-700 ring-1 ring-slate-300',
};

const CONFIDENCE_LABEL_MAP: Record<Confidence, string> = {
  HIGH: 'High confidence',
  MEDIUM: 'Medium confidence',
  LOW: 'Low confidence',
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${CONFIDENCE_CLASS_MAP[confidence]}`}
    >
      {CONFIDENCE_LABEL_MAP[confidence]}
    </span>
  );
};
