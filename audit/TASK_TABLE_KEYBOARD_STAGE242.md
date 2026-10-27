# Stage 242 — native task-table keyboard scrolling verified

Baseline: clean 2269dc28ed905ee9df45bee702c6bf8b2b814656, published version 253. Date: 23 October 2026, Asia/Kathmandu. The remaining specific W10-16 question was whether the existing horizontal task table could actually be scrolled by keyboard, beyond its already established focusable named region.

## Result

**Native horizontal keyboard scrolling works. No runtime fix was needed or made.** The earlier Stage 232 unconfirmed probe remains retained; this new attempt records positive browser evidence and closes that specific question without adding a duplicate/custom keyboard handler.

Used the actual `teamTaskForm`, `tableHTML` and native modal functions with the existing fictional long-content UI-only fixture. It does not authenticate or validate a real assignment preparation and sends no assignment/API/storage command. A disposable preview initially could not resolve its external TypeScript dependency symlink; copying that already-installed dependency inside the disposable fixture repaired preview isolation. No application code or dependency declaration was changed to compensate.

## Observed browser checks

At a 320 px child viewport:

| Check | Observed result |
| --- | --- |
| Named region | Existing task assignments, tabindex 0, active element is the region. |
| Horizontal geometry | Region clientWidth 215 px, content scrollWidth 900 px, maximum scrollLeft 685 px. |
| Native ArrowRight | scrollLeft moved from 0 to 40 px after the browser handled the key. |
| Repeated ArrowRight | Reached exact maximum 685 px. State column was fully inside the visible region. |
| Repeated ArrowLeft | Returned to exact left boundary 0 px. Focus stayed on the region. |
| Dialog overflow | clientWidth and scrollWidth both 271 px; the table scrolls internally. |
| Tab from region | Focus moved to Task title. |
| Ordinary input ArrowLeft | Fictional title retained; caret moved within the input; table stayed at 0. |
| Shift+Tab from Task title | Focus returned to the named table region. |
| Escape from region | Dialog closed and focus returned to Open assignment form. The fixture submission status remained empty. |

Native Home/End horizontal shortcuts, full modal boundary cycling, screen-reader output, real touch devices and institutional acceptance are not asserted by this run. No custom arrow handler, global key interception, focus trap or application save was introduced. Preview stopped after the checks.

## Targeted validation

Fresh passes:

- `check-intake-team-task-client.mjs`: current lead/mentor preparation, exact confirmation and retained task/source checks; duplicate, account, closed/malformed response and no-replay guards.
- `check-intake-team-task-save.mjs`: actual trusted dispatcher and SQLite role/source/token/CAS/audit/history invariants, no automatic completion/scores.
- `check-dialog-accessibility.mjs`: existing native dialog naming/loading/replacement behavior.
- `scripts/task-layout-acceptance-server.mjs --self-test`: actual renderer extraction and fictional UI-only fixture.

The Stage 241 full 32/32 automated regression, TypeScript and build evidence is retained and applies to unchanged runtime files. Those aggregate checks were not rerun or relabelled as fresh in Stage 242. Only README/acceptance evidence changes in the tracked project; source, browser assets, permissions, schema/migrations, configuration and stored data remain intact.

## Acceptance and next task

W10-16 remains **Partial overall**. Its native table-scroll subcheck is now positively verified; all older attempts and defects remain in the register. W10-13 remains blocked for official MIS/credit assertions. Institutional acceptance remains Not run. Live MIS/SSO/mail activation is unchanged and unconfigured/disabled.

Next bounded task: verify keyboard focus boundaries across the shared task dialogs, particularly the previously unconfirmed last/first focus transitions. Use existing native modal behavior and fictional fixtures; do not add a custom focus trap unless a reproducible defect is established. Complete application, screen-reader and touch-device acceptance remain separate work.
