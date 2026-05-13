/**
 * Audit Form Page
 *
 * Main form for entering AI tool spending.
 * Features:
 * - Dynamic tool list (add/remove)
 * - Team size input
 * - Use case selector
 * - Spend summary
 * - Submit button with validation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertCircle, ArrowRight } from 'lucide-react';
import { useFormStore } from '@/store/formStore';
import { ToolInput } from '@/components/ToolInput';
import type { ToolUsageInput, UseCase, AuditInput, AITool } from '@/types';

interface AuditFormPageProps {
  onSubmit: (data: AuditInput) => Promise<void>;
}

const USE_CASES: { value: UseCase; label: string; description: string }[] = [
  { value: 'coding', label: 'Coding', description: 'Development & code generation' },
  { value: 'writing', label: 'Writing', description: 'Content & documentation' },
  { value: 'research', label: 'Research', description: 'Analysis & learning' },
  { value: 'analytics', label: 'Analytics', description: 'Data & insights' },
  { value: 'mixed', label: 'Mixed', description: 'Multiple use cases' },
];

export const AuditFormPage: React.FC<AuditFormPageProps> = ({ onSubmit }) => {
  const {
    tools,
    teamSize,
    useCase,
    totalMonthlySpend,
    isSubmitting,
    addTool,
    removeTool,
    updateTool,
    setTeamSize,
    setUseCase,
    setErrors,
    setIsSubmitting,
    getAuditInput,
  } = useFormStore();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedToolToAdd, setSelectedToolToAdd] = useState<AITool>('cursor');

  const AVAILABLE_TOOLS: { id: AITool; name: string }[] = [
    { id: 'cursor', name: 'Cursor' },
    { id: 'github-copilot', name: 'GitHub Copilot' },
    { id: 'claude', name: 'Claude' },
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'openai-api', name: 'OpenAI API' },
    { id: 'anthropic-api', name: 'Anthropic API' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'windsurf', name: 'Windsurf' },
  ];

  const handleAddTool = (): void => {
    const newTool: ToolUsageInput = {
      tool: selectedToolToAdd,
      plan: 'free',
      seats: 1,
      monthlySpend: 0,
    };
    addTool(newTool);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    // Get audit input from store (already has totalMonthlySpend calculated)
    const auditInput = getAuditInput();

    // Basic validation
    if (!auditInput.tools || auditInput.tools.length === 0) {
      setSubmitError('Add at least one tool');
      return;
    }

    if (auditInput.teamSize < 1) {
      setSubmitError('Team size must be at least 1');
      return;
    }

    // Submit
    try {
      setIsSubmitting(true);
      await onSubmit(auditInput);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run audit';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm md:mb-10 md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">TokenGuard</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">Run Your AI Spend Audit</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
            Add your tools, current plans, and team details. We will generate a deterministic savings report with clear financial impact.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-5 md:space-y-6"
        >
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
            >
              <AlertCircle className="flex-shrink-0 text-rose-600" size={20} />
              <div>
                <p className="font-semibold text-rose-900">Error</p>
                <p className="text-sm text-rose-700">{submitError}</p>
              </div>
            </motion.div>
          )}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 md:text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                1
              </span>
              AI Tools in Your Stack
            </h2>

            <div className="space-y-3">
              {tools.map((tool, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ToolInput
                    tool={tool}
                    onUpdate={(updates: Partial<ToolUsageInput>) => updateTool(idx.toString(), updates)}
                    onRemove={() => removeTool(idx.toString())}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <select
                value={selectedToolToAdd}
                onChange={(e) => setSelectedToolToAdd(e.target.value as AITool)}
                className="min-h-12 rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {AVAILABLE_TOOLS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTool}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-500 hover:bg-slate-50"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 md:text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                2
              </span>
              Team Details
            </h2>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Team size</label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setTeamSize(Math.max(1, teamSize - 1))}
                  className="min-h-12 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="min-w-0 flex-1 border-0 py-3 text-center text-base font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 sm:text-lg"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => setTeamSize(teamSize + 1)}
                  className="min-h-12 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">{teamSize} people in your team</p>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Primary use case</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {USE_CASES.map((uc) => (
                  <button
                    key={uc.value}
                    type="button"
                    onClick={() => setUseCase(uc.value)}
                    className={`min-h-12 rounded-xl border p-3 text-left transition-all ${
                      useCase === uc.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                    }`}
                    aria-pressed={useCase === uc.value}
                  >
                    <div className="font-medium text-sm">{uc.label}</div>
                    <div className={`text-xs ${useCase === uc.value ? 'text-slate-300' : 'text-slate-600'}`}>{uc.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 text-white shadow-lg sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Current total spend</p>
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">${totalMonthlySpend.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-300">${(totalMonthlySpend * 12).toFixed(2)}/year</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Tools tracked</p>
                <p className="text-3xl font-semibold">{tools.length}</p>
              </div>
            </div>
          </section>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full min-h-12 rounded-2xl bg-slate-900 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              {isSubmitting ? 'Running Audit...' : 'Get My Audit Results'}
              {!isSubmitting && <ArrowRight size={18} />}
            </span>
          </motion.button>

          <p className="text-center text-xs text-slate-500 md:text-sm">
            Your data is processed locally. We never store it without your permission.
          </p>
        </motion.form>
      </div>
    </main>
  );
};
