# Student Affairs — planning, monitoring and evaluation responsibility check

Reviewed26 October2026 against retained unchanged SRSv3.4 and current source. This is a responsibility/coverage audit, not a claim that every institutional workflow is active. The academic import work in this same checkpoint is preserved.

| Area | Departmental responsibility | Current implementation and gap |
|---|---|---|
| Department planning | Prepare Student Affairs' own strategic/annual operational plan with objectives, KPIs, activities, calendar, responsibilities, budget/resource references and evidence rules; coordinate subordinate club plans | Existing shared plan capabilities can underpin this. No complete live Student Affairs departmental planning workspace/approved named review configuration is asserted |
| Club planning review | Review club/mentor proposals for institutional alignment, participation, feasibility, safety, resources and reporting requirements; endorse or return with reasons | Existing club planning and Student Affairs demo review exist. Legacy clubPlanState currently promotes ADMIN_REVIEW to APPROVED under sa1; this is not the complete v3.4 Finance Administrator→Principal chain. Guarded approval service exists separately but default-disabled; all-plan adoption remains incomplete |
| Monitoring | Track approved plans against execution, task completion, participation, evidence, mentor/evaluator timeliness, outputs, outcomes, budget references and unresolved actions; require explanations and follow-up | Activity/task/participation/plan-vs-outcome reporting exists. Formal periodic monitoring-review and corrective-action closure capabilities remain isolated pilots or partial; an end-to-end live departmental cycle is not complete |
| Club/programme evaluation | Review performance against approved targets, evidence, committee responsibilities and CEM domains; authorize annual club review and require corrective actions/handover follow-up | Structured club evaluation has ten indicators, source validation, required action owner/deadline, independent Student Affairs verification, stale-source checks, reopening and history. Targeted checks pass. This does not establish full institutional acceptance or complete department appraisal |
| Individual student learning evaluation | Ensure assigned evaluators complete evidence-based evaluation; oversee completeness, appeals routing and verified achievement records | Individual evaluation remains an assigned mentor/evaluator function. Student Affairs title or event leadership alone grants no scoring right. A separately authorized scoped evaluator appointment may confer that duty |
| Reporting and closure | Consolidate authorized club/student-development results and forward through required authorities; track unresolved handover and finance references | Existing annual reports and aggregates exist. Club post-event report route remains committee→mentor→Student Affairs→Principal→Finance, distinct from pre-execution approval. Full operational report/settlement routing is not claimed |
| Scope and privacy | Access only authorized departmental/club records and permitted aggregates; preserve confidential student records | Some legacy demo helpers grant sa1 broad activity/performance visibility. These demo persona checks are not approved institutional grants. Production activation must use scoped/effective-dated authority and confidential drill-down controls; global Student Affairs access is not certified |

## Required authority boundaries

For club planning: club President/event owner drafts → mentor reviews → Student Affairs responsible-unit review → Finance Administrator review → Principal final approval. Every plan, including zero-cost plans and material amendments, follows the confirmed shared approval route. Student Affairs cannot substitute for Finance Administrator or Principal. Approved baselines remain locked; importing or revising must not bypass that route. Self-review is not made valid merely because the submitting office is Student Affairs; reviewer assignments must satisfy existing independent authority controls.

For Student Affairs' own department plan, use the same owner→responsible-unit review→Finance Administrator→Principal chain with an explicitly assigned eligible reviewer. No unnamed reviewer/delegation has been invented by this audit.

Academic workshop/seminar roster-based assignments stay with Academic Department and assigned subject teacher/mentor. Research proposals retain Academic/Research routes. Departmental oversight does not merge these with club applications or confer new evaluation rights.

Relevant SRS module references: M07 club lifecycle, M08 governance/leadership, M09 strategic/annual plans, M10 activities/events, M13 annual evaluation/handover, M14 mentorship/evaluation, M26 role dashboards, M27 analytics, M30 plan approval, M32 interclub work. AT-X01 preserves Finance Administrator before Principal; AT-X07 separates post-event reporting from plan approval. AnnexL AT-M09 explicitly includes mentor review, Student Affairs endorsement, Finance Administrator review and Principal approval; AT-M13 includes mentor evaluation and Student Affairs authorization. AnnexP institutional acceptance remains NOT RUN.

## Verification

Targeted results in STAGE263_STUDENT_AFFAIRS_TEST_OUTPUT.txt:

- check-club-evaluation.mjs passes structured evaluation, independent Student Affairs review, stale evidence, annual gates, private source bindings, corrective-action owner/deadline, revision/reopening, aggregates and role rendering.
- check-reports.cjs passes plan/actual aggregation, activity deduplication, filters, participant/evaluation/budget measures, safe scoped exports and renders.
- check-monitoring-projection.mjs passes private raw monitoring record/feedback/action/identity/receipt omission from all generic demo role projections, preserving internal records.

The initial evaluation test's core assertions passed but its UI harness failed because the stale fake dialog lacked querySelector/removeAttribute/setAttribute used by existing modal accessibility code. Only that test stub was updated, consistent with earlier harness repairs. The complete evaluation test then passed; no application authorization or evaluation logic was weakened.

Next Student Affairs implementation priority: adopt the full shared plan approval chain for remaining legacy club/department plans, complete scoped departmental monitoring/action follow-up and reporting, and connect existing annual evaluation through approved institutional assignments. Preserve the distinct assigned individual-evaluator route. This audit does not mark these gaps completed.
