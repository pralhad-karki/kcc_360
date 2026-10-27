# Stage 267 — Approved club activities in Student Affairs

Baseline: Version 278 / Stage 266, ef154186dee12d8d9610de7bb094e38c3e726dd5.

## Delivered

A read-only server projection publishes activity names and approved date ranges from the existing protected AP-001 club-plan ledger into the existing Student Affairs owner-demo dashboard on workspace load/refresh. It adds no new approval engine, event records, authenticated roles, database tables or execution authority.

The projection validates the full owner submission → responsible-unit → Finance Administrator → Principal decision chain, exact approved snapshot/source binding, original source record and (when applicable) amendment overlay. Legacy APPROVED labels, unit endorsements, drafts, pending reviews and unrelated workspaces cannot populate it. This validation consumes the protected server ledger; it is not independent cryptographic verification of arbitrary imported approval records. Generic commands remain unable to manufacture that ledger.

The latest finally approved version in a club-plan family supplies the schedule. A pending successor leaves the previous approved dates visible. Final successor approval replaces the displayed version without duplicate rows. Duplicate approved versions, incomplete decision chains and changed sources with an identifiable family withhold that family and display a reconciliation count rather than silently falling back. Cancelled plan items are excluded from active calendar rows. No raw review reasons, reviewer identities, grant records, financial details or evidence bodies are returned.

The engine overwrites any stored summary before producing its view and returns the calendar only to sa1 within the existing owner-only demo boundary. It never treats sa1 as a real institutional account. Private case permissions are unchanged. The existing configured approval service remains default-disabled for institutional operation, so no approved activities are fabricated or seeded on deployment.

## Evidence

- `check-approved-club-calendar.mjs`: actual trusted runtime + shared protected approval persistence with in-memory SQLite and fictional identity/grants. Checks every approval stage; final publication; read-only preservation; role/workspace scope; server recomputation; full persisted amendment route; unchanged dates while pending; single successor row; duplicate/tampered/incomplete/changed source denial; exclusion of legacy approvals. Existing thirteen trusted-review integration cases also run through the reused fixture.
- Browser-script harness verifies table labels/dates, escaped titles and withheld-source notice alongside existing department/internship controls.
- Managed browser inspected a temporary read-only fictional fixture showing the approved v2 activity with its extended date, club/cycle, approval route and planning-only explanation. No native authentication or backend save was performed in that browser. Temporary HTML removed before packaging.
- Standard developer regression evidence: STAGE267_REGRESSION.json. TypeScript passed. Production build runs during final packaging; no production database write is required.

## Scope still pending

The clarification is recorded in the Student Affairs requirements addendum. Principal-issued annual targets by department, stable strategic KPI links/allocations, explicit major/minor event targets, planned-vs-achieved rollups without double counting and periodic corrective-action/evaluation integration are not delivered by this calendar. Existing club KPI/target text is not relabelled as an official strategic mapping. Public website publishing, notifications and new execution authorization are not added here. Real identity, approved mappings and institutional acceptance remain dependencies.

Next: implement versioned annual departmental target issuance and subordinate plan/KPI allocation without changing the strategic architecture or plan approval route.
