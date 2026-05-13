/**
 * Audit Engine - Financial-grade reliability tests
 */

import { describe, it, expect } from 'vitest';
import { calculateMetrics, performAudit } from '@/engine/audit';
import { validateAuditForm } from '@/lib/validation';
import type { AuditInput, ToolUsageInput } from '@/types';

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
  totalMonthlySpend: tools.reduce((sum, tool) => sum + tool.monthlySpend + (tool.apiCreditsSpend ?? 0), 0),
  ...overrides,
});

describe('Audit Engine - Enterprise Downgrade', () => {
  it('recommends a downgrade for a small team on enterprise pricing', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 10,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 10,
    });

    const result = performAudit(input);
    const downgrade = result.recommendations.find((recommendation) => recommendation.type === 'ENTERPRISE_DOWNGRADE');

    expect(result.isValid).toBe(true);
    expect(downgrade).toBeDefined();
    expect(downgrade?.confidence).toBe('HIGH');
    expect(downgrade?.estimatedMonthlySavings ?? 0).toBeGreaterThan(100);
  });

  it('does not recommend enterprise downgrade for large teams', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'enterprise',
        seats: 150,
        monthlySpend: 500,
      }),
    ], {
      teamSize: 100,
    });

    const result = performAudit(input);

    expect(result.recommendations.find((recommendation) => recommendation.type === 'ENTERPRISE_DOWNGRADE')).toBeUndefined();
  });
});

describe('Audit Engine - Seat Efficiency', () => {
  it('flags unused seats when seat counts exceed the team size', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'team',
        seats: 10,
        monthlySpend: 80,
      }),
    ], {
      teamSize: 4,
    });

    const result = performAudit(input);

    expect(result.recommendations.some((recommendation) => recommendation.type === 'UNUSED_SEATS' || recommendation.type === 'OVERPROVISIONED_SEATS')).toBe(true);
  });

  it('does not emit seat cleanup noise for already right-sized allocations', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'team',
        seats: 5,
        monthlySpend: 30,
      }),
    ], {
      teamSize: 4,
    });

    const result = performAudit(input);

    expect(result.recommendations.some((recommendation) => recommendation.type === 'UNUSED_SEATS' || recommendation.type === 'OVERPROVISIONED_SEATS')).toBe(false);
  });
});

describe('Audit Engine - API Optimization', () => {
  it('recommends API billing when explicit API spend is cheaper than the subscription', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'openai-api',
        plan: 'credits',
        seats: 1,
        monthlySpend: 120,
      }),
    ], {
      teamSize: 1,
      useCase: 'mixed',
    });

    const result = performAudit(input);
    const apiRecommendation = result.recommendations.find((recommendation) => recommendation.type === 'API_VS_SUBSCRIPTION');

    expect(apiRecommendation).toBeDefined();
    expect(apiRecommendation?.estimatedMonthlySavings ?? 0).toBeGreaterThan(20);
  });
});

describe('Audit Engine - Alternative and Consolidation Logic', () => {
  it('produces a cheaper alternative recommendation for overlapping tools', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'chatgpt',
        plan: 'pro',
        seats: 2,
        monthlySpend: 220,
      }),
    ], {
      teamSize: 2,
      useCase: 'mixed',
    });

    const result = performAudit(input);

    expect(result.recommendations.some((recommendation) => recommendation.type === 'CHEAPER_ALTERNATIVE')).toBe(true);
  });

  it('does not duplicate recommendations for overlapping assistant tools', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'chatgpt',
        plan: 'pro',
        seats: 1,
        monthlySpend: 120,
      }),
      createToolUsage({
        tool: 'claude',
        plan: 'pro',
        seats: 1,
        monthlySpend: 90,
      }),
    ], {
      teamSize: 2,
      useCase: 'mixed',
    });

    const result = performAudit(input);
    const ids = new Set(result.recommendations.map((recommendation) => recommendation.id));

    expect(ids.size).toBe(result.recommendations.length);
    expect(result.recommendations.some((recommendation) => recommendation.type === 'DUPLICATE_TOOL_OVERLAP')).toBe(true);
  });
});

describe('Audit Engine - Metrics and Edge Cases', () => {
  it('calculates spend from current inputs deterministically', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'github-copilot',
        plan: 'pro',
        seats: 1,
        monthlySpend: 12,
        apiCreditsSpend: 8,
      }),
      createToolUsage({
        tool: 'chatgpt',
        plan: 'pro',
        seats: 1,
        monthlySpend: 20,
      }),
    ]);

    const metrics = calculateMetrics(input);

    expect(metrics.totalMonthlySpend).toBe(40);
    expect(metrics.totalAnnualSpend).toBe(480);
  });

  it('handles zero spend without crashing', () => {
    const input = createAuditInput([
      createToolUsage({
        tool: 'cursor',
        plan: 'free',
        seats: 1,
        monthlySpend: 0,
      }),
    ], {
      teamSize: 1,
      totalMonthlySpend: 0,
    });

    const result = performAudit(input);

    expect(result.recommendations.length).toBe(0);
    expect(result.metrics.estimatedMonthlySavings).toBe(0);
    expect(result.metrics.estimatedAnnualSavings).toBe(0);
  });

  it('returns a structured invalid result for malformed input', () => {
    const result = performAudit({
      tools: [
        {
          tool: 'github-copilot',
          plan: 'pro',
          seats: -1,
          monthlySpend: -10,
        },
      ],
      teamSize: 0,
      useCase: 'coding',
      totalMonthlySpend: -10,
    } as AuditInput);

    expect(result.isValid).toBe(false);
    expect(result.recommendations).toHaveLength(0);
    expect(Object.values(result.validationErrors ?? {}).join(' ')).toContain('Team size must be at least 1');
  });

  it('rejects oversized audit payloads before running the engine', () => {
    const oversized = {
      tools: Array.from({ length: 21 }, () => createToolUsage({})),
      teamSize: 5,
      useCase: 'coding',
      totalMonthlySpend: 210,
    };

    const result = validateAuditForm(oversized);

    expect(result.success).toBe(false);
    expect(Object.values(result.errors ?? {}).join(' ')).toContain('Too many tools');
  });

  it('rejects negative values for spend and team size', () => {
    const result = validateAuditForm({
      tools: [createToolUsage({ monthlySpend: -1 })],
      teamSize: -1,
      useCase: 'coding',
      totalMonthlySpend: -1,
    });

    expect(result.success).toBe(false);
    expect(Object.values(result.errors ?? {}).join(' ')).toContain('Team size must be at least 1');
    expect(Object.values(result.errors ?? {}).join(' ')).toContain('Spend must be positive');
  });
});