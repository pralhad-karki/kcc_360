# Department and institutional dashboard requirements — queued for definition

Recorded from the user's discussion on 17 October 2026. This extends the dashboard plan; it does not change approved institutional policy or implement the metrics below. Address the scope and metric definitions after the current access foundation, before dashboard finalization and full demonstration-data population.

## Access and filters

| Audience | Planned reporting scope |
| --- | --- |
| HoD / academic coordinator | Assigned departments, programmes and cohorts, with scope from approved institutional assignments. |
| Director | The director's explicitly authorized remit; a title alone does not confer academic or institution-wide access. |
| Principal / authorized administrator | Institutional aggregates and permitted department/programme/batch/semester drill-downs. Individual support records require separate permission. |
| Authorized student-support staff | Assigned referrals and follow-ups, subject to approved record classification and access. |

Shared filters should include reporting period, academic session/year, department, programme, batch and semester, respecting the different approved calendars. Retain the academic mapping that applied to historical activities. Current cohorts and historical cohorts must be distinguishable. College-wide totals deduplicate stable student/activity IDs rather than sum overlapping roles or units. Base rosters, institutional units, enrolment and teaching assignments remain authoritative MIS data; KCC360 does not create a parallel roster or LMS.

## Activity and outcome counts

| Requested information | Definition and evidence work needed before implementation |
| --- | --- |
| Total events, projects, seminars and workshops | Adopt one activity taxonomy. “Events” may be an umbrella count, not an extra category to add to its subtypes. Deduplicate converted approved-plan items and their linked execution records. |
| Planned / ongoing / completed / incomplete | Approve the state mapping and whether primary categories are mutually exclusive. Preserve raw workflow states and independent verification basis. Pending approval and returned proposals must remain distinguishable. |
| Incomplete work with reason | Record the authorized disposition/reason, responsible person and follow-up. Overdue does not automatically mean formally incomplete; missing reasons must be shown as not recorded. |
| Reflections | Distinguish required, submitted, evaluated and approved-for-website-publication reflections. Count current individual/activity versions while preserving revision history. |
| Publications | Define publication categories and verification evidence. Academic publications, conference outputs, media items and published student reflections must not be silently treated as equivalent publications. |
| Verified outcomes | Reuse current verified-record calculations and show denominator, period, filters, freshness and missing-data limitations. Submission alone is not verified completion. |

## Student engagement and support

- Define “active,” “less active” and “inactive” as engagement categories within an approved reporting period, separate from official enrolment or Left College status. Establish the roster denominator and applicable exit dates from MIS.
- Use assigned responsibilities, completed/verified tasks, relevant participation and follow-up records. Consider assessment coverage and completed-task performance across the four learning domains without inventing weights or treating missing scores as zero.
- Approve thresholds, exceptions, programme-calendar differences and the evidence required for each indicator. Insufficient or missing data must have its own label; it must not automatically classify a student as inactive.
- Treat students needing counseling as restricted priority-support referrals, not automated diagnoses or permanent labels. Define authorized identification/review, recorded concern, assigned support person and follow-up. Aggregate counts and identifying case lists need different permissions; notes must not appear in general leadership dashboards.
- These indicators do not block semester progression. The user's bulk progression rule and the decision to keep progression development pending remain unchanged.

## Development order

1. Complete the current project resource-scope checks and protected read helper.
2. Reconcile dashboard metric definitions and role/scope coverage with the existing SRS and workflows; list missing sources explicitly.
3. Add one department overview using verified existing sources, then scoped student-engagement indicators after thresholds are approved.
4. Add the restricted counseling/referral list and follow-up workflow after its authority and record classification are defined.
5. Add institutional department/programme/semester comparisons with deduplicated totals and tested drill-down scope.
6. Finalize the prototype, then populate the approved demonstration dataset and perform browser/user acceptance.

No thresholds, new counseling permissions, publication claims, activity classifications or production access are approved by this planning note. Reflection website publication, real MIS/LMS integration and multi-role account activation remain separate pending work.

