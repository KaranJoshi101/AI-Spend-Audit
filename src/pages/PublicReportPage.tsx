import React, { useEffect, useState } from 'react';
import type { AuditResult } from '@/types';
import { ResultsPage } from './ResultsPage';
import { fetchPublicReportFromSupabase } from '@/lib/supabase';

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export const PublicReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    const load = async () => {
      const path = window.location.pathname;
      const slug = path.replace('/report/', '');

      // First try Supabase (if configured)
      try {
        const fromSupabase = await fetchPublicReportFromSupabase(slug);
        if (fromSupabase) {
          setResult(fromSupabase);
          const title = `AI Spend Audit • $${fromSupabase.metrics.totalMonthlySpend}/mo`;
          const desc = `Estimated savings: $${fromSupabase.metrics.estimatedMonthlySavings}/mo — ${fromSupabase.recommendations.length} recommendations.`;
          document.title = title;
          setMeta('og:title', title);
          setMeta('og:description', desc);
          setMeta('og:type', 'article');
          setMeta('og:url', window.location.href);
          setMeta('og:site_name', 'TokenGuard');
          setLoading(false);
          return;
        }
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // ignore
      }

      // Fallback to localStorage
      const raw = localStorage.getItem('public_audit_' + slug);
      if (raw) {
        try {
          const parsed: AuditResult = JSON.parse(raw);
          setResult(parsed);
          const title = `AI Spend Audit • $${parsed.metrics.totalMonthlySpend}/mo`;
          const desc = `Estimated savings: $${parsed.metrics.estimatedMonthlySavings}/mo — ${parsed.recommendations.length} recommendations.`;
          document.title = title;
          setMeta('og:title', title);
          setMeta('og:description', desc);
          setMeta('og:type', 'article');
          setMeta('og:url', window.location.href);
          setMeta('og:site_name', 'TokenGuard');
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
          // ignore parse error
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-8">Loading report…</div>;
  if (!result)
    return (
      <div className="p-8">
        <h2>Report not found</h2>
        <p>This report may have expired or been removed.</p>
      </div>
    );

  return <ResultsPage result={result} />;
};
