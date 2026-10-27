# Stage191 — Controlled team draft-creation backend

## Minimum change and workflow impact

The individual handoff remains unchanged. Added two commands to the existing trusted intake dispatcher: readIntakeTeamHandoffDraft and handoffIntakeTeamDraft. They use the current owner/session/origin/revision API boundary; no new route, SQL schema or module was introduced. Both are disabled with the institutional runtime by default. No real permissions, mappings, providers or accounts were provisioned, and no notifications were sent. The confirmation form is the next increment; this step delivers and tests its backend.

A caller must already have current coordinator/final-review access and separately hold the unique explicit ACTIVITY_HANDOFF assignment for the institution and proposal kind (exact programme/batch/semester/course for academic projects). The assignment must be approved, current, available, unrevoked and assigned to the verified active caller. Handoff authority is independent of students and the accepted mentor; it is not inferred from display roles or mentor-assignment/final-review privileges alone.

Execution mappings are optional approved activityMappings rows within the existing trusted academic-master source. Each mapping requires its own ID/version, approval reference, institution, validity and source kind/type/programme. A unique current approved match explicitly chooses an existing execution type and retains the source programme. Unknown/ambiguous mappings, unsupported programmes/types and programme changes are denied. Research is mapped only when explicitly approved; original research type/kind are retained in planning metadata. No database migration or client configuration is added.

## Controlled operation

A fresh authorized preview resolves the current final approval, accepted mentor, research consultation scope/responses, complete confirmed team and verified active execution account aliases. Ambiguous student aliases are denied; the mentor retains the exact assigned account already validated by the accepted assignment, including legitimate acceptance by another verified alias for the same stable person. The preview token binds the workspace revision, full final decision, prerequisites, scoped authority, mapping and proposed draft. Clients cannot choose the owner, members, mentor, type or programme in the save request.

The save requires exact source/final references, current preview token, explicit confirmation and a reason. Two fresh trusted loads are compared, then an existing workspace CAS and atomic audit insertion create one CREATED project and reciprocal intake link. Earlier submissions, first/final decisions, member consents, assignments, consultations and scope history remain unchanged. Private handoff reasons stay in the intake handoff record and are stripped from ordinary student views. Audit metadata references the reason rather than copying it. Duplicate/inconsistent links and failed/stale saves do not create a second activity.

The linked project carries immutable source/final approval, authority and mapping references. Existing source validation recognizes a valid reciprocal draft link so authorized final/mentor/consultation views continue working after handoff. The readiness screen shows the created linked draft, not the old pending preview. The student's intake summary also shows the linked draft without exposing private provenance/reason records.

## Execution remains separate

A linked team draft remains read-only. Generic demo commands referencing it or its source intake are rejected; a post-command invariant also prevents indirect protected-record changes. Browser overview/edit/submit/approve/start controls are suppressed or guarded. Unrelated ordinary projects retain their existing workflow. This avoids passing a trusted institutional team into the older demo approval/start path. No execution authorization is created by final approval or handoff.

Next: connect a fresh scoped preview and explicit confirmation form to these commands, with strict response/fresh-workspace handling. Controlled institutional draft editing/execution/start authorization remains a later step. Do not add another final-review decision or reinterpret a mentor as the final approver.

## Validation

Actual SQLite fixtures cover same-batch exact-course authority and explicit research mapping, missing/revoked/unapproved/wrong-scope authority, stale/ambiguous mappings, exact fields/references/token/confirmation, ambiguous student accounts, source races, audit rollback, CAS conflicts, duplicate prevention, full team and mentor preservation, immutable history, private student/audit projection, reciprocal link tampering and generic edit/start/withdrawal guards. A control confirms unrelated project submission still works. HTTP route tests cover both commands' default-disabled response. Existing VM readiness integration checks display a linked read-only draft and reject execution-enabled link projections. Full regression evidence: AUTOMATED_BASELINE_STAGE191.json; TypeScript/build checked separately. Browser/keyboard and institutional acceptance remain Not run.

Semester progression remains parked; full demonstration data remains deferred. The prototype is not yet finalized or production-ready.
