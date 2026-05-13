import type { ConfidenceLevel, ImplementationDifficulty, Recommendation, RecommendationType } from '@/types';
import { compareConfidence, compareDifficulty } from '@/engine/utils/confidence';

export interface RecommendationCandidate extends Recommendation {
  resourceKeys: string[];
  conflictGroup: string;
  priority: number;
  migrationRisk?: 'low' | 'medium' | 'high';
  learningCurveEstimate?: 'easy' | 'moderate' | 'complex';
}

function typeRank(type: RecommendationType): number {
  switch (type) {
    case 'ENTERPRISE_DOWNGRADE':
      return 1;
    case 'UNUSED_SEATS':
      return 2;
    case 'OVERPROVISIONED_SEATS':
      return 3;
    case 'TEAM_PLAN_OPTIMIZATION':
      return 4;
    case 'API_VS_SUBSCRIPTION':
      return 5;
    case 'CHEAPER_ALTERNATIVE':
      return 6;
    case 'DUPLICATE_TOOL_OVERLAP':
      return 7;
    case 'UNDERUTILIZED_ENTERPRISE_FEATURES':
      return 8;
    default:
      return 9;
  }
}

export function compareCandidates(a: RecommendationCandidate, b: RecommendationCandidate): number {
  if (b.estimatedMonthlySavings !== a.estimatedMonthlySavings) {
    return b.estimatedMonthlySavings - a.estimatedMonthlySavings;
  }

  const confidenceDelta = compareConfidence(a.confidence as ConfidenceLevel, b.confidence as ConfidenceLevel);
  if (confidenceDelta !== 0) {
    return -confidenceDelta;
  }

  const difficultyDelta = compareDifficulty(a.implementationDifficulty as ImplementationDifficulty, b.implementationDifficulty as ImplementationDifficulty);
  if (difficultyDelta !== 0) {
    return difficultyDelta;
  }

  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }

  return typeRank(a.type) - typeRank(b.type);
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function selectNonOverlappingRecommendations(candidates: RecommendationCandidate[]): RecommendationCandidate[] {
  const selected: RecommendationCandidate[] = [];
  const consumedResources = new Set<string>();

  for (const candidate of dedupeById([...candidates].sort(compareCandidates))) {
    const overlaps = candidate.resourceKeys.some((resourceKey) => consumedResources.has(resourceKey));
    if (overlaps) {
      continue;
    }

    if (candidate.estimatedMonthlySavings <= 0 && selected.some((item) => item.estimatedMonthlySavings > 0)) {
      continue;
    }

    selected.push(candidate);
    candidate.resourceKeys.forEach((resourceKey) => consumedResources.add(resourceKey));
  }

  return selected.sort(compareCandidates);
}