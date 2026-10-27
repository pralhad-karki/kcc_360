# Stage 245 — native task-dialog required-field keyboard recovery

Baseline: clean commit 58b2f0a7d5dfd1f39b97ce2a010145682d1b7e5d, published version 256. Date: 23 October 2026, Asia/Kathmandu.

The Stage 244 browser attempt remains recorded as incomplete. In this new attempt, the managed preview was started successfully before opening its permitted HTTP fixture URL. The supported browser could then open it normally; no error-page acquisition, policy bypass or alternative automation surface was used.

## Result

The checked native validation and keyboard recovery sequence works in all eight task dialogs. No runtime defect was established and no application code was changed.

Used top-level `/form` routes from the existing fictional UI-only fixture. Its 12 renderer/helper/style inputs exactly match the current production checkout. The fixture extracts actual renderers and native modal helper, but does not run real controller/save handlers, authentication, API calls or storage writes. Every attempted submission deliberately retained at least one invalid required field, and the fixture submission status stayed empty throughout.

| Dialog | Initial invalid control focused on submit Enter | After correcting that control, submit Enter focused | Tab then Shift+Tab |
| --- | --- | --- | --- |
| Assignment | Task title | Responsible student | Due date → Responsible student |
| Review | Review decision | Individual feedback | Independence declaration → Individual feedback |
| Rereview | Review decision | Individual feedback | Independence declaration → Individual feedback |
| Progress | Change reason | Confirmation | Submit button → Confirmation |
| Revision | Evidence selection | Feedback response reason | Feedback acknowledgment → Reason |
| Evidence submission | Evidence selection | Individual contribution | Submission reason → Individual contribution |
| Evidence verification | Verification reason | Independence declaration | Confirmation → Independence declaration |
| Revised-evidence verification | Verification reason | Independence declaration | Confirmation → Independence declaration |

Corrected values were retained: fictional assignment title, PARTIAL review selections, existing fictional evidence index 0, and fictional reason text as applicable. The revision's earlier contribution was already populated, so its next invalid control was the feedback response reason. Required confirmation/independence checkboxes remained unchecked.

After correction and the next invalid submission, Escape closed every dialog and focused its corresponding opener. A separate fresh invalid-submission attempt in every dialog followed by keyboard Enter on Cancel likewise closed and returned focus to the opener. No form submission result or workflow save occurred.

## Checks and limits

Fresh passes: `node check-dialog-accessibility.mjs`, `node scripts/task-layout-acceptance-server.mjs --self-test`, and exact equality of the 12 fixture inputs with the production checkout. Stage 244's eight targeted client/dialog passes remain retained for identical runtime. Stage 241's full 32/32 regression and TypeScript/build evidence remains applicable; these checks were not rerun or relabelled as fresh here.

This closes the specific initial required-field/correction/dismissal browser question. It does not test every required field, every conditional rule, validation message announcements, private uploads, real controller error responses, full application accessibility, screen readers, touch devices or institutional acceptance. No strict focus-wrap guarantee is inferred. W10-16 remains Partial overall; W10-13 remains blocked for official MIS/credit assertions. Institutional acceptance remains Not run.

Only README and acceptance evidence changed. Existing source, architecture, assets, permissions, schema/migrations, configuration and stored workflow records are preserved. Official MIS API/data/SSO remain external dependencies; mock integration remains isolated and live identity/mail activation remains disabled. No real student data or production credential was used as test data. Preview stopped after testing.

Next bounded development task: audit conditional task-form validation feedback, starting with NEW evidence title/description and selected-domain criteria. These rules are enforced by existing controllers beyond native required attributes. Verify invalid input cannot save and that the student can identify/correct it without losing entered work; introduce a focused fix only if the audit establishes a gap.
