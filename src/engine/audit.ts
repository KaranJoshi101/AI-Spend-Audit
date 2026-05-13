/**
 * Audit Engine Core
 * 
 * Deterministic financial calculation engine.
 * NO AI used here - all rules are explicit and auditable.
 * Returns structured recommendations with financial justification.
 */

import type {
  AuditInput,
  AuditMetrics,
  AuditResult,
  Recommendation,
  ToolUsageInput,
} from '@/types';
import { PRICING_DATA, THRESHOLDS, ALTERNATIVES, getToolMonthlyCost } from '@/lib/pricing';
import { savePublicReportToSupabase } from '@/lib/supabase';

// ==================================================
// METRICS CALCULATION
// ==================================================

export function calculateMetrics(input: AuditInput): AuditMetrics {
  const totalMonthlySpend = input.tools.reduce((sum, tool) => sum + getToolMonthlyCost(tool), 0);
  const totalAnnualSpend = totalMonthlySpend * 12;

  return {
    totalMonthlySpend,
    totalAnnualSpend,
    estimatedMonthlySavings: 0, // Populated after recommendations
    estimatedAnnualSavings: 0,
    savingsPercentage: 0,
    savingsOpportunitiesCount: 0,
  };
}

// ==================================================
// RECOMMENDATION GENERATORS
// ==================================================

/**
 * Check if enterprise plan is necessary for team size
 */
function generateEnterpriseDowngradeRecommendation(
  tool: ToolUsageInput,
  _input: AuditInput
): Recommendation | null {
  const pricing = PRICING_DATA[tool.tool];
  if (!pricing || tool.plan !== 'enterprise') return null;

  const teamSize = _input.teamSize;
  const currentMonthlyCost = getToolMonthlyCost(tool);
  const enterpriseTier = pricing.tiers.find((t) => t.plan === 'enterprise');
  const teamTier = pricing.tiers.find((t) => t.plan === 'team');

  if (!enterpriseTier || !teamTier) return null;

  // If team is small and enterprise is overkill
  if (teamSize < THRESHOLDS.ENTERPRISE_MIN_TEAM_SIZE) {
    const monthlySavings = currentMonthlyCost - teamTier.monthlyPrice;

    if (monthlySavings > THRESHOLDS.ENTERPRISE_DOWNGRADE_SAVINGS_MIN) {
      return {
        id: `${tool.tool}-downgrade-enterprise`,
        tool: tool.tool,
        type: 'downgrade-plan',
        title: `Downgrade from ${tool.plan} to Team plan`,
        problem: `Your ${tool.tool} enterprise plan ($${currentMonthlyCost}/mo) is excessive for a ${teamSize}-person team.`,
        suggestion: `Switch to the Team plan ($${teamTier.monthlyPrice}/mo) which supports ${teamTier.seatsIncluded}+ users.`,
        reasoning: `Enterprise plans are designed for 50+ person organizations with dedicated support needs. Your team doesn't require this tier.`,
        currentSetup: `${tool.tool} Enterprise - ${tool.seats} seats @ $${currentMonthlyCost}/month`,
        estimatedMonthlySavings: monthlySavings,
        estimatedAnnualSavings: monthlySavings * 12,
        confidence: 'high',
        implementationDifficulty: 'easy',
      };
    }
  }

  return null;
}

/**
 * Check for unused seats
 */
function generateUnusedSeatsRecommendation(
  tool: ToolUsageInput,
  input: AuditInput
): Recommendation | null {
  const pricing = PRICING_DATA[tool.tool];
  if (!pricing) return null;

  const tier = pricing.tiers.find((t) => t.plan === tool.plan);
  if (!tier) return null;
  const currentMonthlyCost = getToolMonthlyCost(tool);

  // Conservative estimate: if seats > team size, likely unused
  const unusedSeats = Math.max(0, tool.seats - input.teamSize);

  if (unusedSeats > 0) {
    const monthlySavings = unusedSeats * tier.costPerExtraUser;

    if (monthlySavings > 10) {
      return {
        id: `${tool.tool}-unused-seats`,
        tool: tool.tool,
        type: 'unused-seats',
        title: `Remove ${unusedSeats} unused seats`,
        problem: `You're paying for ${tool.seats} seats but only have ${input.teamSize} team members.`,
        suggestion: `Reduce to ${input.teamSize} seats.`,
        reasoning: `Unused seats are pure waste. Seat reduction is instant.`,
        currentSetup: `${tool.seats} seats @ $${tier.costPerExtraUser}/seat = $${currentMonthlyCost}/month`,
        estimatedMonthlySavings: monthlySavings,
        estimatedAnnualSavings: monthlySavings * 12,
        confidence: 'high',
        implementationDifficulty: 'easy',
      };
    }
  }

  return null;
}

/**
 * Check if API pricing is better than subscription
 */
