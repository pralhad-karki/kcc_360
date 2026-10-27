# Stage 153 — Role-dashboard workflow review and club follow-ups

Reviewed the nine requested role categories against existing profiles, source-action derivation, module routes, guarded details and projected records. This is a code/local-fixture review; browser and institutional acceptance remain Not run.

| Role | Current working connections | Material remaining limit |
| --- | --- | --- |
| Student | Intake, assigned project/task actions, notifications, performance, portfolio and clubs; new club review/handoff/domain responsibilities when explicitly eligible | Real student identity/roster scope; legacy event roster remains additive |
| Faculty | Existing m1 Faculty planning context, latest owned plans, independent-review tracking and authored drafts | Additional faculty accounts and MIS teaching assignments; labels do not create assignments |
| Mentor | Assigned projects/evidence/evaluations, intake mentor acceptance, development and mentor handover | Real caseload/delegation; no organizer authority inferred from mentor title |
| Academic Coordinator / HoD | Separate existing routing, mentor assignment, academic-plan approvals, participant-outcome/controlled-change queues and scoped report navigation | Authoritative programme/department grants and masters |
| Research | Current assigned intake supporting-unit review/action and intake navigation | Broader research lifecycle and live first-review authority source remain separate work |
| Student Affairs | Club authorization, governance/evaluation, intake and reporting using existing assigned source actions | No automatic right to select volunteers or act as domain lead; institutional delegation and manual acceptance |
| Clubs | Existing student leadership/club mentor duties plus new eligible organizer and current domain-lead dashboard/Action Centre links | Real club roster/role grants; selection-only new-event roster mode not implemented |
| Administration | Operational reports, reconciliation/audit and separate finance/document/notice personas | Real institutional scope/account governance, tenant isolation and production trust |
| Institutional Leadership | Read-only report overview under current a1 reporting context, filters and report-module drill-down | Distinct restricted leadership identity absent; a1 retains existing administrative authority |

Confirmed gap: Stages 143–151 added volunteer workflow details, but dashboard work was derived mainly from mandatory notification actions; member-only opening/decision notices intentionally remained informational. Organizer application reviews, selected-roster handoffs and explicit domain coordination therefore lacked direct dashboard follow-up coverage. Also, the student verified count did not apply the active-source/delivery-ready predicates now used by Portfolio.

Minimum changes: a read-only extension in the current volunteer file adds current organizer review counts (excluding own application), selected handoff follow-ups (including eligibility-attention wording), and one ongoing coordination responsibility per current own domain appointment. The existing dashboard count and Action Centre consume the same derived rows, and a dedicated dashboard section keeps them visible beyond the first six summary rows. Navigation stays Dashboard → Projects module overview → existing event detail, or Dashboard → Action Centre → guarded detail. The source is rechecked before navigating; detail commands still enforce their existing authority. No notification is made mandatory, no escalation/policy/transport is added, and application opening/decision messages remain informational.

Student verified-activity counts now additionally check active source and delivery readiness; the original successful-participant predicate remains in the underlying snapshot. Institutional report counts keep their existing definitions. No grade, recognition, role, route, command or database mutation was added. Domain coordination is ongoing responsibility, not an invented pending approval or a requirement to create a minimum number of tasks.

Validation: check-club-volunteer-dashboards.mjs verifies every persona's raw/projected scope parity and renders current dashboards/Action Centre, independent review/self-review exclusion, handoff lifecycle/prerequisite attention, own domain appointment visibility, module/detail navigation, pure rendering, private-content exclusion, source/member/outcome/appointment revocation and student Portfolio count consistency. Existing role/faculty/leadership/notification and full local regression coverage remains separate from browser acceptance; final evidence is AUTOMATED_BASELINE_STAGE153.json.

Pending: browser/keyboard/PDF cases, institutional identity/multi-role grants and approved delegation, real MIS/future LMS data, broader research workflow, and the open SRS register. Progression and the full demonstration dataset remain deferred.

Next: review Action Centre task-level and mentor-review follow-ups against their detailed process states, then fix only any source/status/navigation mismatches found. Do not infer official grades, engagement/counseling labels or approval authority from dashboard visibility.
