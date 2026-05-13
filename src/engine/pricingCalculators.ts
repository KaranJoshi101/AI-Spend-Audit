import type { AITool, PricingPlan, PricingTier, ToolPricing, ToolUsageInput } from '@/types';
import { PRICING_DATA } from '@/lib/pricing';
import { clampMoney, roundMoney } from '@/engine/utils/money';

export function getToolPricing(tool: AITool): ToolPricing | null {
  return PRICING_DATA[tool] ?? null;
}

export function getPricingTier(tool: AITool, plan: PricingPlan): PricingTier | null {
  return getToolPricing(tool)?.tiers.find((tier) => tier.plan === plan) ?? null;
}

export function getEffectiveMonthlySpend(tool: ToolUsageInput): number {
  return clampMoney((tool.monthlySpend ?? 0) + (tool.apiCreditsSpend ?? 0));
}

export function getTieredCostForSeats(tier: PricingTier, seatCount: number): number {
  const additionalSeats = Math.max(0, seatCount - tier.seatsIncluded);
  return roundMoney(tier.monthlyPrice + additionalSeats * tier.costPerExtraUser);
}

export function getLowerCostTier(tool: AITool, currentPlan: PricingPlan, requiredSeats: number): PricingTier | null {
  const pricing = getToolPricing(tool);
  const currentTier = getPricingTier(tool, currentPlan);

  if (!pricing || !currentTier) {
    return null;
  }

  const viableTiers = pricing.tiers
    .filter((tier) => tier.plan !== currentPlan)
    .filter((tier) => tier.monthlyPrice < currentTier.monthlyPrice)
    .filter((tier) => tier.seatsIncluded >= Math.max(1, requiredSeats) || tier.costPerExtraUser > 0);

  if (viableTiers.length === 0) {
    return null;
  }

  return viableTiers.sort((a, b) => a.monthlyPrice - b.monthlyPrice)[0] ?? null;
}

export function getBestSubscriptionTier(tool: AITool, requiredSeats: number): PricingTier | null {
  const pricing = getToolPricing(tool);

  if (!pricing) {
    return null;
  }

  return pricing.tiers
    .filter((tier) => tier.plan !== 'credits')
    .filter((tier) => tier.seatsIncluded >= Math.max(1, requiredSeats) || tier.costPerExtraUser > 0)
    .sort((a, b) => {
      const aCost = getTieredCostForSeats(a, requiredSeats);
      const bCost = getTieredCostForSeats(b, requiredSeats);
      return aCost - bCost;
    })[0] ?? null;
}

export function hasValidPricingForTool(tool: AITool): boolean {
  const pricing = getToolPricing(tool);
  return Boolean(pricing && pricing.tiers.length > 0 && pricing.tiers.every((tier) => Number.isFinite(tier.monthlyPrice)));
}