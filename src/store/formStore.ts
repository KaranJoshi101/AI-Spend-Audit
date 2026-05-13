/**
 * Form State Management with Zustand
 *
 * Central store for audit form state.
 * Handles:
 * - Tool list (add/remove)
 * - Form field state
 * - Local persistence
 * - Validation state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditInput, ToolUsageInput, UseCase } from '@/types';
import { getToolMonthlyCost } from '@/lib/pricing';

interface FormState {
  // Form data
  tools: ToolUsageInput[];
  teamSize: number;
  useCase: UseCase;

  // Derived
  totalMonthlySpend: number;

  // UI state
  isSubmitting: boolean;
  errors: Record<string, string>;

  // Actions
  addTool: (tool: ToolUsageInput) => void;
  removeTool: (toolId: string) => void;
  updateTool: (toolId: string, updates: Partial<ToolUsageInput>) => void;
  setTeamSize: (size: number) => void;
  setUseCase: (useCase: UseCase) => void;
  setErrors: (errors: Record<string, string>) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;

  // Getters
  getAuditInput: () => AuditInput;
  hasErrors: () => boolean;
}

const INITIAL_STATE: Partial<FormState> = {
  tools: [
    {
      tool: 'github-copilot',
      plan: 'pro',
      seats: 1,
      monthlySpend: 0,
    },
  ],
  teamSize: 5,
  useCase: 'coding',
  totalMonthlySpend: 0,
  isSubmitting: false,
  errors: {},
};

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      // Initial state
      tools: INITIAL_STATE.tools as ToolUsageInput[],
      teamSize: INITIAL_STATE.teamSize as number,
      useCase: INITIAL_STATE.useCase as UseCase,
      totalMonthlySpend: INITIAL_STATE.totalMonthlySpend as number,
      isSubmitting: INITIAL_STATE.isSubmitting as boolean,
      errors: INITIAL_STATE.errors as Record<string, string>,

      // Actions
      addTool: (tool) => {
        set((state) => {
          const newTools = [...state.tools, tool];
          const newSpend = newTools.reduce((sum, t) => sum + getToolMonthlyCost(t), 0);
          return {
            tools: newTools,
            totalMonthlySpend: newSpend,
          };
        });
      },

      removeTool: (toolId) => {
        set((state) => {
          const newTools = state.tools.filter((_t, idx) => idx.toString() !== toolId);
          const newSpend = newTools.reduce((sum, t) => sum + getToolMonthlyCost(t), 0);
          return {
            tools: newTools,
            totalMonthlySpend: newSpend,
          };
        });
      },

      updateTool: (toolId, updates) => {
        set((state) => {
          const newTools = state.tools.map((t, idx) =>
            idx.toString() === toolId ? { ...t, ...updates } : t
          );
          const newSpend = newTools.reduce((sum, t) => sum + getToolMonthlyCost(t), 0);
          return {
            tools: newTools,
            totalMonthlySpend: newSpend,
          };
        });
      },

      setTeamSize: (size) => {
        set({ teamSize: Math.max(1, size) });
      },

      setUseCase: (useCase) => {
        set({ useCase });
      },

      setErrors: (errors) => {
        set({ errors });
      },

      setIsSubmitting: (isSubmitting) => {
        set({ isSubmitting });
      },

      reset: () => {
        set(INITIAL_STATE);
      },

      // Getters
      getAuditInput: (): AuditInput => {
        const state = get();
        return {
          tools: state.tools,
          teamSize: state.teamSize,
          useCase: state.useCase,
          totalMonthlySpend: state.totalMonthlySpend,
        };
      },

      hasErrors: (): boolean => {
        const state = get();
        return Object.keys(state.errors).length > 0;
      },
    }),
    {
      name: 'audit-form-store',
      version: 1,
    }
  )
);