/**
 * Form Validation Schemas
 *
 * Zod schemas for audit form validation.
 * Used by React Hook Form for real-time validation.
 */

import { z } from 'zod';

// Tool usage input schema
export const ToolUsageSchema = z.object({
  tool: z.enum([
    'cursor',
    'github-copilot',
    'claude',
    'chatgpt',
    'openai-api',
    'anthropic-api',
    'gemini',
    'windsurf',
  ]),
  plan: z.enum([
    'free',
    'hobby',
    'individual',
    'pro',
    'plus',
    'team',
    'business',
    'max',
    'enterprise',
    'ultra',
    'credits',
  ]),
  seats: z.number().int().min(1, 'At least 1 seat required').max(10000, 'Unrealistic seat count'),
  monthlySpend: z
    .number()
    .min(0, 'Spend must be positive')
    .max(1000000, 'Spend seems unrealistic'),
  apiCreditsSpend: z.number().optional(),
});

// Main audit form schema
export const AuditFormSchema = z.object({
  tools: z
    .array(ToolUsageSchema)
    .min(1, 'Add at least one tool')
    .max(20, 'Too many tools (max 20)'),
  teamSize: z
    .number()
    .int()
    .min(1, 'Team size must be at least 1')
    .max(10000, 'Unrealistic team size'),
  useCase: z.enum(['coding', 'writing', 'research', 'analytics', 'mixed']),
  totalMonthlySpend: z.number().min(0).optional(),
});

export type AuditFormInput = z.infer<typeof AuditFormSchema>;
export type ToolUsageFormInput = z.infer<typeof ToolUsageSchema>;

// Validation helpers
export function validateAuditForm(data: unknown): {
  success: boolean;
  data?: AuditFormInput;
  errors?: Record<string, string>;
} {
  try {
    const validated = AuditFormSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { form: 'Validation failed' },
    };
  }
}

export function validateToolUsage(data: unknown): {
  success: boolean;
  data?: ToolUsageFormInput;
  error?: string;
} {
  try {
    const validated = ToolUsageSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid tool usage' };
    }
    return { success: false, error: 'Validation failed' };
  }
}
