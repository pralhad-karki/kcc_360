# Stage 278 — durable registration-only confirmation and save

2026-10-31, Asia/Kathmandu. Baseline `bed1275bbb4e89d462081c1fa252918854bb3b66` on `development/website-mock-acceptance`; local source and GitHub branch inspected before work. Existing migration files, source records, permissions and audit history were preserved. No production migration, deployment or live synchronization.

## Existing capabilities and incremental plan

Stage 277 supplies a disabled checked full-refresh preview, stable MIS identity keys/digests, identity exceptions, explicit cancellation and missing-row protection. Existing participation retains controlled membership, manual attendance, independent verification, evidence-backed contributions and portfolio linkage. Registration must remain distinct from those capabilities.

Plan implemented: reuse the current preview and context validation; require exact explicit confirmation; re-fetch the complete checked website refresh; persist only registration observations and an immutable operation receipt; use existing workspace revision checks and atomic audit; prove rollback, replay, cancellation and privacy boundaries. No student-import, roster, attendance or portfolio workflow was replaced.

## Independently implemented

`server/website-registration-store.mjs` defaults disabled, supports mock mode only, and has no installed institutional providers, API route, scheduler or operator controls. The caller supplies only event ID, local operation ID and confirmation (`confirmed`, exact preview digest and expected ledger revision). No caller-supplied records, role, identity crosswalk or enablement is accepted.

Preview/save uses the existing approved context validator and stable event-to-website publication binding. A trusted provider must authorize the current subject/actor, current event scope and a separate import capability. Permission-source workspace revision fences are mandatory. Confirmation re-fetches all checked pages, reloads source/identity/authority context, and compares the exact binding and revision before saving. Timeout, changed snapshot, changed mapping, expired/revoked authority or concurrent updates fail without importing partial data.

The save uses a separate private record in the **existing** `kcc_workspaces` table, ID `KCC-WEBSITE-REGISTRATIONS:KCC-OWNER-DEMO`. It does not append fields to the canonical application payload: inspection showed existing persona projections preserve extra root fields, so placing the private ledger there would expose it. First creation is a guarded INSERT; later saves use revision-guarded UPDATE. Both are fenced against current source and authority revisions and batched atomically with the existing `kcc_server_audit` insert. No new table or migration is needed. Previews and failed first saves create no empty ledger.

Each operation retains its subject/actor, scoped identifiers, confirmed digest, snapshot token, zoned observation/save times, observations/exceptions and before/after registration changes. Successful operation IDs bind to the exact confirmation and scope. A repeated request with current import authority returns the stored receipt without contacting the peer or repeating writes/audit. Altered or conflicting operation reuse is rejected. Receipt fields contain counts and operation/event/revision identifiers, not student names, email, MIS keys or portfolio data.

Unknown identities remain unresolved private observations, including cancellation tombstones. An explicit cancellation with the same registration/reference binding can cancel a prior observation even when its identity is unresolved. Cancelled observations cannot return to registered through an older response. Missing rows do nothing. Identity corrections never automatically rebind an imported record; authorized reconciliation remains pending. None of these saves creates students, grants permissions, changes activity membership, verifies attendance/contribution or publishes anything.

## Contract and field mapping

The provisional website artifacts were reviewed in Stage 277; their Git blob hashes and pinned website commit `7930b367c644f449242c04d3e8004d88f0dad3ae` remain in `audit/integration-v1/stage277/PROVENANCE.json`. This increment introduces only private KCC360 ledger/confirmation fields; no competing shared contract or new website request schema.

| Identifier/state | Responsibility |
| --- | --- |
| source event ID | Existing KCC360 event, bound through its publication history |
| website event ID | Existing separate website identity; never inferred from title |
| website registration ID | Separate website registration observation |
| issuer + participant reference | Approved crosswalk to existing MIS key/student actor, or unresolved |
| local operation ID | Durable KCC360 import idempotency; not a publication request ID |
| snapshot token/cursor | Checked full-refresh consistency; not a time watermark/change feed |
| registered/cancelled | Registration state only; no attendance/contribution verification |

## Automated evidence and limits

Seventeen focused save groups pass with the bounded mock and the pinned website service fixture. They exercise defaults and forged confirmations; unauthorized roles/departments/subjects and read-only grants; expired/revoked replay authority; first-save rollback; exact successful save/audit; service reconstruction and offline replay; changed/failed refresh rejection; stale mapping/source; audit rollback/retry; authority revocation at SQL time; concurrent source update preservation; lost post-commit acknowledgement; duplicate simultaneous confirmations; missing rows; known/unresolved cancellation tombstones; delayed revival denial; identity correction conflicts; privacy and size bounds.

The test uses real SQLite and the existing schema/transaction fixture. It also checks the canonical application payload remains unchanged by imports and that saved registration IDs are absent from existing student/mentor/administrator persona views. Existing attendance/contribution checks pass separately. Consolidated regression: **71/71 checks passed, 0 failed**, with final focused rechecks passing all 17 save groups. Evidence: `STAGE278_STORE.txt`, `STAGE278_CONSUMER.txt`, `STAGE278_PARTICIPATION.txt`, `STAGE278_REGRESSION.json`.

Consumer coverage uses the exact Stage 277 pinned website service (Git blob `63e730d4101fad6fc20034b25d145b69bbdd0e05`) with supplied Stage 98 CMS/storage support. It is not the full current website checkout, signed hosted HTTP, production D1, institutional identity or browser operator acceptance. This increment changes standalone JavaScript and test composition only; it does not claim a new deployed framework build. No copied website source/specifications are included in this commit.

## Dependencies and next smallest task

Institution-approved identity issuer, current MIS/student crosswalk, role/department import grants and their transactional authority fences must be configured and accepted before any institutional use. The checked refresh proposal, authentication/scopes, consent/guardian rules and URL policies remain provisional. No live integration or full readiness claim.

Next: add a minimum-field, authorized local ledger/status projection and an operator confirmation workflow, reusing existing session/origin checks and permissions. Keep the route disabled by default and show unresolved identities/cancellations separately from verified participation. Then test the bounded operator journey before wiring roster handoff or moving to reflection/report/fallback publication increments.

**Local mock workflow verified — cross-system acceptance pending** (durable registration observations only).
