# Stage 203 — Individual mentor task review and scoring backend

## Review behavior

readIntakeTeamTaskReview prepares the current individual submission, task output/responsibility/evidence requirement, assigned domains and criteria, supporting evidence and its verification state. Only the active verified person corresponding to the accepted mentor can prepare or record a review; the reviewer must differ from the assigned student and evidence author. Alternative verified accounts for the same mentor person use the existing trusted mapping, not their displayed role.

reviewIntakeTeamTaskWork records one initial decision: VERIFIED, PARTIAL or RETURNED. VERIFIED is available only with currently controlled independently verified supporting evidence. PARTIAL and RETURNED leave done=false. Feedback, independence declaration, confirmation, exact versions and fresh preview are mandatory. No completion threshold is inferred from scores: the existing DEMO_0_4_V1 scale permits only integers 0–4 or explicit null for each assigned domain. Extra, missing, string, fractional or out-of-range domain scores are rejected. Null remains Not assessed, including when the mentor separately verifies completion.

The review reuses taskReviews and retains submission/student/mapping versions, decision, scores, feedback, criterion snapshot, existing evidence binding, reviewer account/time and provenance. Provenance binds the reviewed contribution/submission and original task assignment/execution data to the current final-approved started source. It does not rewrite contribution, execution snapshots, assignment criteria, evidence, other students' reviews or intake/final/start records. No activity completion, certificate, credit, official grade or portfolio achievement is issued by this command.

## Current-state and history controls

Two fresh trusted loads require the accepted mentor/consultations, approved activity mapping, confirmed active team, started activity and absence of pending holds. Exact workspace/submission/review/evidence versions and a full current-project preview token reject stale decisions. Workspace CAS and content-free audit commit atomically; failed ledger writes or competing saves leave no partial review. A content-free ACTIVITY_TASK ledger reference points to taskReviews.feedback rather than copying feedback or scores into general history.

The shared task validator now admits initial reviewed states with exact records and done=true only for VERIFIED. It validates the original submitted state with reviews removed, then validates the independent mentor, assigned score keys, unchanged criterion/task/submission bindings and review-time evidence binding. Historical partial/returned reviews against unverified evidence remain historical after later shared evidence verification; their original binding is retained. Only a review against current verified evidence can represent verified completion. Other controlled operations, including subsequent task assignments, continue to work with valid reviewed tasks. Generic/demo review, reopen, evidence and toggle commands remain blocked.

This increment allows one initial review only. Returning work records the mentor's decision; controlled student revision/resubmission and subsequent review/reopening remain pending. It does not silently return a task to the earlier progress editor.

## Saved-result display and privacy

The existing task-assignment form accepts reviewed states and labels them accurately. A read-only result section shows saved review status in the existing activity overview. Feedback and scores use only review records supplied by the existing scoped workspace view: own student and authorized reviewers see individual data; peer students receive status without private feedback/scores. Partial/returned scores are labelled historical and not verified complete. No decision form or generic write control is exposed in this section.

## Verification and next work

check-intake-team-task-review-save.mjs uses the full actual trusted dispatcher/SQLite approved-started-submitted lifecycle. It checks mentor-only/person-alias authority, current source/hold/roster changes, exact decision/declaration/version/token fields, strict scores and null preservation, completion blocked before evidence verification, partial/returned history, later shared evidence verification, verified completion, immutable criteria/contributions/execution, content-free audit rollback/CAS, duplicate denial, changed stored provenance, subsequent assignments, scoped own/peer/mentor views, escaped result text and existing assignment-form compatibility.

Full regression evidence: AUTOMATED_BASELINE_STAGE203.json. The mentor decision form is next. Revision/resubmission, actual browser/keyboard/institutional acceptance, private uploads and approved live-source activation remain pending. Semester progression stays deferred. No database schema, role grant, provider configuration or access-mode change was made; the score scale remains a demonstration model.
