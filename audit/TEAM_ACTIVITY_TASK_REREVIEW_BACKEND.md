# Stage 207 — Fresh mentor review of revised submissions

## Backend operations

The revised-work path is separate from the original submission-1 commands. It requires exactly two submissions, the retained initial PARTIAL/RETURNED review and work awaiting review. Only the currently active verified person corresponding to the accepted mentor can prepare or save; the reviewer must be independent of the assigned student and evidence author. Current approved source, consultation scope, activity mapping, active team and pending-hold checks remain mandatory.

| Command | Purpose |
| --- | --- |
| readIntakeTeamRevisedEvidenceVerification | Preview the unverified evidence supporting submission 2 and all contributions referencing it. |
| verifyIntakeTeamRevisedEvidence | Independently verify that evidence with a reason, declaration and confirmation. |
| readIntakeTeamTaskRereview | Preview the revised contribution, revision explanation, original feedback/scores, assigned criteria and current supporting evidence. |
| reviewIntakeTeamRevisedTask | Append review 2 of submission 2 with explicit decision, fresh assigned-domain scores, feedback, declaration and confirmation. |

Evidence verification records its originating task-submission version 2 in the existing verification provenance. The evidence validator now resolves the matching task submission rather than always assuming submission 1; earlier version-1 verification records remain unchanged and valid. Evidence verification alone changes no task submission, review, score or completion flag.

The second individual review offers VERIFIED only when supporting evidence is currently verified. PARTIAL and RETURNED keep done=false. Scores reuse the existing DEMO_0_4_V1 model with exact assigned keys, integer 0–4 or explicit null. New scores and feedback are required inputs and are never copied by default from the first review. No passing threshold, whole-activity completion, official grade, certificate or achievement is inferred.

## Retained history and consistency

Review 2 records its own submission/mapping version, student, decision, score values including null, feedback, criterion snapshot, evidence binding, reviewer/time and source provenance. It retains explicit bindings to the revised submission, unchanged task and original review. Review 1, both student submissions, execution history, assigned criteria, other tasks and intake/final/start history stay unchanged.

The shared validator reconstructs the pending revised task, validates its original reviewed state and appended revision, then validates review 2. Verified completion requires current verified supporting evidence and its current binding. Historical partial/returned reviews against unverified evidence remain valid history if shared evidence is verified later; no historical score becomes completed work automatically. Other controlled operations and task assignments continue with valid second-review states. Existing initial-review commands, generic/demo edits, toggles and reopen commands cannot bypass the revised-work path.

Both operations require fresh mode-specific preview tokens and exact workspace/submission/review/evidence versions. Tokens cannot be exchanged between evidence verification and individual review. Two trusted loads reject source/account/authority changes. Atomic workspace CAS and content-free audit insertion prevent partial updates after audit failures or concurrent winners. Evidence reasons and review feedback/scores remain referenced in their records rather than copied into general events or the ledger.

This remains the bounded first-revision cycle: a second review can record partial/returned work, but further student revisions/reopening require a deliberate subsequent workflow extension. This increment adds backend operations and saved-result compatibility; revised-work verification and decision screens are next. The existing scoped result section can display the latest saved review while earlier records remain in history.

## Optional source-link correction

Testing exposed an existing mismatch: the UI and schema described source links as optional, but teamEvidenceUrl rejected the empty string. Empty source links are now accepted; supplied links still require HTTP/HTTPS without embedded credentials or control/space characters. Real initial and revised evidence submissions without links are covered by the new lifecycle test. This does not fetch links or enable file uploads.

## Verification and pending work

check-intake-team-task-rereview-save.mjs uses the actual approved/started/reviewed/resubmitted SQLite lifecycle. It covers mentor-only and same-person alias scope, fresh declaration/feedback/scores, all three review outcomes, verification required before completion, revised evidence version 2, old-review/submission immutability, null versus zero, strict field/version/token checks, changed sources/authority/holds, atomic rollback/CAS and content-free audit, duplicate decisions, later shared-evidence verification, changed provenance, scoped own/peer/mentor results and generic-command denial.

Full regression evidence: AUTOMATED_BASELINE_STAGE207.json. Next: connect revised-work evidence verification and individual re-review screens. Browser/keyboard/institutional acceptance, further revision cycles, private uploads and approved live-source activation remain pending. Semester progression stays deferred. No SQL schema, role grant, provider configuration, score scale or audience change was made.
