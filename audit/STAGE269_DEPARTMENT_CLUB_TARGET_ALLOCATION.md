# Stage 269 — Department and club shares of issued targets

Baseline: Version 280 / Stage 268, commit 2c8b291922592e2ec2c85a237dedd90ab8e459b6.

## Completed backend increment

`server/annual-target-allocation.mjs` allocates planned shares against an exact current issued target version. Each share records the target key (department/cycle/KPI/event scale), full issued-version provenance, recipient, value, allocating person/grants, reason and immutable correction history. A department may retain a share for its own direct work; a club must be active, uniquely identified and mapped to that department in the supplied approved catalogue's club directory. No name/email matching or automatic club creation is used.

The new explicit `PLAN.TARGET_ALLOCATE` capability uses the existing resolver with complete institution/department/target scope and club scope where applicable. Being Principal, coordinator, administrator or sa1 by itself confers no allocation permission. No grant or role assignment is provisioned. Allocation remains distinct from Principal target issuance and the operational plan approval route.

The catalogue must explicitly declare SUM aggregation. Count, number and NPR shares use exact six-place decimal arithmetic internally; count fractions and excess currency precision are rejected. Percentages and non-additive KPIs are rejected rather than summed without a denominator/rule. Total latest shares, including department-retained work, cannot exceed that target version's value. Major/minor shares remain separate parent-target metrics, not automatically combined with an overlapping ALL-events metric.

One recipient cannot receive duplicate allocation records for the same target/version. An unbound correction appends a version and excludes superseded values from current capacity totals. A zero share frees capacity but preserves the recipient key and historical record. Recipient or target reassignment is rejected. Changed KPI/unit/hierarchy/cycle or issued-source bindings require reconciliation. Once any allocation exists, Principal target correction is blocked for a future formal rebase path, even if a share was reduced to zero. This avoids silently orphaning downstream commitments.

`server/annual-target-save.mjs` extends the existing target persistence boundary instead of duplicating its storage/transaction implementation. Issuance requests/receipts retain their original shape and fingerprints. Allocation requests use a separate typed payload and shared operation-receipt ledger. Both paths share current authorization checks, catalogue/authority reloads, target/catalogue/authority transaction revision guards, bounded payloads and atomic audit writes. No new table or migration is required.

## Actual verification

- `check-annual-target-allocation.mjs`: 29 focused cases, including exact source binding, retained department share, immutable/zero corrections, explicit grant/tenant/club checks, stale references, malformed/forged values, duplicate recipient, over-allocation, non-additive/percentage denial, changed period/source, exact decimal sums and latest-version-only capacity.
- Actual shared save implementation with in-memory SQLite: target issuance followed by allocation, correction and historical retry; operation conflict; rollback on audit trigger failure; target/catalogue/authority transaction races; and two simultaneous competing allocations with exactly one commit. Fictional identities/catalogue only.
- Existing 23 target-issuance cases and persistence checks still pass through the refactored shared writer. Permission resolver and identity/grant adapter checks pass; live service/authentication entry points are unchanged.
- Standard broad evidence: STAGE269_REGRESSION.json. The final focused check was repeated after adding the before-issuance time guard; broad allocation checks preceded that narrow guard. Final focused output: STAGE269_TARGET_ALLOCATION_TEST_OUTPUT.txt. TypeScript passes; production build runs during final packaging.
- No UI change or browser acceptance is claimed. No real student data, official target quota, production database write, role activation or catalogue edit is performed.

## Remaining dependencies and next task

This is a default-disabled backend composition boundary, not a live target-allocation screen or institutional API. Approved catalogue/KPI identifiers and SUM semantics, departmental/club mappings, verified identity/grants and server loaders remain unconfigured. No native D1 or real SSO execution has been tested. Stage 268's 2 MB ledger and 1,000-operation bounds remain.

Specific department/club plan-item adoption is not installed. Although correction refuses versions that already declare plan bindings, automated binding creation/verification and formal change/rebase requests remain pending. No existing plan is retrospectively linked, approved, unlocked or rewritten. No planned share counts as a verified achievement, event execution permit, budget commitment, individual score or MIS update. KPI outcome aggregation and all dashboard monitoring/evaluation views still require their explicit source/permission integration.

Next: connect exact allocation versions to existing draft department/club plan items through stable bindings, preserving final approved-plan locks and formal amendment routes. Then complete catalogue/identity provider configuration and entry/reporting interfaces. Earlier MIS imports, academic assignment routes and progression work remain preserved and separate.
