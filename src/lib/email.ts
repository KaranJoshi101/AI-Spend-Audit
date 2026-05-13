import type { AuditResult } from '@/types';
import { saveLeadToSupabase } from '@/lib/supabase';

const RESEND_KEY = (import.meta.env.VITE_RESEND_API_KEY as string) || '';

export async function sendLeadEmail({
  to,
  company,
  role,
  teamSize,
  report,
}: {
  to: string;
  company?: string;
  role?: string;
  teamSize?: number;
  report: AuditResult;
}): Promise<void> {
  const leadData = {
    email: to,
    companyName: company,
    role,
    teamSize,
    auditId: report.publicSlug,
    createdAt: new Date(),
  };

  // Try Supabase first if configured
  await saveLeadToSupabase(leadData);

  if (!RESEND_KEY) {
    // Fallback for local dev: store lead in localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.push({
      ...leadData,
      report,
      createdAt: leadData.createdAt.toISOString(), // Convert to string for JSON storage
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem('leads', JSON.stringify(leads));
    return;
  }

  // Send transactional email via Resend if API key configured
  const body = {
    from: 'no-reply@token-guard.example',
    to: [to],
    subject: `Your TokenGuard audit results — $${report.metrics.totalMonthlySpend}/mo`,
    html: renderLeadEmailTemplate({ to, company, role, report }),
  };

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Render a professional HTML email template for lead notification
 */
function renderLeadEmailTemplate({
  to,
  company,
  role,
  report,
}: {
  to: string;
  company?: string;
  role?: string;
  report: AuditResult;
}): string {
  const reportUrl = `${window.location.origin}/report/${report.publicSlug}`;
  const founderName = to.split('@')[0];

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TokenGuard Audit Results</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">TokenGuard</h1>
      </div>

      <!-- Content -->
      <p>Hi ${founderName},</p>

      <p>Thanks for auditing your AI tool spend${company ? ` at <strong>${company}</strong>` : ''}. We've analyzed your monthly spend of <strong>$${report.metrics.totalMonthlySpend}/mo</strong> and identified an estimated <strong>$${report.metrics.estimatedMonthlySavings}/month</strong> in potential savings (${report.metrics.savingsPercentage.toFixed(1)}%).</p>

      <p>Here are your key opportunities:</p>

      <ul style="margin: 16px 0; padding-left: 20px;">
        ${report.recommendations
          .slice(0, 3)
          .map(
            (rec) =>
              `<li style="margin-bottom: 8px;"><strong>${rec.title}</strong>: $${rec.estimatedMonthlySavings}/mo ($${rec.estimatedAnnualSavings}/yr)</li>`,
          )
          .join('')}
      </ul>

      <p style="margin-top: 24px;">
        <a href="${reportUrl}" style="display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
      </p>

      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        Need help implementing these changes? We can assist with tool evaluation, pricing negotiation, and switching strategies.
      </p>

      <!-- Footer -->
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 32px;">
      <p style="margin-top: 16px; font-size: 12px; color: #999;">
        TokenGuard • ${new Date().getFullYear()}<br>
        ${to}${role ? ` • ${role}` : ''}
      </p>
    </div>
  </body>
</html>
  `;
}
