import type { RecommendationCandidate } from '@/engine/utils/dedupe';
import type { NormalizedAuditInput, NormalizedToolUsage } from '@/engine/validators';
import { THRESHOLDS } from '@/lib/pricing';
import { annualizeMonthlyAmount, clampMoney } from '@/engine/utils/money';
import { getEffectiveMonthlySpend, getPricingTier, getLowerCostTier, getTieredCostForSeats } from '@/engine/pricingCalculators';

const CONTRACTOR_BUFFER_SEATS = 1;

function buildCandidate(base: Omit<RecommendationCandidate, 'resourceKeys' | 'conflictGroup' | 'priority'> & { resourceKeys: string[]; conflictGroup: string; priority: number }): RecommendationCandidate {
  return base;
}

function seatRequirement(input: NormalizedAuditInput): number {
  return Math.max(1, input.teamSize + CONTRACTOR_BUFFER_SEATS);
}

export function generateSeatOptimizationRecommendations(input: NormalizedAuditInput, tool: NormalizedToolUsage): RecommendationCandidate[] {
  const tier = getPricingTier(tool.tool, tool.plan);
  if (!tier) {
    return [];
  }

  const currentMonthlyCost = getEffectiveMonthlySpend(tool);
  const requiredSeats = seatRequirement(input);
  const seatGap = Math.max(0, tool.seats - requiredSeats);
  const recommendations: RecommendationCandidate[] = [];

  if (seatGap > 0) {
    const seatSavings = clampMoney(seatGap * tier.costPerExtraUser);
    const enoughToReport = seatSavings >= 10 && seatGap >= 1;

    if (enoughToReport) {
      const recommendationType = seatGap >= 3 || seatGap / Math.max(1, tool.seats) >= THRESHOLDS.UNUSED_SEATS_THRESHOLD
        ? 'OVERPROVISIONED_SEATS'
        : 'UNUSED_SEATS';

      recommendations.push(buildCandidate({
        id: `${tool.entryId}-seat-rightsize`,
        tool: tool.tool,
        type: recommendationType,
        title: `Right-size ${seatGap} seat${seatGap === 1 ? '' : 's'}`,
        problem: `You are paying for ${tool.seats} seats against a ${input.teamSize}-person team.`,
        suggestion: `Reduce the allocation to ${requiredSeats} seats and keep a small contractor buffer.`,
        reasoning: 'Seat counts above actual usage are usually one of the cleanest, lowest-risk savings opportunities.',
        currentSetup: `${tool.seats} seats @ $${tier.costPerExtraUser.toFixed(2)}/extra seat = $${currentMonthlyCost.toFixed(2)}/month`,
        estimatedMonthlySavings: seatSavings,
        estimatedAnnualSavings: annualizeMonthlyAmount(seatSavings),
        confidence: 'HIGH',
        implementationDifficulty: 'EASY',
        relatedTools: [tool.tool],
        resourceKeys: [tool.entryId],
        conflictGroup: `tool:${tool.entryId}`,
        priority: 2,
      }));
    }
  }

  const lowerTier = getLowerCostTier(tool.tool, tool.plan, requiredSeats);
  if (lowerTier && tool.plan !== 'enterprise') {
    const lowerTierCost = getTieredCostForSeats(lowerTier, requiredSeats);
    const savings = clampMoney(currentMonthlyCost - lowerTierCost);

    if (savings >= 20) {
      recommendations.push(buildCandidate({
        id: `${tool.entryId}-team-plan-optimization`,
        tool: tool.tool,
        type: 'TEAM_PLAN_OPTIMIZATION',
        title: `Reassess ${tool.tool} ${tool.plan} tier`,
        problem: `The current ${tool.plan} plan may be more expensive than a smaller subscription plus the seats you actually need.`,
        suggestion: `Compare the current bundle against the cheapest lower tier that still covers your real seat count.`,
        reasoning: 'Bundled team tiers are only efficient when the included seats are actually used. If the team is smaller, a lower plan can be cheaper without changing workflows.',
        currentSetup: `${tool.plan} tier @ $${currentMonthlyCost.toFixed(2)}/month`,
        estimatedMonthlySavings: savings,
        estimatedAnnualSavings: annualizeMonthlyAmount(savings),
        confidence: 'MEDIUM',
        implementationDifficulty: 'EASY',
        relatedTools: [tool.tool],
        resourceKeys: [tool.entryId],
        conflictGroup: `tool:${tool.entryId}`,
        priority: 3,
      }));
    }
  }

  return recommendations;
}