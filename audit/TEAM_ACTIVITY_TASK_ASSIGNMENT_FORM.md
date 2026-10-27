# Stage196 — Controlled team task assignment form

## Minimum change and workflow impact

The existing started-activity overview now offers task preparation to its visible team lead or accepted mentor. This is an entry hint; the existing trusted backend independently verifies authority and current sources. A browser controller reuses the existing modal, four-domain labels, workspace dispatcher, task model and shared synchronization. No database, route, permission or module was added. Ordinary/demo workflows remain unchanged.

The form loads a fresh verified team list, task revision, existing assignments and actor/source-bound preview before permitting submission. The student selection starts blank. Task title, deadline, responsibility, expected output, evidence requirement, selected domains with a criterion for each, reason and explicit confirmation are required. Group/workstream reference remains optional. Names and activity content are escaped. Previous assignments remain visible.

The exact dedicated assignment command uses the prepared references, token and task revision. Its minimal response is never applied as workspace data. The controller fetches the complete current workspace and verifies the new task, assignee, criteria, source links, initial assignment state and retained earlier assignments before applying it. An uncertain save asks the user to refresh and inspect the task list rather than automatically replaying a write. Duplicate clicks, closed dialogs, account switches, reset generations and lock ownership are guarded.

Assignment does not submit evidence, award scores, verify completion or create portfolio achievements. Controlled progress, evidence and mentor evaluation remain later steps. The institutional runtime remains disabled until approved institutional sources are configured; no demonstration dataset or external notifications were added.

## Validation and limits

The controller VM exercises explicit member selection, all four domain controls, invalid fields and forged authority/state denial, exact request payload, full-workspace confirmation, malformed preparation/result handling, accepted mentor access, failed refresh without replay, duplicate clicks, account/reset races and closed-dialog safety. Existing backend lifecycle and SQLite tests run with the regression suite. Evidence: AUTOMATED_BASELINE_STAGE196.json. TypeScript, production build and whitespace checks are reported separately.

Browser/keyboard and institutional user acceptance have not run. This is a prototype increment, not production acceptance. Semester/year progression remains parked and the full demonstration dataset remains deferred.

Next: controlled assignee progress and blocker backend, followed by its form, evidence submission and independent mentor verification.
