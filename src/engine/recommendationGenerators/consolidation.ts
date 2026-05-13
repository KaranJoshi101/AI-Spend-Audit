import type { RecommendationCandidate } from '@/engine/utils/dedupe';
import type { NormalizedAuditInput } from '@/engine/validators';
import { annualizeMonthlyAmount, clampMoney } from '@/engine/utils/money';
import { getEffectiveMonthlySpend } from '@/engine/pricingCalculators';

const OVERLAP_GROUPS: Array<{ id: string; tools: string[]; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; factor: number }> = [
  { id: 'coding-assistants', tools: ['cursor', 'github-copilot', 'windsurf'], confidence: 'MEDIUM', factor: 0.65 },
  { id: 'general-assistants', tools: ['chatgpt', 'claude', 'gemini'], confidence: 'LOW', factor: 0.6 },
];

function buildCandidate(base: Omit<RecommendationCandidate, 'resourceKeys' | 'conflictGroup' | 'priority'> & { resourceKeys: string[]; conflictGroup: string; priority: number }): RecommendationCandidate {
  return base;
}

function makeCurrentSetup(items: Array<{ tool: string; spend: number }>): string {
  return items.map((item) => `${item.tool} @ $${item.spend.toFixed(2)}/month`).join(' + ');
}

function getGroupTools(input: NormalizedAuditInput, groupTools: string[]) {
  return input.tools.filter((tool) => groupTools.includes(tool.tool));
}

export function generateConsolidationRecommendations(input: NormalizedAuditInput): RecommendationCandidate[] {
  const recommendations: RecommendationCandidate[] = [];

  for (const group of OVERLAP_GROUPS) {
    const tools = getGroupTools(input, group.tools);
    if (tools.length < 2) {
      continue;
    }

    const uniqueTools = [...new Map(tools.map((tool) => [tool.tool, tool])).values()];
    const currentSpends = uniqueTools.map((tool) => ({ tool, spend: getEffectiveMonthlySpend(tool) }));
    const sortedBySpend = currentSpends.sort((a, b) => b.spend - a.spend);
    const primary = sortedBySpend[0];
    const secondary = sortedBySpend[1];

    if (!primary || !secondary) {
      continue;
    }

    const monthlySavings = clampMoney(secondary.spend * group.factor);
    if (monthlySavings < 25) {
      continue;
    }

    recommendations.push(buildCandidate({
      id: `${group.id}-consolidation-${uniqueTools.map((tool) => tool.entryId).sort().join('-')}`,
      tool: primary.tool.tool,
      type: 'DUPLICATE_TOOL_OVERLAP',
      title: `Consolidate overlapping ${group.id.replace('-', ' ')}`,
      problem: `${uniqueTools.map((tool) => tool.tool).join(' and ')} serve overlapping workflows and create redundant spend.`,
      suggestion: `Keep the primary workflow in ${primary.tool.tool} and reduce the secondary tool after the next renewal.`,
      reasoning: 'When two tools cover the same general job, the safest optimization is to standardize on one primary workflow and retain only the tool that is clearly required.',
      currentSetup: makeCurrentSetup(currentSpends),
      estimatedMonthlySavings: monthlySavings,
      estimatedAnnualSavings: annualizeMonthlyAmount(monthlySavings),
      confidence: group.confidence,
      implementationDifficulty: 'COMPLEX',
      relatedTools: uniqueTools.map((tool) => tool.tool),
      resourceKeys: uniqueTools.map((tool) => tool.entryId),
      conflictGroup: `consolidation:${group.id}:${uniqueTools.map((tool) => tool.entryId).sort().join('|')}`,
      priority: 7,
    }));
  }

  const exactDuplicates = new Map<string, typeof input.tools>();
  for (const tool of input.tools) {
    const key = `${tool.tool}:${tool.plan}:${tool.seats}:${tool.monthlySpend}:${tool.apiCreditsSpend ?? 0}`;
    const bucket = exactDuplicates.get(key) ?? [];
    bucket.push(tool);
    exactDuplicates.set(key, bucket);
  }

  for (const [, duplicateTools] of exactDuplicates) {
    if (duplicateTools.length < 2) {
      continue;
    }

    const [primary, ...rest] = duplicateTools;
    const duplicateSpend = rest.reduce((sum, tool) => sum + getEffectiveMonthlySpend(tool), 0);

    if (duplicateSpend < 25) {
      continue;
    }

    recommendations.push(buildCandidate({
      id: `duplicate-${duplicateTools.map((tool) => tool.entryId).join('-')}`,
      tool: primary.tool,
      type: 'DUPLICATE_TOOL_OVERLAP',
      title: `Remove duplicate ${primary.tool} entries`,
      problem: `The audit contains multiple identical ${primary.tool} entries that likely represent duplicated spend entries.`,
      suggestion: 'Keep one canonical entry and remove the duplicate records.',
      reasoning: 'Duplicate audit rows should never be counted separately in financial reporting.',
      currentSetup: duplicateTools.map((tool) => `${tool.tool} @ $${getEffectiveMonthlySpend(tool).toFixed(2)}/month`).join(' + '),
      estimatedMonthlySavings: clampMoney(duplicateSpend),
      estimatedAnnualSavings: annualizeMonthlyAmount(clampMoney(duplicateSpend)),
      confidence: 'HIGH',
      implementationDifficulty: 'EASY',
      relatedTools: duplicateTools.map((tool) => tool.tool),
      resourceKeys: duplicateTools.map((tool) => tool.entryId),
      conflictGroup: `duplicate:${duplicateTools.map((tool) => tool.entryId).sort().join('|')}`,
      priority: 0,
    }));
  }

  return recommendations;
}