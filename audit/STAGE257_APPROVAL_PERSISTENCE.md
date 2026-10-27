# Stage 257 approval persistence and SRS v3.4 adoption

25 October 2026. Source baseline: Version 268, commit `0078629e41768850c97a2ddb5cc432f6ba7267b0`. The source helper reopened that exact checkout before editing. Site identity, audience and existing schema are preserved.

The current requirements are the user-supplied v3.4 file retained unchanged in `requirements/`. The v3.4 incremental matrix supplements, rather than overwrites, Stage255's 35-row catalogue and its provenance limitations. New Annex P acceptance criteria remain NOT RUN. Text was compared; new embedded diagram images were not visually validated in this stage.

## Implemented in this increment

`server/plan-approval-source.mjs` projects exact existing academic/club plan snapshots through explicitly approved server-owned source mappings and stable owner-person identities. Default configuration is disabled. Source budget totals use minor-unit integer arithmetic. A source change alters the approval binding. This reader does not invent institutional roles or provision registry entries.

`server/plan-approval-save.mjs` composes the existing AP-001 policy with the existing workspace/audit SQL schema. It clones requests before awaiting, rejects additional client fields, reloads trusted source/authority twice, binds decisions to exact plan content/version, checks review/workspace revisions, and updates the workspace plus audit in one D1-compatible transaction. Receipts support safe retry without another decision or audit. Competing requests cannot overwrite a winning workspace revision. The same transaction checks an authority-fence revision; a changed fence prevents the candidate write.

Receipt reads recheck current actor authority, assignment and identity before disclosing the minimal saved result. Revoked capability cannot retrieve an earlier receipt. New plan versions preserve prior records and link to the prior approval state. Approval records remain separate from existing legacy plan records; no historical approvals are synthesized and no execution authority is granted.

The shared engine generator now excludes raw `planApprovalRecords` from every generic role view while preserving them in storage snapshots. This prevents future persistent approval snapshots, reasons and receipt details from appearing through the ordinary workspace response.

## Verification

- 14 isolated SQLite persistence scenarios pass, including academic and club full routes, duplicate retry, two concurrent submissions, audit failure rollback, unrelated concurrent winner preservation, transaction-time authority-fence change, authority changes between loads, revoked retry access, expiry/configuration guards, exact source binding, cross-person denial, versioned return/history and generic projection isolation.
- Existing source-projection checks pass for academic and club records, approved scope/owner mapping, disabled default, exact snapshots, malformed budgets and precise minor-unit totals.
- The 26 AP-001 pure-policy cases and existing permission-policy checks pass.
- TypeScript and production build pass. Existing workflow suite results are recorded separately in `STAGE257_REGRESSION.json`.
- No new browser acceptance was needed for this server-only increment. Stage254 browser evidence remains separate.

## Precise release boundary

This is an implemented and locally tested persistence composition boundary, NOT live academic/club plan enforcement. No route/controller or review UI imports it yet. No actual institutional source mappings, grants, sessions, authority-fence records or providers were installed. No production records, migrations, authentication settings or real messages/payments were changed.

The trusted loader is a server dependency, not a completed MIS connection. Its provider must authenticate, bind the exact source plan/workspace and scope, load current people/grants/assignments, validate the authority fence and maintain its epoch when any relevant identity/policy/assignment changes. Double reads alone are not a distributed revocation lock; production activation requires the authority-fence update contract. SQLite simulations do not establish official SSO, native Cloudflare concurrency or institutional acceptance.

An APPROVED policy result still has `executionAuthorized: false`. Existing legacy academic and club approval-route conflicts remain unresolved; source projection and atomic storage are preparatory integration components. All-plan entry/bypass coverage, UI review queues, execution controls, approved successor activation, full Annex M change requests and event/public/payment requirements remain pending.

## Next bounded task

Connect this composition to a trusted runtime and a single academic/club review path with protected preview/decision controls. Cover every legacy transition and execution bypass for that activated path, preserving historical records. Use explicitly labelled isolated fixtures until official identity/authority configuration is available. Retain pending/rejected requests without unlocking baselines; Principal-originated plans remain blocked until an independent-authority rule is provided.
