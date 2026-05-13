import React from 'react';
import { motion } from 'framer-motion';
import type { Recommendation } from '@/types';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { DifficultyBadge } from '@/components/results/DifficultyBadge';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, rank }) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg sm:p-5 md:p-6"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
            {rank}
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight text-slate-900 sm:text-lg">{recommendation.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{recommendation.problem}</p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right ring-1 ring-emerald-100 sm:py-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-700">Estimated savings</p>
          <p className="text-xl font-semibold text-emerald-700">${recommendation.estimatedMonthlySavings.toFixed(0)}/mo</p>
          <p className="text-xs text-emerald-700/80">${recommendation.estimatedAnnualSavings.toFixed(0)}/yr</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <section className="rounded-xl bg-rose-50/60 p-4 ring-1 ring-rose-100">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Detected issue</p>
          <p className="mt-1 text-sm text-rose-900">{recommendation.problem}</p>
        </section>
        <section className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Current setup</p>
          <p className="mt-1 text-sm text-slate-800">{recommendation.currentSetup}</p>
        </section>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <section className="rounded-xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">Suggested action</p>
          <p className="mt-1 text-sm text-sky-900">{recommendation.suggestion}</p>
        </section>
        <section className="rounded-xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Annualized value</p>
          <p className="mt-1 text-sm font-medium text-emerald-900">
            ${recommendation.estimatedAnnualSavings.toFixed(0)} in potential yearly savings
          </p>
        </section>
      </div>

      <section className="mt-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Financial reasoning</p>
        <p className="mt-1 text-sm text-slate-700">{recommendation.reasoning}</p>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ConfidenceBadge confidence={recommendation.confidence} />
        <DifficultyBadge difficulty={recommendation.implementationDifficulty} />
      </div>
    </motion.article>
  );
};
