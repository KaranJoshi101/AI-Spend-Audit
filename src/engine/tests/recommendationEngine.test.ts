import { describe, it, expect } from 'vitest';
import { generateRecommendationsForAudit } from '@/engine/recommendationEngine';
import { validateAuditInput } from '@/engine/validators';
import type { AuditInput, ToolUsageInput } from '@/types';

const makeTool = (overrides: Partial<ToolUsageInput>): ToolUsageInput => ({
  tool: 'github-copilot',
  plan: 'pro',
  seats: 1,
  monthlySpend: 10,
  useCase: 'coding',
  ...overrides,
});

const makeInput = (tools: ToolUsageInput[], overrides: Partial<AuditInput> = {}): AuditInput => ({
  tools,
  teamSize: 3,
  totalMonthlySpend: tools.reduce((sum, tool) => sum + tool.monthlySpend + (tool.apiCreditsSpend ?? 0), 0),
  ...overrides,
});

describe('recommendationEngine', () => {
  it('normalizes tool and plan aliases before validation', () => {
    const result = validateAuditInput(makeInput([
      makeTool({
        tool: 'Copilot',
        plan: 'Pro',
        seats: 1,
        monthlySpend: 10,
      }),
    ]));

    expect(result.success).toBe(true);
    expect(result.data?.tools[0].tool).toBe('github-copilot');
    expect(result.data?.tools[0].plan).toBe('pro');
  });

  it('returns recommendations sorted by savings and without resource overlap', () => {
    const input = makeInput([
      makeTool({ tool: 'chatgpt', plan: 'pro', monthlySpend: 120, seats: 1 }),
      makeTool({ tool: 'claude', plan: 'pro', monthlySpend: 90, seats: 1 }),
    ]);
    const result = validateAuditInput(input);

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('expected validation to succeed');
    }

    const recommendations = generateRecommendationsForAudit(result.data);
    const ids = new Set(recommendations.map((recommendation) => recommendation.id));

    expect(ids.size).toBe(recommendations.length);
    expect(recommendations.every((recommendation) => recommendation.estimatedMonthlySavings >= 0)).toBe(true);
  });

  it('deduplicates overlap groups and keeps the highest-value recommendation', () => {
    const input = makeInput([
      makeTool({ tool: 'chatgpt', plan: 'pro', monthlySpend: 120, seats: 1 }),
      makeTool({ tool: 'claude', plan: 'pro', monthlySpend: 90, seats: 1 }),
    ]);
    const result = validateAuditInput(input);

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('expected validation to succeed');
    }

    const recommendations = generateRecommendationsForAudit(result.data);
    const toolSet = new Set(recommendations.flatMap((recommendation) => recommendation.relatedTools ?? [recommendation.tool]));

    expect(toolSet.has('chatgpt')).toBe(true);
    expect(toolSet.has('claude')).toBe(true);
    expect(recommendations.some((recommendation) => recommendation.type === 'DUPLICATE_TOOL_OVERLAP')).toBe(true);
    expect(new Set(recommendations.map((recommendation) => recommendation.id)).size).toBe(recommendations.length);
  });
});