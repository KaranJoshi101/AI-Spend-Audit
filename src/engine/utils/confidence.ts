import type { ConfidenceLevel, ImplementationDifficulty } from '@/types';

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const DIFFICULTY_RANK: Record<ImplementationDifficulty, number> = {
  EASY: 1,
  MODERATE: 2,
  COMPLEX: 3,
};

export function compareConfidence(a: ConfidenceLevel, b: ConfidenceLevel): number {
  return CONFIDENCE_RANK[a] - CONFIDENCE_RANK[b];
}

export function compareDifficulty(a: ImplementationDifficulty, b: ImplementationDifficulty): number {
  return DIFFICULTY_RANK[a] - DIFFICULTY_RANK[b];
}

export function chooseHighestConfidence(...levels: ConfidenceLevel[]): ConfidenceLevel {
  return levels.reduce<ConfidenceLevel>((best, candidate) => {
    return compareConfidence(candidate, best) > 0 ? candidate : best;
  }, 'LOW');
}

export function chooseEasiestDifficulty(...levels: ImplementationDifficulty[]): ImplementationDifficulty {
  return levels.reduce<ImplementationDifficulty>((best, candidate) => {
    return compareDifficulty(candidate, best) < 0 ? candidate : best;
  }, 'COMPLEX');
}