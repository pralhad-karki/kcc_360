# Stage163 — linked activity follow-ups and source navigation

Review found that new individual handoff/draft responsibilities were not part of the notification-backed dashboard queue, that a linked proposal had no direct source-intake return control, and that generic pending-proposal notices could remain actionable after linked intake scope became invalid.

## Minimum changes

`prototype/intake-linked-followups.js` reuses existing read-only extension points, notification reconciliation and project overview. It adds no route, command, permission, schema, stored institutional configuration or public delivery channel.

- Current coordinator handoff action when an individual intake is eligible and unlinked.
- Current owner draft/submission and approved-activity preparation actions. They resolve when the workflow advances; preparation is not permission to bypass delivery/start gates.
- Coordinator-only changed-source attention for linked proposals before start. Stale source stops the ordinary draft/preparation/review action; it does not grant a source override or correction power.
- Existing linked proposal-review actions retain their current submitted version and source/independence checks. The existing approved-policy due-date reminders/escalation chain is preserved; new follow-up kinds have no invented deadline or escalation chain.
- Guarded activity → source-intake navigation using current record access and consistent bidirectional IDs. Supporting-only and unassigned readers gain no new project/intake access.

New stored follow-up notices recheck current source, recipient, route, version, canonical base/ID and ACTION phase. Changed/resolved/forged notices cannot authorize stale actions. Existing source reconciliation preserves history/read receipts and resolves superseded responsibilities; no notice itself approves, creates, enrols, starts or completes an activity.

The existing individual handoff readiness helper accepts an explicit actor for read-only queue derivation; the command still uses the actual current actor and remains coordinator-only. There is no client-controlled actor override or new institutional role grant. Browser and generated engine load the same extension; asset queries advance to v184.

## Validation

`check-intake-linked-followups.mjs` covers actual intake/mentor/handoff/proposal transitions, duplicate/read-receipt preservation, correct coordinator/student ownership, return/resubmission versions, stale old mentor notices, changed-source attention, malformed/stale/forged notice denial, cancellation/start resolution, peer/role restrictions, raw/projected parity, guarded source/back navigation and read-only rendering. Approved policy fixtures check the existing proposal reminder, overdue and escalation phases remain available under current source scope.

The focused role dashboards, TypeScript and application build pass. Full local candidate results are retained in `audit/AUTOMATED_BASELINE_STAGE163.json`. Browser/keyboard/institutional acceptance remains Not run because supported browser control is unavailable.

This remains the existing in-app, reconciliation-on-access notification mechanism. No email/SMS, background scheduler, delivery retry service or new publication transport is activated. Real MIS/identity/roster/reviewer grants, team/research first-review activation, progression and full demonstration data remain pending/deferred. Formal AT statuses and existing G-gaps remain unchanged.
