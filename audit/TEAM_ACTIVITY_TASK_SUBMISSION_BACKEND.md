# Stage199 — Controlled initial task evidence and submission backend

## Inspection and essential changes

The existing task workflow records project evidence, then links a student's contribution to it in task.submissions. Shared project evidence is allowed but each student must describe their own contribution. Mentor evidence verification and task review are separate. This increment reuses those existing shapes in the trusted dispatcher; it adds no database structure, API route, role grant or module.

readIntakeTeamTaskSubmission prepares a current task-specific preview. submitIntakeTeamTaskWork atomically records an initial individual submission against either new evidence or an existing controlled project evidence reference. New evidence uses the existing title, description, optional HTTP/HTTPS source URL, author and verified=false fields, plus provenance linking its originating task to the approved started team activity. Links are stored without fetching them or treating them as verified content. A new description/link evidence record and its task submission commit together or neither does.

## Authority and workflow

Only the active verified person corresponding to the task assignee may prepare or submit. Team lead, accepted mentor, coordinator or approver status alone gives no authority to submit another student's work. The existing reviewed/final-approved/started source, accepted mentor/consultations, approved activity mapping, confirmed active members and pending hold checks are reused.

Submission requires current source/task references, preview token, expected execution version, initial submission version zero, individual contribution, reason and confirmation. A current unresolved blocker prevents submission. New evidence must have valid title/description and an optional safe source URL. Existing evidence must come from this same controlled project/source and a confirmed team member; arbitrary indices, outsider evidence and superseded/altered records cannot be substituted. Shared evidence does not copy another student's individual contribution.

The existing task.submissions record stores version 1, assigned student, mapping version, contribution, evidence index and the existing evidence-binding snapshot. Its added provenance retains source references, source digest, prior work state, execution version, submitting account and reason. The task becomes SUBMITTED with done=false. Mapping, criteria, responsibility, evidence requirement, prior execution snapshots, other tasks and intake/final/start history remain unchanged. No score, review, completion, certificate or portfolio achievement is generated.

The shared task-context validator now recognizes structurally valid initial submitted work while preserving the prior execution-state validation. Submitted tasks cannot be reported again through the progress backend. Task managers can still prepare and assign other tasks. The assignment form's existing read-only task list labels SUBMITTED as Under review, not verified complete. Resubmission, return/revision, evidence verification and independent mentor assessment await subsequent controlled steps; this validator must be extended with those operations rather than admitting arbitrary states.

## Atomicity and files

Two fresh trusted loads check the actor, source, complete project preview and workspace/task versions. Workspace CAS and audit insertion are atomic; stale/replayed confirmations, changed sources, failed audit writes and competing updates do not leave orphan evidence or partial submissions. The existing ACTIVITY_TASK audit codec adds a reason reference to submissions.teamSubmissionSource.reason, resolved at the task's referenced submission version. Private contribution, evidence description and reason are not copied into the audit ledger or general event message.

This increment supports text descriptions and source links. Private-file upload integration for institutional team evidence is still pending. Inspection found the generic/demo file authorization could otherwise mutate new unverified institutional evidence. That write path now rejects linked institutional team evidence, preserving ordinary/demo upload behavior and existing reads. No storage service, source provider or live runtime was activated. Controlled evidence currently admits no file attachments and remains unverified; future trusted attachment and mentor-verification operations must update these checks deliberately.

## Validation and next step

SQLite fixtures exercise the full team-review/mentor/consultation/final/handoff/start/task chain, responsible-student-only access, invalid fields/URLs/indices/state/roles, current source and holds, a legitimate blocker report/clear, actor/source/token/version changes, atomic rollback/CAS with no orphan evidence, retained criteria/execution/intake history, new and shared evidence with independent contributions, submitted progress freeze, subsequent assignments, malformed evidence/submission denial and blocked generic upload/verification/review bypasses. HTTP checks confirm both new commands remain disabled by default. Existing private-file checks also run. Full regression evidence: AUTOMATED_BASELINE_STAGE199.json. TypeScript, build and whitespace checks are reported separately.

Browser/keyboard and institutional acceptance remain Not run. The full demonstration dataset is deferred, semester/year progression remains parked, and live institutional integration is still disabled. The prototype is not finalized or production-ready.

Next: connect the controlled evidence/submission form, then implement independent mentor verification. Trusted private-file attachment support and formal acceptance remain pending.
