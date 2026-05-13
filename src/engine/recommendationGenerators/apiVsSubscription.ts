import type { RecommendationCandidate } from '@/engine/utils/dedupe';
import type { NormalizedAuditInput, NormalizedToolUsage } from '@/engine/validators';
import { annualizeMonthlyAmount, clampMoney } from '@/engine/utils/money';
import { getBestSubscriptionTier, getEffectiveMonthlySpend, getPricingTier, getTieredCostForSeats } from '@/engine/pricingCalculators';

function buildCandidate(base: Omit<RecommendationCandidate, 'resourceKeys' | 'conflictGroup' | 'priority'> & { resourceKeys: string[]; conflictGroup: string; priority: number }): RecommendationCandidate {
  return base;
}

export function generateApiVsSubscriptionRecommendations(input: NormalizedAuditInput, tool: NormalizedToolUsage): RecommendationCandidate[] {
  const currentSpend = getEffectiveMonthlySpend(tool);
  const currentTier = getPricingTier(tool.tool, tool.plan);
  const apiTier = getPricingTier(tool.tool, 'credits');

  if (!apiTier) {
    return [];
  }

  if (tool.plan === 'credits') {
    const subscriptionTier = getBestSubscriptionTier(tool.tool, Math.max(tool.seats, input.teamSize));
    if (!subscriptionTier) {
      return [];
    }

    const subscriptionCost = getTieredCostForSeats(subscriptionTier, Math.max(tool.seats, input.teamSize));
    const monthlySavings = clampMoney(currentSpend - subscriptionCost);

    if (monthlySavings < 20) {
      return [];
    }

    return [buildCandidate({
      id: `${tool.entryId}-api-to-subscription`,
      tool: tool.tool,
      type: 'API_VS_SUBSCRIPTION',
      title: `Move ${tool.tool} usage to a subscription`,
      problem: `Your ${tool.tool} API spend is higher than the cheapest subscription tier that fits your seat count.`,
      suggestion: `Adopt ${subscriptionTier.plan.toUpperCase()} billing and keep the current workflow model.`,
      reasoning: 'For steady usage patterns, a fixed subscription is easier to budget and cheaper than variable usage billing.',
      currentSetup: `${tool.plan} billing @ $${currentSpend.toFixed(2)}/month`,
      estimatedMonthlySavings: monthlySavings,
      estimatedAnnualSavings: annualizeMonthlyAmount(monthlySavings),
      confidence: 'HIGH',
      implementationDifficulty: 'MODERATE',
      relatedTools: [tool.tool],
      resourceKeys: [tool.entryId],
      conflictGroup: `tool:${tool.entryId}`,
      priority: 4,
    })];
  }

  if (!currentTier || !tool.apiCreditsSpend || tool.apiCreditsSpend <= 0) {
    return [];
  }

  const apiCost = apiTier.monthlyPrice + tool.apiCreditsSpend;
  const monthlySavings = clampMoney(currentSpend - apiCost);

  if (monthlySavings < 20) {
    return [];
  }

  const confidence = tool.useCase === 'coding' || tool.useCase === 'mixed' ? 'MEDIUM' : 'LOW';

  return [buildCandidate({
    id: `${tool.entryId}-subscription-to-api`,
    tool: tool.tool,
    type: 'API_VS_SUBSCRIPTION',
    title: `Switch ${tool.tool} to API billing`,
    problem: `Your subscription cost plus API usage is higher than a direct API billing model for the same usage profile.`,
    suggestion: `Move to the API billing tier and keep seat-based subscriptions only where they are cheaper.`,
    reasoning: 'This comparison only fires when the current audit includes explicit API usage spend, so the savings estimate is tied to observed spend rather than an invented usage curve.',
    currentSetup: `${tool.plan} billing + API spend @ $${currentSpend.toFixed(2)}/month`,
    estimatedMonthlySavings: monthlySavings,
    estimatedAnnualSavings: annualizeMonthlyAmount(monthlySavings),
    confidence,
    implementationDifficulty: 'MODERATE',
    relatedTools: [tool.tool],
    resourceKeys: [tool.entryId],
    conflictGroup: `tool:${tool.entryId}`,
    priority: 5,
  })];
}