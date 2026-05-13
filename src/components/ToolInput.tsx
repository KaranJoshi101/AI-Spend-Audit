/**
 * Tool Input Component
 *
 * Card-based UI for adding/editing a single tool.
 * Features:
 * - Plan dropdown (context-aware)
 * - Seat counter
 * - Spend input
 * - Remove button
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PRICING_DATA } from '@/lib/pricing';
import type { AITool, ToolUsageInput, PricingPlan } from '@/types';

interface ToolInputProps {
  tool: ToolUsageInput;
  onUpdate: (updates: Partial<ToolUsageInput>) => void;
  onRemove: () => void;
}

const TOOL_LABELS: Record<AITool, string> = {
  cursor: 'Cursor',
  'github-copilot': 'GitHub Copilot',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  'openai-api': 'OpenAI API',
  'anthropic-api': 'Anthropic API',
  gemini: 'Gemini',
  windsurf: 'Windsurf',
};

export const ToolInput: React.FC<ToolInputProps> = ({ tool, onUpdate, onRemove }) => {
  const pricing = PRICING_DATA[tool.tool];
  const currentTier = pricing?.tiers.find((t) => t.plan === tool.plan);

  const availablePlans: PricingPlan[] = pricing?.tiers.map((t) => t.plan) || [];
  const [monthlySpendInput, setMonthlySpendInput] = useState(tool.monthlySpend > 0 ? String(tool.monthlySpend) : '');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{TOOL_LABELS[tool.tool]}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
          aria-label="Remove tool"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Plan</label>
          <select
            value={tool.plan}
            onChange={(e) => onUpdate({ plan: e.target.value as PricingPlan })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {availablePlans.map((plan) => (
              <option key={plan} value={plan}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Seats</label>
          <div className="flex items-center overflow-hidden rounded-xl border border-slate-300">
            <button
              type="button"
              onClick={() => onUpdate({ seats: Math.max(1, tool.seats - 1) })}
              className="px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Decrease seats"
            >
              −
            </button>
            <input
              type="number"
              value={tool.seats}
              onChange={(e) => onUpdate({ seats: Math.max(1, parseInt(e.target.value) || 1) })}
              className="min-w-0 flex-1 border-0 py-2 text-center text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              min="1"
            />
            <button
              type="button"
              onClick={() => onUpdate({ seats: tool.seats + 1 })}
              className="px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Increase seats"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Monthly spend ($)</label>
        <input
          type="number"
          value={monthlySpendInput}
          onChange={(e) => {
            const nextValue = e.target.value;
            setMonthlySpendInput(nextValue);

            if (nextValue === '') {
              onUpdate({ monthlySpend: 0 });
              return;
            }

            const parsedValue = Number(nextValue);
            onUpdate({ monthlySpend: Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0 });
          }}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>

      {currentTier && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex flex-wrap justify-between gap-2">
            <span>{currentTier.seatsIncluded} seats included</span>
            <span>${currentTier.costPerExtraUser}/extra user</span>
          </div>
        </div>
      )}
    </article>
  );
};
