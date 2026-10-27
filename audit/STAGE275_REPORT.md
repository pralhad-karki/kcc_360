# Stage 275 — publication API acceptance

2026-10-27, Asia/Kathmandu. Branch `development/website-mock-acceptance` starts at GitHub `main` commit `c47c92cad3372a62579e2de6f20ce01fc9f6b708`. Application sources match Stage 274 / saved Version 286 (`2154aed`). GitHub has a new initial commit; earlier 296-commit history remains in `git-history/kcc360-history.bundle`. Archive-only differences were inspected. No database migrations were changed or applied. GitHub source development only; no hosted deployment.

## Existing work and independent increment

Stage 273 already supplies the approved-event adapter, durable workspace outbox, immutable request IDs, CAS saves and atomic audit, mock transport, retries, corrections and terminal withdrawals. Stage 274 supplies session-derived operator permissions, minimal read projection, disabled framework route and operator controls. Existing approvals, participation, reflections, portfolios and completion reports remain authoritative.

The publication route now maps known failures consistently: unauthorized scope 403, invalid fields 400, unknown request 404, stale/superseded/withdrawn state 409, invalid website response 502. Unexpected errors retain the generic service response without private details. Integration stays disabled by default; no caller-selected role, consent or enablement was introduced. KCC360 remains independent of website availability.

Added `check-website-v1-route.mjs` to the existing regression launcher. It compiles the actual route/service, substituting only Cloudflare identity/environment and the operator import. It reuses the actual controller, engine, runtime, SQLite and mock transport. It is not hosted Worker authentication acceptance.

## Provisional contract and mapping

The requested OpenAPI, publication schema and Stage 91 report are retained in `audit/integration-v1/`. No competing contract was introduced. Stage 98's supplied local consumer was tested again. SHA-256 comparison confirms its provisional OpenAPI and publication schema exactly match the retained copies. This does not claim hosted compatibility or formal schema validation.

| Field | Existing mapping |
| --- | --- |
| `source_id`, `kcc360_event_id` | Stable canonical KCC360 event ID |
| `request_id` / idempotency key | Same durable request UUID for exact retries |
| listing version / `source_version` | Separate approved-listing revision and monotonic transfer version |
| `website_event_id` | Separate website-assigned event identity |
| `website_revision`, status, `public_url` | Independent website state; URL provisionally relative |
| source approval | Unchanged by website status or publishing |

Timestamps retain explicit offsets/UTC. Reflection, report and portfolio identifiers remain distinct.

## Automated evidence and limits

- Eight compiled-route groups pass with the bounded mock and with the Stage 98 consumer (`STAGE275_STAGE98_ROUTE.txt`): disabled/no writes; owner/session/origin/JSON/size guards; role/department/spoof denial; duplicate submission; timeout/retry; private draft and independent website review; privacy; session revocation/re-login; withdrawal receipt and delayed-old-request denial; generic internal errors.
- Stage 98 producer run: 19 grouped checks pass (`STAGE275_STAGE98_PRODUCER.txt`), including rejection, lost acknowledgement, corrections, stale responses and withdrawal races.
- TypeScript and production build pass (`STAGE275_TYPESCRIPT.txt`, `STAGE275_BUILD.txt`). Consolidated regression: **69/69 passed, 0 failed** (`STAGE275_REGRESSION.json`).

Full signed-in browser withdrawal/keyboard testing and hosted Worker/institutional acceptance remain pending. Earlier partial browser observations are not promoted to completed acceptance. No live synchronization, real credentials or production migrations.

## Dependencies and next increment

Before registration, the website team must confirm who issues opaque `participant_reference`, trusted mapping to existing MIS/KCC360 students, consistent full-refresh paging/snapshot semantics, and explicit cancellation (missing rows never imply cancellation). No incremental cursor semantics are assumed. Authentication/scopes, URL origin, consent/guardian policy, revocation and reinstatement remain provisional coordination dependencies.

Next smallest task: finish the local signed-in browser withdrawal journey, then stage a disabled full-refresh registration preview using existing participation records. Unknown identities become exceptions; no automatic student creation or attendance verification. Reflection/report publication and fallback reconciliation remain later increments using existing approvals and audit.

**Local mock workflow verified — cross-system acceptance pending** (event transfer and compiled publication route only).
