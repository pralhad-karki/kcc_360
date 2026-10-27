# Stage 246 — persistent conditional validation feedback

Baseline: clean f2e62eb3eb8d8046d994a0805724180f05b4fb48, published version 257. Date: 23 October 2026, Asia/Kathmandu.

## Problem and change

Assignment domain/criterion errors and initial evidence conditional errors were rejected before any save, but their messages used the global toast outside the native modal. That toast disappears after 3200 ms. Source inspection established this feedback gap; prior native required-field tests did not exercise it.

Assignment and initial evidence forms now contain a hidden, persistent `role="alert"` paragraph with tabindex -1. Their existing local input-validation catch displays the original error as text and focuses that paragraph inside the current modal. No field values or form DOM are replaced. On the next controller validation attempt the previous message clears; a new invalid attempt replaces and refocuses it. Successful correction follows the existing save path. Existing authority/current-context guards run before feedback changes. Legacy missing-marker fallback retains toast behavior.

The validation rules, server commands, trusted source binding, confirmations, locks, revisions, roles, permissions and save semantics are unchanged. No new field requirement or institutional policy was introduced. Browser assets were regenerated from the existing sources and only the two changed client cache versions were advanced.

## Verification

Existing assignment/evidence client tests now exercise actual controller catches with an error-element stub. For each rejected input they assert no request, same open marker, unchanged field payload, visible nonempty feedback and one focus call. The subsequent corrected valid path asserts feedback clears and the existing exact save/GET proof succeeds. Existing stale/account/duplicate/closed-modal checks remain.

Fresh passes:

- `check-intake-team-task-client.mjs`
- `check-intake-team-task-evidence-client.mjs`
- `check-intake-team-task-save.mjs`
- `check-intake-team-task-submission-save.mjs`
- `check-dialog-accessibility.mjs`
- `scripts/task-layout-acceptance-server.mjs --self-test`
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- Production build: `node scripts/run-framework.mjs build`

The existing local fictional fixture now extracts the actual pure input validators and feedback helpers for assignment/evidence, in addition to their renderers. Its submit listener prevents default and only validates locally; it never runs the real controllers, API, authentication or storage commands. Valid correction displays “Fictional UI validation only; nothing saved.” This distinguishes browser display/focus proof from the actual controller tests above.

Browser observations:

| Case | Observed result |
| --- | --- |
| NEW evidence without title/description | Original error visible, summary focused, modal open, contribution retained, submission status empty |
| Title corrected but description missing | Summary remains visible/focused; corrected title retained; status empty |
| Description corrected | Summary hidden and empty; fictional local validation status only |
| Tab from evidence summary | Reaches evidence selection |
| Assignment with no selected domain | Domain/criterion error visible/focused; title retained; status empty |
| Selected Concept without criterion | Same local error recovery; no save |
| Skills criterion with Skills unselected | Same local error recovery; no save |
| Corrected domain criteria | Summary clears; fictional local validation status only |
| Dismissal | Evidence Escape and assignment keyboard Cancel close and restore opener |

One label locator initially timed out after opening the evidence fixture; refreshed accessibility state showed the correctly rendered form and the documented name selector then worked. No application console failure was established. Preview stopped after testing.

## Preservation and remaining work

No schema/migration, configuration, stored data, architecture, integration boundary or authorization change. No real student data or production credential was used as test data. Official MIS API/data/SSO remain pending; live identity/mail activation remains disabled. Semester progression rules and existing histories are untouched.

D246-01 is fixed and retested for these two dialogs. W10-16 remains Partial for wider accessibility/screen-reader/touch acceptance. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Stage 241's 32/32 aggregate report remains historical and was not rerun or relabelled as a current full-suite result after this runtime change.

Next bounded task: extend the same persistent validation-feedback behavior to the student revision dialog, retaining its genuine-change rule, feedback acknowledgment and append-only save history. Other dialog/controller errors and complete institutional accessibility acceptance remain separate work.
