# Stage162 — linked proposal corrections and delivery protection

The end-to-end review reproduced a defect: the generic draft editor could change a linked Workshop/Seminar to another activity type or programme while retaining the accepted intake link. Reclassification could remove the required delivery template or detach the proposal from its reviewed academic scope.

## Minimum fix

Only intake-linked drafts now keep their programme and activity type fixed to the current bound intake. The existing editor displays these two values as read-only and explains the scope boundary. Forged edit payloads are checked server-side. The source-current check also compares programme/type before submission, approval and start, so changing stored classification cannot bypass it.

Title, description and deadline corrections still use the existing versioned editor and independent proposal review. Original submissions remain unchanged after return/correction/resubmission. Unlinked proposals retain their existing editing behavior. Programme/template changes require reviewed intake scope, not a silent generic edit; this increment does not introduce a new scope-change approval module.

Changes are confined to `prototype/intake-activity-handoff.js`, generated copies and browser cache queries. No new route, command, permission, table, shared data or automatic state transition is added.

## End-to-end regression

`check-linked-intake-delivery.mjs` builds both Workshop and Seminar through actual intake, routing, mentor acceptance and draft handoff commands. It then checks:

- Template/programme edit denial and read-only controls; ordinary title/description correction.
- Student submission, independent return, retained original snapshot, correction and resubmission as the next proposal version.
- Peer denial and independent proposal approval; one initiating student only.
- Start denial before delivery-plan approval; returned plan, revised agenda and fresh independent approval.
- Assigned mapped task with current evidence and independent quality review; verified single-student attendance and conducted session matching the approved plan.
- Practical output for Workshop and distinct abstract/paper/slides/references for Seminar.
- Returned submitted-output correction reopening execution, retained prior output and fresh verification.
- Individual reflection, final human evaluation and verified activity completion without automatic certificate issuance or publication.

The test initially failed on the actual scope-edit defect before the fix. Fixture development also corrected expectations to respect existing peer-access denial, mandatory task completion and the rule that only submitted outputs can be returned; those existing controls were preserved rather than weakened.

Focused linked-handoff and legacy delivery tests, TypeScript and application build are checked. Full local candidate results are in `audit/AUTOMATED_BASELINE_STAGE162.json`. Local fixtures do not replace browser/keyboard/print or institutional acceptance; those remain Not run. No formal AT case or existing G-gap is closed by this verification.

MIS/real identity and roster sources, confirmed multi-student teams, Research/subject-faculty first-review activation, institutional approval grants, progression and full demonstration data retain their existing pending/deferred scope.
