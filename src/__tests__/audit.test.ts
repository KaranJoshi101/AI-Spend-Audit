/**
 * Audit Engine - Comprehensive Test Suite
 * 
 * Tests validate:
 * - Enterprise downgrade logic
 * - Savings calculations
 * - Low-spend detection
 * - Recommendation generation
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { performAudit, calculateMetrics } from '@/engine/audit';
import type { AuditInput, ToolUsageInput } from '@/types';

// ==================================================
// TEST DATA FIXTURES
// ==================================================

const createToolUsage = (overrides: Partial<ToolUsageInput>): ToolUsageInput => ({
  tool: 'github-copilot',
  plan: 'pro',
  seats: 1,
  monthlySpend: 10,
  ...overrides,
});

const createAuditInput = (tools: ToolUsageInput[] = [], overrides: Partial<AuditInput> = {}): AuditInput => ({
  tools: tools.length ? tools : [createToolUsage({})],
  teamSize: 5,
  useCase: 'coding',
  totalMonthlySpend: tools.reduce((sum, t) => sum + t.monthlySpend, 10),
  ...overrides,
});

// ==================================================
// TEST SUITE 1: ENTERPRISE DOWNGRADE LOGIC
// ==================================================

describe('Audit Engine - Enterprise Downgrade', () => {
  it('should recommend downgrade from enterprise to team plan for small team', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 10, // Small team
    });

    const result = performAudit(input);

    expect(result.recommendations.length).toBeGreaterThan(0);
    const downgrade = result.recommendations.find((r) => r.type === 'downgrade-plan');
    expect(downgrade).toBeDefined();
    expect(downgrade?.estimatedMonthlySavings).toBeGreaterThan(100);
  });

  it('should NOT recommend downgrade if team is large enough for enterprise', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 150,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 100, // Large team
    });

    const result = performAudit(input);
    const downgrade = result.recommendations.find((r) => r.type === 'downgrade-plan');

    // Should not have downgrade if team is large
    expect(downgrade).toBeUndefined();
  });

  it('should NOT recommend downgrade if savings are below threshold', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 50,
        monthlySpend: 35, // Team plan is $30, so only $5 savings (below $100 threshold)
      }),
    ], {
      teamSize: 5,
    });

    const result = performAudit(input);
    const downgrade = result.recommendations.find((r) => r.type === 'downgrade-plan');

    expect(downgrade).toBeUndefined();
  });
});

// ==================================================
// TEST SUITE 2: SAVINGS CALCULATIONS
// ==================================================

describe('Audit Engine - Savings Calculations', () => {
  it('should calculate total monthly and annual savings correctly', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 500,
    });

    const result = performAudit(input);

    expect(result.metrics.totalMonthlySpend).toBe(500);
    expect(result.metrics.estimatedMonthlySavings).toBeGreaterThan(0);
    expect(result.metrics.estimatedAnnualSavings).toBe(
      result.metrics.estimatedMonthlySavings * 12
    );
  });

  it('should calculate savings percentage correctly', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 500,
    });

    const result = performAudit(input);
    const expectedPercentage = (result.metrics.estimatedMonthlySavings / 500) * 100;

    expect(result.metrics.savingsPercentage).toBeCloseTo(expectedPercentage, 1);
  });

  it('should handle zero spend gracefully', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'free',
        seats: 1,
        monthlySpend: 0,
      }),
    ], {
      totalMonthlySpend: 0,
    });

    const result = performAudit(input);

    expect(result.metrics.savingsPercentage).toBe(0);
    expect(result.metrics.estimatedMonthlySavings).toBe(0);
  });
});

// ==================================================
// TEST SUITE 3: NO-SAVINGS CASES
// ==================================================

describe('Audit Engine - Low Spend Detection', () => {
  it('should mark result as low spend if total < threshold', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'pro',
        seats: 1,
        monthlySpend: 10,
      }),
    ], {
      teamSize: 1,
      totalMonthlySpend: 10,
    });

    const result = performAudit(input);

    expect(result.isLowSpend).toBe(true);
  });

  it('should mark result as optimized if no recommendations', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'team',
        seats: 5,
        monthlySpend: 30,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 30,
    });

    const result = performAudit(input);

    expect(result.recommendations.length).toBe(0);
    expect(result.metrics.savingsOpportunitiesCount).toBe(0);
  });

  it('should not mark as high savings if savings < threshold', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'team',
        seats: 10,
        monthlySpend: 50,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 50,
    });

    const result = performAudit(input);

    expect(result.isHighSavings).toBe(false);
  });
});

// ==================================================
// TEST SUITE 4: RECOMMENDATION GENERATION
// ==================================================

describe('Audit Engine - Recommendation Generation', () => {
  it('should generate multiple recommendations for multiple tools', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
      createToolUsage({
        tool: 'claude',
        plan: 'enterprise',
        seats: 50,
        monthlySpend: 200,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 700,
    });

    const result = performAudit(input);

    expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it('should sort recommendations by savings (highest first)', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
      createToolUsage({
        tool: 'claude',
        plan: 'enterprise',
        seats: 50,
        monthlySpend: 200,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 700,
    });

    const result = performAudit(input);

    for (let i = 1; i < result.recommendations.length; i++) {
      expect(result.recommendations[i - 1].estimatedMonthlySavings).toBeGreaterThanOrEqual(
        result.recommendations[i].estimatedMonthlySavings
      );
    }
  });

  it('should include reasoning in all recommendations', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 100,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 500,
    });

    const result = performAudit(input);

    for (const rec of result.recommendations) {
      expect(rec.reasoning).toBeTruthy();
      expect(rec.reasoning.length).toBeGreaterThan(10);
    }
  });
});

// ==================================================
// TEST SUITE 5: EDGE CASES
// ==================================================

describe('Audit Engine - Edge Cases', () => {
  it('should handle single user with free plan', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'free',
        seats: 1,
        monthlySpend: 0,
      }),
    ], {
      teamSize: 1,
      totalMonthlySpend: 0,
    });

    const result = performAudit(input);

    expect(result.metrics.totalMonthlySpend).toBe(0);
    expect(result.recommendations.length).toBe(0);
  });

  it('should handle multiple identical tools', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 50,
        monthlySpend: 250,
      }),
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 50,
        monthlySpend: 250,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 500,
    });

    const result = performAudit(input);

    expect(result.metrics.totalMonthlySpend).toBe(500);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle high savings scenario correctly', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 200,
        monthlySpend: 1500,
      }),
    ], {
      teamSize: 5,
      totalMonthlySpend: 1500,
    });

    const result = performAudit(input);

    expect(result.isHighSavings).toBe(true);
    expect(result.metrics.estimatedMonthlySavings).toBeGreaterThan(500);
  });
});

// ==================================================
// TEST SUITE 6: METRICS ISOLATION
// ==================================================

describe('Audit Engine - Metrics Calculation', () => {
  it('should calculate metrics independently of recommendations', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'pro',
        seats: 3,
        monthlySpend: 30,
      }),
    ], {
      teamSize: 3,
      totalMonthlySpend: 30,
    });

    const metrics = calculateMetrics(input);

    expect(metrics.totalMonthlySpend).toBe(30);
    expect(metrics.totalAnnualSpend).toBe(360);
    expect(metrics.estimatedMonthlySavings).toBe(0); // Not yet calculated
  });

  it('should include api credits spend in monthly totals', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'openai-api',
        plan: 'credits',
        seats: 1,
        monthlySpend: 100,
        apiCreditsSpend: 25,
      }),
    ], {
      teamSize: 1,
      totalMonthlySpend: 125,
    });

    const metrics = calculateMetrics(input);

    expect(metrics.totalMonthlySpend).toBe(125);
    expect(metrics.totalAnnualSpend).toBe(1500);
  });
});
