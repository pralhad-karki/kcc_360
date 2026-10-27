# Stage 243 — task-dialog keyboard boundary observations

Baseline: clean commit 6a3cb5c0ddaae495b2d631d8daddcbb3fe3243d7, published version 254. Date: 23 October 2026, Asia/Kathmandu.

Used the existing disposable fictional UI fixture at its top-level `/form` route, rather than inside its layout iframe. It extracts actual task renderers and the native shared modal helper. No real student data, API, workflow command, storage write or form submission was used.

## Observed results

| Dialog | Initial focus | Escape and Cancel |
| --- | --- | --- |
| Assignment | Existing task assignments region | Closed; opener focused |
| Review | Decision select | Closed; opener focused |
| Rereview | Decision select | Closed; opener focused |
| Progress | Stage select | Closed; opener focused |
| Revision | Selection select | Closed; opener focused |
| Evidence submission | Selection select | Closed; opener focused |
| Evidence verification | Reason textarea | Closed; opener focused |
| Revised-evidence verification | Reason textarea | Closed; opener focused |

Across all eight forms, Shift+Tab from the initial control focused the dialog element. Tab from the last Cancel control left BODY as active element while the dialog stayed open. The next Tab focused the dialog element and the following Tab reached its first control. No background control received focus in these observed sequences. For the seven non-assignment forms a further reverse step from the dialog likewise left BODY active. A third reverse step was checked for assignment and revised-evidence verification and reached Cancel. Every dismissal returned to its corresponding opener, and every fixture result remained empty.

BODY being active does not identify which browser chrome control, if any, owns focus. The read-only browser evaluation surface does not expose `document.hasFocus()` (attempt returned TypeError), so browser chrome ownership is unverified. These observations establish reentry and dismissal behavior in this browser, not a strict first-to-last wrap guarantee, universal focus containment or full accessibility acceptance. Earlier BODY observations remain intact. No reproducible background-application focus leak was established; no custom focus trap or runtime change was introduced.

## Validation and preserved state

Fresh passes: `check-intake-team-task-client.mjs`, `check-intake-team-task-save.mjs`, `check-dialog-accessibility.mjs`, and `scripts/task-layout-acceptance-server.mjs --self-test`.

Stage 241's 32/32 regression and TypeScript/build evidence remains applicable to unchanged runtime; those aggregate checks were not rerun or relabelled here. Only this audit, README and the acceptance register changed. Source, browser assets, permissions, schema/migrations, configuration and stored data remain intact. Disposable preview stopped after testing.

W10-16 remains Partial overall. Full application accessibility, screen-reader and real touch-device acceptance remain unfinished. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Official MIS API/schema and SSO are still external dependencies. Live identity and mail activation remain disabled.

Next bounded task: check keyboard recovery after native required-field validation in the task dialogs, using fictional fixtures and no saves; verify that invalid controls become reachable and dismissal still restores focus. Fix only an established defect and retain the wider acceptance limits.
