# TokenGuard Test Plan

This file documents the current testing surface for TokenGuard and how to run it.

---

## Automated Checks

### Unit Tests

- File: `src/__tests__/audit.test.ts`
- Coverage:
  - enterprise downgrade logic
  - savings calculations
  - low-spend detection
  - recommendation ordering
  - edge cases
  - metrics isolation
  - api credit spend inclusion
- File: `src/engine/tests/recommendationEngine.test.ts`
- Coverage:
  - alias normalization
  - recommendation selection and dedupe
  - overlap handling

### Commands

```bash
npm run type-check
npm run lint
npm test -- --run
npm run build
```

## What These Tests Protect

- Total monthly and annual spend calculations
- Total estimated savings calculations
- Recommendation count and ordering
- Threshold behavior for small teams and low spend
- Regression protection for API credit spend totals
- Recommendation normalization and deduplication across engine generators

## Manual Checks

- Open the audit form and confirm each tool can be added.
- Verify monthly spend typing works without appending behind an initial zero.
- Run an audit and confirm the results page shows current spend and annual savings separately.
- Open a public report URL and confirm the OG meta tags are present.

## CI Expectations

CI should run the same validation gates as local development:

1. install dependencies
2. type-check
3. lint
4. test
5. build
