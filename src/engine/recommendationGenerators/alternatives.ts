import type { RecommendationCandidate } from '@/engine/utils/dedupe';
import type { NormalizedAuditInput, NormalizedToolUsage } from '@/engine/validators';
import { ALTERNATIVES } from '@/lib/pricing';
import { annualizeMonthlyAmount, clampMoney } from '@/engine/utils/money';
import { getEffectiveMonthlySpend } from '@/engine/pricingCalculators';

const USE_CASE_FIT: Record<string, string[]> = {
  cursor: ['coding'],
  'github-copilot': ['coding'],
  windsurf: ['coding'],
  claude: ['coding', 'writing', 'research', 'mixed'],
  chatgpt: ['coding', 'writing', 'research', 'analytics', 'mixed'],
  'openai-api': ['coding', 'research', 'analytics', 'mixed'],
  'anthropic-api': ['writing', 'research', 'mixed'],
  gemini: ['writing', 'research', 'analytics', 'mixed'],
};

function buildCandidate(base: Omit<RecommendationCandidate, 'resourceKeys' | 'conflictGroup' | 'priority'> & { resourceKeys: string[]; conflictGroup: string; priority: number }): RecommendationCandidate {
  return base;
}

function isUseCaseCompatible(tool: NormalizedToolUsage): boolean {
  const fitSet = USE_CASE_FIT[tool.tool] ?? [];
  return tool.useCase === 'mixed' || fitSet.includes(tool.useCase);
}

export function generateAlternativeRecommendations(_input: NormalizedAuditInput, tool: NormalizedToolUsage): RecommendationCandidate[] {
  const alternatives = ALTERNATIVES[tool.tool];
  if (!alternatives || alternatives.length === 0 || !isUseCaseCompatible(tool)) {
    return [];
  }

  const currentSpend = getEffectiveMonthlySpend(tool);
  const bestAlternative = alternatives.slice().sort((a, b) => b.savingsPct - a.savingsPct)[0];
  if (!bestAlternative) {
    return [];
  }

  const monthlySavings = clampMoney(currentSpend * bestAlternative.savingsPct);
  if (monthlySavings < 25) {
    return [];
  }

  const migrationRisk: RecommendationCandidate['migrationRisk'] = bestAlternative.savingsPct >= 0.25 ? 'medium' : 'low';
  const learningCurveEstimate: RecommendationCandidate['learningCurveEstimate'] = bestAlternative.savingsPct >= 0.25 ? 'moderate' : 'easy';

  return [buildCandidate({
    id: `${tool.entryId}-alternative-${bestAlternative.tool}`,
    tool: tool.tool,
    type: 'CHEAPER_ALTERNATIVE',
    title: `Evaluate ${bestAlternative.tool} instead`,
    problem: `${tool.tool} appears more expensive than a close alternative for the same general workflow.`,
    suggestion: `Pilot ${bestAlternative.tool} before renewing the current tool at full price.`,
    reasoning: bestAlternative.reason,
    currentSetup: `${tool.tool} @ $${currentSpend.toFixed(2)}/month`,
    estimatedMonthlySavings: monthlySavings,
    estimatedAnnualSavings: annualizeMonthlyAmount(monthlySavings),
    confidence: bestAlternative.savingsPct >= 0.25 ? 'MEDIUM' : 'LOW',
    implementationDifficulty: bestAlternative.savingsPct >= 0.25 ? 'COMPLEX' : 'MODERATE',
    relatedTools: [tool.tool],
    resourceKeys: [tool.entryId],
    conflictGroup: `tool:${tool.entryId}`,
    priority: 6,
    migrationRisk,
    learningCurveEstimate,
  })];
}