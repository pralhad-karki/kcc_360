# Stage 169 — Current-authority first-review queue and participant status

## Minimum change

Reuse the existing dedicated intake/team dispatcher and workspace endpoint for two read-only commands: `readIntakeFirstReviewQueue` and `readIntakeFirstReviewStatus`. Production composition remains default-disabled with no approved institutional providers. No SQL table, write command, institutional grant, main engine command, separate dashboard module or navigation route is added. Existing individual intake and other module workflows are unchanged.

`server/intake-first-review-read.mjs` reads the frozen Stage 168 handoff. It validates fresh identity/person/tenant mapping and approved dated sources, then reconstructs an editable descriptor only in detached memory for existing normalization. It never reopens or writes the submitted intake. Current normalization/source versions, frozen invitation record, immutable submitted-content digest, current confirmed memberships, lead invitation grant, approved policy and fresh reviewer/approval assignments must still match the stored handoff. The existing resolver is rerun with the stored binding; its complete result must match. A new or fallback reviewer is not silently substituted for a changed historical route.

Only the current assigned first-reviewer's stable person ID receives an actionable-review-status row and read-only proposal/team details. A final approver, another staff role or a broad demo administrator receives no access merely from that label. Even if one account has several roles, the stable-person comparison applies. Participants receive their own minimal historical status without proposal/team detail payload. A withdrawal displays WITHDRAWN to participants; changed sources display SOURCE_CHANGED, while the old reviewer loses both queue and detail access. Expired/revoked identity or unavailable source providers deny the read. Normal workspace views still withhold institutional team records from legacy staff scopes.

Responses are paged (maximum 20) and omit raw bindings, source/approval references, grant data, person IDs, invitation rounds and private financial fields. Current reviewers see only the submitted proposal allowlist and minimal confirmed student IDs/display names/lead flags. These are read-only; `canDecide` is always false. Two fresh trusted loads and identical source/projection fingerprints prevent mixed or stale reads. No ledger or workspace mutation occurs.

## Existing navigation and controller

`prototype/intake-first-review-client.js` adds a conditional read-only panel to the existing Dashboard → Activity Intake overview → submission-detail modal. Team participants see status only; reviewers can read the frozen proposal and confirmed team. Consultation is indicated as required for research, never marked complete automatically. No review, mentor or approval buttons are provided in this increment.

After successful server-owned team access discovery, the controller fetches the minimal scoped queue. Disabled discovery keeps the panel hidden and makes no extra read. The cache is ephemeral, tied to the exact workspace snapshot/account/revision, and is cleared on refresh/persona/reset. It is never persisted or fed into full-workspace replacement. Every detail opening rechecks server authorization. Controller generation, current cache, account/revision and modal markers reject late responses; lock ownership prevents an obsolete response unlocking a newer action. Content is escaped and unknown response fields are discarded. Empty, stale or failed queues do not expose cached records. Browser assets advance to v190.

## Verification

- `check-intake-first-review-read.mjs`: real configured intake/invitation/submission chain and SQLite; assigned academic/research reviewer detail, participant-only status, final-authority/other-role denial, revoked/reassigned/unavailable/version changes, roster/member/grant changes, content/team/route tampering, student withdrawal, double-load conflicts, bounded paging and default-disabled reads. Reads leave payload/revision/audit unchanged.
- `check-intake-first-review-client.mjs`: actual controller in a VM; capability/default hiding, minimal cache, existing three-level links, escaped content, participant status, malformed/cross-role/stale responses, closed modal/account reset, latest-request wins, lock ownership and no workspace replacement/write requests.
- `check-team-command-route.mjs`: actual HTTP route keeps the new reads disabled (503), retaining the existing owner/origin/account/revision checks and data/audit.

Full local results: `AUTOMATED_BASELINE_STAGE169.json`. TypeScript and production build checked separately. Browser/keyboard/print and institutional acceptance remain **Not run**. Controller tests are not browser acceptance; no production authority, live MIS integration or formal SRS acceptance is claimed.

## Next step / boundaries

Implement version-bound first-review decisions and return/revision handling through the existing guarded mechanism. Recheck current authority and source binding at every decision; preserve frozen submissions/teams, audits and one lead reviewer. Consultation and mentor assignment/acceptance, final approval and controlled team execution handoff remain separate later connections. The controlled team-submit UI remains a subsequent controller connection; Stage 168 currently supplies its guarded server command, not an activated institutional submit button. Approved provider/identity/roster/reviewer-policy configuration is required before live institutional access.

Semester/year progression and full demonstration data remain parked. MIS enrolment, fees/results and planned LMS ownership remain unchanged.
