# Stage 204 — Individual mentor decision form

## Entry and preview

The existing activity overview lists each submitted, unreviewed individual task for its recorded mentor account. Shared evidence does not merge individual reviews. The server remains authoritative: readIntakeTeamTaskReview requires the current accepted mentor's verified person, independence, active team, unchanged approved source/mapping and clear holds before returning a fresh preview. No alias visibility, grant or source configuration was broadened.

The form displays the assigned student account, deadline, output, responsibility, evidence requirement, individual submitted contribution, supporting evidence description and optional safe source link, and the exact assigned domain criteria. Source text is escaped; only validated HTTP/HTTPS links render with noopener/noreferrer. Evidence is not fetched automatically. The decision starts unselected. VERIFIED appears only when current supporting evidence is verified; PARTIAL and RETURNED remain available. Each assigned domain provides explicit 0–4 choices and Not assessed, using the existing demonstration scale. Empty means null, while zero remains numeric zero.

Individual feedback, independence declaration and confirmation are required. Extra/missing fields, unassigned domain scores, unavailable decisions, numeric strings outside the exact dropdown values, fractional/out-of-range scores and empty/oversized/control-character feedback are rejected before sending. Completion remains an explicit decision; the form infers no numeric passing threshold.

## Save confirmation

The form calls reviewIntakeTeamTaskWork with the exact source/task references, expected submission/review/evidence versions and preview token. Duplicate clicks are locked. A successful command response is not applied as workspace data. A separate workspace GET must prove the expected task state/completion flag, score values including null, criterion snapshot, feedback, reviewer/time, evidence binding and source/task/submission provenance, plus unchanged supporting evidence and other tasks. The derived assessment status must agree with verified completion. Only then is the new workspace applied and success shown.

Account resets and stale preparation invalidate late results. Closed/replaced preview modals do not reopen. Failed refreshes or unexpected results invalidate the form and ask for refresh/inspection, avoiding replay when a decision may already have saved. The existing read-only result section presents the outcome through its existing privacy-filtered workspace projection. No generic/demo review or reopening command is exposed.

## Verification and next work

check-intake-team-task-review-client.mjs exercises recorded-mentor entry, separate individual cards, exact fresh contribution/task/evidence/criteria, verified-only completion choice, strict score/feedback/declaration/confirmation inputs, null versus zero, escaped text and safe links, malformed/stale preview/results, changed evidence/tasks/provenance, duplicate clicks, account changes during prepare/save/GET, failed refreshes and closed-modal behavior. Real trusted dispatcher → SQLite → scoped mentor-workspace round trips cover PARTIAL, RETURNED and VERIFIED; they confirm that earlier contributions, shared evidence and other reviews remain unchanged.

Full regression evidence: AUTOMATED_BASELINE_STAGE204.json. Controlled student revision/resubmission and subsequent mentor review are next; the current backend allows one initial review. Browser/keyboard/institutional acceptance, private uploads and live approved-source activation remain pending. Semester progression stays deferred. No backend command, score scale, SQL schema, role grant, provider or access-mode change was made in this increment.
