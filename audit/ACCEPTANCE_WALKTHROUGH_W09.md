# W-09 — CV, responsibility reports, role sandbox and project discussion

Stage 123 · 2026-10-19 · Browser / institutional walkthrough not run

Supplemental acceptance of delivered features only; no new role authority, official academic data, live multi-role integration or public publication.

Use designated existing fictional records and permitted demo personas. Record Blocked where an eligible source is unavailable; do not seed records, reset shared data, configure grants or enable transports to bypass prerequisites. Record the current revision and source IDs before each case.

No demonstration records created by preparing this guide. Use a designated editable fictional CV and writable project only with tester authorization; CV edits and discussion messages persist. Do not use real personal or confidential content.

Student s1/s2 for own CV; existing institution-report personas a1/c1/d1/sa1 for reporting; current project readers, thread author and assigned mentor for discussion. Multi-role sandbox is isolated fictional policy evidence, not live account provisioning. Audit fixture is developer-only.

For each numbered step and exception record Pass, Fail, Blocked or Not run, tester/date, persona, source/revision, expected versus observed result and defect reference. Save only redacted evidence; private CV/PDF and discussion content must not become public acceptance attachments. All manual results initially Not run.

## 1. Student

Dashboard → My Portfolio → Edit my CV declarations

Enter fictional external education, training and skills, then save.

Expected: Own declarations persist with version/time and student-declared classification; verified portfolio is unchanged.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 2. Student

My Portfolio → Edit my CV declarations

Edit and then clear a designated declaration section.

Expected: Current declaration changes or disappears; no verification or approval is invented. Previous CV text history is not claimed.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 3. Student

My Portfolio → Prepare private CV

Select only a nonempty declaration section and preview.

Expected: Nothing is preselected; declaration-only CV is allowed and clearly labelled self-declared.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 4. Student

My Portfolio → Prepare private CV

If available, explicitly select a current verified achievement and valid own certificate reference.

Expected: Preview includes selected current source summaries only; unavailable eligible sources make this step Blocked.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 5. Student

Private CV preview → print preparation

Open the private print view and use browser Print / Save as PDF.

Expected: Print view is private, escaped and labelled; inspect page breaks, clipping and readability. Native PDF result must be recorded, not assumed.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 6. Student

My Portfolio → private achievement export

If an eligible own verified achievement exists, select it and prepare the separate export.

Expected: Only chosen eligible records appear; CV declarations and public sharing consent are not changed.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 7. Institution report persona

Dashboard → Reports → Student responsibility report

Search a designated student name/demo ID and compare visible rows to permitted source activities.

Expected: Mapped tasks, current verification, legacy work, deadlines and source labels reconcile without claiming a full MIS class roster.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 8. Institution report persona

Reports → Student responsibility report

Apply existing programme, year and date filters; open an allowed source.

Expected: Rows and navigation respect current scope and filters; source programme/semester labels do not become authoritative student enrolment.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 9. Institution report persona

Reports → Faculty mentor responsibilities

Search a current mentor and reconcile activity, students and awaiting-review work.

Expected: Current recorded mentor is used; legacy work is separate and paused/cancelled/completed review counts are unavailable where applicable.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 10. Institution report persona

Reports → Research activity summary

Compare exact Research activities with submitted readable Research intakes.

Expected: Separate counts are not summed; unsubmitted drafts and title keyword matches are excluded.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 11. Institution report persona

Reports → Research activity summary

Apply a specific academic year and inspect any available publication tracking link.

Expected: Intakes without recorded year are excluded with explanation; publication link retains separately assigned permissions and is not a journal total.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 12. Tester

SRS Coverage → Multi-role sandbox

Open the isolated sandbox and change view context.

Expected: Presentation changes while all fictional grants still apply; no live account, workflow or stored workspace changes.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 13. Tester

Multi-role sandbox

Try own-person review, other-project access and department/restricted-record probes.

Expected: Same-person review and out-of-scope/restricted probes are denied as labelled; permitted scope remains distinct.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 14. Tester

Multi-role sandbox

Toggle mentor revocation, reporter revocation, explicit deny and expired time; reset.

Expected: Each relevant probe reflects the policy change; reset restores fictional defaults only. Inspect keyboard focus and status announcement.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 15. Project reader

Dashboard → project detail → Discussion

On a designated writable project, post a fictional root message.

Expected: Message remains project-bound with current actor/time; it is shared with current project readers, not a private evaluation channel.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 16. Other authorized project reader

Project detail → Discussion

Reply to the open designated thread.

Expected: Reply is attached to the root; legacy messages and unrelated threads remain unchanged.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 17. Thread author or current assigned mentor

Project detail → Discussion

Resolve the thread with a reason.

Expected: State and reason event appear; replies pause. No academic approval, evaluation or project completion is implied.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 18. Thread author or current assigned mentor

Project detail → Discussion

Reopen with a reason and add a permitted reply.

Expected: All messages and resolution history remain; current permissions are checked again.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 19. Tester

All above available views

Navigate by keyboard through controls, tables and dialogs; inspect narrow and wide layouts.

Expected: Focus is visible and usable, controls labelled, content readable and private print layout checked. Record actual results and defects.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## 20. Developer only

Local isolated SQLite fixture: node check-audit-save.mjs

Run the existing fixture and inspect its assertions for CV create/edit/clear, denial, no-op, stale revision, rollback and retry.

Expected: CV audit metadata is committed atomically with workspace change without declaration text; other command audits remain legacy. This is automated fixture evidence, not a browser audit viewer or institutional acceptance.

Not run. Record source/revision, observed result and redacted evidence; use Blocked when prerequisites are missing.

## Exception checks

- **CV ownership** — Change to a peer or staff persona and inspect available CV actions. Expected: No access to another student’s editable declarations or private CV export.
- **Stale private output** — Using an agreed isolated fixture, change a selected source after preview, then request print. Expected: Stale selection is rejected; never reuse or publish an obsolete private output. Blocked without a controlled fixture.
- **Popup handling** — Block popups before private print preparation. Expected: A clear failure is shown without private content appearing in an unintended window.
- **Report restrictions** — Use a finance-only or otherwise non-report persona to attempt report navigation. Expected: Existing report restrictions remain; reporting never grants private publication or CV declaration access.
- **Unknown denominators** — Search a student absent from available sources and inspect unmapped/paused cases. Expected: No inference of inactivity, zero achievement, counseling need or a complete cohort denominator.
- **Discussion permission** — As a reader who is neither author nor current mentor, attempt to resolve another thread. Expected: Resolution is unavailable or denied without altering records.
- **Discussion conflicts** — With a designated concurrent test, submit against a changed thread; inspect a resolved or non-writable project. Expected: Stale writes and forbidden replies are rejected, history preserved. Do not bypass inactive/outcome controls.
- **Missing prerequisites** — Encounter missing certificates, source records, institutional roles or enabled website transport. Expected: Record Blocked; do not create grants, seed bulk data or mark an integration accepted.

Automated evidence scripts: check-cv-declarations.mjs, check-portfolio-export-client.mjs, check-student-responsibilities.mjs, check-faculty-responsibilities.mjs, check-research-report.mjs, check-multi-role-sandbox.mjs, check-audit-save.mjs, check-project-discussion.mjs

Execute available browser/keyboard/PDF cases with designated testers, record blocked prerequisites and fix observed defects. Keep formal acceptance cases and all 21 open SRS gaps open until separately reviewed.
