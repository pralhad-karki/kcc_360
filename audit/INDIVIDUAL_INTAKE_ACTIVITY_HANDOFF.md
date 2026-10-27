# Stage161 — individual intake to draft activity proposal

Approved bounded increment: connect ready individual academic Project, Workshop and Seminar intakes to the existing Projects proposal lifecycle. Research, opted-in team/invitation and club intakes remain excluded; internship keeps its separate authorized-readiness handoff.

## Behavior

Only the existing coordinator can confirm a handoff with the current intake revision/source binding, reason and checkbox. Current routing must have Academic as the primary unit; the accepted mentor and every configured supporting responsibility must still be current. Club references, institutional team opt-in or invitation metadata prevent this individual path. No annual-plan item is required.

The new activity is CREATED, never APPROVED or STARTED. Project maps to Course project; Workshop and Seminar preserve their types and existing delivery-plan/output gates. The initiating student is the sole initial member and owner. The accepted mentor remains the assigned mentor. Title, purpose, programme, deadline, semester/course, proposed start and expected output are carried into the existing proposal/metadata shape. Staff mentor-fit/capacity notes and private supporting reasons are not copied into project provenance.

Intake submissions, decisions, mentor/support histories and draft revisions are preserved. Source IDs/versions and a minimal binding are recorded on the activity; a reasoned link is recorded on the intake. Existing project/audit histories record creation. Exactly one consistent link can exist: repeated confirmed handoff opens the original draft; inconsistent, stale, duplicate or dangling links are denied. This is ordinary workspace compare-and-swap persistence through the existing API, not a new table or migration.

Student/coordinator submission and independent mentor proposal approval use the existing lifecycle. Submission, approval and start also recheck the intake link, initial participant and accepted-source binding. A changed/revoked source must be resolved; it cannot silently authorize another draft or a start. Existing proposal edits, workshop/seminar delivery requirements, individual evaluation, evidence and later activity controls remain in place. Later authorized activity mentor transfers retain their own workflow; an old intake source must not be assumed current after a changed assignment.

## Integration and scope

`prototype/intake-activity-handoff.js` uses existing extension points for the intake panel, pending-action queue and pre-start checks. One command, `handoffIndividualIntake`, and its bounded reason/confirmation fields are added to the existing allowlists. Browser and generated engine load the same implementation. No new UI module, route, permission grant, schema or shared demo records are introduced. Browser asset version queries advance to v182.

The coordinator sees Create linked draft proposal only when eligible. After handoff the create action disappears and authorized readers can open the existing linked activity. Supporting-only readers receive no handoff panel. The current coordinator-led prototype remains explicitly distinct from future Research/subject-faculty first-review routing and real institutional grants.

## Validation

`check-intake-activity-handoff.mjs` covers actual intake/routing/mentor/support transitions, incomplete/declined/stale prerequisites, actor denial, explicit confirmation and source versions, one-member draft creation, field/history preservation, minimal provenance, repeat/inconsistent links, raw/projected privacy, existing independent approval/start, Workshop/Seminar draft mapping and excluded Research/club/team paths. Existing intake/support/mentor-suggestion/dashboard checks, TypeScript and build are checked. Full candidate results are in `audit/AUTOMATED_BASELINE_STAGE161.json`.

Browser/keyboard/institutional acceptance remains Not run because supported browser control is unavailable. No formal AT/G-gap closure is inferred from fixtures. Real MIS/identity/roster/reviewer configuration, confirmed multi-student membership, configurable institutional approval authority, team/research activation, progression and the full demonstration dataset retain their existing pending/deferred boundaries.

Next bounded review: verify linked draft revision/return and activity start through the existing workshop/seminar delivery process, including clear treatment of source changes rather than adding another workflow module.

The initial full run was 130/144: fourteen checks called legacy command-preservation guards that did not yet include the newly reviewed `handoffIndividualIntake` command. Both guard layers now permit this one explicit addition while preserving uniqueness and the unchanged remainder of the command list. Initial evidence remains in `audit/AUTOMATED_BASELINE_STAGE161_INITIAL.json`; the clean rerun is recorded separately.
