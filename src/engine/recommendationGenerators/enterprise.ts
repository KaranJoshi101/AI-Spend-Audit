import type { RecommendationCandidate } from '@/engine/utils/dedupe';
import type { NormalizedAuditInput, NormalizedToolUsage } from '@/engine/validators';
import { THRESHOLDS } from '@/lib/pricing';
import { annualizeMonthlyAmount, clampMoney } from '@/engine/utils/money';
import { getBestSubscriptionTier, getEffectiveMonthlySpend, getLowerCostTier, getPricingTier, getToolPricing, getTieredCostForSeats } from '@/engine/pricingCalculators';

const ENTERPRISE_LIKE_PLANS = new Set(['enterprise', 'business', 'max', 'ultra']);

function buildCandidate(base: Omit<RecommendationCandidate, 'resourceKeys' | 'conflictGroup' | 'priority'> & { resourceKeys: string[]; conflictGroup: string; priority: number }): RecommendationCandidate {
  return base;
}

function buildCurrentSetup(tool: NormalizedToolUsage, currentMonthlyCost: number): string {
  return `${tool.tool} ${tool.plan.toUpperCase()} - ${tool.seats} seats @ $${currentMonthlyCost.toFixed(2)}/month`;
}

export function generateEnterpriseRecommendations(input: NormalizedAuditInput, tool: NormalizedToolUsage): RecommendationCandidate[] {
  const pricing = getToolPricing(tool.tool);
  if (!pricing || !ENTERPRISE_LIKE_PLANS.has(tool.plan)) {
    return [];
  }

  const enterpriseTier = getPricingTier(tool.tool, tool.plan);
  if (!enterpriseTier) {
    return [];
  }

  const currentMonthlyCost = getEffectiveMonthlySpend(tool);
  const requiredSeats = Math.max(input.teamSize, Math.min(tool.seats, input.teamSize + 1));
  const targetTier = getLowerCostTier(tool.tool, tool.plan, requiredSeats) ?? getBestSubscriptionTier(tool.tool, requiredSeats);

  const candidates: RecommendationCandidate[] = [];

  if (tool.plan === 'enterprise' && input.teamSize < THRESHOLDS.ENTERPRISE_MIN_TEAM_SIZE && targetTier) {
    const replacementCost = getTieredCostForSeats(targetTier, requiredSeats);
    const monthlySavings = clampMoney(currentMonthlyCost - replacementCost);

    if (monthlySavings >= THRESHOLDS.ENTERPRISE_DOWNGRADE_SAVINGS_MIN) {
      candidates.push(buildCandidate({
        id: `${tool.entryId}-enterprise-downgrade`,
        tool: tool.tool,
        type: 'ENTERPRISE_DOWNGRADE',
        title: `Downgrade ${tool.tool} from Enterprise`,
        problem: `The ${tool.tool} ${tool.plan} tier is oversized for a ${input.teamSize}-person team.`,
        suggestion: `Move to ${targetTier.plan.toUpperCase()} and keep only the seats you actually need.`,
        reasoning: 'Enterprise pricing is justified only when support, compliance, or seat volume is large enough. Your current team size fits a lower tier without losing core functionality.',
        currentSetup: buildCurrentSetup(tool, currentMonthlyCost),
        estimatedMonthlySavings: monthlySavings,
        estimatedAnnualSavings: annualizeMonthlyAmount(monthlySavings),
        confidence: 'HIGH',
        implementationDifficulty: 'EASY',
        relatedTools: [tool.tool],
        resourceKeys: [tool.entryId],
        conflictGroup: `tool:${tool.entryId}`,
        priority: 1,
      }));
    }
  }

  if (tool.plan === 'enterprise' && !targetTier) {
    candidates.push(buildCandidate({
      id: `${tool.entryId}-underutilized-enterprise`,
      tool: tool.tool,
      type: 'UNDERUTILIZED_ENTERPRISE_FEATURES',
      title: `Review ${tool.tool} Enterprise usage`,
      problem: `The ${tool.tool} enterprise plan may include features your current team is not using.`,
      suggestion: 'Audit enterprise-only features, support entitlements, and security add-ons before renewal.',
      reasoning: 'When no lower tier can be proven safe from the current pricing catalog, the defensible action is to verify whether enterprise-specific capabilities are actually needed.',
      currentSetup: buildCurrentSetup(tool, currentMonthlyCost),
      estimatedMonthlySavings: 0,
      estimatedAnnualSavings: 0,
      confidence: 'LOW',
      implementationDifficulty: 'MODERATE',
      relatedTools: [tool.tool],
      resourceKeys: [tool.entryId],
      conflictGroup: `tool:${tool.entryId}`,
      priority: 9,
    }));
  }

  return candidates;
}