function generateApiVsSubscriptionRecommendation(
  tool: ToolUsageInput,
  _input: AuditInput
): Recommendation | null {
  // Only for subscription-based tools
  const currentMonthlyCost = getToolMonthlyCost(tool);

  if (tool.plan === 'credits' || !currentMonthlyCost || currentMonthlyCost < 50) {
    return null;
  }

  const apiTier = PRICING_DATA[tool.tool]?.tiers.find((t) => t.plan === 'credits');
  if (!apiTier) return null;

  // Estimate: if using API could save 40% or more, recommend it
  const estimatedApiCost = currentMonthlyCost * (1 - THRESHOLDS.API_SAVINGS_PERCENTAGE);
  const monthlySavings = currentMonthlyCost - estimatedApiCost;

  if (monthlySavings > 20) {
    return {
      id: `${tool.tool}-api-optimization`,
      tool: tool.tool,
      type: 'api-vs-subscription',
      title: `Switch to pay-per-use API billing`,
      problem: `Your fixed ${tool.tool} subscription ($${currentMonthlyCost}/mo) may be more expensive than usage-based billing for variable workloads.`,
      suggestion: `Consider migrating to API credits model for pay-per-use pricing.`,
      reasoning: `Variable usage patterns cost less with per-request billing. Fixed seats are wasteful for episodic work.`,
      currentSetup: `${tool.plan} subscription @ $${currentMonthlyCost}/month`,
      estimatedMonthlySavings: monthlySavings,
      estimatedAnnualSavings: monthlySavings * 12,
      confidence: 'medium',
        implementationDifficulty: 'hard',
    };
  }

  return null;
}

/**
 * Check for better alternatives
 */
function generateAlternativeRecommendation(
  tool: ToolUsageInput,
  _input: AuditInput
): Recommendation | null {
  const alternatives = ALTERNATIVES[tool.tool];
  if (!alternatives || alternatives.length === 0) return null;
  const currentMonthlyCost = getToolMonthlyCost(tool);

  // Recommend the cheapest alternative
  const best = alternatives.reduce((prev, curr) =>
    curr.savingsPct > prev.savingsPct ? curr : prev
  );

  const monthlySavings = Math.round(currentMonthlyCost * best.savingsPct);

  if (monthlySavings > 20) {
    return {
      id: `${tool.tool}-alternative`,
      tool: tool.tool,
      type: 'better-alternative',
      title: `Consider ${best.tool} instead`,
      problem: `${tool.tool} may not be the most cost-effective solution for your use case.`,
      suggestion: `Evaluate ${best.tool} as a potential replacement.`,
      reasoning: best.reason,
      currentSetup: `${tool.tool} @ $${currentMonthlyCost}/month`,
      estimatedMonthlySavings: monthlySavings,
      estimatedAnnualSavings: monthlySavings * 12,
      confidence: 'low', // Alternatives require evaluation
      implementationDifficulty: 'hard', // Switching tools is hard
    };
  }

  return null;
}

// ==================================================
// AUDIT ENGINE
// ==================================================

export function generateRecommendations(input: AuditInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const tool of input.tools) {
    // Enterprise downgrade
    const downgrade = generateEnterpriseDowngradeRecommendation(tool, input);
    if (downgrade) recommendations.push(downgrade);

    // Unused seats
    const seats = generateUnusedSeatsRecommendation(tool, input);
    if (seats) recommendations.push(seats);

    // API vs Subscription
    const api = generateApiVsSubscriptionRecommendation(tool, input);
    if (api) recommendations.push(api);

    // Alternatives
    const alt = generateAlternativeRecommendation(tool, input);
    if (alt) recommendations.push(alt);
  }

  return recommendations.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
}

export function performAudit(input: AuditInput): AuditResult {
  const metrics = calculateMetrics(input);
  const recommendations = generateRecommendations(input);

  // Sum up all savings
  const totalMonthlySavings = recommendations.reduce((sum, r) => sum + r.estimatedMonthlySavings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const savingsPercentage = metrics.totalMonthlySpend > 0 
    ? (totalMonthlySavings / metrics.totalMonthlySpend) * 100 
    : 0;

  const updatedMetrics: AuditMetrics = {
    ...metrics,
    estimatedMonthlySavings: totalMonthlySavings,
    estimatedAnnualSavings: totalAnnualSavings,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    savingsOpportunitiesCount: recommendations.length,
  };

  const isHighSavings = totalMonthlySavings > THRESHOLDS.HIGHLIGHT_SAVINGS_THRESHOLD;
  const isLowSpend = metrics.totalMonthlySpend < THRESHOLDS.LOW_SPEND_THRESHOLD;

  const result: AuditResult = {
    id: generateId(),
    metrics: updatedMetrics,
    recommendations,
    input,
    createdAt: new Date(),
    publicSlug: generateSlug(),
    isHighSavings,
    isLowSpend,
  };

  // Attempt to persist a public copy to Supabase asynchronously (best-effort)
   
  (async () => {
    try {
      await savePublicReportToSupabase(result);
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // ignore
    }
  })();

  return result;
}

// ==================================================
// HELPERS
// ==================================================

export function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}
