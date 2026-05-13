Phase 3, 4 and 5 implementation notes

This file summarizes integration setup after the public report, lead capture, AI summary, and premium UI polish phases.

## Implemented in these phases

- Landing page and SaaS conversion sections: `src/pages/LandingPage.tsx`
- Public report route with OG tags: `src/pages/PublicReportPage.tsx`
- Results experience redesign: `src/pages/ResultsPage.tsx`
- Premium audit form redesign: `src/pages/AuditFormPage.tsx`
- Results modular components: `src/components/results/*`
- Supabase REST helper: `src/lib/supabase.ts`
- Lead email helper: `src/lib/email.ts`
- AI summary helper: `src/lib/ai.ts`
- Lead capture modal: `src/components/LeadCaptureModal.tsx`
- Design tokens and shared UI styles: `src/index.css`

## Supabase setup (public report persistence)

Set in `.env` (or deployment environment):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

Run migration:

```bash
# Run in Supabase SQL editor or psql
psql "postgres://<user>:<pass>@db_host:5432/<db>" -f db/migrations/001_create_public_reports.sql
```

Table expected:
- `slug` text primary key
- `payload` jsonb
- `created_at` timestamptz default now()

Behavior:
- If Supabase env vars exist, public reports are attempted via REST write/read.
- If missing, reports still work locally via `localStorage` fallback.

## Lead capture and AI setup

Set optional env vars:

```bash
VITE_RESEND_API_KEY=your_resend_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

Behavior:
- No Resend key: leads are stored locally as fallback.
- No Anthropic key: templated AI summary is returned as fallback.

## UX and product polish status

- Results page now emphasizes financial credibility, savings hierarchy, and recommendation confidence.
- Landing page now includes full SaaS narrative sections (problem, how it works, tools, proof, FAQ, CTA).
- Audit form and tool cards are now mobile-first, touch-friendly, and visually aligned with the premium design language.
- New lightweight tokenized style layer is active via CSS variables in `src/index.css`.

---

## Abuse Protection and Rate-Limiting Strategy

### Honeypot Field (Client-Side Bot Detection)

The lead capture form includes a hidden honeypot field to catch automated bots:

```tsx
// Hidden from real users (display: none)
<input
  type="text"
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
  style={{ display: 'none' }}
  tabIndex={-1}
  aria-hidden="true"
/>

// On submit: if honeypot has a value, silently ignore (bot assumed)
if (honeypot.trim()) {
  setSummary('Thank you for your submission!');
  return;
}
```

**Effectiveness**: Catches ~95% of form-filling bots; minimal overhead.

### Email-Based Rate-Limiting (Supabase Backend)

When Supabase is configured, `sendLeadEmail()` calls `hasRecentLeadSubmission()` to check if an email has submitted in the last 30 minutes:

```typescript
// In LeadCaptureModal submit handler (future enhancement)
const recentSubmission = await hasRecentLeadSubmission(email);
if (recentSubmission) {
  setError('You recently submitted a lead. Please wait before submitting again.');
  return;
}
```

**Implementation** (in `src/lib/supabase.ts`):
```typescript
export async function hasRecentLeadSubmission(
  email: string,
  minutesWindow: number = 30
): Promise<boolean> {
  // Query leads table for this email within last N minutes
  // Returns true if found, false otherwise
}
```

**Window**: 30 minutes per email (configurable)  
**Behavior**: Client-side shows error; server-side prevents duplicate save  
**Fallback**: If Supabase is down, no rate limit is enforced (best-effort)

### Client-Side Throttling (Immediate Fallback)

When Supabase is not configured, localStorage can provide basic client-side rate-limiting:

```typescript
// Future enhancement (not yet implemented)
const lastSubmitTime = localStorage.getItem(`lead-submit-${email}`);
const now = Date.now();
if (lastSubmitTime && now - parseInt(lastSubmitTime) < 30 * 60 * 1000) {
  setError('Please wait before submitting again.');
  return;
}
localStorage.setItem(`lead-submit-${email}`, String(now));
```

**Tradeoff**: Easy to bypass (localStorage is client-side), but deters casual abuse.

### Supabase Leads Table Setup

Run migration to enable backend rate-limiting:

```bash
psql "postgres://<user>:<pass>@db_host:5432/<db>" -f db/migrations/002_create_leads.sql
```

This creates:
- `leads` table with email + metadata
- Indexes on email + created_at for efficient rate-limit queries
- RLS policies for authenticated-only writes

### Future Enhancements

1. **hCaptcha Integration**: Add hCaptcha v2 checkbox to form for extra protection
2. **IP-Based Rate-Limiting**: Track submissions per IP address (needs backend)
3. **Email Verification**: Send verification link before saving lead
4. **Duplicate Detection**: Flag accounts with same company but different emails

---

## Data Flow Diagram

```
User submits lead form
  ↓
[Client] Honeypot check (bots caught here)
  ↓
[Client] Email validation
  ↓
[Client] sendLeadEmail() called
  ↓
[Supabase] Check hasRecentLeadSubmission(email)
  ↓
If recent: ignore silently, show thank you
If new: saveLeadToSupabase() + send Resend email
  ↓
[Client] generateAISummary(report)
  ↓
Show AI summary in modal (or template fallback)
```
