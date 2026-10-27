# Stage 250 — persistent evidence-verification validation feedback

Baseline: clean 4c42ad3a5ea1cb79e6f6fa273063b7f6b6685032, published version 261. Date: 23 October 2026, Asia/Kathmandu.

## Change

Initial and revised-work evidence verification now keep original input-validation messages inside their open modal and focus the message, replacing the expiring global toast for these local input errors. A hidden alert paragraph in `teamVerifyForm` is inherited by the revised-evidence renderer. One local helper manages its text, visibility and focus. The separate revised-work controller selects the existing review helper for REVIEW mode and the evidence helper for EVIDENCE mode.

Current account, prepared context, modal and marker guards still run first. The previous error clears before the next validation attempt; rejected input updates/refocuses the summary without replacing fields. Corrected input follows the original trusted save/GET path. Independence declarations, required reason/confirmation, version/source checks and independent mentor authority are unchanged. Verification remains evidence-only: it does not score or complete individual tasks.

Only affected client cache versions advanced; assets were regenerated using the existing preparation script. No server command, architecture, database/schema/migration, configuration, authorization or stored workflow record changed.

## Fresh checks

- `node check-intake-team-evidence-verification-client.mjs`: existing invalid-field/forged-field cases plus whitespace-only reason assert zero requests, same open marker, unchanged field payload, visible nonempty feedback and one focus call. Corrected input clears feedback; exact command/GET proof preserves tasks.
- `node check-intake-team-task-rereview-client.mjs`: both REVIEW and EVIDENCE invalid inputs now assert persistent focused feedback and no toast. Corrected cases clear feedback. Actual trusted dispatcher/SQLite/scoped-view evidence verification leaves prior task/submission/review histories intact, and separate individual reassessment still passes.
- `node check-intake-team-task-review-client.mjs`: independent decisions and 0/null score semantics remain valid.
- `node check-dialog-accessibility.mjs`.
- `node scripts/task-layout-acceptance-server.mjs --self-test`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Production build: `node scripts/run-framework.mjs build`.

The existing fictional fixture now extracts the actual evidence input validator, exact-key dependency and feedback helper for both verification routes. It runs pure local validation only, without application controllers, authentication, API calls or storage commands.

## Browser evidence

The following were observed separately for initial and revised-work verification:

| Check | Result |
| --- | --- |
| Initial form | Blank reason, unchecked declarations, hidden empty error and no score controls |
| Spaces-only reason with declarations checked | Existing validator rejects it; original message visible/focused; reason/declarations retained; modal remains open; fixture status empty |
| Tab from error | Reaches verification reason |
| Corrected reason | Error clears/hides; declarations retained; fictional local validation status only |
| Escape after correction | Closes dialog and restores opener |
| Fresh invalid attempt followed by keyboard Cancel | Closes dialog and restores opener; local status stays empty |

Corrected fixture status states “Fictional UI validation only; nothing saved.” Actual controlled save semantics are covered by the isolated controller/SQLite tests above. No browser workflow save occurred. Preview stopped after testing. No real student data or production credential was used as test data.

## Acceptance and next task

D250-01 fixed and retested for both verification paths. W10-16 remains Partial for complete application accessibility, screen readers and touch devices. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Historical attempts remain intact; Stage 241's 32-command regression was not rerun or relabelled as current after runtime changes.

Official MIS API/data/SSO remain external dependencies; isolated mock integration and disabled live identity/mail activation remain unchanged. Bulk progression still excludes only officially Left College students, with final-semester handling separate.

Next bounded task: persistent conditional feedback for task-progress blocker/detail validation, the remaining task-form controller in this feedback pass. Retain blocker snapshots, reason/confirmation and the separation between progress reporting and verified completion.
