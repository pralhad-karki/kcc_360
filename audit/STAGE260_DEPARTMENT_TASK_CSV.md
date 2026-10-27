# Stage 260 department workshop and seminar task CSV

Baseline: published Version 271, commit `5336cad8c9d2e36ca599e19c35cb3a8ae9f952a5`. Reopened the exact Site checkout. The user subsequently clarified that strategic planning uploads, department/mentor task control, student data upload and semester/MIS integration are separate capabilities. The confirmed addendum is retained in requirements alongside unchanged SRS v3.4.

## Delivered

Added a task-import option to departmental class workshop/seminar event overviews, and a task-planning list under Academic Plans. The list covers every currently eligible event in the reader's assigned department/mentor scope. Strategic annual/event planning CSV/Excel imports are preserved and remain separate.

The department downloads an exact task template and current roster references, chooses a CSV file locally or pastes CSV, and saves a preview. Files are limited to 30 KB and batches to 50 task rows. Headers, quoting/BOM, widths, stable task identifiers, active existing roster references, deadlines, outputs, duties, evidence and at least one observable domain criterion are validated. The full individual instructions/criteria remain available for mentor inspection, with row errors displayed. Preview does not assign tasks.

A valid preview is submitted to the currently assigned mentor. The mentor independently approves the definitions or returns the batch with a reason. The department explicitly confirms creation of the approved new task rows. Rows are materialized through the existing shared individual-task mapping recorder, preserving assessment, student submission, evidence and human review semantics. No task is marked done/verified; no grade, credit, certificate or attendance is generated.

The same responsible-department/assigned-mentor policy now controls manual task assignment for the class-workshop/seminar route. Student event leads cannot bypass the CSV gate by using the general task editor. Student-project and club task authority remain on their existing routes. The task mapping form's missing `due` whitelist entry was corrected to match its existing date field and server validation.

Task academic-period data includes the original course, semester, programme, batch, year and source-plan version. Existing mapped tasks keep their prior snapshots. The existing event roster is unchanged: an import cannot enroll students. Changes to roster, mentor, source schedule, task mapping references or import ledger invalidate a pending batch's source binding. AP-001-controlled parents still require their separate execution authorization; this CSV path does not activate controlled-plan work.

Import task references are unique within an event, even when a file is renamed or its source reference changes. Identical re-imported rows are reported as already imported. Different content under an imported reference cannot overwrite existing assignments, submissions or evaluations. A returned batch can be corrected through a new preview while preserving the prior rows/reasons. Reapplying a committed batch creates no duplicate tasks/audit. Batch application and server audit use the existing transactional workspace save/CAS, so audit failures and competing revisions cannot partially persist tasks.

Applied import history stays readable by the scoped department/mentor after event closure without reopening assignment. Raw batch/roster details and import ledger are withheld from student/unrelated-administrator generic views. Authorized source department reviewers and the assigned mentor can inspect them. Individual students retain their own mapped task view. No new institution-wide roles/grants are provisioned; this increment uses the existing authenticated owner-only demo with server-checked, record-scoped demo personas. It is not an official personnel or MIS authentication activation.

## Existing club workflow reviewed

Preserved planned volunteer domains/positions → student application → organizer selection → controlled roster handoff → individual domain-task assignment → independent work review → reflection/evaluation and verified projections. Applications currently target positions; detailed individual tasks are assigned after selection. This increment does not create a duplicate club application system or assert arbitrary multiple task applications per student.

Recruitment planning, applications, selection, handoff, domain-task and achievement-chain checks were run. Three legacy test-only dialog stubs lacked methods already used by the existing dialog naming code. The same querySelector failure was reproduced against the prior application source. Only those test fixtures were updated with querySelector/removeAttribute/setAttribute; club workflow source was unchanged.

## Student import and MIS boundaries

Verified the existing known-student placement/progression CSV upload and the deliberately disabled official MIS adapter. Those are not a new student-master import or live E-Digital Nepal sync. New institutional student-master/class-roster import remains a separate next task. No emails are used to establish identity, no vendor endpoints are invented, and no accounts are created from task CSV. The existing bulk rule excludes only officially Left College students and keeps final-semester processing separate; fees, failed subjects and attendance do not create new bulk exclusion rules.

## Validation and limits

A final targeted rerun after historical-read access refinement passed. The dedicated workflow test covers 13 scenarios, including both Workshop and Seminar manual roles, CSV phases, invalid/duplicate rows, stable snapshots, stale scope, controlled-parent denial, corrections, privacy and changed-content replay protection. The shared-service SQLite test uses actual service/form logic and existing SQL schema to verify rollback, concurrent winner preservation, same-revision race, duplicate-free retry and private student output. A client harness verifies local-only reads, file limits, stale file reads and spreadsheet-safe export.

The standard regression runner now includes these three CSV checks plus the six club checks alongside the existing 38 groups. Final results are retained in STAGE260_REGRESSION_FINAL.json. The earlier STAGE260_REGRESSION.json is preliminary evidence from before the user's manual-assignment/semester clarification and is not the final acceptance report.

The actual frontend was inspected in a clearly labelled fictional browser fixture with backend calls disabled and browser storage isolated. The department button and CSV file-chooser/preview dialog were inspected; no real file was selected or submitted. This is not an authenticated framework→D1 browser import test. The temporary HTML is removed before packaging; a reusable fixture generator remains a development script only.

No production records, authentication configuration, migrations, existing code modules or audit history were reset/replaced. Official MIS/SSO, new student-master/roster upload, all-plan approval adoption and institutional acceptance remain pending. Event plan approval and item-level execution authorization retain their separate release boundaries.
