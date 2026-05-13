 # TokenGuard — Full Project Documentation

This document captures the full, minute-level state of the TokenGuard project (AI Spend Audit SaaS). It consolidates architecture, design decisions, file map, commands, environment variables, migrations, testing details, and phase history so you have a single source of truth.

--

## Project Summary

- Name: TokenGuard
- Purpose: A launch-ready SaaS web app that audits AI tool spending for startups and provides deterministic, auditable recommendations to reduce costs.
- Primary goal: Ship a founder-focused Product Hunt-ready MVP with production-grade engineering: strict TypeScript, linting, tests, good UX, persistence options, and shareable public reports.

## High-level Architecture

- Frontend: React 19 + Vite (SPA)
- Styling: TailwindCSS 4.x
- State: Zustand with persist middleware (localStorage)
- Forms: React Hook Form + Zod validation
- Animations: Framer Motion
- Icons: Lucide React
- Tests: Vitest + @testing-library/react
- Optional persistence: Supabase (REST) for public reports
- Optional email: Resend API for lead emails
- Optional AI summaries: Anthropic API

## Important Project Files (map + purpose)

- `src/types/index.ts` — Domain-driven types (AITool union, AuditInput, AuditResult, Recommendation, PricingPlan). Central to the whole codebase.
- `src/lib/pricing.ts` — Single source of truth for tool pricing, tiers, thresholds, alternatives.
- `src/engine/audit.ts` — Deterministic audit engine: `calculateMetrics`, `generateRecommendations`, `performAudit`, helpers `generateId`, `generateSlug`.
- `src/lib/validation.ts` — Zod schemas for the audit form and individual tools; `validateAuditForm`, `validateToolUsage` helpers.
- `src/store/formStore.ts` — Zustand persist store for form state and helper methods (addTool, removeTool, updateTool, getAuditInput, reset).
- `src/components/ToolInput.tsx` — Reusable card for editing a single tool (plan, seats, spend).
- `src/pages/AuditFormPage.tsx` — Main form page (tool list, team size, use case, summary, submit handler).
- `src/pages/ResultsPage.tsx` — Results display with animated counters, recommendation cards, CTAs, modal integration.
- `src/App.tsx` — App orchestration and lightweight routing: landing `/`, app `/app`, public report `/report/:slug`.
- `src/pages/LandingPage.tsx` — Landing hero and CTA.
- `src/pages/PublicReportPage.tsx` — Loads public audits from Supabase (if configured) then `localStorage` as fallback; sets Open Graph meta tags.
- `src/lib/supabase.ts` — Minimal REST helper to save/fetch `public_reports` table in Supabase (best-effort).
- `src/lib/email.ts` — Minimal Resend email helper with localStorage fallback (stores leads locally if no API key).
- `src/lib/ai.ts` — AI summary helper (Anthropic integration if configured; templated fallback if not).
- `src/components/LeadCaptureModal.tsx` — Modal to capture lead email/company, send email, and generate AI summary.
- `src/components/results/AnimatedCounter.tsx` — Reusable animated numeric counter for financial metrics.
- `src/components/results/SavingsHero.tsx` — Premium hero block emphasizing annual and monthly savings.
- `src/components/results/RecommendationCard.tsx` — Structured financial recommendation card with current setup, action, and reasoning.
- `src/components/results/ConfidenceBadge.tsx` — Confidence status pill (high/medium/low).
- `src/components/results/DifficultyBadge.tsx` — Implementation difficulty chip (easy/moderate/complex).
- `src/components/results/CTASection.tsx` — Results CTA surface for share and consultation states.
- `src/index.css`, `src/App.css` — Tailwind and small global styles; some custom utilities (.gradient-text, .glass-effect).
- `src/__tests__/audit.test.ts` — 16 comprehensive tests verifying audit engine behavior.
- `db/migrations/001_create_public_reports.sql` — SQL migration to create `public_reports` table for Supabase.
- `README_PHASE3.md`, `PROJECT_FULL_DOC.md` — Project docs and Phase 3 notes.

## Domain & Types (summary)

- AITool (union): 'cursor' | 'github-copilot' | 'claude' | 'chatgpt' | 'openai-api' | 'anthropic-api' | 'gemini' | 'windsurf'
- AuditInput: { tools: ToolUsageInput[], teamSize: number, useCase: UseCase, totalMonthlySpend?: number }
- AuditResult: { id, metrics, recommendations[], input, createdAt, publicSlug, isHighSavings, isLowSpend }
- Recommendation: { id, type, title, problem, suggestion, reasoning, currentSetup, estimatedMonthlySavings, estimatedAnnualSavings, confidence, implementationDifficulty }

Refer to `src/types/index.ts` for full type definitions.

## Pricing & Business Rules (summary)

