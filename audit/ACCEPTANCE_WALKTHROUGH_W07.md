# W-07 — Four-domain performance, scoped reporting and source/export reconciliation

Status: Browser / institutional walkthrough not run

Existing descriptive task-performance and operational/department/institution reporting. Does not approve official grades, institutional rankings, counseling lists, engagement thresholds, MIS roster denominators or production role scopes.

Use existing authorized fictional records or a designated known acceptance fixture with mapped assignments, verified/current and returned work, an actual zero score, an unassessed domain, cancelled activity, unmapped label and plan-only row. Do not alter shared records merely to fabricate totals. If fixture variants are unavailable, mark their checks Blocked. Record filters/date basis and source IDs; guide creation adds no data.

Student (s1), currently assigned mentor (m1 or approved replacement), existing reporting roles Programme Coordinator (c1), Department Head (d1), Student Affairs (sa1), Finance (f1/fv1) and Administrator (a1). Current demo reporting scope is broader than real department delegation; live scope acceptance remains pending.

Reuse the approved QA activity outputs from earlier walkthroughs when available. Select a small known set and independently calculate assigned, verified, assessed and distinct activity totals from visible source records. Do not treat legacy unmapped work as scored opportunity or free-text department/course metadata as authoritative MIS scope.

## Step 1 — Student Aarati Sharma (s1)

Navigation: Dashboard → Performance

Action: Choose own student record and available academic year/semester filters. Record mapped assignments, verified tasks, assessed tasks and legacy/unmapped work.

Expected: Own assigned responsibilities only within current source scope. Academic-period values come from retained mappings; no new semester progression or official roster data is inferred.

## Step 2 — Student / authorized mentor

Navigation: Performance → four-domain summaries and trend groups

Action: Compare Concept, Skills, Leadership and SDG Impact assigned/verified/assessed counts and mean/coverage against a few known authorized task records.

Expected: Means use assessed verified work; a task can map to multiple domains. Zero is a real recorded score; missing assessment and no opportunities remain N/A/unassessed. Do not add domain counts as unique tasks.

## Step 3 — Student / authorized current mentor

Navigation: Performance → Open task; permitted Evidence link

Action: Open a source task/evidence record and compare assignment version, submitted work, current review and domain mapping.

Expected: Source opens through current permissions. Returned/reopened tasks or changed evidence cease to count as currently verified; prior history remains.

## Step 4 — Programme Coordinator (c1) / Department Head (d1) / Student Affairs (sa1)

Navigation: Dashboard → Reports → Operational reports

Action: Apply a known programme, academic year and inclusive deadline range using Apply filters. Record filters and generation time.

Expected: Displayed counts use current filtered readable activity records. Activity deadline date is the filter basis; event start date and current roster are not silently substituted.

## Step 5 — Authorized reporting role

Navigation: Reports → approved planning and verified outcomes

Action: Reconcile current approved non-cancelled plan items with verified linked completions. Compare distinct successful participants with activity counts.

Expected: Completion rate = verified completed plan items / approved non-cancelled items; zero denominator N/A. No eligible-cohort participation percentage without authoritative denominator. Activities deduplicate; participant totals are not registration or attendance.

## Step 6 — Authorized reporting role

Navigation: Dashboard → department reporting card → Department reporting overview

Action: Compare mapped department-label rows, Unmapped rows and plan-only rows under the same filters. Expand source-record lists.

Expected: Provisional academic-plan labels do not establish department authorization. Plan denominators follow source plans, activity totals follow activity records; plan-only rows can have no activities/tasks.

## Step 7 — Authorized reporting role

Navigation: Department reporting overview → four-domain charts/table → task source lists

Action: Compare chart labels, score means, assessed/assigned coverage, mapped/verified task totals and completion percentage.

Expected: Charts and table agree with the shared task calculations. Cancelled responsibilities excluded; missing versus zero preserved. No ranking, official grade or active/inactive/counseling classification is generated.

