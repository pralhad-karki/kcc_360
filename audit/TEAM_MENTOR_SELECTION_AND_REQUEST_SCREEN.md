# Stage 175 — Authorized mentor selection and request screen

## Minimum change and workflow impact

Connect the existing `requestIntakeTeamMentor` backend to the existing Dashboard → Activity Intake overview → detailed proposal/mentor selection flow. Add two bounded read commands on the existing authenticated workspace endpoint: `readIntakeTeamMentorRequestQueue` and `readIntakeTeamMentorCandidates`. Extend the existing mentor-read file and add a browser-only request controller. No SQL migration, navigation module, endpoint, engine command permission, provider, real role grant or institutional activation is introduced.

Only the current verified active person holding the unique explicit scoped MENTOR_ASSIGN authority sees reviewed proposals with no prior mentor-assignment history. The current reviewed proposal and frozen team/source/route must still validate. A first reviewer, final approver, broad demo role or student alone has no assignment right. An authorized assigner with zero eligible mentors still sees the pending proposal and an empty eligibility page, rather than a fabricated candidate or a hidden completed task.

Candidate discovery reuses the same source-snapshot validator as request creation and mentor responses. Eligible mentors must have verified actor-to-person mappings, active identities and current available PROJECT_MENTOR eligibility within the approved institutional/kind/academic scope, independent of the team and assigner. Multiple verified actor aliases produce one choice per stable person. Candidate display labels come from the approved eligibility source when provided, otherwise the verified actor ID; names are never invented. The paged projection contains only mentor actor ID, display label and a source-selection reference. It does not expose stable person IDs, authority mappings, raw bindings, fees or private capacity assessments. The proposal's optional student mentor preference is displayed as a preference, without assignment or automatic matching.

Read operations load trusted sources twice, compare fingerprints and projection equality and perform no writes/audit inserts. Both proposal queues and candidate pages are bounded to 20 rows. The proposal detail exposes only the submitted fields needed for assignment and the separate consultation-required flag.

## Selection freshness and compatibility

Extract the existing assigner-authority check into a shared function within its current server file; existing request/response authority and scope rules stay the same. Candidate reads provide a SHA-256 selection reference over the existing source snapshot and chosen actor ID. The request screen sends it as optional `selectionToken` on the existing command. When present, the save requires exact equality with the freshly rebuilt source reference before either save stage can commit. This catches changed eligibility version, scope or actor/person mapping between selection and confirmation.

The reference is not a permission or credential: the server still verifies current explicit assignment authority, eligibility, proposal/team/review, independent identity and atomic workspace revision. Existing trusted server callers without this additional field retain their prior strict command contract and current-source validation. No existing field is removed or reinterpreted; unknown fields and malformed references remain rejected. The new screen always supplies the selection reference. Assignment records and audit formats remain unchanged.

## Screen behavior and adjacent workflows

The authorized dashboard links to the existing module overview, which lists reviewed proposals awaiting mentor requests. Opening a proposal fetches current candidates; choosing one opens a confirmation form with mandatory expertise/fit, availability/capacity assessment, assignment reason and explicit confirmation. Student preferences and approved source labels are escaped. Selection alone sends no request and confers no membership or supervisory permission. The resulting assignment is REQUESTED; the existing mentor queue and controlled response screen handle acceptance or reassignment requests afterward.

The new controller validates read/write actor, workspace, review, submission and assignment references. Snapshot/account/cache/generation/modal and lock ownership guards reject stale interactions and late responses. It applies only a separate fresh full-workspace response after a successful request, never a minimal command result. Conflicts and uncertain saves require refreshing status rather than automatic replay. Closing a dialog after a committed save still allows the matching workspace refresh. The extension preserves existing request/response screens and refresh/reset hooks, and is not included in the server engine.

Default institutional composition remains disabled with no approved providers; the ordinary hosted demo gains no institutional authority. No real notification is sent and no full demonstration data is inserted. Site audience and owner API authentication, the navigation hierarchy, existing individual workflows, MIS/future LMS ownership and parked semester progression remain unchanged.

## Verification

`check-intake-team-mentor-selection.mjs` exercises actual draft/team/consent/first-review fixtures, trusted providers, dispatcher and SQLite. It verifies assigner-only discovery, no read writes, eligible source labels, stable-person alias deduplication, an actual 23-candidate paged result, privacy allowlists, changed-version selection denial, revoked authority/eligibility, malformed/stale references, changed sources between loads, successful existing request creation without autoacceptance, disappearance after assignment and duplicate denial. Null malformed request fields still produce controlled validation errors. Existing mentor request and response tests verify behavior after the shared authority extraction.

`check-intake-team-mentor-request-client.mjs` loads the actual response and request controllers together in a VM. It covers default-disabled access, dashboard/module/selection/confirmation, optional preference display and escaping, explicit candidate choice, mandatory assessments/confirmation, exact source-bound request, empty/paged/malformed/stale candidates, command-result checks, full-workspace-only apply, duplicate prevention, conflict/failed-refresh handling, account changes and lock ownership.

`check-team-command-route.mjs` verifies both read commands remain disabled 503 with no stored mutation in the actual HTTP route. Full regression evidence: `AUTOMATED_BASELINE_STAGE175.json`. TypeScript and production build are checked separately. Browser, keyboard, print and institutional acceptance remain **Not run**; local fixtures and VM checks are not acceptance results.

## Next

Add controlled mentor withdrawal/replacement with preserved assignment history and fresh acceptance, so a recorded reassignment request can be resolved. Then connect interdepartmental consultation and separate final approval/execution readiness. Real provider configuration, notification transport and institutional acceptance remain pending. No production-readiness milestone or formal SRS acceptance closure is claimed.
