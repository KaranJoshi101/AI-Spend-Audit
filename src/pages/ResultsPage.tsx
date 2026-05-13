import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { AuditResult } from '@/types';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { SavingsHero } from '@/components/results/SavingsHero';
import { RecommendationCard } from '@/components/results/RecommendationCard';
import { CTASection } from '@/components/results/CTASection';

interface ResultsPageProps {
  result: AuditResult;
  onShare?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onShare,
}) => {
  const [leadOpen, setLeadOpen] = useState(false);
  const { metrics, recommendations, isHighSavings, isLowSpend, input } = result;
  const hasRecommendations = recommendations.length > 0;

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 },
    },
  };

  const pageTitle = useMemo(() => {
    if (isLowSpend) return 'Audit Complete: Strong Efficiency Baseline';
    if (isHighSavings) return 'Audit Complete: High-Impact Savings Identified';
    return 'Audit Complete: Optimization Opportunities Identified';
  }, [isHighSavings, isLowSpend]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4 py-8 text-left md:py-12">
      <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.p variants={cardVariants} className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            TokenGuard financial audit report
          </motion.p>
          <motion.h1 variants={cardVariants} className="text-2xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            {pageTitle}
          </motion.h1>
          <motion.p variants={cardVariants} className="max-w-3xl text-sm text-slate-600 md:text-base">
            Deterministic recommendations based on your team profile and current tool spend. Designed to support fast, defensible budget decisions.
          </motion.p>

          <motion.div variants={cardVariants}>
            <SavingsHero result={result} />
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Current monthly spend</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">${metrics.totalMonthlySpend.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Team size</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{input.teamSize} people</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Tools audited</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{input.tools.length} tools</p>
            </div>
          </motion.div>
        </motion.div>

        {hasRecommendations && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.h2 variants={cardVariants} className="text-xl font-semibold text-slate-900 md:text-2xl">
              Recommendations ({recommendations.length})
            </motion.h2>

            <div className="space-y-3 md:space-y-4">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  variants={cardVariants}
                >
                  <RecommendationCard recommendation={rec} rank={idx + 1} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!hasRecommendations && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
          >
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">No major optimization actions required</h3>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Your AI spend profile looks healthy right now. Keep this report as a baseline for future hiring and tool expansion.
            </p>
          </motion.div>
        )}

        <CTASection
          highSavings={isHighSavings}
          lowSpend={isLowSpend}
          onOpenLead={() => setLeadOpen(true)}
          onShare={onShare}
        />

        <LeadCaptureModal open={leadOpen} onClose={() => setLeadOpen(false)} report={result} />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="pt-2 text-center text-xs text-slate-500 md:text-sm"
        >
          Savings estimates are based on published pricing assumptions. Actual results can vary based on contracted rates and procurement terms.
        </motion.p>
      </div>
    </main>
  );
};
