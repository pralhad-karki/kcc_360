# Stage 238 — saved mock cohort batch dashboard

Baseline: clean 24518c8eedf2674d127e3445c1e0ea315e6b7773, published version 249. Recovered existing Stage 237 API/storage and Stage 236 core; no reset or replacement.

## Completed

- Added `prototype/academic-cohort-batches.js`, composed after the existing read-only cohort preview. Existing Academic Progression readers c1/d1/a1 see Manage fictional batches. Student and other personas do not. Existing individual progression and read-only preview controls remain intact.
- Coordinator selects a fictional cohort and reviews every row before entering a proposal reason. Only official Left College is excluded. Break/repeat/unknown students remain included. The separate final-semester result has no submission control. Pending or applied batches against the same source prevent another proposal control.
- Saved batches display cohort, state, preparation time, counts and review entry. Details retain the coordinator reason, department-head decision/reason/time and before/after placement versions. Applied batches offer no second apply action.
- Only d1 sees approve/reject for a proposed batch. Decisions require a review reason. Only c1 sees application for an approved batch, followed by an explicit required acknowledgment that only the fictional ledger changes. a1 is read-only. UI role checks supplement the existing server guards; owner-controlled demo personas are not institutional sign-in or two independently authenticated people.
- Client requests carry only approved action-specific fields and current actor/revision/source references. No raw student/placement data, browser record write, generic workspace command or automatic retry is introduced.
- Responses are checked for mock mode, no official write-back, source/revision/actor consistency, valid state/decision/binding identifiers, exact row/count/status relationships, before placement versions and applied result versions. Displayed names/reasons/labels are escaped.
- Generation, active persona, modal marker/open state and busy guards prevent late results from replacing another dialog or old-account display. Submit buttons disable during requests. Async replacements focus the named heading using the existing dialog helper.
- All mutation failures and malformed success responses show neutral uncertain-save recovery: the save may have committed; refresh saved batches before taking another action. The previous form/action is discarded. Refresh performs a new GET, never resubmits the command. Preview-only failures say no proposal was submitted.

## Validation

Passed `check-cohort-progression-batches-client.mjs` using actual client scripts and real planner/core-generated fictional responses: full proposal/approve/reject/apply displays and exact requests; preview-before-proposal; independent action visibility; required reason/confirmation; retained before/after results; final/pending guards; escaping; late/duplicate/closed/replaced/account responses; malformed GET/save responses; uncertain-save refresh without replay; no ordinary workspace command or local storage writes.

Also passed existing durable cohort API/store SQLite checks, pure cohort core, cohort preview API/client, individual academic progression, MIS/SSO isolation and shared server regressions. TypeScript no-emit and production build pass. New check added to the reusable runner, now 30 configured checks; no fresh 30-command aggregate run is asserted.

Browser rehearsal used the actual new UI and TypeScript API/service/store/core in a disposable checkout, fictional in-memory SQLite, existing owner stub and a narrow local HTTP bridge. No production database, actual student data, credentials, vendor API or mail provider was used.

Observed coordinator full-cohort preview with six records/five included/one official Left College exclusion, saved proposal at mock revision 1, department-head reasoned approval at revision 2, and coordinator checked confirmation/application at revision 3. Result retained proposal/approval and all before/after versions: included rows advanced semester 3/version 1 → semester 4/version 2; Left College stayed unchanged/version 1. Original ordinary shared workspace remained revision 0 with unplaced academic profiles. Reopening through the narrow frame read the same saved applied batch.

At 320 px child frame width (305 px usable document width), saved detail modal clientWidth/scrollWidth were both 256 px. H2 held focus after loading; Escape returned to Manage fictional batches. Narrow final-semester preview offered no Save fictional proposal control. Student persona had zero Manage fictional batches controls. Browser fixture's unrelated team invitation discovery toast remains its existing unsupported-route limitation; it is not a cohort failure or a success assertion. Managed preview stopped. Full accessibility/screen-reader/touch/institutional acceptance is not claimed.

## Preserved and next

Database schema/migrations, core API/store, existing source architecture, actual academic placements, activity/research/internship/club/learning histories and reflection/email timing remain unchanged. All application in this workflow targets only the existing isolated mock ledger. Live MIS, SSO and mail remain unconfigured/disabled.

Next bounded task: controlled withdrawal of a stale pending mock proposal/approval, with actor/reason/revision guards, retained original proposal/decision and audit history, then fresh preparation. Current source mismatch correctly denies approval/application, but there is not yet a withdrawal action to retire a stale pending batch. Do not silently edit its snapshot or reset its ledger to bypass that boundary.

Official roster/status synchronization, institutional identities/SSO and any authorized MIS write-back still require E-Digital Nepal specifications/access. The immutable mock source is not silently advanced after a saved fictional application.
