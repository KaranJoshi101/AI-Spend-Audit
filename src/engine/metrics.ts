import type { AuditMetrics } from '@/types';
import type { NormalizedAuditInput } from '@/engine/validators';
import { annualizeMonthlyAmount, percentageOf, roundMoney, sumMoney } from '@/engine/utils/money';
import { getEffectiveMonthlySpend } from '@/engine/pricingCalculators';

export function calculateBaseMetrics(input: NormalizedAuditInput): AuditMetrics {
  const totalMonthlySpend = sumMoney(input.tools.map((tool) => getEffectiveMonthlySpend(tool)));
  const totalAnnualSpend = annualizeMonthlyAmount(totalMonthlySpend);

  return {
    totalMonthlySpend,
    totalAnnualSpend,
    estimatedMonthlySavings: 0,
    estimatedAnnualSavings: 0,
    savingsPercentage: 0,
    savingsOpportunitiesCount: 0,
  };
}

export function applySavingsToMetrics(metrics: AuditMetrics, estimatedMonthlySavings: number, opportunitiesCount: number): AuditMetrics {
  const safeMonthlySavings = roundMoney(Math.max(0, estimatedMonthlySavings));
  const safeAnnualSavings = annualizeMonthlyAmount(safeMonthlySavings);
  const savingsPercentage = percentageOf(safeMonthlySavings, metrics.totalMonthlySpend);

  return {
    ...metrics,
    estimatedMonthlySavings: safeMonthlySavings,
    estimatedAnnualSavings: safeAnnualSavings,
    savingsPercentage,
    savingsOpportunitiesCount: Math.max(0, opportunitiesCount),
  };
}