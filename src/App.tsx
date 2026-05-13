import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuditFormPage } from '@/pages/AuditFormPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { LandingPage } from '@/pages/LandingPage';
import { PublicReportPage } from '@/pages/PublicReportPage';
import { performAudit } from '@/engine/audit';
import { validateAuditForm } from '@/lib/validation';
import { useFormStore } from '@/store/formStore';
import type { AuditResult, AuditInput } from '@/types';
import './App.css';

type Page = 'landing' | 'form' | 'results' | 'report';

function App(): React.ReactElement {
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const getInitialPage = (): Page => {
    if (initialPath.startsWith('/report/')) return 'report';
    if (initialPath === '/' || initialPath === '') return 'landing';
    if (initialPath === '/app') return 'form';
    return 'landing';
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const { reset } = useFormStore();

  useEffect(() => {
    // If user navigates directly to a report URL, keep it handled by render
    const onPop = () => {
      const p = window.location.pathname;
      if (p.startsWith('/report/')) setCurrentPage('report');
      else if (p === '/' || p === '') setCurrentPage('landing');
      else if (p === '/app') setCurrentPage('form');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleAuditSubmit = async (auditInput: AuditInput): Promise<void> => {
    const validation = validateAuditForm(auditInput);
    if (!validation.success) {
      const message = Object.entries(validation.errors ?? {})
        .map(([field, error]) => `${field}: ${error}`)
        .join('; ');
      throw new Error(message || 'Invalid audit data');
    }

    // Simulate slight delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Run audit
    const result = performAudit(auditInput);
    // Persist a public copy keyed by slug so public report URLs work
    try {
      localStorage.setItem('public_audit_' + result.publicSlug, JSON.stringify(result));
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // ignore storage errors
    }
    setAuditResult(result);
    setCurrentPage('results');
    // update URL to /app for consistency
    window.history.pushState({}, '', '/app');
  };

  const handleNewAudit = (): void => {
    reset();
    setAuditResult(null);
    setCurrentPage('form');
  };

  const handleShare = (): void => {
    if (!auditResult) return;
    const url = `${window.location.origin}/report/${auditResult.publicSlug}`;
    try {
      navigator.clipboard.writeText(url);
      window.history.pushState({}, '', `/report/${auditResult.publicSlug}`);
      alert('Report URL copied to clipboard!');
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // fallback
      alert(url);
    }
  };

  // Lead capture is handled inside ResultsPage via modal and helpers

  return (
    <motion.div
      key={currentPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {currentPage === 'landing' ? (
        <LandingPage onStart={() => { window.history.pushState({}, '', '/app'); setCurrentPage('form'); }} />
      ) : currentPage === 'report' ? (
        <PublicReportPage />
      ) : currentPage === 'form' ? (
        <AuditFormPage onSubmit={handleAuditSubmit} />
      ) : auditResult ? (
        <div className="relative">
          <ResultsPage result={auditResult} onShare={handleShare} />
          <div className="fixed bottom-4 right-4 z-20 md:absolute md:bottom-auto md:right-6 md:top-6">
            <button
              onClick={handleNewAudit}
              className="rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              ← New Audit
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

export default App;
