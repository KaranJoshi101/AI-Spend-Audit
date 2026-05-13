/**
 * Audit Engine Core
 *
 * Deterministic financial calculation engine.
 * All calculations are validated, pure, and auditable.
 */

import type { AuditInput, AuditMetrics, AuditResult } from '@/types';
import { THRESHOLDS } from '@/lib/pricing';
import { savePublicReportToSupabase } from '@/lib/supabase';
import { applySavingsToMetrics, calculateBaseMetrics } from '@/engine/metrics';
import { generateRecommendationsForAudit } from '@/engine/recommendationEngine';
import { validateAuditInput } from '@/engine/validators';
import { roundMoney } from '@/engine/utils/money';

export function calculateMetrics(input: AuditInput): AuditMetrics {
  const validation = validateAuditInput(input);
  if (!validation.success || !validation.data) {
    return {
      totalMonthlySpend: 0,
      totalAnnualSpend: 0,
      estimatedMonthlySavings: 0,
      estimatedAnnualSavings: 0,
      savingsPercentage: 0,
      savingsOpportunitiesCount: 0,
    };
  }

  return calculateBaseMetrics(validation.data);
}

function createInvalidResult(input: AuditInput, errors: Record<string, string>): AuditResult {
  return {
    id: generateId(),
    metrics: {
      totalMonthlySpend: 0,
      totalAnnualSpend: 0,
      estimatedMonthlySavings: 0,
      estimatedAnnualSavings: 0,
      savingsPercentage: 0,
      savingsOpportunitiesCount: 0,
    },
    recommendations: [],
    input,
    createdAt: new Date(),
    publicSlug: generateSlug(),
    isHighSavings: false,
    isLowSpend: false,
    isValid: false,
    validationErrors: errors,
  };
}

export function performAudit(input: AuditInput): AuditResult {
  const validation = validateAuditInput(input);
  if (!validation.success || !validation.data) {
    return createInvalidResult(input, validation.errors ?? { form: 'Validation failed' });
  }

  const metrics = calculateBaseMetrics(validation.data);
  const recommendations = generateRecommendationsForAudit(validation.data);
  const totalMonthlySavings = roundMoney(
    recommendations.reduce((sum, recommendation) => sum + recommendation.estimatedMonthlySavings, 0)
  );
  const updatedMetrics = applySavingsToMetrics(metrics, totalMonthlySavings, recommendations.length);

  const result: AuditResult = {
    id: generateId(),
    metrics: updatedMetrics,
    recommendations,
    input: validation.data,
    createdAt: new Date(),
    publicSlug: generateSlug(),
    isHighSavings: totalMonthlySavings >= THRESHOLDS.HIGHLIGHT_SAVINGS_THRESHOLD,
    isLowSpend: metrics.totalMonthlySpend < THRESHOLDS.LOW_SPEND_THRESHOLD,
    isValid: true,
  };

  void (async () => {
    try {
      await savePublicReportToSupabase(result);
    } catch {
      // best effort only
    }
  })();

  return result;
}

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
