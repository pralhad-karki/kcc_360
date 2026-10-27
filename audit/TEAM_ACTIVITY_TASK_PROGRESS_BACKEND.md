# Stage197 — Controlled assigned-student progress backend

## Inspection and essential change

The existing task model already distinguishes task assignments, student execution reports, evidence submissions and independent mentor verification. Its ordinary/demo execution form reserves work stage and blocker changes to the responsible student; task managers separately control priority and estimated effort. Generic mutations remain blocked for institutional team activities. This increment adds only the controlled student execution backend through the existing trusted dispatcher. No database structure, route, permission grant or new product module was added.

Two commands reuse the current source/start/task model: readIntakeTeamTaskProgress prepares a task-specific preview; reportIntakeTeamTaskProgress records a confirmed report. The existing assignment context now has an internal option to validate the same started source without requiring manager authority. The new progress preparation then independently requires the verified active person corresponding to the task assignee. Lead, mentor, coordinator and final approver status alone cannot authorize reports for another student. A lead can report their own assigned task.

## State, history and audit

Reports accept only TO_DO (stored ASSIGNED) or IN_PROGRESS, a boolean blocker, detail for an active blocker, change reason and explicit confirmation. Clearing a blocker requires an empty current detail; the prior detail remains in executionHistory. No-op reports are rejected. The current execution version increments and the previous execution/state is appended with reporting actor, timestamp and reason using the existing snapshot shape. Mapping, selected domain criteria, evidence requirements, task revision/count, previous task records and reviewed intake/final/start records are preserved.

Shared task-context validation now accepts only controlled ASSIGNED/IN_PROGRESS history with sequential snapshot versions, valid responsible reporting actors/timestamps, unchanged NORMAL priority and unset estimated effort, consistent blocker fields, no submissions/reviews and done=false. This is structural validation and preservation through controlled saves, not a cryptographic guarantee against privileged database edits. Manager priority/effort, task reassignment, evidence submission, review and completion remain separate pending controlled operations.

The read preview is bound to actor, source references, workspace revision and complete project. Saving checks two fresh trusted contexts, current accepted mentor/consultations, active confirmed members, approved mapping and existing pending holds. Stale preview/version or changed source/authority rejects the report. An atomic workspace CAS and audit insertion prevent partial saves and stale replay. Audit metadata identifies the task and execution-version transition; executionHistory.reason references history[versionAfter - 1].reason without copying private reason/blocker text into the ledger or general project event.

The existing assignment form's read-only task list now accepts and labels IN_PROGRESS so another task can still be assigned after an earlier task has progress. Initial new assignments still require ASSIGNED, execution version zero and no completion. No progress form is introduced in this backend increment.

## Validation and remaining work

The SQLite test reuses the actual confirmed-team, first-review, mentor/consultation, final approval, handoff, start and task-assignment fixture. It checks responsible-student-only access, a lead's own task, invalid/forged stages and fields, active people/mentor/hold rules, no-op and stale replay denial, source changes, atomic audit rollback and competing CAS writes, blocker report/clear, sequential snapshots, retained task mapping and source history, subsequent task assignment and blocked generic execution bypass. HTTP checks confirm both commands remain disabled by default. Full regression evidence: AUTOMATED_BASELINE_STAGE197.json. TypeScript, build and whitespace checks are reported separately.

Institutional runtime stays disabled until approved real sources/accounts are configured. Browser/keyboard and institutional acceptance remain Not run. No full demonstration dataset, notifications or semester progression was introduced. This is a prototype increment, not production acceptance.

Next: connect the controlled student progress/blocker form, then evidence submission and independent mentor verification.
