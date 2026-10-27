# Stage 236 — isolated mock cohort batch lifecycle core

Baseline: clean dd2086eb4fda4895f8406d32518f3ccf5a6fab16, published version 247. Existing Stage 235 owner-demo cohort preview recovered intact. No source, database or architecture reset.

## Implemented scope

`server/cohort-progression-batch.mjs` supplies pure transitions over a server-owned, explicitly fictional ledger. It is deliberately not imported into the live API, workspace engine or browser. The exported transition function is not an authentication boundary: its eventual service caller must derive the actor from the authenticated session and atomically persist the result against the expected revision.

- Initial fictional placement ledger comes from the existing normalized mock adapter contract, validated by the existing cohort planner. No real people, credentials or institution programme definitions are introduced.
- Coordinator c1 prepares a proposal; department head d1 independently approves or rejects it. Administrator and student/mentor personas have no override. Coordinator c1 can explicitly apply an approved proposal to the returned fictional ledger.
- Proposals retain the complete cohort preview, source and structure versions, stable student/person/enrollment identifiers, per-row before placements, preparation reason and a deterministic SHA-256 content binding. This is a consistency binding over server-owned data, not a signature, client authorization or tamper-proof storage claim.
- A current planner result must exactly match the approved preview. Source, structure, college status, student version and placement changes invalidate approval/application. The caller must supply the current source; official MIS retrieval is not implemented here.
- Every member, including the Left College exclusion, is checked before any candidate placement update. Five ordinary fictional cohort members advance; break, repeating and unknown statuses remain included. Only official Left College is excluded. Other-cohort placements remain unchanged.
- Final-semester proposals return a separate-review denial; there is no automatic graduation, invented final-semester progression or credit assignment.
- Successful application creates a detached candidate ledger with incremented placement versions, retained proposal/approval, complete before/after snapshots and an appended revisioned history event. Rejected proposals remain retained when a new proposal is prepared. Input state and prior history are never mutated. Failure returns no candidate ledger.
- Expected ledger revision, unique batch identifiers, pending-cohort exclusion, state transitions and application replay guards prevent blind overwrites in the pure lifecycle. Monotonic event timestamps are required. These checks do not replace a database compare-and-swap.

## Validation

Passed: `check-cohort-progression-batch.mjs`, existing cohort preview/API/client checks, existing individual academic progression checks, MIS adapter/SSO isolation checks, TypeScript no-emit and production build.

The new check exercises proposal → independent approval → explicit application, rejection and corrected proposal retention; exact five/one inclusion; before/after versions and detached histories; role denial; duplicate/pending/stale/replayed commands; content and approval binding changes; expired/ambiguous sources; changes in each binding category; placement conflicts in first/last/excluded rows; final-semester denial; adverse fee/attendance/grade/hold flags; private-field omission; caller mutation during asynchronous hashing; and no partial state on denial.

Added the check to the reusable task-workflow runner (now 28 commands). No new complete 28-command execution is claimed; earlier aggregate reports remain historical. No browser test is necessary for this stage because no UI or route changed. Stage 235 browser evidence remains unchanged; institutional acceptance remains pending.

## Boundaries and next task

The new core is implemented and tested, but durable proposal/review/application is **not enabled**. Database schema/migrations, stored workspace placements, existing individual progression and all activity/research/internship/club/learning histories are unchanged. Stage 235 remains a read-only preview. No real student data or production credentials were used in tests.

Next bounded task: connect a server-private mock ledger to durable storage with revision/session compare-and-swap and atomic audit persistence. Test competing saves, session changes, storage failures and no disclosure through unrelated workspace responses. Only then expose authenticated proposal/review controls. Do not put an unfiltered ledger in the shared workspace view or treat demo personas as institutional identities.

Official E-Digital Nepal roster/status synchronization, institutional SSO and any authorized MIS write-back still require vendor specifications and access. Existing live MIS, SSO and email configurations remain disabled/unconfigured. They do not block the durable mock workflow work.
