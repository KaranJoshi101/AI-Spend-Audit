import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AuditResult } from '@/types';
import { sendLeadEmail } from '@/lib/email';
import { generateAISummary } from '@/lib/ai';

interface Props {
  open: boolean;
  onClose: () => void;
  report: AuditResult;
}

export const LeadCaptureModal: React.FC<Props> = ({ open, onClose, report }) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Abuse protection: honeypot field
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check: if honeypot field has a value, this is a bot (ignore silently)
    if (honeypot.trim()) {
      // Pretend success to confuse bot; don't actually submit
      setSummary('Thank you for your submission!');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setSending(true);
    try {
      // best-effort: send lead email via Resend with full lead data
      await sendLeadEmail({
        to: email,
        company,
        role: role || undefined,
        teamSize: teamSize ? parseInt(teamSize, 10) : undefined,
        report,
      });

      // Try to generate an AI summary (best-effort)
      const s = await generateAISummary(report);
      setSummary(s);
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Failed to submit. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button className="absolute inset-0 bg-slate-950/55" onClick={onClose} aria-label="Close dialog" />
      <div className="relative w-full max-w-xl rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 md:p-7">
        <button className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:right-4 sm:top-4" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Founder support</p>
        <h3 className="mb-2 mt-2 text-lg font-semibold text-slate-900 sm:text-xl">Book AI Spend Optimization Consultation</h3>
        <p className="mb-4 text-sm leading-6 text-slate-600">Share your work email and we will send a focused action plan for your highest-impact recommendations.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Required email field */}
          <input
            className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            aria-label="Work email"
            autoComplete="email"
          />

          {/* Optional company field */}
          <input
            className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            aria-label="Company"
            autoComplete="organization"
          />

          {/* Optional role field */}
          <input
            className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Your role (e.g., CEO, CTO) (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Role"
            autoComplete="organization-title"
          />

          {/* Optional team size field */}
          <input
            className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Team size (optional)"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            type="number"
            min="1"
            max="10000"
            aria-label="Team size"
            inputMode="numeric"
          />

          {/* Honeypot field: hidden from real users, catches bots */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={sending}
              className="min-h-12 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Request Consultation'}
            </button>
            <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>

        {summary && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">AI Summary</h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};
