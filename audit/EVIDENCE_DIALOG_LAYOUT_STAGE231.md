# Stage 231 — evidence submission and verification dialogs

Baseline: clean ff06bab2e97c2990f97c0af12ba788fa5d615e88, published version 242. No MIS access required.

D231-01 reproduced with fictional long prose/unbroken text using the actual production form renderers and native modal helper in a 320 px child viewport. Evidence submission, evidence verification and inherited revised-evidence verification each had dialog clientWidth 271 / scrollWidth 5151 and no visible Cancel button.

Applied the existing task-dialog-content class to both initial and loading sections for the evidence-submission and verification clients. They now inherit Stage 230's bounded controls, natural checkbox dimensions, wrapping, reduced nested padding and definition-list layout. Added non-submitting Cancel buttons using the existing closeModal helper. Revised-evidence verification inherits the fix from teamVerifyForm; no new workflow implementation was introduced. Updated only the affected script cache revisions.

Extended scripts/task-layout-acceptance-server.mjs with these three form variants, using the existing actual-function extraction and fictional contributions. The local-only harness has no application APIs, records, database binding, authentication or external data, rejects non-GET requests and performs no saves. Browser layout acceptance is distinct from the separately executed trusted dispatcher/SQLite workflow checks.

| Child viewport | Forms tested | Client / scroll width in every form | Document width |
| --- | --- | --- | --- |
| 320 px | evidence, verification, revised-evidence | 271 / 271 | 320 |
| 360 px | evidence, verification, revised-evidence | 309 / 309 | 360 |
| 768 px | evidence, verification, revised-evidence | 565 / 565 | 768 |

Named dialog headings were observed for all variants. Cancel and Escape closed each dialog and returned focus to the opener. Attempted blank submission focused required evidence selection for the student or required reason for the mentor. Declarations remained unchecked and textareas retained their 2000-character limits. No workflow command was submitted in the browser. Full screen-reader, touch-device and complete accessibility acceptance remains outstanding. W10-16 stays Partial; historical attempts and institutional acceptance Not run remain preserved.

Targeted verification passed: renderer self-test; check-intake-team-task-evidence-client.mjs; check-intake-team-evidence-verification-client.mjs; check-intake-team-task-rereview-client.mjs; shared dialog accessible naming; TypeScript no-emit; production build. Those client checks include real trusted dispatcher and SQLite scope/concurrency/provenance checks with fictional fixtures. The preview was stopped after testing.

Preserved: separate evidence verification versus individual completion/scoring, required independence/confirmation, current-source guards, immutable histories, application permissions, schema/migrations/data and disabled MIS/SSO/email integration. No real student data or credentials were used.

Next bounded independent task: task-assignment dialog accessibility and responsive-layout checks, including long assignee/criteria labels. Do not treat these evidence-form checks as assignment-form acceptance.
