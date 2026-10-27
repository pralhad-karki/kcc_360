# Stage 268 — Annual departmental target issuance backend

Baseline: Version 279 / Stage 267, commit 6a63f48c070ce1bb56ab47c28a6334f51f7dffd4.

## Completed backend increment

`server/annual-targets.mjs` supplies a default-disabled target issuance service. It reads a supplied, institution-approved strategic catalogue and validates pillar → goal → stable KPI/version references, active departments, explicit annual cycle dates and units. It neither creates nor edits the strategic catalogue. No seven-pillar/twenty-five-goal content or official KPI identifiers have been invented or populated.

Issuance requires the shared capability resolver to grant the new explicit `PLAN.TARGET_ISSUE` capability through exactly one applicable Principal grant, scoped to the institution, department and target record. A demo administrator, department reviewer or Student Affairs persona does not acquire that grant. Principal target issuance remains distinct from operational plan authorship and final approval. The existing AP-001 route and its principal-originated-plan independence rule are unchanged.

Target values support count, number, percentage and NPR units with validation. Major/minor/all-event classification is explicit for eligible count KPIs; other KPIs use NOT_APPLICABLE. Three major and twelve minor events are fictional test values, not a default quota. Department/cycle/KPI/classification duplicates and target scope reassignment are rejected. Corrections append an issued version with reason, issuer, grant, catalogue provenance, cycle dates and superseded-version reference. Earlier versions remain immutable. Nothing marks a KPI achieved or authorizes an event, payment, individual evaluation or MIS update.

`server/annual-target-save.mjs` is a server-only composition boundary for a future authenticated provider. It requires provisioned, separate `KCC-ANNUAL-TARGETS:<institution>` and `KCC-STRATEGIC-CATALOG:<institution>` rows in the existing workspace storage and a distinct authority fence. No row is automatically created. It validates approved effective configuration and reloads trusted context before committing. Target, catalogue and authority revisions are checked inside the same SQL batch as the audit entry. Audit insertion failure rolls back the target update. Matching operation retries return their prior receipt; conflicting operation reuse is rejected. A retry of an earlier issuance after a correction remains a historical receipt, not a new issuance or claim about the latest version.

The loader contract must authenticate the institutional subject, load current approved grants/catalogue/configuration and advance the authority fence on relevant changes. It is not safe to feed this boundary browser-supplied identity, grants or catalogue data. No live provider, HTTP route, login integration or target-entry UI is installed. The core defaults off; these modules are backend implementation, not an available institutional workflow.

## Actual evidence

- `check-annual-targets.mjs`: 23 core cases with fictional catalogue/Principal grant, including disabled default, exact provenance, immutable corrections, role/revocation/tenant/department denial, invalid hierarchy, duplicate and stale KPI references, malformed values, forged fields, explicit major/minor distinction and duplicate target prevention.
- Same check executes the actual save service against in-memory SQLite with the existing schema. Checks persistence and audit counts, repeated import-style operation idempotency, conflicting reuse, versioned correction with historical retry, target/catalogue/authority transaction races, audit-trigger rollback, expiry and changed configuration between loads.
- Existing permission-policy and identity/grant adapter checks passed. Existing service/authentication entry points are unchanged.
- Broad regression: STAGE268_REGRESSION.json. The focused target test was repeated after adding persistence correction/history checks; STAGE268_ANNUAL_TARGET_TEST_OUTPUT.txt records the final run.
- TypeScript passed; production bundle built during final packaging. No UI change, so no new browser QA is claimed. No production database migration or write is performed by this increment.

## Dependencies, limits and next step

Official catalogue content/IDs, cycle/department mappings, Principal identity/grants and provider configuration remain prerequisites to activation. The save composition has not been exercised against native D1 or institutional SSO. The target ledger is bounded to 2 MB and 1,000 operation receipts, not an institution-scale throughput claim.

Club allocation, departmental/club plan-item bindings, target acceptance views, target-entry screens, public/department reporting and planned-versus-verified achievement aggregation are pending. The core refuses correction when a version already declares allocations/plan bindings, but automated binding collection and formal reallocation/rebase controls are not installed; they must be completed before activating downstream adoption. No existing approved plan is retroactively linked or unlocked.

Next: implement subordinate departmental/club KPI allocation against exact issued target versions, with stable bindings, capacity validation and audited correction; then connect the approved catalogue/identity providers and interfaces. Existing MIS import and semester progression work remains separate and pending where previously documented.
