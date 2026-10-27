# Stage 232 — task assignment dialog layout

Baseline: clean 27312b3c1ca2a326781d8795b1bcba8eaf58ce0c, published version 243.

D232-01 reproduced with the actual teamTaskForm/tableHTML/native modal renderers and fictional long content in a 320 px child viewport: dialog clientWidth 271, scrollWidth 4906, no visible Cancel. The initial exaggerated-label renderer stress fixture was followed by checks within the accepted name/title/criterion limits. This UI-only harness does not validate or authenticate a live assignment preview and performs no saves.

Applied existing task-dialog-content layout to assignment and loading content, added a non-submitting Cancel button and named the existing-task table's scroll wrapper as the keyboard-focusable region Existing task assignments. No global table style or business logic changed. Updated assignment script cache revision. Extended the local fictional layout harness with actual teamTaskForm and tableHTML plus confirmed-student/task/domain sample data.

| Child viewport | Dialog client/scroll width | Student selector width | Task-table scroll area/content width |
| --- | --- | --- | --- |
| 320 px | 271 / 271 | 215 | 215 / 900 |
| 360 px | 309 / 309 | 253 | 253 / 900 |
| 768 px | 565 / 565 | 509 | 509 / 900 |

Document widths matched their child viewport widths. The table retains its own horizontal scroll area; the dialog itself no longer overflows. The region exposes its name/tabindex and accepts keyboard focus; Tab then focuses Task title. ArrowRight probes did not establish horizontal scrolling (read-back remained zero), so that behavior is not claimed passed. Native select options retain full text; fitting the selector does not make every long option visible at once.

At 320 px the browser retained a 120-character title, a 200-character student display name in its option, a selected Concept domain and 2000-character criterion/responsibility values without widening the dialog. Confirmation remained unchecked. Blank submission focused required Task title; due remains a native date input and domain/confirmation checkboxes start unchecked. Cancel and Escape return focus to the opener. Only fictional data was used; no assignment command was sent in the browser.

Passed: check-intake-team-task-client.mjs (current lead/mentor preview, exact field/criteria/account handling, duplicate/stale/closed/malformed response and no replay); check-intake-team-task-save.mjs (actual trusted dispatcher and SQLite role/source/token/CAS/audit invariants); renderer self-test; shared dialog naming; TypeScript no-emit; production build. Preview stopped.

Preserved: source architecture, schema/migrations/data, approved permissions and confirmations, immutable task history and distinct assignment/evidence/completion/scoring stages. MIS/SSO/email activation remains disabled. W10-16 remains Partial, official MIS/credit assertions remain blocked and institutional acceptance Not run.

Next independent task: task-history and overview readability/keyboard checks from W10-16. These are separate from dialog acceptance. Full screen-reader, real touch-device and complete keyboard-scroll acceptance remain pending.
