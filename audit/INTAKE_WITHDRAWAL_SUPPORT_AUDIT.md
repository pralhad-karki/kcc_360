# Stage 167 — Intake withdrawal and supporting-responsibility audit references

## Review and minimum change

Student intake withdrawal, mentor withdrawal and supporting-responsibility request/response/withdrawal already retain reasons, actors, timestamps and history in guarded intake records. Their server audit events used legacy selected-record metadata, often null from the intake page. Extend the existing intake mapper and audit dispatcher for these five commands. No database, route, permission, business rule, institutional source or demonstration data changes.

- `withdrawActivityIntake`: INTAKE ID and draft revision, prior state → WITHDRAWN. Drafts have no submitted version; their decision's version remains null. The audit record identifies the retained draft revision, never inventing a submission.
- `withdrawIntakeMentor`: existing INTAKE_MENTOR_ASSIGNMENT ID/version and prior state → WITHDRAWN; accepted responses and older assignments remain unchanged.
- `requestIntakeSupport`, `respondIntakeSupport`, `withdrawIntakeSupport`: additive INTAKE_SUPPORT_REQUEST type in the existing codec, with the actual request ID and per-target sequence version. A new request is a distinct record with null prior version/state; responses and withdrawals retain that request's version. Requests for other units retain independent sequences and states.

Reason references use `reason` for creation/response and `withdrawalReason` for withdrawals, with command-specific resolution to the existing source record. Student withdrawal resolves the appended intake decision; mentor/support withdrawal resolves `withdrawal.reason`; support request resolves `reason`; support response resolves `response.reason`. No private narrative, responsibility/deliverable, mentor notes or submission content is copied into audit metadata. Existing workspace revision/commit binding and atomic save remain in use. Readers deploy with the additive type; older codecs cannot interpret the new type. Historical metadata/legacy rows remain untouched.

The mapper validates only expected guarded changes and rejects malformed transitions. Existing engine authority, source-current checks and linkage restrictions remain the authorization boundary. In particular stale supporting requests may be withdrawn to obtain fresh acceptance; withdrawal must not be incorrectly gated by current-source acceptance. Linked activities continue to block mentor/support withdrawal under existing rules.

## Verification

`check-intake-withdrawal-support-audit.mjs` uses the real service and in-memory SQLite. It covers DRAFT/SUBMITTED/RETURNED student withdrawal, accepted mentor withdrawal, Research and Global Collaboration support requests, independent acceptance/decline, revised requests, accepted and stale-request withdrawal, original decision/response preservation and non-last-array request changes. Checks include ID/version/state correlation, private-content exclusion, ledger rollback/retry for every added command, duplicate/stale/unauthorized/declaration/source rejection, and no activity creation. A temporary copied linkage marker tests existing linked-work withdrawal rejection; this is explicitly a fixture, not a real linked activity or institutional data source. The preceding handoff suite covers actual linked activity creation. Malformed trusted transitions are rejected.

Full local results: `AUTOMATED_BASELINE_STAGE167.json`. TypeScript and production build checked separately. Browser/keyboard/print and institutional acceptance remain **Not run**. Broader G22 audit coverage is still open; this is limited to the listed intake commands. Live institutional identities, rosters, team/research first-review activation and delegations remain pending. Semester progression and the full demonstration dataset remain parked.

Next recommended step: consolidate first-review/team workflow readiness and remaining integration blockers before selecting further functional work; do not infer institutional acceptance from fictional-data checks.
