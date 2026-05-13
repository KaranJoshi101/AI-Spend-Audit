import type { AITool, PricingPlan, ToolUsageInput } from '@/types';

const TOOL_ALIASES: Record<string, AITool> = {
  cursor: 'cursor',
  'github-copilot': 'github-copilot',
  copilot: 'github-copilot',
  claude: 'claude',
  chatgpt: 'chatgpt',
  'openai-api': 'openai-api',
  'openai api': 'openai-api',
  'anthropic-api': 'anthropic-api',
  'anthropic api': 'anthropic-api',
  gemini: 'gemini',
  windsurf: 'windsurf',
};

const PLAN_ALIASES: Record<string, PricingPlan> = {
  free: 'free',
  hobby: 'hobby',
  individual: 'individual',
  pro: 'pro',
  plus: 'plus',
  team: 'team',
  business: 'business',
  max: 'max',
  enterprise: 'enterprise',
  ultra: 'ultra',
  credits: 'credits',
};

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function normalizeToolName(value: unknown): AITool | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeKey(value);
  return TOOL_ALIASES[normalized] ?? null;
}

export function normalizePlanName(value: unknown): PricingPlan | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeKey(value);
  return PLAN_ALIASES[normalized] ?? null;
}

export function normalizeFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function normalizeToolUsageValue(tool: ToolUsageInput): ToolUsageInput {
  return {
    ...tool,
    seats: Math.max(1, Math.floor(tool.seats)),
    monthlySpend: Math.max(0, tool.monthlySpend),
    apiCreditsSpend: tool.apiCreditsSpend !== undefined ? Math.max(0, tool.apiCreditsSpend) : undefined,
  };
}