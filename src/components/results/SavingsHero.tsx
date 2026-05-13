import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { AuditResult } from '@/types';
import { AnimatedCounter } from '@/components/results/AnimatedCounter';

interface SavingsHeroProps {
  result: AuditResult;
}

export const SavingsHero: React.FC<SavingsHeroProps> = ({ result }) => {
  const { metrics, isLowSpend } = result;
  const currentAnnualSpend = Math.round(metrics.totalAnnualSpend);

  if (isLowSpend) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Healthy baseline
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
              Your stack is already relatively optimized.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              We did not detect major waste. Keep sharing reports with your leadership team and rerun this audit as your team scales.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl md:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(244,114,182,0.18),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.16),transparent_45%)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Estimated annual savings</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <AnimatedCounter
            value={Math.round(metrics.estimatedAnnualSavings)}
            duration={1.25}
            prefix="$"
            suffix="/year"
            className="text-5xl font-semibold tracking-tight md:text-7xl"
          />
          <span className="pb-2 text-sm text-slate-300 md:text-base">
            from <AnimatedCounter value={Math.round(metrics.estimatedMonthlySavings)} duration={1.25} prefix="$" suffix="/month" />
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Prioritize the highest-confidence actions first to realize savings before your next billing cycle.
        </p>

        <p className="mt-3 text-sm text-slate-200">
          Current annual spend: <span className="font-semibold text-white">${currentAnnualSpend.toLocaleString()}/year</span>
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Current monthly spend</p>
            <p className="mt-1 text-xl font-semibold">
              <AnimatedCounter value={metrics.totalMonthlySpend} prefix="$" decimals={2} duration={1.2} />
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Savings rate</p>
            <p className="mt-1 text-xl font-semibold">
              <AnimatedCounter value={metrics.savingsPercentage} suffix="%" decimals={1} duration={1.2} />
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Opportunities found</p>
            <p className="mt-1 text-xl font-semibold">{metrics.savingsOpportunitiesCount}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
