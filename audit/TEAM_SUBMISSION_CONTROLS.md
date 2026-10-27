# Stage 171 — Controlled team submit and resubmit screens

## Essential change and workflow impact

Expose the existing controlled team submission command through the existing Activity Intake screen. No route, module, SQL structure, engine command, role grant or approval authority is added. Existing individual intake and team selection/invitation/reviewer screens remain in place. Dashboard → Module Overview → Detailed Process navigation is preserved.

The existing trusted team-access projection adds an optional submission capability only for the current lead's editable unlinked draft with current accepted membership and a valid first-review route. A revised submission additionally requires the preceding valid return decision, a newer draft and a newer team version. The projection includes the current title, confirmed student IDs/display names and the exact next review/submission references. It does not persist anything, convey authorization to execute, or expose stable person IDs, fees, roster snapshots or authority records. The actual save continues to reload trusted sources twice, revalidate authorization and consent, and commit through the existing atomic workspace/audit path.

A small browser extension adds eligible submit/resubmit buttons and a confirmation dialog showing the current draft/team versions and complete confirmed team. An unchecked confirmation, malformed capability, changed account/workspace/page or changed capability cannot send the command. The command uses the existing workspace and invitation revisions. The response must match its action, actor, next workspace revision, proposal, first-review/submission references, invitation revision and non-execution state. Only a separately fetched full workspace can replace local records; minimal command results cannot. Conflicts and uncertain outcomes require refresh and status review without automatic replay. Lock ownership and generation guards reject late responses after account/reset changes. Closing the dialog after a committed request still allows the matching full workspace refresh.

The institutional runtime stays disabled because approved identity, roster, academic master and authority providers have not been configured. Consequently these controls remain absent in the ordinary hosted demonstration. Local fixtures exercise the enabled path; no real student or authority has been provisioned and no full demonstration dataset was added.

## Verification and limits

`check-intake-team-submit-client.mjs` exercises the actual capability sanitizer and browser controller in a VM: disabled/malformed hiding, content escaping, complete member display, confirmation/current-reference guards, exact command shape, response/reference rejection, full-workspace-only application, no replay, failed refresh, stale-account lock ownership and post-save modal closure. This is controller verification, not an actual browser test.

`check-intake-first-review-decisions.mjs` now also verifies capability absence before acceptance, no-write discovery after acceptance, revoked routing authority, disappearance after submission, fresh pending acceptance after return, and the new version references after renewed consent. It retains the real engine → trusted provider fixture → SQLite return/edit/accept/resubmit/review lifecycle checks. An initial assertion assumed revoking the subject reviewer must remove readiness; the existing valid coordinator fallback correctly retained it. The test now revokes all route assignments to check absence of a valid route. No routing behavior was weakened or changed.

Full regression evidence: `AUTOMATED_BASELINE_STAGE171.json`. TypeScript and the production build are verified separately. Browser, keyboard, print and institutional acceptance remain **Not run**; fixture checks do not close formal SRS acceptance gaps.

## Pending and next action

Next: inspect the existing mentor-assignment and consultation workflow against the reviewed team handoff, then implement only the minimum authorized bridge needed. A recorded first review still does not assign a mentor, complete consultation, grant final approval or authorize execution. Live source provisioning, notification transport and institutional acceptance remain pending. Semester/year progression and full demonstration data remain parked; MIS and future LMS ownership boundaries are unchanged.
