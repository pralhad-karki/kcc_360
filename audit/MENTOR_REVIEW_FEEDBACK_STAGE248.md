# Stage 248 — persistent individual mentor-review validation feedback

Baseline: clean af000a7b0f2b2fd46751a40c06f418025d4ab00c, published version 259. Date: 23 October 2026, Asia/Kathmandu.

## Change

The initial individual mentor-review controller now displays its original input-validation error inside the open form, with persistent text, alert semantics and keyboard focus. Previously it used the expiring global toast outside the native modal. The paragraph is hidden initially, clears before the next controller validation attempt, and updates/refocuses on another rejection. Field DOM and entered values are not replaced.

Existing current-account/context/modal guards still run first. No rule changed: only allowed decisions, assigned-domain 0–4 or Not assessed, valid individual feedback, independence declaration and confirmation pass. Verified-evidence requirements, independent mentor authority, exact source/version binding, trusted save/GET checks and retained histories are unchanged. The browser asset was regenerated and this client's cache version advanced.

`teamReviewForm` is also reused by revised-work review, so that renderer inherits the hidden error paragraph. Its separate controller still uses its existing error path; this stage does not claim revised-work feedback activation. Evidence-verification feedback is also outside this change.

## Fresh verification

- `node check-intake-team-task-review-client.mjs`: whitespace-only feedback added to the existing invalid-input cases; every rejected case additionally asserts zero requests, same open marker, unchanged field payload, visible nonempty message and one focus call. Corrected input clears the message. Existing real dispatcher/SQLite/scoped-view cases for PARTIAL, RETURNED and VERIFIED pass, retaining 0 versus null, independent review and verified-evidence completion requirements.
- `node check-intake-team-task-rereview-client.mjs`: reused rendering and separate revised-work controller behavior remain valid.
- `node check-dialog-accessibility.mjs`.
- `node scripts/task-layout-acceptance-server.mjs --self-test`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Production build: `node scripts/run-framework.mjs build`.

The local fictional fixture now extracts the actual individual-review input validator, exact-key dependency and feedback helper. It supplies task domains and allowed decisions alongside the existing preview. Browser form submissions only run pure local validation; no controller, authentication, application API or storage command runs.

Browser observations:

| Case | Observed result |
| --- | --- |
| PARTIAL, Concept 0, Skills Not assessed, feedback containing only spaces, declarations checked | Native required check allows the nonempty text, then existing controller-style pure validator rejects it. Original message is visible/focused inside the open modal; decision, raw scores, spaces and declarations retained; fixture status empty. |
| Tab from summary | Focus reaches Review decision. |
| Feedback corrected | Error clears/hides; Concept remains 0 and Skills remains blank/Not assessed; only fictional local validation status appears. |
| Escape after correction | Modal closes and opener regains focus. |
| Fresh RETURNED attempt with spaces-only feedback | Error visible/focused, declarations and decision retained; fixture status empty. |
| Keyboard Cancel after rejection | Modal closes and opener regains focus. |

Valid fixture status explicitly states “Fictional UI validation only; nothing saved.” Actual save behavior is covered separately by the controller/SQLite tests above. Preview stopped after testing. No real student data or production credential was used as test data.

## Preservation and remaining work

No database/schema/migration, configuration, role, permission, architecture, source integration boundary or stored workflow record changed. Existing semester progression and final-semester rules remain intact. Official MIS API/data/SSO remain external dependencies; isolated mocks and disabled live identity/mail activation are preserved.

D248-01 fixed and retested for the initial individual-review controller. W10-16 remains Partial for full application accessibility/screen-reader/touch acceptance. W10-13 remains blocked for official MIS/credit assertions; institutional acceptance remains Not run. Earlier evidence is retained; Stage 241's full 32-command regression is historical and was not rerun or relabelled as current after runtime changes.

Next bounded task: connect persistent validation feedback to the separate revised-work individual-review controller, preserving fresh decisions/scores, independent mentor authority and append-only reassessment history.
