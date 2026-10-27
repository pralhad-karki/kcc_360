# Stage 249 — persistent revised-work individual-review feedback

Baseline: clean 782007be20d5d391f8309947cec0546f3a641d31, published version 260. Date: 23 October 2026, Asia/Kathmandu.

## Change

The separate revised-work controller now uses the existing individual-review feedback helper for its REVIEW mode. Input errors persist as focused text inside the current form rather than using the expiring global toast outside the native modal. The existing hidden alert paragraph was inherited from `teamReviewForm` in Stage 248; no duplicate message element or helper was introduced.

Current-account/context/modal/marker guards still run before clearing or displaying feedback. A subsequent attempt clears the old message, then validates against the same prepared revised-work input. A rejection updates/refocuses the summary without replacing fields. Corrected valid input retains the original trusted save/GET path. EVIDENCE mode keeps its existing toast behavior in this stage.

Fresh decisions, scores and feedback remain blank initially. Earlier feedback and revision explanation remain historical context, without becoming current assessment defaults. Independent mentor authority, allowed decisions, assigned-domain 0–4/Not assessed, verified-evidence completion requirements, current versions and append-only history are unchanged. The changed client cache version advanced and existing browser assets were regenerated.

## Fresh validation

- `node check-intake-team-task-rereview-client.mjs`: invalid REVIEW cases, including whitespace-only feedback, now assert zero requests, unchanged input/marker, open modal, visible focused feedback and no toast. EVIDENCE cases explicitly assert unchanged toast behavior and no summary focus. Corrected REVIEW clears feedback before the existing save proof. Existing trusted dispatcher/SQLite/scoped-view cases retain prior submissions and first review, and cover fresh VERIFIED, RETURNED and PARTIAL second decisions.
- `node check-intake-team-task-review-client.mjs`.
- `node check-dialog-accessibility.mjs`.
- `node scripts/task-layout-acceptance-server.mjs --self-test`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Production build: `node scripts/run-framework.mjs build`.

The existing fictional fixture now enables the actual pure review validator/helper on its rereview route. It does not run application controllers, authentication, API or storage commands. Browser observations:

| Case | Result |
| --- | --- |
| Initial revised review | Decision, both score selects and feedback empty; declarations unchecked; hidden error empty |
| Historical context | Earlier mentor feedback and student's revision explanation remain rendered |
| PARTIAL, Concept 0, Skills Not assessed, spaces-only feedback, declarations checked | Existing validator rejects input; error visible and focused; decision, raw scores, feedback and declarations retained; fixture status empty |
| Tab from summary | Reaches fresh decision select |
| Corrected feedback | Summary clears/hides; 0/Not assessed values retained; fictional local validation status only |
| Escape after correction | Closes and restores opener |
| Fresh RETURNED with spaces-only feedback | Persistent focused rejection; fresh score blanks and declarations retained; fixture status empty |
| Keyboard Cancel after rejection | Closes and restores opener |

Valid local status states “Fictional UI validation only; nothing saved.” Actual controlled save/history behavior is established by the separate tests above. Preview stopped after testing. No real student data or production credentials were used as test data.

## Preservation and next task

D249-01 fixed and retested for revised-work individual REVIEW mode. No database/schema/migration, permissions, configuration, architecture or stored workflow records changed. Existing semester progression and final-semester rules are preserved. Official MIS API/data/SSO remain external dependencies; isolated mock integration and disabled live identity/mail activation remain unchanged.

W10-16 remains Partial for full application accessibility, screen-reader and touch acceptance. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Earlier execution evidence remains intact. Stage 241's full 32-command aggregate result is historical and was not rerun or relabelled after these runtime changes.

Next bounded task: persistent validation feedback for initial and revised-work evidence verification, retaining their separate independence declarations and leaving individual completion/scores unchanged.
