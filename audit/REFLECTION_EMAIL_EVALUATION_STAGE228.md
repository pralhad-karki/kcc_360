# Stage 228 — appreciation after evaluation

Baseline: clean e05c35eb61c813061b975a53810cbd0c387cf316, published version 239. User approved submission acknowledgment in-app and appreciation email after evaluation, from the responsible evaluating department.

The submission command no longer invokes email preparation, even if a server-side provider is supplied. Existing successful-save acknowledgment remains in-app, with immediate/later sharing guidance. Submitted reflection sharing still does not require evaluation.

The existing submitEvaluation command now invokes the disabled-by-default email runtime after a real changed engine result. It passes the evaluator and target student separately. Queue creation and final evaluation use the existing atomic workspace/audit batch. Persona compare-and-swap protection covers evaluation as well as submission. Contact or sender unavailability does not discard the finalized evaluation.

The planner requires a newly finalized evaluation by the assigned mentor/evaluator for the same current reflection version. It rejects self-evaluation, unchanged final evaluations, unsubmitted/changed reflections, mismatched evaluators and stale evaluation references. Existing engine evaluation permissions remain authoritative. No new department or staff approval permission is granted.

Approved registry contract extension (internal adapter only): evaluationSenders contains actor, projectId, departmentId, senderId, email, version, VERIFIED status and validity dates. Exactly one current verified project/evaluator mapping is required. The responsible institution supplies these mappings for Student Affairs, Academic departments, Research or another approved department. No demo label or request field chooses the sender. A department name is not itself authorization.

Template v2 says the reflection has been reviewed, offers appreciation, and does not imply academic completion or disclose scores, feedback, reflection text or share links. The student/guardian registered-contact, verified relationship and communication-purpose guards remain. Idempotency identifies the final evaluation event and recipient. Duplicate finalization does not queue duplicate messages.

Queued jobs bind the evaluation version/time/evaluator/reflection version and approved department sender. The delivery protocol rechecks both against current saved records and registry before transport. A changed evaluation/mentor/sender or an old submission-only pending job is invalidated without transport. A worker configured for another sender cannot claim it. The approved From address is bound into the request digest. Source records remain private; no migration, reset, mail send, schedule, credentials or provider was installed.

Validation passed:
- check-reflection-email.mjs: actual human-evaluation event, current version/evaluator, department mapping ambiguity/expiry, contact/guardian/consent guards, minimal template, deduplication and private projection.
- check-reflection-email-save.mjs: actual service and SQLite; submission never invokes preparation; final evaluation + queue + audit atomicity; blocked-source evaluation preservation; duplicate finalization; source change/expiry; injection denial; audit rollback; actor/workspace CAS races.
- check-reflection-email-delivery.mjs: evaluation removal/change, mentor change, department sender change, wrong-sender worker and legacy submission-only job protections, plus prior authenticated receipts/retries/uncertainty.
- check-reflection-email-runner.mjs: fake-provider concurrency, persistence-before-transport, uncertainty recovery and source revalidation regression.
- Monitoring, submitted-reflection sharing/client, sync and server checks passed.
- TypeScript no-emit check and production build passed.

Live email remains disabled. Pending activation dependencies are approved institutional identity/contact and department-sender mappings, real mail provider with authenticated reconciliation, and worker/recovery acceptance. Institutional evaluation workflows beyond the existing assigned-evaluator command are not fabricated or bypassed.
