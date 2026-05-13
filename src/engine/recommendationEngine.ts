import type { Recommendation } from '@/types';
import type { NormalizedAuditInput } from '@/engine/validators';
import { selectNonOverlappingRecommendations, type RecommendationCandidate } from '@/engine/utils/dedupe';
import { generateEnterpriseRecommendations } from '@/engine/recommendationGenerators/enterprise';
import { generateSeatOptimizationRecommendations } from '@/engine/recommendationGenerators/unusedSeats';
import { generateApiVsSubscriptionRecommendations } from '@/engine/recommendationGenerators/apiVsSubscription';
import { generateAlternativeRecommendations } from '@/engine/recommendationGenerators/alternatives';
import { generateConsolidationRecommendations } from '@/engine/recommendationGenerators/consolidation';

function buildCandidates(input: NormalizedAuditInput): RecommendationCandidate[] {
  const candidates: RecommendationCandidate[] = [];

  for (const tool of input.tools) {
    candidates.push(...generateEnterpriseRecommendations(input, tool));
    candidates.push(...generateSeatOptimizationRecommendations(input, tool));
    candidates.push(...generateApiVsSubscriptionRecommendations(input, tool));
    candidates.push(...generateAlternativeRecommendations(input, tool));
  }

  candidates.push(...generateConsolidationRecommendations(input));

  return candidates;
}

export function generateRecommendationsForAudit(input: NormalizedAuditInput): Recommendation[] {
  const selected = selectNonOverlappingRecommendations(buildCandidates(input));
  return selected.map(({ resourceKeys, conflictGroup, priority, ...recommendation }) => recommendation);
}