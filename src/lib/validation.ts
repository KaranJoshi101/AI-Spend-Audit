import type { AuditInput, ToolUsageInput } from '@/types';
import { validateAuditInput, validateToolUsageInput } from '@/engine/validators';

export type AuditFormInput = AuditInput;
export type ToolUsageFormInput = ToolUsageInput;

export function validateAuditForm(data: unknown): {
  success: boolean;
  data?: AuditFormInput;
  errors?: Record<string, string>;
} {
  const result = validateAuditInput(data);
  if (result.success && result.data) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.errors ?? { form: 'Validation failed' },
  };
}

export function validateToolUsage(data: unknown): {
  success: boolean;
  data?: ToolUsageFormInput;
  error?: string;
} {
  const result = validateToolUsageInput(data);
  if (result.success && result.data) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.errors ? Object.values(result.errors)[0] ?? 'Invalid tool usage' : 'Validation failed' };
}
