# Stage 206 — Assigned-student revision form

## Entry and review of earlier work

The existing activity overview offers Prepare my revision for the recorded assigned student on an initial PARTIAL or RETURNED task in a started institutional team activity. Blocked work, completed work and submissions already awaiting review are excluded. The backend remains authoritative: readIntakeTeamTaskRevision checks the current student person, accepted mentor/source/consultations/mapping, active team, holds and versions before supplying the preview. No permissions, account-alias visibility or live sources were changed.

The form shows fixed task output/responsibility/evidence requirements and criteria, earlier mentor feedback and historical scores, and the original contribution/evidence reference. Historical null and zero scores stay distinct and are not editable. The original contribution is copied into an editable revised-contribution field; the original record remains read-only. Evidence selection begins empty and supports either new description/source-link evidence or an explicitly selected controlled existing team reference. New-evidence fields must remain blank when reusing an existing reference. Private uploads remain pending.

Students must describe how feedback was addressed, acknowledge it and confirm their revised work. The client rejects unchanged contribution/evidence content, including identical copied evidence and verification-status-only changes. It also checks exact field sets, text bounds/control characters, current evidence indices and optional HTTP/HTTPS links. User content in the preview and prefilled textarea is escaped. Task criteria, assignments, scores and previous reviews are never editable through the form.

## Save and history proof

resubmitIntakeTeamTaskWork receives exact source/task and expected execution/submission/review versions plus the fresh preview token. Duplicate clicks are locked. Save-response workspace data is ignored. A separate full workspace GET must prove submission 2, unchanged submission 1 and mentor review, unchanged criteria/execution/other tasks/evidence, correct student contribution/source/time and original-task provenance, feedback acknowledgment and Under review with no current completion. New evidence is checked against its expected new index/content/source; reused evidence must match its original record. Only then is success shown and the refreshed workspace applied.

Stale/malformed previews or responses, account changes during reads/saves/refreshes, closed/replaced preparation and failed refreshes cannot silently replay a save or apply another account's data. An uncertain outcome invalidates the form and asks the student to refresh and inspect task history before retrying. The existing scoped read-only result panel retains earlier feedback/scores as historical while revised work awaits fresh assessment.

## Verification and next work

check-intake-team-task-revision-client.mjs covers own PARTIAL/RETURNED entry, current original feedback/submission/scores/criteria, escaped content/prefill, forbidden score/criteria edits, acknowledgment/reason/confirmation, genuine changes versus status-only/no-op copies, URLs/indices/field limits, exact preview/result versions, original/new record reconciliation, duplicate clicks, stale/forged/account/closed-modal and failed-refresh handling. Real trusted dispatcher → SQLite → scoped student-workspace round trips cover new evidence after a partial decision and reuse of verified shared evidence after a returned decision. Earlier submissions, mentor feedback/scores and other records are preserved; neither revision inherits completion.

Full regression evidence: AUTOMATED_BASELINE_STAGE206.json. Next is controlled fresh mentor review of revised submissions. Browser/keyboard/institutional acceptance, private uploads and approved live-source activation remain pending. Semester progression stays deferred. This form uses the existing bounded first-resubmission backend; it adds no backend command, SQL schema, grants, provider configuration or access-mode change.
