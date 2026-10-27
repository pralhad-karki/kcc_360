# Stage 216 — Peer dashboard fix and revision acceptance

22 October 2026 · Asia/Kathmandu. Baseline 981fe4ed04bade88c727a631ab8d40fd8c758e4e. Existing production architecture, permissions, MIS boundaries and progression policy remain unchanged.

## Defect D216-01: verified peer task crashed dashboard — fixed

Starting the isolated reviewed-task baseline initially showed Shared workspace unavailable with Cannot read properties of undefined (reading 'submissionVersion'). A browser diagnostic stack traced this to notificationActions in notifications.js. The peer workspace correctly retained assessmentCurrent=true while omitting the private taskReviews array. The renderer trusted the current flag but dereferenced the absent latest review while constructing a completion-notification version.

The minimal fix constructs that notification only when its review record is available in the current projection. It does not disclose, reconstruct or fetch private reviews, change assessment validity or grant permissions. Owner and authorized review contexts still construct their existing completion notifications. Generated browser/server copies are synchronized; notification asset cache keys are updated.

The regression added to check-task-progress-notifications.mjs fails on the original dereference, then passes after the guard. It checks a real server-projected peer with current verified status and omitted reviews, notification generation, dashboard assigned actions/snapshot, no peer completion-source reconstruction, preserved owner completion notification and retained underlying review count. During test development an unrelated call to a nonexistent dashboard() helper was corrected to dashboardSnapshot(); that intermediate failure is not an application defect.

Browser retest: the same reviewed fixture loaded the full s1 dashboard at revision 48 with private reviews still omitted. The prior startup failure and passing retest are retained here; no fixture data was altered to make the dashboard pass.

## Isolated reviewed fixture

The local launcher accepts --reviewed-fixture to import the existing asserted initial-review lifecycle after the assignment fixture. Production routes/builds never import this launcher. Only the disposable preview dev command enables the option. Those initial submissions/reviews are prerequisite fixtures, not new browser acceptance results. The original frozen source clock remains 2026-10-19T12:30:00.000Z.

Browser project b365a198-1ce0-42ed-ba81-0245bb925868; task 36083cb0-cc9c-406d-a808-5a12081b74f2. s2 is the assigned student; s7 is the independent mentor. A separate pre-existing verified s2 task exercised the peer-dashboard defect. No real student or live database was used.

## W10-08 — Pass after startup repair

s2 opened Prepare my revision, which showed submission 1, partial review 1, original criteria, Concept 0 and remaining domains Not assessed. An unchanged-contribution attempt with existing evidence and explicit acknowledgment/confirmation remained in the revision form; the next genuine save advanced only once, from revision 48 to 49. No exact transient rejection toast was captured.

The genuine revision used a new fictional pilot description, changed contribution and explanation. Submission 2 appeared under review, with review 1 and its original scores retained as historical. New evidence reference #2 began unverified. No completion or score was inherited.

## W10-09 — Pass for revised evidence

s7 inspected the revised evidence, requirement, contribution and historical feedback. With reason, independence declaration and confirmation, evidence verification saved at revision 50. The overview then said Submission v2 / Evidence verified / Not verified complete and retained the separate individual-review action. Evidence verification did not complete the task or activity.

## W10-10 — Fail: third-round automatic confirmation warning

The first fresh reassessment opened with decision unselected, feedback empty and all scores Not assessed. s7 explicitly saved PARTIAL review 2 with Concept 2 and new feedback at revision 51. Expanded history retained submission/review 1 and 2, original Concept 0 versus new Concept 2, the different contributions, frozen evidence snapshots and unchanged criteria.

s2 then submitted a genuinely changed third contribution using already verified evidence #2, reaching revision 52. s7 entered a fresh PARTIAL review 3 with Concept 3 and different feedback. The client reported: Unable to confirm this revised-work action. Refresh and inspect the task history before trying again. The cached UI still showed submission 3 awaiting review.

Following that instruction, Refresh shared data returned revision 53 and displayed the saved PARTIAL review 3, exact feedback and Concept 3 / remaining domains Not assessed. The write had succeeded; no retry or duplicate review was submitted. The activity remained Started. This is an observed confirmation-path issue (D216-02), not lost data. Its cause remains unconfirmed; do not assume either a server failure or secure-origin/digest availability. W10-10 remains Fail pending a targeted diagnosis and browser retest. Do not count refresh recovery as a clean confirmation pass.

## Verification and release limits

- PASS: peer notification/dashboard regression, existing task queue consistency, task-history rendering, adapter self-test, TypeScript, production build, syntax/whitespace.
- Browser: D216-01 failed initially then passed after fix; W10-08/09 passed; W10-10 recorded Fail with successful refresh recovery and no duplicate write.
- Full regression baseline not rerun. W10-11–16 and institutional acceptance remain unexecuted. No task/activity completion, academic credit, real identity integration or policy acceptance is certified.
- Preview stopped after evidence collection; only fictional in-memory records were changed. Diagnostic console instrumentation existed only in the disposable adapter, not application source.

Next: diagnose D216-02 in the third-round saved-result verification path using the recorded source/account/revision/digest checks, add a focused failing regression if applicable, and retest through the supported browser. Preserve all saved history and the successful-write/refresh recovery behaviour. No live-source activation or progression work is authorized by this test result.
