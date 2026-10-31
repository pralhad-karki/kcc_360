# Stage 277 — checked registration refresh preview

2026-10-31, Asia/Kathmandu. KCC360 baseline: `162bcc0d815edf60630f259a97d2ca1b0509f773`, branch `development/website-mock-acceptance`; GitHub and clean local source inspected before work. Existing database migrations remain unchanged and unapplied. No deployment or live synchronization.

## Audit and incremental plan

Existing `prototype/participation.js` and the shared engine already manage roster snapshots, independently verified attendance and evidence-backed individual contributions. Club event enrolment and selected-volunteer handoff provide controlled roster additions. Website registration must not bypass selection, assign membership, verify hours, or grant permissions. `server/mis-manual-import.mjs` already supplies stable MIS keys and canonical digests; creating students through a website feed would duplicate that workflow.

Plan: retain the current website specification; fetch a complete checked refresh through a mock-only adapter; match only approved issuer/reference crosswalks to existing MIS/student identities; preview registration/cancellation differences and identity exceptions; prove no existing data changes. Defer persistence and operator controls to the next independently testable increment.

## Website artifacts located and reviewed

Inspected website branch `development/cms-foundation` at pinned commit `7930b367c644f449242c04d3e8004d88f0dad3ae`. All three requested artifacts were available, together with the new registration exchange schema. Reviewed-file provenance hashes are retained in `audit/integration-v1/stage277/PROVENANCE.json`, preserving earlier snapshots. New website source/specification copies are kept outside this repository and are not included in this commit.

The updated provisional OpenAPI proposes `consistency=checked`, an opaque `snapshot_id` repeated with continuation cursors, and `snapshot_complete=true` on the final page. An audited registration or cancellation during paging causes 409; staged pages must be discarded. This is optimistic checked full refresh, not a frozen snapshot, temporal watermark or incremental feed. Missing rows must not imply cancellation. Participant issuer and authoritative MIS crosswalk remain provisional. This increment introduces no competing shared contract.

## Implemented independently

Added `server/website-registration-preview.mjs` as a read-only integration adapter. It reuses `misStudentKey` and `misDigest`, defaults disabled, accepts mock transport only, and has no installed identity/source providers, API route, scheduler, commit method or browser activation. Exact requests contain only the source event ID; roles, consent, crosswalks, flags and cursors cannot be supplied by callers.

A server-supplied scoped context must reference the existing event-to-website binding, approved authority, institution, issuer, existing students/student actors, existing activity members, crosswalk and prior registration observations. Tests obtain event access through the existing publication runtime rather than title matching. The production context loader remains unimplemented pending institutional identity configuration.

The adapter stages all pages in memory. It rejects legacy unchecked responses, inconsistent snapshots, malformed/foreign/private fields, invalid zoned timestamps, duplicate or nonadvancing cursors, incomplete/oversized refreshes and transport failures. It reloads the trusted context after fetching; changed permissions, identity mappings or source revisions invalidate the preview. No partial result or database write occurs.

Only one approved crosswalk match to an existing MIS key and existing student actor can produce a registration proposal. Unknown, ambiguous, wrong-namespace, duplicate-student and unapproved mappings remain exceptions. Previously cancelled registrations cannot be restored by a delayed registered response. An explicit cancellation proposes cancelling only the registration observation, retaining existing event membership, attendance, contributions and portfolio records. Empty/missing rows take no action. Every result has `canCommit:false`; its digest is a future preview-binding input, not a durable import identifier.

| Website field | Internal preview use |
| --- | --- |
| configured issuer + `participant_reference` | Approved crosswalk to existing MIS key and student actor; never names/email |
| `registration_id` | Separate registration identity; never a student or event ID |
| `website_event_id` | Must equal the existing source-event binding |
| `state=registered` | Registration-only proposal; no verification/membership grant |
| `state=cancelled` | Explicit registration-only cancellation proposal |
| `created_at` | Zoned creation timestamp; not a change watermark |
| `snapshot_id`, `next_cursor`, `snapshot_complete` | One checked complete full-refresh session |

## Automated evidence and limits

`check-website-registration-preview.mjs` passes 11 grouped checks with a bounded mock and again against the pinned current website service. Tests cover scoped access and field spoofing; full paging; repeat previews; identity exceptions; timeout/change rejection; malformed/legacy/private/foreign responses; repeated cursors; empty/missing rows; stale local authority; explicit cancellations; delayed revival denial; duplicate-student conflicts; unchanged complete KCC360 workspace. Existing participation verification checks also pass. The consolidated regression passed **70/70 checks, 0 failed**; final focused rechecks pass all 11 preview groups. See `STAGE277_PREVIEW.txt`, `STAGE277_CONSUMER.txt`, `STAGE277_PARTICIPATION.txt` and `STAGE277_REGRESSION.json`.

The consumer test executes the verbatim pinned `integration-v1/service.mjs` using the supplied Stage 98 CMS/storage support fixture. The source was obtained through the GitHub connector; a complete current website Git checkout was unavailable. Its exact Git blob hash is retained for review; the copied website source is outside this repository and is not imported into the application. This composition verifies the actual proposed checked-registration methods, including an actual cancellation invalidating continuation, but does not establish compatibility with the entire latest website checkout or its hosted authentication. No schema-validator, browser registration UI, live MIS/SSO, cross-system deployment or institutional acceptance is claimed. No framework behavior changed.

Automatic approval review rejected publishing copied website source/specifications to this repository as an unapproved disclosure. The safer commit includes only KCC360-authored code, tests, reports and provenance hashes. The original website files remain in the website repository.

## Dependencies and next smallest task

Website-team agreement is still required for the issuer namespace, institutional identity verification and approved MIS/KCC360 crosswalk; checked full-refresh versus frozen-snapshot acceptance; authentication/scopes and key lifecycle; consent and public URL policies. The checked paging proposal reduces the earlier technical gap but remains provisional until jointly accepted.

Next: prepare a durable registration-only import ledger and an authorized explicit-confirmation save using the existing workspace CAS and atomic audit pattern. Bind confirmation to the complete preview, current identity/source/authority digests and prior registration state; verify retries, concurrent updates and cancellation tombstones. Preserve separate participation verification and student-import authority. Expose operator controls only after these boundaries are tested. Reflection, report PDF and fallback reconciliation remain later bounded increments.

**Local mock workflow verified — cross-system acceptance pending** (registration preview only; registration synchronization is not activated).
