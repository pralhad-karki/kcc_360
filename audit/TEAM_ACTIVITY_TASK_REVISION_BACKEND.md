# Stage 205 — First controlled student revision and resubmission

## Behavior and authority

readIntakeTeamTaskRevision prepares an assigned student's own initial PARTIAL or RETURNED review, earlier contribution/evidence reference, feedback/scores/criteria, fixed task details and current controlled evidence choices. Current accepted-mentor/source/consultation/mapping/active-team/hold checks are reused. Lead, mentor, coordinator and final reviewer roles do not authorize submitting another student's revision. Completed work, untouched assignments and submissions already awaiting review are excluded.

resubmitIntakeTeamTaskWork appends submission version 2 after the initial partial/returned review. It requires a fresh preview, exact execution/submission/review/workspace versions, feedback acknowledgment, contribution, reason describing the changes and confirmation. Students may add new unverified description/source-link evidence or explicitly reuse current controlled team evidence. Source links are stored without fetching; private-file uploads remain pending. New evidence and the revised submission commit together.

A revision must change the individual contribution or supporting evidence content. A change from unverified to verified alone is not revised work; an identical evidence copy also does not satisfy the change requirement. Title, description, source, author and file-content binding are considered independently of verification status. No score, criterion, assignment, responsibility or mentor decision is editable by this command.

The original submission and initial mentor review remain unchanged in their existing arrays. The new submission records its own contribution, evidence binding, author/time and source provenance, including previous submission/review versions, the complete previous task binding, feedback acknowledgment and reason. Work returns to SUBMITTED / Under review with done=false. Prior scores remain historical and do not verify completion of revised work. Other tasks, original evidence, progress snapshots and intake/final/start history remain intact.

## Scope and consistency

This bounded increment supports one resubmission after the initial review. The student form and subsequent mentor verification/re-review of submission 2 are separate later increments. Existing initial-review/evidence commands reject revised tasks rather than accidentally reviewing submission 1 or carrying its completion forward. Verified tasks cannot be reopened through this student command. Repeated resubmission is blocked while the revised task is under review.

The shared controlled-task validator recognizes exactly two submissions and one preserved PARTIAL/RETURNED review for this pending state. It reconstructs and validates the original reviewed task, requires an exact match to its retained binding, then validates the appended student submission, feedback acknowledgment and changed work. Shared revised evidence may subsequently be used and verified through another valid initial submission; the revised task's original evidence snapshot stays valid without rewriting it. Future re-review must explicitly extend this validation contract.

Two trusted loads reject changed sources/authority; workspace CAS plus content-free audit insertion is atomic. Failed ledger writes and concurrent winners leave neither orphan evidence nor partial revisions. Audit metadata references the second submission's reason and records the reviewed state → SUBMITTED and version 1 → 2, without copying private text into the ledger or general history.

The existing scoped result panel now labels resubmitted work Under review and retains Earlier mentor feedback/scores as historical. Peer students still receive no individual submission/review records through the existing workspace projection. Generic/demo submit, review, reopen, toggle and evidence writes remain blocked. No database schema, permission grant, source provider or access mode changed.

## Verification and next work

check-intake-team-task-revision-save.mjs uses the actual trusted dispatcher/SQLite reviewed-team lifecycle. It checks responsible-student-only scope, PARTIAL/RETURNED entry, completed/untouched/duplicate denial, feedback acknowledgment, strict fields/URLs/indices, genuine revision versus verification-only/no-op changes, source/hold/version/authority changes, atomic audit rollback/CAS, original reviews/contributions/execution/criteria, both new and existing evidence, later shared verification, altered historical bindings, subsequent assignments, own/peer/mentor views, historical display and generic-command bypass denial.

Full regression evidence: AUTOMATED_BASELINE_STAGE205.json. Next is the student revision/resubmission form, then controlled fresh mentor review of submission 2. Browser/keyboard/institutional acceptance, private uploads and approved live-source activation remain pending. Semester progression remains deferred.
