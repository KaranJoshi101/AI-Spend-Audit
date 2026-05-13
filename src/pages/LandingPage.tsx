import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, CircleDollarSign, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const startupLogos = ['Northbay', 'Launchrail', 'Mergekit', 'Scaleforge', 'Packetflow', 'Orbital'];

  const supportedTools = [
    'Cursor',
    'GitHub Copilot',
    'Claude',
    'ChatGPT',
    'OpenAI API',
    'Anthropic API',
    'Gemini',
    'Windsurf',
  ];

  const faqs = [
    {
      q: 'How accurate are the savings estimates?',
      a: 'Recommendations come from deterministic pricing rules and explicit assumptions, so every number is inspectable and auditable.',
    },
    {
      q: 'Do you store sensitive spend data?',
      a: 'Core audit processing runs locally in the browser. Public sharing only happens when you explicitly choose it.',
    },
    {
      q: 'Who is this built for?',
      a: 'Founders, engineering leaders, and finance operators who need a quick, credible AI spend review before budget planning.',
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(251,113,133,0.16),transparent_38%),radial-gradient(circle_at_70%_75%,rgba(125,211,252,0.1),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-5 md:px-8 md:pb-24 md:pt-16">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-sm sm:p-6 md:p-10"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">
            <Sparkles size={14} aria-hidden="true" />
            Founder-grade AI spend intelligence
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-6xl">
            Most startups overpay for AI tooling before they notice.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base md:text-lg">
            Audit your AI stack before your next billing cycle. TokenGuard surfaces hidden spend in minutes and turns it into a clear savings plan your team can execute.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onStart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Find Hidden AI Spend
              <ArrowRight size={16} />
            </button>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              href="#how-it-works"
            >
              Audit Flow Preview
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-300">AI spend analyzed</p>
              <p className="mt-1 text-2xl font-semibold">$2.3M+</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-300">Average waste uncovered</p>
              <p className="mt-1 text-2xl font-semibold">18.4%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-300">Average audit completion</p>
              <p className="mt-1 text-2xl font-semibold">4m 12s</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Used by fast-moving product teams</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-200 sm:grid-cols-3 md:grid-cols-6">
              {startupLogos.map((logo) => (
                <span key={logo} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center font-medium">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">The problem</h2>
            <p className="mt-2 text-sm text-slate-300">Tool sprawl grows faster than procurement discipline. Costs look small alone and large in aggregate.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">What TokenGuard does</h2>
            <p className="mt-2 text-sm text-slate-300">Detects overprovisioned seats, plan mismatches, and viable alternatives using deterministic logic.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Why this matters</h2>
            <p className="mt-2 text-sm text-slate-300">You reduce waste quickly and align founders, engineering, and finance on one report.</p>
          </article>
        </section>

        <section id="how-it-works" className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">
          <h2 className="text-xl font-semibold sm:text-2xl">How it works</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Step 1</p>
              <p className="mt-2 font-semibold">Input your stack</p>
              <p className="mt-1 text-sm text-slate-300">Add tools, plans, seats, and monthly spend by product.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Step 2</p>
              <p className="mt-2 font-semibold">Run deterministic audit</p>
              <p className="mt-1 text-sm text-slate-300">Get transparent recommendations ranked by financial impact.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">Step 3</p>
              <p className="mt-2 font-semibold">Share and execute</p>
              <p className="mt-1 text-sm text-slate-300">Share your public report link and execute high-confidence actions.</p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold sm:text-2xl">Supported tools</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {supportedTools.map((tool) => (
              <div key={tool} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                {tool}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
              <TrendingDown size={14} />
              Example savings snapshot
            </p>
            <p className="mt-3 text-3xl font-semibold sm:text-4xl">$1,920/month</p>
            <p className="mt-2 text-sm text-emerald-100">A 42-person team removed unused seats and downgraded two enterprise plans. Net impact: $23,040/year.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-emerald-100">Recommendations</p>
                <p className="mt-1 font-semibold">6 actions</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-emerald-100">Payback window</p>
                <p className="mt-1 font-semibold">Under 30 days</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h2 className="text-lg font-semibold sm:text-xl">Trusted by operators who care about margins</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />Deterministic recommendations with explicit reasoning</li>
              <li className="flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 text-sky-300" />Privacy-first flow with optional sharing</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />Executive-friendly reports designed for budget review</li>
            </ul>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Operational signal</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200">
                <CircleDollarSign size={16} className="text-emerald-300" />
                72% of teams rerun their audit within 45 days as hiring changes tool usage.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">
          <h2 className="text-xl font-semibold sm:text-2xl">FAQ</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((faq) => (
              <article key={faq.q} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-1 text-sm text-slate-300">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center sm:p-6 md:p-8">
          <h2 className="text-xl font-semibold sm:text-2xl">See where your AI budget is leaking</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Run a founder-focused audit, quantify monthly waste, and share a credible savings plan in one link.
          </p>
          <button
            onClick={onStart}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Start Your Audit
            <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </main>
  );
};
