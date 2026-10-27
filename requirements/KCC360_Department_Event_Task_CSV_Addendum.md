# Department event task planning and student data clarification

User-confirmed clarification, 25 October 2026. This increment supplements SRS v3.4; it does not rename or replace that specification or certify all requirements as implemented.

| Flow | Confirmed responsibility | Current implementation boundary |
|---|---|---|
| Strategic annual/event planning | Departments and clubs upload planning data; institutional plan approval and approved-baseline locking remain separate | Existing academic and club planning CSV/Excel imports retained. Uploading a strategic plan does not itself assign individual tasks. |
| Academic class workshops and seminars | Responsible department and assigned mentor control individual task assignment for every eligible event | Added per-event task CSV preview, validation, mentor definition review and department confirmation. Manual assignment is restricted to the same department/mentor scope. |
| Student academic projects and other student proposals | Students submit proposals through existing intake, first review and mentor/team workflows | Existing student proposal routing preserved; department class-task CSV cannot replace or bypass it. |
| Club event tasks | Club plans task/position opportunities; students apply; organizers select; selected students receive individual mapped tasks | Existing position planning, member applications, selection, roster handoff, domain tasks and independent learning assessment retained and checked. Applications currently target planned positions, with detailed individual tasks assigned after selection. |
| Student data import | Student-master/enrollment data and academic placement are separate from event task CSV | Known-student placement/progression CSV already exists. A new student-master/class-roster import is separate pending work; task files create no student accounts or enrollments. |
| Semester progression | Update current placement while preserving historical event/task/assessment/portfolio snapshots | Existing placement and bulk-progression safeguards retained. Bulk cohort progression excludes only officially Left College students; final-semester handling remains separate. |
| E-Digital Nepal integration | Use approved stable student/person/course/enrollment mappings and official API/SSO contracts | Official live adapter/SSO remains disabled/pending. Fictional normalized adapters and controlled export import are not live vendor synchronization. |

Task CSV rows identify one existing event-roster student reference and describe that student's duty, expected output, evidence, deadline and selected concept/skills/leadership/SDG-impact criteria. Unknown or ineligible roster references, duplicate task keys, invalid deadlines and missing criteria block batch submission. An upload cannot silently add participants, change event dates or budgets, approve a plan, finalize learning, award credit or issue certificates.

Roster and academic-period snapshots belong to the original event/task. Semester advancement or later MIS updates must not rewrite those historical mappings. Event/class roster import, institutional account creation and MIS identity linking must each have their own explicit reviewed authority.
