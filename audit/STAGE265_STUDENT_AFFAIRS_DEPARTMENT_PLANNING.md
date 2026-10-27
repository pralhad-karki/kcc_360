# Stage265 — Student Affairs department planning and factual monitoring

## Baseline and scope

Started from clean `61261ad37d75b0560fb6a388ab8fede43097b767`, published Version276. Sites version/audience and source were verified. Preserves the existing architecture,35-module organization, SRS bytes, database/audit records, club execution safeguards, academic/research routes and MIS boundaries. No production database changes or sample population were performed.

The user requested Student Affairs planning, monitoring and evaluation across club events, placement and wider services. This increment adds a usable **owner-demo departmental planning surface** and a DEPARTMENTAL source adapter for the existing M30/AP-001 approval service. It does not claim completion of the placement pipeline, institutional staff login or the full monitoring/evaluation cycle.

## Implemented

- A Student Affairs navigation entry for the existing Student Affairs demo persona, preserving Dashboard→department overview→detailed form navigation. Other demo personas cannot read/write the new unit-plan records. The existing role/identity system is unchanged; this creates no institutional role grant.
- New departmental source records in `unitPlans` within the existing private JSON workspace, without another application, database table or approval engine. No automatic plan/target/sample creation. Source unitCode is the internal STUDENT_AFFAIRS category, not an invented MIS unit ID. Official institution/unit/person identity still comes from approved server mapping.
- Department plans capture title, cycle and objectives. Service items capture area, activity, dates, responsible-person planning declaration, mentor/evaluator arrangement, deliverable, KPI/target, NPR budget and funding reference, and evidence requirements. Six service categories: club events/leadership; placement/career; internships; leadership/skills/student development; community/SDG/partnerships; participation/recognition/follow-up. These declarations create no task assignment, student enrollment, job offer, evaluator role, credit, payment or event.
- Draft CRUD validates dates, scope, required fields and money; IDs are internally generated and stable. Submission requires current version, complete items, reason and explicit confirmation, then locks ordinary editing. An owner may withdraw a still-unregistered submission for correction, with prior submission/withdrawal history retained. Once a protected approval record exists, generic edits/withdrawal are blocked and the source is immutable.
- Independent `server/unit-plan-guard.mjs` checks every generic command: correct author/command, immutable identity/scope, per-command field restrictions, preserved submission/preparation history, no fabricated raw final approval and no new unit-linked execution. It is layered with the existing all-club governance and registered-plan guards.
- Extended existing plan source projector and protected-source guard to DEPARTMENTAL; the shared policy already supported that kind. Adoption requires a complete SUBMITTED unit source, exact approved institution/unit/owner mapping and stable raw source snapshot. The new source cannot enable amendments by configuration: departmental amendment preparation/propagation remains unimplemented, so allowAmendments:true is rejected. No generic bypass of that lock is possible.
- Shared review DTO now includes departmental cycle/objectives and item service/responsibility/arrangement/deliverable/budget-reference fields. It continues to omit raw histories/receipts and uses the existing protected reviewer route. Minimal department view markers show the protected review state/revision and executionAuthorized:false. Raw preparation SUBMITTED state does not claim institutional approval.
- Read-only monitoring panel uses existing readable owner-demo **club** records: activity/verified/open counts, submitted reflections awaiting final evaluation and annual evaluations awaiting unit review. It returns no private reflection bodies, scores or case details. Placement and department-wide internship outcome sources are explicitly unavailable, not reported as zero. Planned-item counts include draft/submitted declarations and are explicitly not completed-service counts or performance ratings.

## Approval/authority evidence

Actual existing service/SQLite tests take a new submitted DEPARTMENTAL source through:

Owner CREATE/SUBMIT → independent responsible-unit reviewer → Finance Administrator → Principal.

A skipped/owner final-approval attempt is denied. The approved review record grants no execution authority and leaves the exact source snapshot unchanged. Registered source withdrawal through generic commands is denied. This exercises the **existing** shared policy/persistence, not a duplicate Student Affairs approval chain.