- `PRICING_DATA`: mapping per tool → tiers (monthlyPrice, seatsIncluded, costPerExtraUser)
- `THRESHOLDS`: constants like ENTERPRISE_MIN_TEAM_SIZE (50), HIGHLIGHT_SAVINGS_THRESHOLD ($500/mo), LOW_SPEND_THRESHOLD ($100/mo), ENTERPRISE_DOWNGRADE_SAVINGS_MIN ($100)
- `ALTERNATIVES`: map of cheaper alternatives with estimated savings percentage and reason

The pricing layer is intentionally deterministic and non-AI.

## Audit Engine (functions & behavior)

- `calculateMetrics(input: AuditInput)` → computes totalMonthlySpend, totalAnnualSpend and fills metrics placeholders.
- Recommendation generators (per tool):
  - `generateEnterpriseDowngradeRecommendation` — suggests downgrading enterprise plan if team < 50 and savings > threshold
  - `generateUnusedSeatsRecommendation` — suggests seat removal if seats > team size
  - `generateApiVsSubscriptionRecommendation` — suggests switching to credits if usage patterns favor API
  - `generateAlternativeRecommendation` — suggests lower-cost alternatives from `ALTERNATIVES`
- `generateRecommendations` — collects and sorts recommendations by estimatedMonthlySavings
- `performAudit(input)` — orchestrates metrics + recommendations; sums savings, computes percentages; returns `AuditResult` with `publicSlug` and flags. Also asynchronously attempts to persist the public copy to Supabase via `src/lib/supabase.ts` (best-effort).

Helpers: `generateId()` and `generateSlug()` generate unique ids and 8-character slug used for public report URLs.

## Store (Zustand) summary

- `src/store/formStore.ts` stores: tools[], teamSize, useCase, totalMonthlySpend, isSubmitting, errors and methods (addTool, removeTool, updateTool, setTeamSize, setUseCase, setErrors, setIsSubmitting, reset, getAuditInput)
- Persists to `localStorage` under key `audit-form-store`.
- The audit form starts from a neutral zero-spend state until the user enters their own tool spend values.

## Validation (Zod)

- `ToolUsageSchema` validates tool entries: tool enum, plan enum, seats (1–10000), monthlySpend range, optional apiCreditsSpend.
- `AuditFormSchema` validates full form: tools array (1–20), teamSize (1–10000), useCase enum.
- Helpers return structured { success, data?, errors? } objects for UI consumption.

## UI Components & Pages (behavior)

- `ToolInput` — premium input card for a single tool; plan dropdown, seat counter, monthly spend input, remove button.
- `AuditFormPage` — mobile-first audit intake flow with step sections, spend summary hero, and deterministic submit.
- `AuditFormPage` and the store intentionally initialize monthly spend at `$0` so the product never implies user data is prefilled.
- `ResultsPage` — premium report layout using modular components (`SavingsHero`, `RecommendationCard`, badges, CTASection) and clear financial hierarchy.
- `LeadCaptureModal` — collects email/company; calls `sendLeadEmail` (Resend integration or localStorage fallback) and `generateAISummary` (Anthropic integration or template fallback). Shows AI summary when available.
- `LandingPage` — full SaaS homepage flow (hero, problem, how it works, supported tools, sample savings, social proof, FAQ, final CTA).
- `PublicReportPage` — fetches public audit from Supabase (if configured) or localStorage; sets OG meta tags for social sharing and renders `ResultsPage` with the public `AuditResult`.

## Design System Notes (Phase 5)

- Global design tokens are defined in `src/index.css` via CSS variables (`--tg-bg`, `--tg-surface`, `--tg-text`, `--tg-muted`, `--tg-border`, `--tg-accent`, `--tg-shadow-soft`).
- Lightweight reusable style classes were added (`.tg-card`, `.tg-chip`, `.tg-button-primary`, `.tg-button-secondary`).
- Previous conflicting global heading overrides were removed to preserve component-level hierarchy and responsive typography.

## Data flow (form → results → share)

1. User fills `AuditFormPage` (Zod validates inputs).
2. `App.tsx` `handleAuditSubmit` calls `performAudit(input)`.
3. `performAudit` returns `AuditResult` and attempts to save a public copy to Supabase (best-effort); `App.tsx` writes copy to localStorage `public_audit_<slug>`.
4. `App.tsx` sets `auditResult` and navigates to results view.
5. User can `Share Audit Report` which copies `/report/<slug>` to clipboard and pushes the URL to history.
6. Public visitors to `/report/<slug>` are served `PublicReportPage` which tries Supabase first then localStorage.

## Env vars (dev & prod)

- `VITE_SUPABASE_URL` — Supabase instance URL (optional)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (optional)
- `VITE_RESEND_API_KEY` — Resend API key for sending lead emails (optional)
- `VITE_ANTHROPIC_API_KEY` — Anthropic API key for AI summaries (optional)

