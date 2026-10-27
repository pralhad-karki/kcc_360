# Stage 230 — narrow task form layout and accessible dismissal

Baseline: clean 89e1c272d7a86053f518a81d54786006ea2131b7, published version 241. Work continues independently of MIS.

D230-01 reproduced in the actual review-form renderer with fictional long unbroken text in a real 320 px child viewport: document width 320; dialog clientWidth 271 and scrollWidth 5151. Global page section padding, default fieldset min-content sizing, long text and unconstrained controls contributed to overflow. Global full-width input styling also stretched checkboxes.

Fix scoped to task dialog content:
- review, progress and revision forms/loading content use task-dialog-content; rereview inherits the existing review renderer.
- remove nested page padding; allow fieldsets/controls to shrink; wrap long text; remove definition-list indentation; keep checkbox dimensions natural with readable adjacent declarations.
- visible non-submitting Cancel buttons use the existing closeModal helper. Native showModal, Escape, accessible heading naming and source/version/save guards remain unchanged.
- domain scores have distinct accessible names (for example Concept mastery score). 0 and Not assessed remain different values.

Browser evidence from scripts/task-layout-acceptance-server.mjs (disposable checkout only):

| Actual child viewport | Tested forms | Dialog clientWidth / scrollWidth | Document width |
| --- | --- | --- | --- |
| 320 px | review, rereview, progress, revision | 271 / 271 each | 320 |
| 360 px | review, rereview, progress, revision | 309 / 309 each | 360 |
| 768 px | review, rereview, progress, revision | 565 / 565 each | 768 |

The harness extracts actual production form functions and the shared modal helper, loads the actual stylesheet, and serves fictional long prose and unbroken text. Fixed-width same-origin iframes provide actual CSS layout viewports without an unsupported browser resize API. It has no MIS connection, application command endpoint, authentication, database or real records. It rejects non-GET requests. These are form layout/interaction observations, not full application or workflow-save acceptance.

All named forms showed Cancel and returned focus to their opener after cancellation. Escape returned focus to the opener. A top-level required-decision check focused the decision select on attempted blank submission. Native boundary probes after the last control left BODY active and before the first focused the native dialog; no outside page control was observed focused, but full focus-boundary/browser-chrome behavior is not declared passed. No custom focus trap was introduced. A visual screenshot inspection of the 320 px progress dialog confirmed wrapped text and controls within its scroll area. Screen-reader, real touch-device and complete W10-16 accessibility acceptance remain outstanding; W10-16 is Partial. Existing historical attempts remain in the acceptance register. Institutional acceptance remains Not run and institutional activation disabled.

Passed:
- Local fictional layout renderer self-test.
- check-intake-team-task-review-client.mjs, check-intake-team-task-rereview-client.mjs, check-intake-team-task-progress-client.mjs, check-intake-team-task-revision-client.mjs (including actual dispatcher/SQLite prerequisites, exact saved-record proof and privacy/concurrency guards).
- check-dialog-accessibility.mjs.
- TypeScript no-emit and production build.

No schema, migration, database data, business permissions or MIS/SSO/email activation changed. Managed preview stopped after checks. Next bounded independent task: evidence-submission and verification dialog accessibility/responsive checks; do not infer they passed from these four forms.