All identities, grants and approvals in this test are fictional trusted fixtures in in-memory SQLite. The actual institutional runtime remains default-disabled: approved named source/person/reviewer/authorization-fence composition has not been supplied. Owner-demo submission/plan creation is preparatory work, not a verified institutional decision. No Principal/Finance signatory, local password, SSO or privileged role was created.

## Persistence and privacy

Existing D1 workspace CAS+audit handles the new form commands. Item/history changes roll back if audit insertion fails. Concurrent requests preserve one winner. New form fields are strictly whitelisted; callers cannot supply owner, unit, role, approval state or evaluation/actual values. `server/service.ts` is unchanged. The additive JSON collection requires no SQL migration and is created only by an explicit authorized demo draft action. No existing rows are rewritten by deployment. The generic view exposes new unit plans only to sa1; other reviewers read through the separate protected institutional route after real configuration.

Previously documented broad legacy demo reporting/persona limitations remain; this increment does not certify institutional confidential-record access. It does not broaden Student Affairs access to private internship case records. Individual evaluation remains assigned mentor/evaluator authority, separate from department oversight. Academic workshops/seminars and research proposals retain their distinct routes.

## Actual tests and QA

- `STAGE265_UNIT_PLAN_TEST_OUTPUT.txt`:16 core cases covering empty initial state, six service categories, owner/scope denial, validation, exact submission, locked state, audited withdrawal history, all-role view privacy, forged fields, raw mutations, complete mapped source adoption and protected lock/execution denial.
- `STAGE265_UNIT_PLAN_SAVE_OUTPUT.txt`: compiled actual shared service plus exact transactional SQLite SQL: draft/item persistence, form whitelist, audit rollback, CAS race/concurrent winner and source preservation. Also exact mapped DEPARTMENTAL source through existing AP-001 persistence owner→unit→Finance Administrator→Principal; review DTO has all substantive departmental fields, omits raw histories; generic lock stays effective and execution false.
- `STAGE265_UNIT_PLAN_CLIENT_OUTPUT.txt`: actual browser-script VM harness for navigation, six service areas/forms, unavailable-source labels, no private reflection-body leakage from monitoring facts, submission/withdrawal and unauthorized role denial. After browser inspection, a duplicate active navigation highlight was corrected and a responsive service-card grid added; client harness reran with a single-active-nav assertion. No live save claim from this harness.
- `STAGE265_REGRESSION.json`:60/60 groups PASS, including club approval backstop, annual evaluations/reports/privacy, student/academic MIS import and staging, department task CSV, AP policy/source/review/amendments and all retained cohort/learning tests. This broad run preceded the navigation/grid/plain-wording-only polish; final targeted core/service/client checks are repeated afterward.
- Real browser, temporary explicitly fictional read-only fixture served by managed Sites preview: six service cards, unavailable placement/internship facts, department plan modal and service-item modal were inspected through accessibility and screenshots. The long item form scrolls normally; no real/shared data was entered, no form was submitted, no network-backed save or institutional sign-in tested. Temporary fixture removed before packaging; generator retained. No retained screenshot deliverable is claimed.
- TypeScript passes; final packaging executes production build; whitespace check passes. No real MIS data or production transaction used.

## Remaining work

Full placement opportunities/applications/selection/offer/joining case pipeline; authorized internship oversight projection; formal periodic monitoring/corrective-action review; department-wide programme evaluation; strategic-parent/approved-KPI catalogue linkage; departmental CSV/Excel planning imports; formal departmental amendments; separately authorized execution; live staff configuration and institutional acceptance. The existing approved strategic pillar/goal/KPI architecture was not modified.

Next priority: connect Student Affairs placement/internship case monitoring through explicit scoped assignments and existing workflow evidence, then the shared periodic monitoring/review cycle. Keep unavailable sources explicit and keep student scoring/host decisions/academic approvals separate. The existing real normalized cohort-progression and faculty/subject import workstreams remain retained, not cancelled.
