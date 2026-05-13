/* Minimal Supabase REST helper (no external dependency)
   Uses SUPABASE_URL and SUPABASE_ANON_KEY env vars when available.
   Tables: 
   - public_reports: slug (text, primary), payload (jsonb), created_at (timestamp)
   - leads: id (uuid, primary), email (text), company_name (text), role (text), team_size (int), audit_id (text), created_at (timestamp)
*/
import type { AuditResult, LeadData } from '@/types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

function hasConfig() {
  return SUPABASE_URL && SUPABASE_KEY;
}

export async function savePublicReportToSupabase(result: AuditResult): Promise<void> {
  if (!hasConfig()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/public_reports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ slug: result.publicSlug, payload: result }),
    });
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // ignore network errors
    // console.warn('Supabase save failed', _e);
  }
}

export async function fetchPublicReportFromSupabase(slug: string): Promise<AuditResult | null> {
  if (!hasConfig()) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_reports?slug=eq.${encodeURIComponent(slug)}&select=payload`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].payload as AuditResult;
    }
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // ignore
  }
  return null;
}

/**
 * Save a lead to Supabase leads table
 * Best-effort: ignores network errors and silently falls back if unconfigured
 * @param lead LeadData object with email, company_name, role, team_size, audit_id
 */
export async function saveLeadToSupabase(lead: LeadData): Promise<void> {
  if (!hasConfig()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        email: lead.email,
        company_name: lead.companyName,
        role: lead.role,
        team_size: lead.teamSize,
        audit_id: lead.auditId,
        created_at: lead.createdAt.toISOString(), // Convert Date to ISO string for DB
      }),
    });
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // ignore network errors
    // console.warn('Supabase lead save failed', _e);
  }
}

/**
 * Check if an email has submitted a lead within the last N minutes (rate-limiting)
 * Used to prevent spam and duplicate lead submissions
 * @param email Email to check
 * @param minutesWindow Time window in minutes (default 30)
 * @returns true if email has recent lead, false otherwise
 */
export async function hasRecentLeadSubmission(email: string, minutesWindow: number = 30): Promise<boolean> {
  if (!hasConfig()) return false;
  try {
    const cutoffTime = new Date(Date.now() - minutesWindow * 60 * 1000).toISOString();
    const url = `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(cutoffTime)}&select=id`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return Array.isArray(data) && data.length > 0;
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // ignore errors; allow submission if we can't reach DB
    return false;
  }
}
