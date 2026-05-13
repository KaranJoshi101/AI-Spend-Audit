# TokenGuard

AI Spend Audit SaaS for startup cost optimization.

TokenGuard helps founders and engineering leaders identify AI tool overspending with deterministic, auditable recommendations and shareable financial reports.

---

## Screenshots

![TokenGuard landing page](./src/assets/hero.png)

## Demo / Deployment

- Local production preview: [http://127.0.0.1:4173/](http://127.0.0.1:4173/)
- Production build command: `npm run build`
- Preview command: `npm run preview`

## What It Solves

- Enterprise plans used by teams too small to justify them
- Unused seats that quietly increase monthly spend
- Subscription plans that should be usage-based (API credits)
- Expensive tool choices where cheaper alternatives can fit

---

## Current Product Capabilities

1. Enter tool stack details: plans, seats, and monthly spend
2. Run deterministic spend audit with financial reasoning
3. Review premium results UI with monthly and annual savings clarity
4. Share public report links (`/report/:slug`)
5. Capture qualified leads and generate AI follow-up summaries

Note: the audit form starts at $0.00 spend and you fill in all pricing manually.

---

## Tech Stack

- Frontend: React 19 + Vite
- Language: TypeScript strict mode
- Styling: TailwindCSS 4.x + lightweight tokenized design layer
- Forms and Validation: React Hook Form + Zod
- State: Zustand with local persistence
- Motion: Framer Motion
- Testing: Vitest + React Testing Library
- Optional Persistence: Supabase (public reports)
- Optional Email: Resend
- Optional AI Summaries: Anthropic

---

## Project Status

### Phase 1: Foundation ✅
- Domain models, pricing constants, deterministic audit engine
- 19 unit tests passing for core financial logic

### Phase 2: Form and Results Core ✅
- Stateful audit form with validation and persistence
- Initial results rendering and recommendation output

### Phase 3: Landing + Public Share ✅
- Landing page and public report route
- Shareable slug-based report URLs
- Supabase helper with local fallback

### Phase 4: Lead Capture + AI Summary ✅
- Lead capture modal wired to results CTA
- Resend and Anthropic helpers with graceful fallback behavior

### Phase 5: Premium UX Polish ✅
- Results page redesign with modular premium components
- Landing page upgraded to SaaS conversion narrative sections
- Audit form and tool cards upgraded for mobile-first usability
- Lightweight design tokens and global style normalization

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open the local URL printed by Vite
```

### Testing

```bash
# Run all tests
npm test

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Documentation

- **[PROJECT_FULL_DOC.md](./PROJECT_FULL_DOC.md)** — Full project documentation and latest implementation state
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Architecture and system decisions
- **[DEVLOG.md](./DEVLOG.md)** — Phase-by-phase implementation log
- **[PRICING_DATA.md](./PRICING_DATA.md)** — Pricing strategy and maintenance notes
- **[README_PHASE3.md](./README_PHASE3.md)** — Integration notes for Supabase, Resend, and Anthropic

---

## Product Positioning

TokenGuard is built to feel like a real launch-ready SaaS product:

- Founder-oriented copy and financial credibility
- Deterministic recommendation logic (not opaque LLM pricing math)
- Production-grade TypeScript and test coverage for core engine
- Premium UX with responsive, conversion-aware layouts

## Key Decisions

- Keep pricing and savings math deterministic so the report is defensible.
- Separate current spend from estimated savings to avoid misleading labels.
- Persist form state locally so refreshes do not lose audit progress.
- Treat public report persistence, AI summaries, and transactional email as best-effort integrations with graceful fallback behavior.
- Optimize for founder trust: clear copy, explicit reasoning, and a shareable report path.

---

## License

Proprietary — Credex Labs 2026
