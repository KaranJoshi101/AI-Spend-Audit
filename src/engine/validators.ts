import type { AuditInput, AITool, PricingPlan, ToolUsageInput, UseCase } from '@/types';
import { PRICING_DATA, getTier, getValidPlansForTool } from '@/lib/pricing';
import { normalizeFiniteNumber, normalizePlanName, normalizeToolName, normalizeToolUsageValue } from '@/engine/utils/normalization';
import { roundMoney, sumMoney } from '@/engine/utils/money';

export interface EngineValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export interface NormalizedToolUsage extends ToolUsageInput {
  entryId: string;
}

export interface NormalizedAuditInput extends Omit<AuditInput, 'tools'> {
  tools: NormalizedToolUsage[];
}

const USE_CASES: UseCase[] = ['coding', 'writing', 'research', 'analytics', 'mixed'];

function isPricingStructureValid(): boolean {
  return Object.values(PRICING_DATA).every((pricing) => {
    if (!pricing || typeof pricing.tool !== 'string' || !Array.isArray(pricing.tiers) || pricing.tiers.length === 0) {
      return false;
    }

    return pricing.tiers.every((tier) => {
      return (
        typeof tier.plan === 'string' &&
        Number.isFinite(tier.monthlyPrice) &&
        Number.isFinite(tier.seatsIncluded) &&
        Number.isFinite(tier.costPerExtraUser)
      );
    });
  });
}

function validateToolUsageValue(raw: unknown, index: number): EngineValidationResult<NormalizedToolUsage> {
  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: { [`tools.${index}`]: 'Tool entry must be an object' } };
  }

  const source = raw as Record<string, unknown>;
  const toolName = normalizeToolName(source.tool);
  const planName = normalizePlanName(source.plan);
  const seatsValue = normalizeFiniteNumber(source.seats);
  const monthlySpendValue = normalizeFiniteNumber(source.monthlySpend);
  const apiCreditsSpendValue = source.apiCreditsSpend;
  const apiSpendNumber = apiCreditsSpendValue === undefined || apiCreditsSpendValue === null
    ? 0
    : normalizeFiniteNumber(apiCreditsSpendValue);

  const errors: Record<string, string> = {};

  if (!toolName) {
    errors[`tools.${index}.tool`] = 'Unknown tool';
  }

  if (!planName) {
    errors[`tools.${index}.plan`] = 'Unknown plan';
  } else if (toolName) {
    const validPlans = getValidPlansForTool(toolName);
    if (!validPlans.includes(planName)) {
      errors[`tools.${index}.plan`] = `Plan ${planName} is not valid for ${toolName}`;
    }
  }

  if (seatsValue === null || !Number.isInteger(seatsValue) || seatsValue < 1) {
    errors[`tools.${index}.seats`] = 'Seats must be at least 1';
  }

  if (monthlySpendValue === null || monthlySpendValue < 0) {
    errors[`tools.${index}.monthlySpend`] = 'Spend must be positive';
  }

  if (apiCreditsSpendValue !== undefined && apiCreditsSpendValue !== null && (apiSpendNumber === null || apiSpendNumber < 0)) {
    errors[`tools.${index}.apiCreditsSpend`] = 'API spend must be at least 0';
  }

  if (toolName && planName && !getTier(toolName, planName)) {
    errors[`tools.${index}.pricing`] = 'Pricing data is missing for the selected tool and plan';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const normalizedTool = normalizeToolUsageValue({
    tool: toolName as AITool,
    plan: planName as PricingPlan,
    seats: seatsValue as number,
    monthlySpend: roundMoney(monthlySpendValue as number),
    apiCreditsSpend: apiSpendNumber ? roundMoney(apiSpendNumber) : undefined,
  });

  return {
    success: true,
    data: {
      ...normalizedTool,
      entryId: `tool-${index}`,
    },
  };
}

export function validateAuditInput(data: unknown): EngineValidationResult<NormalizedAuditInput> {
  if (!isPricingStructureValid()) {
    return {
      success: false,
      errors: { pricing: 'Pricing catalog is malformed' },
    };
  }

  if (!data || typeof data !== 'object') {
    return { success: false, errors: { form: 'Audit input must be an object' } };
  }

  const raw = data as Record<string, unknown>;
  const toolsValue = raw.tools;
  const teamSizeValue = normalizeFiniteNumber(raw.teamSize);
  const useCaseValue = raw.useCase;
  const totalMonthlySpendValue = raw.totalMonthlySpend;

  const errors: Record<string, string> = {};

  if (!Array.isArray(toolsValue)) {
    errors.tools = 'Tools must be an array';
  } else if (toolsValue.length === 0) {
    errors.tools = 'Add at least one tool';
  } else if (toolsValue.length > 20) {
    errors.tools = 'Too many tools (max 20)';
  }

  if (teamSizeValue === null || !Number.isInteger(teamSizeValue) || teamSizeValue < 1) {
    errors.teamSize = 'Team size must be at least 1';
  }

  if (!USE_CASES.includes(useCaseValue as UseCase)) {
    errors.useCase = 'Invalid use case';
  }

  if (totalMonthlySpendValue !== undefined && totalMonthlySpendValue !== null) {
    const spendNumber = normalizeFiniteNumber(totalMonthlySpendValue);
    if (spendNumber === null || spendNumber < 0) {
      errors.totalMonthlySpend = 'Total monthly spend must be at least 0';
    }
  }

  const normalizedTools: NormalizedToolUsage[] = [];
  if (Array.isArray(toolsValue)) {
    for (const [index, tool] of (toolsValue as unknown[]).entries()) {
      const result = validateToolUsageValue(tool, index);
      if (!result.success || !result.data) {
        Object.assign(errors, result.errors ?? { [`tools.${index}`]: 'Invalid tool entry' });
        continue;
      }

      normalizedTools.push(result.data);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const computedMonthlySpend = sumMoney(
    normalizedTools.map((tool) => tool.monthlySpend + (tool.apiCreditsSpend ?? 0))
  );

  return {
    success: true,
    data: {
      tools: normalizedTools,
      teamSize: teamSizeValue as number,
      useCase: useCaseValue as UseCase,
      totalMonthlySpend: computedMonthlySpend,
    },
  };
}

export function validateToolUsageInput(data: unknown): EngineValidationResult<NormalizedToolUsage> {
  return validateToolUsageValue(data, 0);
}