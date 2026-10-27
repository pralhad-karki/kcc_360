# Stage195 — Controlled initial task assignment backend

## Inspection and minimum change

The existing task model supports responsibilities, expected outputs, evidence requirements, selected four-domain criteria, mapping history, individual submissions and mentor verification. Its task-manager rule permits the active team lead or assigned mentor. Generic demo task mutations remain blocked for institutional team activities. This increment reuses that task shape and manager rule through the existing trusted dispatcher, without creating another module, database structure or grant model.

Added readIntakeTeamTaskAssignment and assignIntakeTeamTask. Both remain disabled with the institutional runtime until approved real sources are configured. The assignment form and progress/submission/review commands are not connected in this backend increment. No live permissions, sample dataset or notifications were added.

## Trusted context and authority

A current linked STARTED activity, frozen final approval and recorded start are required. The context reuses reviewed-source validation, current mentor/consultation readiness, approved execution mapping and existing pending-hold checks. Shared readiness and hold checks were extracted from their existing implementations so the established review/start behavior stays consistent. Source scope and complete active verified team membership are rechecked from fresh trusted sources.

Only the verified stable person corresponding to the frozen project lead or accepted mentor may prepare/assign tasks. Coordination, final review, handoff or start permission alone does not grant task management. A separately verified alias for the same accepted mentor is supported. Assignees are limited to confirmed active members; the mentor, outsiders and unverified accounts cannot be substituted.

The read-only preparation returns verified candidate student IDs/names/accounts, the existing four domains, a minimal current task list, task revision and an actor/source-bound preview token. It does not expose stable person IDs, fees, mentor capacity assessments or other raw institutional source records.

## Assignment and retained records

A new task requires a title, assignee, valid deadline, expected output, responsibility, evidence requirement, one or more existing domains and a criterion for each selected domain. Optional group reference uses the existing field. Unknown or duplicate domains and missing/extra criteria are rejected. A reason and explicit confirmation are required. The operation accepts only initial new assignments; editing, reassignment and mapping revisions remain separate pending controlled operations.

The save checks current source/final/start references, workspace and task revisions and preview token on two fresh trusted loads. Workspace CAS and atomic audit insertion append one existing-shaped task and increment the project task revision. Prior tasks, intake/final/start/handoff and academic source history remain unchanged. The mapping begins at version 1, work state ASSIGNED, done=false and execution version zero. No evidence submission, verified result, score, completion, portfolio achievement or certificate is produced by assignment.

Selected domain criteria and evidence requirements remain attached to the task for later independent mentor review. Academic-period metadata comes from the preserved activity programme/semester; unavailable year information remains null rather than being inferred from MIS. Audit metadata identifies ACTIVITY_TASK and references its actual mappingReason field without copying the reason into the audit ledger.

Duplicate/stale confirmations cannot create another task. Failed audit insertion and concurrent CAS writes leave no partial task. Generic demo task toggling/completion remains blocked. Task definitions are preserved separately from future progress and performance evidence.

## Validation and next step

Actual SQLite lifecycle fixtures cover verified lead/mentor and alternate mentor alias access, denied reviewer/admin/ordinary participant access, exact confirmed candidates, selected four-domain criteria, invalid dates/fields, outside-team assignees, inactive people, revoked mentor sources, pending holds and source changes, exact token/revision/confirmation, stale replay, audit rollback/CAS, retained previous task/history, typed audit privacy and blocked generic self-completion. HTTP checks cover both new commands' default-disabled behavior. Full evidence: AUTOMATED_BASELINE_STAGE195.json. TypeScript and build checked separately. Browser/keyboard and institutional acceptance remain Not run.

Next: connect the task-assignment form and verified team selection to these commands, then add controlled assignee progress/blocker updates and evidence submission/mentor verification. Notifications, live source activation and formal acceptance remain pending. Semester progression is parked; the full demonstration dataset is deferred. The prototype is not yet finalized or production-ready.
