# Stage 235 — mock-backed bulk semester progression preview

Baseline: clean 2cd49fe06cdbdeb3d1397013d8eb8e42e980b5a1, published version 246. Stage 234 identified that individual placement tests did not establish the approved cohort rule.

## Implemented

- Pure cohort-progression-preview.mjs, separate from existing individual-placement business logic. Selects a complete recorded programme/batch/semester cohort by stable normalized identifiers. Only LEFT_COLLEGE produces an exclusion. ON_BREAK, REPEATING and UNKNOWN stay included; extra fee, attendance, failed-subject, held-standing and inactive flags are not exclusion criteria and are never echoed.
- Existing MIS adapter in explicit MOCK composition, using a separate fictional cohort fixture. Base fixtures remain intact. No official E-Digital endpoint, schema or authentication protocol was invented.
- Explicit versioned fictional programme structure, with period order/year mappings and a separate final-semester review outcome. No arithmetic guess from semester names, automatic graduation or credit assignment. Four periods are a fictional test structure, not an approved KCC programme definition.
- GET/POST /api/academic-cohort-preview: existing owner identity gate and c1/d1/a1 academic-reader demo roles; fresh session recheck after source loading; exact cohort/source reference request; same-origin JSON/size guards; no-store responses. No workspace/audit update or new database schema. POST only computes a read preview, with canApply/canSubmit/canApprove false.
- Academic Progression entry and named native dialog. Cards show inclusion/exclusion, current/proposed period and separate final-semester review. Both loading/result headings receive focus after asynchronous replacement. All labels/records are escaped; account, dialog, source and duplicate-request guards prevent stale display/replay. No apply or approval button exists.
- Existing individual placement notice now explicitly identifies its hold rule as individual-placement behavior. Existing hold/resume/advance approvals/history remain unchanged; they are not reused as bulk exclusion rules.

The new preview is reviewable in the owner-controlled demo but cannot update student placement. A complete batch proposal/independent approval/atomic apply workflow remains the next bounded development task, not a capability claimed in this stage. Official MIS synchronization/write-back stays disabled.

## Validation

Passed:
- check-cohort-progression-preview.mjs: six semester-three cohort members, five included and one official Left College exclusion; break/repeat/unknown and adverse fee/grade/attendance/hold flags do not exclude; other semester is outside selected cohort; explicit order/year mappings; final-semester member included for separate review; expired/ambiguous/cross-tenant/invalid sources block the entire preview; detached private outputs and no input mutation.
- check-cohort-progression-route.mjs: actual TypeScript route/service compiled against existing service with in-memory SQLite; owner-only authentication and every non-academic persona denied; c1/d1/a1 allowed; current source and session checks; exact body/origin/content-type/size; stale/repeated/forged apply and mode fields; contacts not disclosed; workspace payload/revision and server audit unchanged on all previews/denials/replays.
- check-cohort-progression-client.mjs: existing-page integration, fictional labels/counts, escaped rows, fixed preview request, malformed/enable/count response denial, duplicate/account/closed/replaced-dialog and failure no-replay guards; no browser record writes or placement commands.
- Existing check-academic-progression.mjs, check-mis-adapter.mjs and check-server.mjs passed. Three new cohort commands added to the reusable task-workflow runner; the prior Stage 234 24-command report remains historical and is not relabelled as a fresh 27-command run.
- TypeScript initially exposed a narrow default-configuration type in the JS adapter; added a typed configuration-mode contract and source-presence narrowing. Final no-emit check and build passed. No @ts-ignore or live enable flag was introduced.

## Browser evidence

Disposable complete checkout, fictional in-memory SQLite and existing narrow local adapter; real new route/service/client code. Coordinator opened Academic Progression, selected semester-three cohort and observed six records: five included, official Left College excluded, with break/repeat/unknown shown as included. Final cohort showed one included final-semester review, no next-period assignment or automatic graduation. Current academic profiles and shared revision remained at their initial version/revision 0.

At 320 px child workspace width (305 px usable document width), the actual preview dialog had equal clientWidth/scrollWidth 256/256. After asynchronous replacement H2 was the active element with the result heading. Escape returned focus to the opener. Only Choose another fictional cohort and Close actions were present. Student persona had no cohort preview control. Full institutional and accessibility acceptance is not claimed. The temporary adapter lacks unrelated intake-discovery support and can show its existing unrelated discovery toast; that fixture limitation is not a cohort success assertion. Managed preview stopped after tests.

## Preserved and pending

Existing source architecture, schema/migrations, academic placement and learning histories, task/research/internship/club workflows, permissions and approved reflection/email timing remain intact. All test people and addresses are fictional; no production credentials were used. Live MIS, SSO and mail remain externally unconfigured.

Next: controlled mock cohort batch proposal and independent review, with immutable source/before-after bindings, stale-source/session guards, whole-batch atomicity and retained history. Official sources and MIS updates remain outside that mock workflow until vendor specifications and authorized integration are available.
