# Stage190 — Approved team activity handoff preflight

## Inspection and minimum-change decision

The existing individualIntakeSource/handoffIndividualIntake path explicitly excludes institutional teams. It accepts one participant, demo coordinator/mentor accounts and a narrower set of execution programmes/types. Its linked draft follows the ordinary demo approval/start controls. The institutional team path instead uses current approved source records and a configured final reviewer. Reusing the individual command for a team would lose confirmed membership and apply an inappropriate authorization path.

The next bounded change therefore adds a read-only preflight to the existing readiness detail. Actual team activity creation is not enabled in this increment. The review/grant model is preserved: being a coordinator, mentor or final reviewer is not interpreted as permission to create or start institutional activities. No new module, database structure, route, command or permission is introduced. Ordinary individual handoff and existing activities are unchanged.

## Resulting behavior

Only an authorized fresh readiness read of a valid final-approved team record includes handoffPreview. It shows the proposed CREATED draft details, all confirmed students and the team lead, the assigned mentor account/version, expected outputs, semester/course and dates/SDGs. It retains original source values and does not expose private staff assessment/response narratives, stable person identifiers or raw authority snapshots. Rejected or undecided proposals have no approved-team handoff preview. The preview is omitted from queue summaries and general student workspace projections.

A pending controlled-handoff blocker is always shown; canCreate and executionAuthorized stay false. Same-batch Project/Workshop/Seminar types can show their corresponding existing execution type. Multidisciplinary research remains explicitly unmapped rather than being silently relabelled as an SDG project. Programmes outside the current execution form's set retain their source name and show an execution mapping requirement. Changed current prerequisites add a review blocker. The UI has no creation/start form or button.

The original final-review source/digest validation and two fresh-source comparison remain in force before this preview is returned. The new pure projection shares whitelisted submitted proposal/team preview logic with final review to avoid diverging member lists. It does not write records or audit events.

Inspection also found that the preceding final-review form rejected mentorSuggestion objects even though intake supports {name,reason}. Corrected its strict validator and escaped display to accept that established shape while rejecting extra object fields. Existing data and mentor assignment permissions are unchanged.

## Validation and pending work

Actual SQLite lifecycle checks cover same-batch and research final approval, full team/lead/mentor/output retention, no read-side writes/audit changes, rejection omission, current-source validation, research/programme/prerequisite blockers and private narrative exclusion. VM checks load the actual readiness/final/handoff controllers and verify escaped content, read-only form-free output, strict malformed-preview rejection, missing preview compatibility, research mapping and stale-account response handling. A regression check exercises structured mentor suggestions and extra-field rejection. Full evidence: AUTOMATED_BASELINE_STAGE190.json. TypeScript and build validated separately. Browser/keyboard and institutional acceptance remain Not run; approved real providers and runtime are not activated.

Next: implement a controlled team draft-creation command after defining its current scoped authority and explicit execution mapping, then connect its confirmation form. Keep separate activity start authorization, duplicate/CAS protection and immutable final-review provenance. Do not route team creation through the individual demo command or infer new authority from a display role. Notifications, institutional acceptance and other formal gaps remain pending. Semester progression stays parked; full demonstration data is deferred.
