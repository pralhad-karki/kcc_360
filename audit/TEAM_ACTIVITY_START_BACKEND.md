# Stage193 — Controlled team activity start backend

## Inspection and minimum change

Linked team drafts were intentionally read-only: generic demo edit/submit/approve/start commands cannot mutate them. Their institutional final approval is already recorded, so another proposal approval would duplicate that decision. The next change adds an operational start through the existing trusted intake dispatcher and atomic workspace/audit pattern. No new module, API route, database schema or live permission/source was introduced.

Added readIntakeTeamStartReadiness and startIntakeTeamActivity. Both remain default-disabled with the institutional runtime. They require existing current coordinator/final-review access plus a separate explicit approved ACTIVITY_START assignment. Display roles, final-review authority and ACTIVITY_HANDOFF alone do not grant start permission. The assignment must be current, available, unrevoked, institution/kind scoped and independent of students and the mentor. Academic assignments require the exact programme/batch/semester/course. No real assignment, mapping or provider was provisioned.

The handoff's existing authority/mapping validation helpers are reused for start without changing their rules. Individual/demo activities retain their existing workflows.

## Readiness and controlled save

The fresh preview validates the reciprocal linked CREATED draft, frozen final approval and complete prerequisite digest, current mentor acceptance and research consultation scope/responses, active verified team accounts, the original approved execution mapping ID/version and unchanged planning scope. It checks existing postponement/cancellation controls and pending activity changes, mentor transfers or evidence amendments. Premature tasks/evidence/messages/evaluations/recognition in an unstarted draft are rejected. No new fee, attendance, grade or invented scheduling conditions were added.

The preview provides only the activity scope, team/mentor, source/final references and a token; it creates no permission to work. The token binds workspace revision, the draft/handoff/final record, current authority and mapping. Start requires exact references, expected version zero, that preview token, a reason and explicit confirmation. Both fresh source stages revalidate before a workspace CAS and atomic audit commit. Missing/revoked/stale authority or mapping, mismatched source, holds, races, failed audits and duplicate starts cannot record another start.

A successful operation changes the linked activity from CREATED to STARTED and appends an immutable private teamStart record to its intake, with a minimal matching project status. Final approval, submitted proposal, team consents, mentor/consultation/scope and handoff history are retained unchanged. Audit metadata references the private reason rather than copying it. Started links are validated reciprocally, including source/final references, status, actor, date and authority reference. Future/inconsistent start-status tampering is rejected by source reads.

Ordinary student views strip the private start record/reason and expose only a minimal start status. Existing readiness and project overview screens display the recorded Started state. A historical/read-only status read still returns executionAuthorized=false; the successful start command alone records its operational start with executionAuthorized=true. This is not a general permission to use other demo activity actions.

## Deliberate limits and next step

The start confirmation form is not connected in this backend increment. Generic commands remain blocked for linked team activities after start; further task assignment, delivery and evaluation require their controlled institutional execution path. No automatic IN_PROGRESS/completion transition or recognition is added.

Next: connect a fresh start-readiness preview and explicit confirmation form to the existing linked-activity detail. Reuse its final approval and the shared controller freshness/lock protections. Then connect controlled task execution incrementally. Browser/institutional acceptance, real source activation and notifications remain pending. Semester progression remains parked; full demonstration data remains deferred.

## Validation

Real SQLite fixtures exercise same-batch exact-course permission and multidisciplinary research start, missing/revoked/wrong-scope/ambiguous permissions, inactive members, changed mappings and metadata, postponement/cancellation and pending holds, premature execution records, exact token/reference/confirmation rules, two-load source races, audit rollback/CAS, duplicate denial, unchanged final/handoff history, private audit/student projections and reciprocal Started link validation. Existing generic continuation remains denied after start. HTTP tests cover default-disabled new commands. VM detail checks display a Started record and reject inconsistent flags. Full regression evidence: AUTOMATED_BASELINE_STAGE193.json; TypeScript and production build checked separately. Browser/keyboard and institutional acceptance remain Not run. The prototype is not yet finalized or production-ready.
