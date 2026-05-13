import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Share2 } from 'lucide-react';

interface CTASectionProps {
  highSavings: boolean;
  lowSpend: boolean;
  onOpenLead: () => void;
  onShare?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  highSavings,
  lowSpend,
  onOpenLead,
  onShare,
}) => {
  return (
    <section className="space-y-3">
      {highSavings && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onOpenLead}
          className="group w-full rounded-2xl bg-slate-900 px-6 py-4 text-left text-white shadow-lg transition hover:bg-slate-800"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
            Founder support
          </span>
          <span className="mt-1 inline-flex items-center gap-2 text-base font-semibold md:text-lg">
            Book AI Spend Optimization Consultation
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 block text-sm text-slate-300">
            Get a tactical 30-minute breakdown tailored to your stack and team size.
          </span>
        </motion.button>
      )}

      {lowSpend && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Maintain momentum</h3>
          <p className="mt-1 text-sm text-slate-600">
            Your setup is already in strong shape. Share this report and set a recurring quarterly audit.
          </p>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onShare}
        className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:shadow"
      >
        <span className="inline-flex items-center gap-2">
          <Share2 size={17} />
          Share Audit Report
        </span>
      </motion.button>
    </section>
  );
};
