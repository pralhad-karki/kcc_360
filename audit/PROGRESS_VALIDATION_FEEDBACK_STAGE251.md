# Stage 251 — persistent task-progress blocker feedback

Baseline: clean 1c895a3e7d088a9172c8b5a0e4e7d6ad41000152, published version 262. Date: 24 October 2026, Asia/Kathmandu.

## Change

Task-progress local input errors now persist inside the current dialog and receive keyboard focus rather than using the expiring global toast. The form has a hidden alert paragraph with tabindex -1, using the same bounded feedback pattern as the other task dialogs. A subsequent controller validation attempt clears the previous message; rejection replaces/refocuses it without rebuilding the form or changing entered values.

Current account/context/modal/marker guards remain first. Existing validation is unchanged: a blocked report needs detail; a not-blocked report must leave detail blank; a change reason and confirmation are required; reporting the same progress and blocker state is rejected. Corrected input follows the original trusted command and fresh complete GET proof. Progress does not award scores or verify completion. Blocker snapshots and execution history remain append-only.

The affected client cache version advanced and assets were regenerated using the existing preparation script. No server command, architecture, database/schema/migration, configuration, authorization or stored workflow record changed. The installed Sites helper had moved from 1.1.1 to 1.1.2; the existing source was opened using the installed helper before editing, without changing project configuration.

## Fresh checks

- `node check-intake-team-task-progress-client.mjs`: invalid cases now include spaces-only blocker detail and reason; rejection asserts zero requests, same open marker, unchanged payload, visible nonempty feedback and one focus call. Corrected input clears the message. Existing actual trusted dispatcher/SQLite/scoped-view round trips cover setting and clearing a blocker while retaining its prior snapshot and keeping done false.
- `node check-intake-team-task-evidence-client.mjs`: separate evidence submission behavior remains valid.
- `node check-dialog-accessibility.mjs`.
- `node scripts/task-layout-acceptance-server.mjs --self-test`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Production build: `node scripts/run-framework.mjs build`.

The existing fictional fixture now extracts the actual progress validator and feedback helper. It also clears its local validation-status text before every submission attempt, so an earlier successful rehearsal cannot describe a later rejected attempt. It runs pure input validation only, without application controllers, API, authentication or storage commands.

## Browser observations

| Case | Result |
| --- | --- |
| Unchanged stage/blocker/detail with reason and confirmation | Existing no-change error visible/focused; stage/detail/reason/confirmation retained; modal open; local status empty |
| Tab from error | Reaches work stage |
| Blocked without detail | Original validation error visible/focused; other entries retained; local status empty |
| Changed valid blocker detail | Error clears; fictional local validation status only |
| Choose Not blocked while retaining detail | Original validation error visible/focused; detail retained for correction; previous local status cleared |
| Clear detail for Not blocked | Error clears; fictional local validation status only |
| Escape after correction | Closes dialog and restores opener |
| Fresh unchanged report, then keyboard Cancel | Error visible/focused before dismissal; Cancel closes and restores opener |

Valid fixture status states “Fictional UI validation only; nothing saved.” Actual history and controlled save behavior are covered separately by the controller/SQLite tests above. Preview stopped after testing. No real student data or production credential was used as test data.

## Acceptance and next task

D251-01 fixed and retested. This finishes the scoped persistent local input-feedback pass across eight task dialogs from Stages 246–251. It does not change server failure/reconciliation handling or certify complete application accessibility.

W10-16 remains Partial for full application/screen-reader/touch acceptance. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Previous attempts and defect records are retained. Stage 241's full 32-command regression remains historical and was not rerun or relabelled as current after these runtime changes.

Official MIS API/data/SSO remain external dependencies; isolated mock integration and disabled live identity/mail activation are preserved. Bulk progression still excludes only officially Left College students and handles final semester separately.

Next bounded task: run the full existing workflow regression suite against the completed task-form feedback changes and record a fresh readiness checkpoint with exact results, retaining all external and institutional acceptance limits.
