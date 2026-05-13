# TokenGuard Reflection

This document captures the main product and engineering lessons from building TokenGuard.

---

## What Worked

- Deterministic financial logic built trust faster than an AI-only explanation layer.
- Strict TypeScript and a small set of shared domain types reduced calculation drift.
- Keeping pricing data in one place made the recommendation engine easier to audit.
- A premium UI with plain financial language made the product feel more credible.

## What Did Not Work Well

- Hardcoded assumptions in the UI can make totals look inconsistent if the labels are unclear.
- Optional integrations are convenient, but they need explicit fallback behavior to avoid broken flows.
- Form inputs that default to zero can feel like they are appending characters unless buffered correctly.

## Lessons Learned

1. Put money math behind one source of truth.
2. Separate savings from spend in the UI so users do not confuse the two.
3. If a field is optional in the data model, document how it affects totals.
4. Validate the exact numbers shown in the interface with end-to-end examples.

## Current Product Takeaway

TokenGuard works best when the product explains the math plainly: current spend, expected savings, and the logic behind each recommendation. That makes the report usable for founders and defensible for reviewers.
