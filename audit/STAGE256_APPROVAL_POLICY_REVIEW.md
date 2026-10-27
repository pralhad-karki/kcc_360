# Stage 256 — AP-001 policy review and isolated verification

Date: 25 October 2026

## Source reconciliation

Sites project `appgprj_6ad20d6935c88191901237acf47b94a8` lists Version 267 at source commit `be5b617b87819857263325cffc77eed98077da23`, with no deployment ID. Version 266 has a deployment ID and matches the handover's published checkpoint. The source helper opened the maintained checkout at the exact Version 267 commit, with no local changes before this increment. No new application was created.

## Changes

- Corrected AP-001 ownership-record placement in the shared permission resolver request. Previously, legitimate review attempts were denied as unresolved independence.
- Require an ACTIVE review assignment within any configured validity window.
- Principal approval now revalidates earlier reviewers using freshly supplied trusted reviewer identities, including active status and tenant. It no longer synthesizes those identities from the current Principal's session.
- Prevent revision lineage from moving between institutions, units or plan kinds.
- Added `check-plan-approval-policy.mjs` with 26 isolated fictional-fixture cases covering all eight catalogue plan kinds at zero cost, nonzero cost, route order, role and owner independence, assignment validity, changed/revoked prior authority, inactive/missing prior identity, stale review/content, return/new-version history, Principal-originated blocking, reasons, backdating and repeat approval.

## Verification and limits

The 26 policy cases, existing permission-policy check, TypeScript check and production build pass. Full workflow regression results are retained separately in `STAGE256_REGRESSION.json`.

This is a tested trusted-input policy foundation. It is still disconnected from production routes, existing plan controllers, review UI and persistent storage. An APPROVED policy record deliberately retains `executionAuthorized: false`; it does not grant execution authority. No grants, accounts, database records, migrations or authentication configuration were provisioned or changed. No browser or institutional acceptance was run for this server-only increment. Stage254 browser evidence is unchanged and does not validate this new policy.

Persistence-level idempotency, concurrent requests/CAS, successor-plan activation and academic/club bypass coverage are NOT implemented or verified in this stage. Do not describe AP-001 as production enforcement. The existing academic and club approval-route conflicts in the Stage255 matrix remain pending.

## Next bounded task

Connect a single academic/club shared approval path to trusted identity/assignment loading and existing persistent compare-and-swap storage, with atomic audit/receipt writes and execution guards. Keep original approved records and legacy decision history; do not manufacture historical Finance/Principal decisions. Add concurrency/idempotency acceptance tests before wiring review controls. Principal-originated plans remain blocked pending an explicit independent-authority rule.
