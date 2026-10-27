# Stage198 — Controlled student progress and blocker form

## Inspection and minimum change

The Stage197 backend already validates the responsible student, current started activity, accepted mentor, confirmed team, pending holds, preview token and execution version. This increment connects those commands through a browser controller using the existing activity overview, modal, shared workspace synchronization and reset chain. It introduces no database, route, permission model or module. Ordinary/demo activity controls and the generic institutional write guard remain unchanged.

The started linked-activity overview shows My assigned team tasks and an Update my progress button only for visible current assignments belonging to the selected account. This is a navigation hint; the backend verifies actual active-person authority. No broader project discovery or alias access was added. A verified alternate account omitted from the current generic workspace projection is not made visible by this increment.

## Report and confirmation

Opening the form prepares a fresh task-specific preview and checks its source references, actor/workspace revision, task, execution version and current execution fields against the scoped workspace. It does not use cached permission hints to save. The form preselects current To do/In progress and blocker status, escapes task/blocker content, and requires a change reason and explicit confirmation. A blocker requires detail; clearing it requires Not blocked with blank detail. No-op reports and extra fields, self-completion, scores, assignment changes, priority and estimated effort are not accepted.

The command uses exact source/task references, preview token and expected execution version. Its minimal response is never applied as workspace state. A fresh full workspace read must confirm the saved report, source/start/team links, unchanged task definition, unchanged previous execution history and the newly appended snapshot/reason. Only then is the refreshed scoped workspace applied. Failed or uncertain confirmation asks the student to refresh and inspect the task before retrying, without automatic write replay.

Duplicate clicks, stale modal/context, account changes and reset generations cannot submit or apply an old report. A closed modal does not reopen after a pending read. A committed report can still synchronize after closing its dialog; changing account prevents applying the old account's data or releasing a newer operation's lock.

Progress reports do not submit evidence, verify completion, award performance or create portfolio achievements. No runtime sources were activated, no demonstration dataset was populated and no external notifications were sent. Semester/year progression remains parked.

## Validation and next step

Controller VM checks cover assigned-student entry, fresh preparation, escaped content, strict stages/blockers/reason/confirmation, exact command, no-op rejection, malformed/forged response denial, full refreshed-record/history verification, clearing a blocker, failed GET without replay, duplicate clicks, account/reset races and closed-dialog safety. An additional round trip runs this same controller through the actual trusted dispatcher, SQLite lifecycle fixture and actual scoped engine view for both reporting and clearing a blocker. Full regression evidence: AUTOMATED_BASELINE_STAGE198.json. TypeScript, build and whitespace checks are reported separately.

Browser/keyboard and institutional user acceptance remain Not run. Approved live sources/accounts are still required before enabling the institutional runtime. The prototype is not finalized or production-ready.

Next: controlled task evidence-submission backend, followed by its form and independent mentor verification.