## Step 8 — Authorized reporting role

Navigation: Department reporting overview → source task detailed process → return to Reports

Action: Open a specific authorized task source, verify it against displayed metadata and return. Repeat after changing report filter or role in a controlled access check.

Expected: Dashboard → module overview → detail maintained. Stale/missing/cancelled/unreadable task links are rechecked; source navigation grants no approval rights.

## Step 9 — Authorized reporting role

Navigation: Department reporting overview → Export department JSON / Export department CSV

Action: Export the same filtered overview and compare row totals, domains, empty/unmapped rows and provenance/filter metadata against screen.

Expected: Aggregate department exports match displayed basis without private reflections, submissions, assessment comments or contacts. Browser file-download behavior remains a manual acceptance result.

## Step 10 — Finance Approver (f1) / Financial Verifier (fv1)

Navigation: Dashboard → Reports → finance-scoped view

Action: Inspect linked club budget approval, actual/variance, settlement and cash-known/unknown reporting under the current filters.

Expected: Finance-scoped reporting does not grant department academic reports or individual evaluation access. Linked club finance is not the college ledger; unknown legacy cash is not silently treated as zero.

## Step 11 — Administrator (a1)

Navigation: Dashboard → Institutional overview → Open reporting module / department report

Action: Compare institutional verified/planning/overdue/evaluation/finance summaries to Reports under the same filters; return to Administration.

Expected: Read-only reporting context matches existing calculations and preserves filters. This is an admin view switch, not a separately restricted Principal/Leadership account or a new role grant.

## Step 12 — Tester with permitted empty/filter fixture

Navigation: Reports / Department reporting overview → filters yielding no records; Performance with no applicable domain opportunity

Action: Inspect empty rows, chart/table labels and exported metadata; then restore the agreed filters.

Expected: No false zero-performance or division-by-zero rate. N/A, unassessed and unmapped states remain explicit; filtered exports retain the provenance needed to interpret the result.

## Exception checks

- **Student/finance department denial:** Try department overview/export/source links as a student or finance persona. Expected: No academic department-report access from those roles; task/report routes recheck current scope.
- **Missing versus zero:** Compare a recorded zero, blank assessment and no assigned opportunity in a known controlled fixture. Expected: Zero remains zero; missing/zero-denominator cases are not represented as poor performance.
- **Duplicate and cancelled activity:** Compare a multiply mapped activity and cancelled source under matching filters. Expected: Unique totals do not double-count mappings; cancelled work does not count as verified completion.
- **Stale task or role link:** Change filters/role or use controlled reopened/evidence-amended work before reopening a source link. Expected: No stale verified contribution or scope bypass. Current task assessment/source basis governs.
- **Plan-versus-activity label/date basis:** Compare a source-plan department/date differing from its linked activity plus a plan-only row. Expected: Plan denominators follow approved source plans; activity metrics follow their documented filters. Unmapped values remain disclosed.
- **CSV/export privacy and escaping:** Export controlled unusual labels and compare displayed totals/metadata without posting private files publicly. Expected: Labels safely escaped; aggregate department exports omit private individual content and remain consistent with filters.
- **Authority and interpretation:** Inspect leadership view switch, provisional labels and engagement/counseling language. Expected: No new permissions, production department ACL, diagnoses, rankings or unapproved active/inactive categories are implied.

Record tester/date/timezone, site version, actor/context, exact filters and date basis, fixture/source/version IDs, expected hand-calculated totals versus display/export, Not run/Pass/Fail/Blocked and defect reference. Keep source/export files within permitted scope. Automated known fixtures do not certify authoritative MIS cohorts or real institutional role grants.

Automated evidence: check-performance.mjs, check-reports.cjs, check-leadership-dashboard.mjs, check-role-dashboards.mjs

W-08: activity and reflection publication privacy/approval/lifecycle walkthrough, separating default-disabled live assignments and simulated website delivery.
