# Stage 247 — persistent student revision validation feedback

Baseline: clean fae1f23934a31a61240bb93752564a8121dcc250, published version 258. Date: 23 October 2026, Asia/Kathmandu.

## Change

The student revision dialog now uses the same local, persistent, keyboard-focused error paragraph introduced for assignment and initial evidence in Stage 246. Previously its conditional input errors used the global toast outside the modal, disappearing after 3200 ms.

The original error text appears inside the existing form as `role="alert"`, tabindex -1, without replacing fields. Before the next controller input check it clears; a rejected attempt updates/refocuses it. Current-account/context/modal guards still run first. Successful correction follows the existing controlled submission flow. No validation or authorization rules changed.

The feedback acknowledgment, confirmation, genuine contribution/evidence change requirement, safe links, fixed criteria, retained mentor feedback and append-only submission/review history remain enforced. The revision client cache version advanced and browser assets were regenerated through the existing script. No server command, architecture, schema/migration, configuration, permissions or stored workflow data changed.

## Validation

Fresh passes:

- `node check-intake-team-task-revision-client.mjs`: existing invalid-field and unchanged-content cases now additionally assert visible/focused feedback, unchanged payload and marker, open modal and zero requests. Corrected save clears feedback. Existing trusted dispatcher/SQLite/scoped-view round trips preserve prior history for NEW and EXISTING evidence.
- `node check-intake-team-task-rereview-client.mjs`: fresh mentor evidence/individual decisions, current versions, independent authority, 0/null distinction and retained histories.
- `node check-dialog-accessibility.mjs`.
- `node scripts/task-layout-acceptance-server.mjs --self-test`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Production build: `node scripts/run-framework.mjs build`.

The existing fictional browser fixture now extracts revision input/feedback helpers and their pure dependencies. Its synthetic context includes an explicit prior evidence snapshot. An initial unchanged-content rehearsal incorrectly passed because fixture prose had trailing whitespace while the validator trims submitted text. The fixture prose was normalized; the application rule was not changed. A self-test now proves unchanged content is rejected and changed contribution passes. The fixture also clears its local validation status on reopening so an old successful rehearsal cannot appear to describe a new invalid attempt.

## Browser observations

Using actual form/input/feedback functions, fictional content and no application save handlers, API, authentication or storage commands:

| Check | Result |
| --- | --- |
| NEW evidence without title/description | Original error visible and focused; reason and checked declarations retained |
| Title supplied, description missing | Error remains focused; entered title retained |
| EXISTING evidence with leftover NEW title | Existing mixed-input rejection displayed locally |
| Unchanged contribution/evidence, after fixture correction | Genuine-change error visible/focused, modal open, local status empty |
| Tab from error | Reaches evidence selection |
| Corrected contribution with existing evidence | Error clears; fictional local validation status only |
| Corrected NEW evidence | Error clears; fictional local validation status only |
| Escape / keyboard Cancel | Modal closes, opener regains focus; Cancel also checked after unchanged-content rejection |
| Reopen | Previous fictional validation status cleared |

Final fixture retests confirmed NEW missing/corrected cases and unchanged-content rejection with a fresh local status. Valid fixture attempts only display “Fictional UI validation only; nothing saved.” They do not prove an institutional save; controller/SQLite tests above cover the actual controlled save path. Preview stopped after testing.

## Acceptance and next task

D247-01 fixed and retested for revision feedback. W10-16 remains Partial for complete application accessibility, screen-reader and touch acceptance; W10-13 remains blocked for official MIS/credit assertions. Institutional acceptance remains Not run. Earlier results are retained. The Stage 241 32-command regression is historical and was not rerun or relabelled as current after runtime changes.

Official MIS API/data/SSO remain external dependencies; isolated mock integration and disabled live identity/mail activation are preserved. Semester progression still excludes only official Left College and retains the separate final-semester path. No real student data or production credentials were used as test data.

Next bounded task: persistent conditional validation feedback for the mentor's individual task-review dialog, preserving independent review, assigned-domain scores, zero/Not assessed distinction and verified-evidence completion requirements.