## Stage 55 — Metric and audience contract (17 October 2026)

Reconciled with the draft consolidated SRS pp.24–25 and 59–61 (MET-001, AT-14 and Annex F). Definitions below are a reporting implementation contract, not adoption of new institutional thresholds. Existing report access remains demo-only; programme/year/date UI filters do not enforce departmental authorization.

| Metric | Definition | Current source / missing inputs | Audience contract |
| --- | --- | --- | --- |
| Verified activities / types | Distinct non-cancelled verified activity IDs; events are an umbrella, never added to subtypes. | Existing reportSnapshot / verifiedActivity; taxonomy approval and stable department mappings missing. | Scoped academic aggregates; institutional totals deduplicate shared records. |
| Approved-plan completion | Verified completed linked items / approved non-cancelled items in period × 100; zero denominator = N/A. | Existing approvedReportItems; department ID and approved reporting calendar pending. | Assigned academic scope; aggregate-only leadership. |
| Planned / ongoing / incomplete | Retain raw workflow states; approve exclusive reporting categories. Overdue is not formal incomplete; absent reasons = not recorded. | Existing states, due dates and change history; formal incomplete disposition/reason mapping pending. | Scoped aggregates; authorized record drill-down only. |
| Participation | Distinct verified participants / eligible defined-cohort participants × 100; attendance and successful completion separate. | Verified participant numerator available; authoritative MIS cohort denominator missing, so rate unavailable. | Assigned cohort aggregates; student identities require record access. |
| Tasks and four domains | Show assigned, verified and assessed task counts, assessment coverage and existing domain scores; missing scores = N/A. | Existing performanceDomainSummary; no approved engagement weights or thresholds. | Existing authorized assessment views; no expanded leadership access. |
| Reflections / publications | Required, submitted and evaluated reflections separate from approved website publication; publication categories distinct. | Individual reflection versions/evaluations exist; public publication approval/register missing. Showcase consent is not website approval. | Private content retains existing permissions; leadership receives permitted aggregates only. |
| Student engagement | Active / less active / inactive require approved period, thresholds, exceptions and roster. Insufficient data = unknown. | Assigned and completed tasks available; authoritative roster and approved classification policy missing. | Assigned departmental aggregates; permitted student drill-down only. |
| Priority student support | Reviewed referrals with concern, responsible support person and follow-up; counts separate from identifying case lists. | No referral workflow or approved counseling authority/classification. No automatic diagnosis. | Separate support permissions; general dashboards never expose counseling notes. |

### Common reporting rules and minimum impact

Every result must show period, active filters, verification basis, source freshness and denominator where applicable. For the first bounded overview, retain current due-date period semantics and label them explicitly; submission/completion timestamps are different measures. Show unavailable rather than zero when a source or denominator is absent. Institutional totals use stable IDs; disclose shared-record inclusion in departmental totals. Only authorized approved mappings may support production department drill-downs and exports; filters never grant access.

Current `planningMetadata.department` is free text from an academic plan, not an institutional department ID or permission. Some records have no mapping; show an explicit unmapped bucket rather than infer from programme, responsible unit or current student placement. Batch/semester/year metadata describes the source plan at conversion, not necessarily current enrolment. Two demo academic profiles cannot establish the institution's active student denominator. `primaryUnit: ACADEMIC` is a responsibility category, not a department.

The next small implementation may provide a clearly provisional overview grouping existing academic-plan metadata, counting each visible activity once and disclosing excluded/unmapped sources. Reuse existing report calculations and record guards. Add no schema, new routes, grants or parallel MIS roster. Test linked plan/activity deduplication, missing mappings, cancelled items, zero denominators and existing actor scope. This is an internal prototype view, not verified production departmental authorization. Engagement classification, publication and support cases wait for their missing policy/source contracts.

Current step changes documentation and SRS Coverage presentation only. Existing workflow transitions, records, permissions and dashboard calculations remain unchanged. No original reconciliation gap or acceptance case is closed by recording this specification. Semester progression and full demonstration population remain deferred.