Behavior: If optional env vars are missing, the app falls back to safe local behaviors: localStorage persistence for public reports and leads, and templated AI summaries.

## Database migration

- `db/migrations/001_create_public_reports.sql` — SQL to create `public_reports(slug text primary key, payload jsonb, created_at timestamptz default now())` and an index on `created_at`.

## Tests & CI

- Unit tests: `src/__tests__/audit.test.ts` — 16 tests covering enterprise downgrade, savings calculations, low spend detection, recommendation generation, and edge cases.
- Run tests:

```bash
npm run test
```

- Type check and lint are strict and enforced in CI:

```bash
npm run type-check
npm run lint
```

## Build & Run

- Install dependencies:

```bash
npm install
```

- Dev server:

```bash
npm run dev
# opens at http://localhost:5173 (or other port if busy)
```

- Production build:

```bash
npm run build
npm run preview # optional to preview production build
```

## Deployment notes

- SPA can be deployed to Vercel, Netlify, or any static host.
- For shareable public reports stored in Supabase, ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your deploy environment and run the migration.
- For email sending, set `VITE_RESEND_API_KEY` in the environment; consider server-side email dispatch for security if you need private keys.

## Phase History (concise changelog)

- Phase 1: Foundation
  - React 19 + Vite SPA, TypeScript strict mode, domain types, pricing rules, audit engine, 16 tests. Files: `src/types`, `src/lib/pricing.ts`, `src/engine/audit.ts`, tests.

- Phase 2: Form & Results UI
  - `src/store/formStore.ts` (Zustand persist), `src/lib/validation.ts` (Zod), `ToolInput` component, `AuditFormPage`, `ResultsPage`, routing in `App.tsx`, Tailwind styles. Type-check & lint both passed.

- Phase 3: Landing + Public Reports
  - `LandingPage`, `PublicReportPage`, routing tweaks to support `/report/:slug`, localStorage public copy persistence, Open Graph meta tags, Supabase helper skeleton, migration SQL.

- Phase 4: Lead capture & AI summaries
  - `LeadCaptureModal`, `src/lib/email.ts` (Resend helper), `src/lib/ai.ts` (Anthropic helper with local fallback), wired into `ResultsPage`.

- Phase 5: Premium UX/UI polish
  - Results page redesign with modular components and improved financial credibility presentation.
  - Landing page redesign into a complete conversion-focused SaaS narrative.
  - Audit form and `ToolInput` redesign for premium feel, accessibility, and mobile touch ergonomics.
  - Lightweight tokenized visual system and global style normalization in `src/index.css`.
  - Mobile-first validation passes for landing, form, and results flows.

## Known Issues & Notes

- The Supabase helper is a minimal REST wrapper (no PostgREST row-level security logic implemented). For production, prefer server-side persistence or secure functions.
- Resend `from` address in `src/lib/email.ts` is a placeholder — update DNS/SPF settings and from-address to a verified domain before using in production.
- Anthropic usage in `src/lib/ai.ts` is a simple `fetch` call to a generic endpoint; adjust to the exact provider contract and model naming used by your plan.
- `localStorage` fallback means public reports persisted locally are not shareable beyond the machine that generated them — Supabase/server endpoint required for global sharing.

## Next Steps & Suggestions

1. Decide on public report hosting strategy:
   - Use Supabase (run migration + provide env vars) — minimal server-side work.
   - Or build a serverless endpoint (Vercel serverless function) to accept POSTs and return canonical report URLs (simpler for serverless-first deploys).
2. Add CI: tests, type-check, lint, build for PRs.
3. Add E2E visual tests for main flows (landing → form → results → share/public report).
4. Add Product Hunt launch assets (OG image generation, social screenshots, launch copy).
5. If moving to production security, route Supabase/Resend writes through serverless endpoints.

## Useful Commands (copyable)

Install
```bash
npm install
```

Run dev
```bash
npm run dev
```

Run build
```bash
npm run build
```

Run tests
```bash
npm run test
```

Type check
```bash
npm run type-check
```

Lint
```bash
npm run lint
```

## Where things live

- Source: `src/`
- Styles: `src/index.css`, `src/App.css`
- Tests: `src/__tests__/`
- Migrations: `db/migrations/`
- Documentation: `README_PHASE3.md`, `PROJECT_FULL_DOC.md`

--

If you'd like, I can (pick one):

- Generate a single runnable example that deploys a serverless function + DB migration for public reports.
- Add CI configuration (GitHub Actions) that runs type-check, lint, tests, and builds.
- Produce a one-page Product Hunt launch checklist and assets (screenshots, short copy, OG image suggestion).

Tell me which of those you want and I'll implement it.
