# Stage 170 — Version-bound first review and controlled revision loop

## Minimum change and preserved boundaries

Extend the existing dedicated intake/team dispatcher with `decideIntakeTeamFirstReview`. Keep default-disabled production composition and the existing endpoint, owner/origin/account checks, trusted providers and workspace transaction. No SQL table, navigation module, ordinary engine command or institutional role provisioning is added. Existing individual intake workflows remain unchanged.

The currently assigned independent first reviewer can record RETURNED with actionable feedback or REVIEWED (first review recorded). Neither is final approval, confirmed consultation, mentor assignment, academic recognition or permission to start. The separately configured final approval authority remains unchanged. Research Coordinator and academic subject/fallback routing continue to use approved current assignments and stable person identities, including where an account has several roles.

## Decision and return lifecycle

The new save helper reuses current first-review authorization and verifies exact intake, handoff and submitted-version references. A reason is mandatory. Only one decision is allowed per frozen handoff. Both trusted loads must still authorize the same version and have identical source/workspace fingerprints; stale, revoked, changed, duplicate or unauthorized decisions cannot commit. Workspace and structured audit save atomically using the existing revision guard. Audit metadata references the intake/submitted version and decision reason path in `teamFirstReviewDecisions`; it does not copy feedback or proposal content.

Decisions append to `teamFirstReviewDecisions`; the immutable `teamFirstReviews` snapshots and intake `submissions` remain unchanged. RETURNED changes the main intake to RETURNED. REVIEWED retains the submitted intake and derives FIRST_REVIEWED status. Completed/returned reviews leave the reviewer's pending queue. The initiating student receives feedback; other members receive minimal own participation status without feedback or proposal details. Current source checks still govern reviewer access to any retained detail.

Only a valid return tied to the latest frozen version unlocks the author's existing draft editor. A successful edit advances the draft revision and sets the source team version to the latest invitation-round version plus one. Repeated edits before a new invitation round do not create artificial rounds; editing after a fresh round invalidates that round and again requires fresh consent. Existing invitation revision then creates a new round with pending nonlead invitations. All required members must accept the current content/team binding before controlled resubmission. The existing current, approved lead-grant and academic mapping requirements remain in force; no grant is automatically created or renewed by editing.

Resubmission appends a new immutable intake submission and sequential first-review handoff. Earlier teams, responses and decisions remain preserved. Old review links cannot decide the new version. Generic submission/coordinator triage remains blocked for team cases; a first-review completion cannot be used to edit the draft or bypass final approval.

## Existing UI/controller

The scoped detail view offers the decision form only when the server projects current first-review decision capability. Explicit choice and bounded feedback are required. Client flags never authorize the write; the server reloads identity, sources and current assignment on every decision. Participant status supports RETURNED, REVISION_IN_PROGRESS and FIRST_REVIEWED, with lead-only feedback. The ordinary author editor remains available only after a valid return.

Decision responses are minimal and cannot replace workspace records. After a successful decision, the controller fetches the existing full workspace, checks actor/revision and only then applies it. Conflicts are not replayed; failure to confirm/refresh requires a fresh workspace. Account/cache/modal and request-generation guards prevent stale decisions, and lock ownership prevents old responses affecting newer work. Assets advance to v191. The dedicated controlled team submit/resubmit button remains the next controller connection; its guarded server command and entire revision/consent/resubmission chain are tested here, not claimed as an activated live institutional UI.

## Verification

- `check-intake-first-review-decisions.mjs`: actual configured academic intake/invitation/submission chain → assigned faculty return → real existing engine edit → explicit updated approved fixture source → revised invitation round → fresh invitee acceptance → immutable resubmission → first review recorded. Also verifies Research Coordinator return with consultation still required. Checks reasons and person/version authority, retained snapshots, duplicate/stale links, private feedback/audit references, no automatic mentor/project/final approval, source changes, audit-failure rollback/retry and concurrent-winner preservation. The generic draft engine result is persisted as a fixture for the existing generic save lane; institutional permissions are not provisioned by the test or application.
- `check-intake-first-review-decision-client.mjs`: actual VM controller form, mandatory choice/reason, exact version references, full-refresh-only replacement, no conflict/duplicate replay, failed-refresh recovery, stale account/lock handling and durable saved response after modal closure.
- Existing read/controller checks retain read-only scenarios; only the expected pending-reviewer capability now becomes true. Malformed capability checks still reject nonboolean/unauthorized values.
- Actual HTTP route test confirms the new command stays disabled (503) with unchanged data/audit.

Full local results: `AUTOMATED_BASELINE_STAGE170.json`; TypeScript and production build checked separately. An initial source-change assertion expected only 409; a second trusted load that already loses reviewer scope correctly returns 403 before a save can be staged. The fixture now accepts either denied/conflict response and continues to require unchanged payload/audit. No authorization behavior was weakened. Browser/keyboard/print and institutional acceptance remain **Not run**. Broader SRS and audit gaps are not closed by this increment.

## Next

Connect the existing guarded team submit/resubmit command to the current intake interface, with explicit confirmation and fresh workspace refresh. Then connect reviewed teams to authorized mentor/consultation arrangements and the separate approval/execution lifecycle. Live source/role/roster configuration and institutional acceptance remain pending. Semester/year progression and full demonstration data remain parked; MIS/LMS ownership remains unchanged.