### Stage 56 — Provisional department activity overview
Operational Reports now groups distinct, currently visible activities by retained academic-plan department labels, with verified/cancelled/overdue counts and expandable source-record tables. Blank or absent labels have an explicit unmapped bucket. Existing period/programme/year filters and report access apply. Labels are escaped and are not authoritative department IDs or production access scope. No roster, schema, grants, workflow transitions or engagement thresholds change. Department comparisons use one retained label per activity; shared mappings remain pending. No full demonstration data added and progression remains deferred.

Validation: report fixtures cover duplicates, missing mappings, filters, cancelled verification, overdue, escaped labels and Finance/student denial; existing report and freshness fixtures, TypeScript and production build. Browser acceptance remains pending. Next: approved-plan completion by source department with linked-item deduplication and explicit denominators.


### Stage 57 — Department approved-plan completion
Extended the provisional source-label overview with approved-item denominators, verified linked-item numerators, completion percentages and expandable plan/item provenance. Reuses approvedReportItems (latest approved revisions, stable item deduplication, cancelled item/linked activity exclusion) and verifiedActivity. Plans with no execution activity still appear; zero denominator is N/A. Academic plan department labels come from the approved source revision; missing/club labels remain unmapped. Activity conversion labels can differ and are explicitly distinguished. Plan period uses item end date; activity counts use activity deadline. No student roster, schema, route, grants or workflows changed; original SRS gaps remain open.

Validation: report fixtures include cross-total reconciliation, source-label versus activity-label differences, plan-only rows, latest approved revisions with newer drafts, cancelled items/activities, item-date filtering, empty/zero denominators and existing role denial. Freshness/render checks, TypeScript and production build also checked. Browser acceptance remains pending. Next: connect reporting to existing role dashboard navigation without expanding access. Progression, engagement policy, restricted counseling, website publication and full demonstration data remain pending.


### Stage 58 — Dashboard to department reporting navigation
Added a compact source-label reporting card for existing institution-reporting demo personas (Administrator, Coordinator, Department Head, Student Affairs), including the Administrator's institutional overview context. It displays current report filters, mapped-label count and unmapped-activity count. The guarded link opens a focused overview inside the existing Reports module; expandable activity and approved-item source tables provide details, and a return action restores the complete operational report. No new route, role, permission, schema or workflow is introduced. Finance and other personas cannot acquire department access through a stale focused view or direct navigation helper. No new Principal/Director account or department-scoped production authority is claimed.

Validation: all-persona card eligibility, module/detail navigation, retained filters, return path, stale-role denial, leadership context and dataset immutability; reporting, existing role/faculty/leadership dashboard and freshness regressions, TypeScript and build. Browser acceptance remains pending. Next: reconcile dashboard coverage and source/policy dependencies before further reporting expansion. Semester progression and full demonstration dataset remain deferred.


### Stage 59 — Dashboard coverage and dependency reconciliation
Reviewed existing role dashboards, reporting navigation and source calculations. Updated the stale Stage 51 role-coverage register through current implementation, with a visible available/missing/owner/next-action matrix in SRS Coverage. Existing account contexts are not production multi-role grants. Department labels remain provisional; source gaps for MIS rosters, stable unit mappings, engagement policy, counseling authority and website publication approval are explicit. No gap/acceptance case is closed by this review, and no source SRS, permission, schema or workflow is changed.

All 57 regression scripts passed at this checkpoint. Coverage/report rendering, freshness, TypeScript and production build checked after the register update; browser acceptance remains pending. Next bounded functional step: use existing assigned-task/current-verification/four-domain calculations in the provisional department report, displaying coverage and missing scores without new weights, engagement labels or grading decisions. Engagement/counseling await their policy and source inputs. Semester progression and full demonstration data remain deferred.


