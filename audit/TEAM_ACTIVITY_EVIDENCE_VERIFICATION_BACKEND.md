# Stage 201 — Controlled mentor evidence verification backend

## Behavior

readIntakeTeamEvidenceVerification prepares the current submitted task, assigned criteria/evidence requirement, evidence description/source link and all individual contributions currently referencing that evidence. verifyIntakeTeamEvidence marks that evidence verified, with a unique versioned verification record, mentor account/time, retained original evidence binding, reason and explicit independence declaration. Only the current active accepted mentor may do so. The verified person must differ from the evidence author and every student whose submitted work references it; an account alias cannot bypass this check. Lead/coordinator/final-review authority alone does not grant verification.

Current approved source, mentor/consultation scope, activity mapping, active members, started activity and pending-hold checks remain required. Exact references, evidence/submission versions, fresh preview token, reason, declaration and confirmation are checked on two trusted loads. Workspace CAS and structured audit insertion commit atomically. Evidence is not fetched or evaluated automatically, and no file upload or runtime source is activated.

Verification changes the evidence only. Task submission versions, individual contributions, original evidence snapshots, task criteria, progress snapshots, other tasks and prior review/final/start history remain unchanged. Tasks stay SUBMITTED / Under review with done=false. There are no completion decisions, scores, awards or portfolio achievements in this increment. Mentor completion review, return/revision and scoring remain separate future controls.

## Shared evidence and validation

The existing controlled task validator now recognizes independently verified evidence. Verification retains the original unverified binding, so earlier submissions remain valid without rewriting their evidenceSnapshot. Later submissions can explicitly reuse verified shared evidence and capture its actual verified binding. The existing student form displays the actual verified/unverified status and validates the independently refreshed saved evidence in either case. Every contribution remains its own submission.

Verification provenance must match the accepted mentor's person, source, originating review task, evidence index, original binding, reason/declaration and valid dates. A before-verification snapshot requires a submission at or before verification; an already-verified snapshot requires a submission at or after verification. Invalid/altered verification, content or submission history blocks subsequent controlled operations. Existing generic/demo edits, task reviews, toggles and evidence/file writes remain blocked for institutional team activities.

The audit codec adds ACTIVITY_EVIDENCE and teamEvidenceVerification.reason as explicit metadata/reference options. A unique verification ID links the content-free ledger entry to the evidence record. Evidence descriptions, contribution statements and verification reasons are not copied to the general event or ledger.

## Verification and remaining work

check-intake-team-evidence-verification-save.mjs uses the existing reviewed/approved/started SQLite lifecycle. It checks mentor-only and person-alias scope, revoked authority/inactive participants, holds, stale previews/versions, changed sources/evidence/contributions, declaration/confirmation/field limits, atomic ledger rollback and concurrent winners, original snapshots, shared evidence, later verified reuse, altered provenance, preserved unverified completion and generic/file-write denial. check-intake-team-task-evidence-client.mjs now exercises verified shared evidence through the actual dispatcher, SQLite storage and scoped student view as well.

Full regression evidence: AUTOMATED_BASELINE_STAGE201.json. Actual browser/keyboard/institutional acceptance remains Not run. Mentor evidence-verification screen and individual completion/assessment controls are next. Private uploads and live approved-source activation remain pending; semester progression remains deferred. No SQL schema, permission grant, source configuration or access-mode change.
