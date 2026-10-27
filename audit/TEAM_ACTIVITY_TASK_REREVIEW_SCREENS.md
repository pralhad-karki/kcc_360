# Stage 208 — Revised-work mentor screens

## Entry and two actions

The existing activity overview lists revised submissions awaiting a second mentor review. The recorded mentor account gets an individual review action per task; unverified shared evidence gets one verification action per evidence item. This is a display hint only: existing trusted backend commands enforce current person/mentor authority, independence, source/mapping/consultations, active team, holds and exact versions. No account-alias visibility, permission or source configuration was broadened.

The evidence-verification screen shows the revised supporting evidence, source link if present, assigned requirement/criteria, original feedback/scores, the student's revision explanation and every submission referencing that evidence. The separate individual-review screen shows the revised contribution, original historical feedback/scores, revision explanation, assigned task criteria and current evidence state. It offers completion only with verified evidence; partial/return decisions remain available. Decisions start unselected, feedback starts empty and every domain starts Not assessed. No score or narrative is carried forward by default.

Both screens reuse the existing bounded text/field, 0–4/null score, feedback/reason, independence and confirmation controls. Original feedback is read-only. User content is escaped and source links are validated before rendering with noopener/noreferrer. Empty optional links display No source link supplied. Evidence is not fetched automatically. Evidence verification does not complete the individual task or the activity.

## Fresh preview and save proof

The common client validates the mode-specific preview against the current task's second submission, first review, fixed criteria, evidence and all linked contributions. Its exact protocol/action/version checks distinguish evidence verification from second review. Each save carries the fresh mode-specific token, submission version 2, existing review version 1 and current evidence version. The backend remains unchanged in this increment.

Save-response workspace data is ignored. A separate full workspace GET must prove the expected result before success or application. Verification requires the exact submission-2 evidence provenance, retained content, mentor/time and unchanged tasks/reviews. Individual review requires the exact appended review 2, new scores/feedback, criterion snapshot, current evidence binding, revised-submission/original-review provenance, unchanged original review/submissions/evidence/other tasks and correct derived completion state. The first review and both submissions stay in history.

Duplicate clicks, stale/malformed results, changed accounts during prepare/save/GET, wrong mode actions and failed refreshes invalidate unsafe results. Late reads cannot reopen closed preparation. An uncertain write outcome requires refresh and task-history inspection before another attempt. The account reset chain preserves newer request locks rather than unlocking another account's work.

## Validation and remaining scope

check-intake-team-task-rereview-client.mjs loads the existing shared form/validation helpers and the new client together. It checks mentor entry, shared-evidence deduplication, all contributions, exact historical/current previews, no inherited defaults, explicit scores/null, required declarations/confirmation, safe links and escaping, stale/malformed/mode/account/duplicate/closed/failed-refresh handling, and independently refreshed saved provenance/history. Real trusted dispatcher → SQLite → scoped mentor-workspace round trips cover new evidence verification, verified completion of revised work, returned second review and partial second review with unverified evidence. Old review/submission/criteria records remain unchanged, and the overall activity stays STARTED.

Full regression evidence: AUTOMATED_BASELINE_STAGE208.json. Browser/keyboard/institutional acceptance, approved live-source activation and private uploads remain pending. The current workflow supports one student resubmission and its second review; further revision cycles require a deliberate extension. Semester progression stays deferred. No backend command, SQL schema, role grant, score scale, provider configuration or audience changed.

Next: consolidate the task-assignment → progress/blocker → evidence → initial review → revision → fresh second-review chain, identify remaining gaps and prepare acceptance checks without treating automated coverage as institutional acceptance.

## Task-cycle checkpoint after screen verification

Automated lifecycle coverage now connects assignment, responsible-student progress/blockers, initial evidence/contribution, evidence verification, individual initial decisions, one student revision, revised evidence verification and a fresh second review. Both partial/returned and verified second outcomes are exercised through real trusted commands, SQLite storage and scoped workspace views. This evidence does not constitute browser or institutional acceptance.

The next concrete workflow gap is another revision after a second PARTIAL/RETURNED decision: the current revision preparation deliberately requires one prior submission and one review, while second-review records contain two of each. A future increment must support additional sequential cycles with retained history and fresh assessment; no route should silently reset those arrays, reopen verified completion or inherit prior scores. Live-source activation, private uploads and manual acceptance remain separate outstanding dependencies.