### Stage 60 — Department task completion and four-domain coverage
Provisional department reports now show mapped assigned tasks, current verified completions, completion percentage and each domain's mean/assessed/assigned/verified counts and coverage. Extracted the unchanged existing task-summary logic for shared use by programme, club and department reports. Cancelled activities and legacy unmapped tasks are excluded; stale evidence/reopened work loses verified status. Missing scores/opportunities stay N/A and a recorded zero stays zero. Scores retain the existing equal-task-weight demo scale; no grades, engagement classification, ranking or counseling diagnosis is introduced. No private reflection/submission/review comments are rendered, and existing reporting access/filters remain unchanged.

Validation: department versus programme parity, known denominators/coverage, duplicate activity handling, zero/missing, stale evidence, reopened/cancelled work, unmapped and plan-only rows, filters, pure rendering and role denial; existing task/performance/report/dashboard regressions, TypeScript and build. Browser acceptance remains pending. Next: align department export summaries with displayed metrics, source basis and coverage. MIS scope, engagement policy, counseling, publication, progression and full demonstration data remain pending.


### Stage 61 — Department aggregate export alignment
Focused department report now offers aggregate-only JSON/CSV exports and print. Full operational JSON includes the same explicit department summary object; Finance exports retain their prior scope. Exported counts, percentages, domain means/assigned/verified/assessed/coverage use displayed calculations. JSON preserves numeric zero and null; CSV uses N/A for missing values and the existing formula-safe serialization. Every CSV data row includes filters, generation time, demo/access/source-label/period/verification/scale/coverage limitations. Empty CSV retains metadata with NO_MATCHING_RECORDS. CSV contains four domain rows per department; activity/plan/task totals repeat on those rows and must not be summed across domains. No new private content, permissions, workflows or schema.

Validation: displayed/export metric parity, zero/null, rectangular CSV, formula labels, focused aggregate-only JSON, empty-result provenance, all-persona export denial and unchanged Finance/Coordinator restrictions; reporting/performance/dashboard regressions, TypeScript and build. Browser acceptance remains pending. Next: visual four-domain summary using existing provisional department metrics, missing-data and coverage rules. Progression and full demonstration dataset remain deferred.


### Stage 62 — Department four-domain visual summary
Added responsive inline SVG horizontal charts for each provisional department row using the same domain means and assessed/assigned coverage as the table/export. All charts use the fixed demo 0–4 scale. Recorded zero has a marker at the origin; missing scores have no marker and display N/A. Coverage text is distinct from score; plan-only/unmapped/empty cases remain explicit. Accessible SVG title/description and exact-value tables are retained; no chart dependencies, new scores, thresholds or rankings. Existing report access and filters guard chart entry points. No workflow, schema or grant change.

Validation: known chart positions, zero/missing distinction, coverage text, no-opportunity/empty states, escaped labels, accessible text, pure rendering, report integration and denied roles; performance/report/dashboard/freshness checks, TypeScript and build. Browser visual/keyboard acceptance remains pending. Next: guarded source-task drill-down for the department summary using existing visible records, without exposing private comments. Progression and full demonstration data remain deferred.


### Stage 63 — Guarded department task source drill-down
Expandable source tables now show mapped task/activity identifiers, shared titles, assigned students, workflow state, current verification and domain scores from the same rows as department summaries. Non-assigned domains, missing scores and recorded zero remain distinct. Extracted shared reportTaskRows without changing existing summary rules. A guarded helper rechecks institution reporting permission, current report filters, visible current project/task identity, mapping and non-cancellation before opening the existing Projects → Tasks process. The Reports navigation retains the department overview. Source tables omit private submissions, reflections, feedback and evidence contents; aggregate export content remains unchanged. No new route, grants, schema or workflow.

Validation: source/count parity, zero/missing/current score presentation, privacy/escaping, authorized navigation and report return, all denied roles, stale filters, missing/cancelled sources and unchanged data; reporting/performance/task/dashboard regressions, TypeScript and build. Browser/keyboard acceptance remains pending. Next: consolidate report regressions and review remaining prototype workflow order, including reflection publication request/approval, before further dashboard expansion. Progression and full demonstration data remain deferred.
