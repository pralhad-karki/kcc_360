# Continue KCC360 development — Stage 287 private candidate heads

4 November 2026, Asia/Kathmandu. Continue from the actual branch after checking HEAD/tree/status and remote history. Stage 287 succeeds `30c1b82752acfde487f09e8771b4e80046b2a77b` on `development/website-mock-acceptance`. Read `audit/STAGE287_REPORT.md`, `audit/STAGE287_CODE_MANIFEST.json`, `audit/STAGE287_HEAD_CHECKS.txt`, `audit/STAGE287_REGRESSION.json` and `audit/STAGE287_VALIDATION.json`, then the relevant source/fixtures. Preserve newer/unpublished work, records, IDs, approvals, files, migrations and audit history. Earlier handover sections below remain historical evidence; this next-task statement takes precedence.

Stage 287 adds default-disabled private candidate heads and a shared coordinator under `server/discussion-migration/`, reusing Stage 286 immutable candidates and effect codecs. Namespaces: `KCC-DISCUSSION-HEAD:`, `KCC-DISCUSSION-COORDINATOR:`, `KCC-DISCUSSION-HEAD-OP:`; schemas `KCC360_DISCUSSION_HEAD_V1`, `KCC360_DISCUSSION_COORDINATOR_V1`, `KCC360_DISCUSSION_HEAD_OPERATION_V1`. Exact key mappings are in the report. No runtime composition, route, real authority provider, dispatcher or cutover exists.

ADVANCE requires a stored candidate owned by the current subject/actor, exact current canonical witness/digest, current candidate staged revision, expected head/shared versions and a matching current virtual before-digest. REVERSE requires the latest shared stack entry and exact candidate after-digest; it restores captured presence/values and independently rematerializes the remaining stack. Every transition advances versions and retains immutable operation/audit history. Canonical source and existing staged copies never change. A shared coordinator intentionally serializes workspace-wide reminder/audit effects; safe cross-project conflicts are not an independent-project throughput improvement.

Atomic writes cover coordinator, project head, immutable transition and server audit. Source/authority revisions, private row revision/commit UUIDs and absence witnesses guard the first write; later writes require its fresh commit UUID. Durable retries resolve lost acknowledgement without another transition. Current authorization is required for historical replay, which returns original witnesses/revisions and never rewinds a newer head. Active/current references are validated; corrupt or missing evidence fails closed rather than being reconstructed. Historical chains are retained but not exhaustively walked on every read.

The private stack is bounded to eight active candidates, at most 24 private row observations and 1,990,000 UTF-8 bytes per written row. The maximum tested stack uses fewer than 100 bind parameters/query. These are local rehearsal limits, not hosted capacity, retention approval or permission to delete old records. Unexpected/stale source, effects or initialization are rejected; no implicit rebase, compaction or repair occurs. Stage 285 recovery preserves new private rows and can rematerialize the recovered baseline in local fictional checks; hosted DB/object recovery remains pending.

**Next bounded task:** prepare new command candidates against the exact materialized private head, retaining canonical/staged/authority/head witnesses and durable receipt binding; then test a genuine multi-command sequence and guarded reversal. Current Stage 286 candidates are independently evaluated against canonical source, so a later stateful candidate usually conflicts with a changed private virtual workspace. Compatible no-op candidates demonstrate coordination, not full stateful command execution. Keep the active canonical path unchanged and all new behavior disabled.

Readiness remains HOLD: shared-root contention, whole-workspace reads, in-memory materialization, institutional identity/tenancy/header trust, current withdrawal authority outside rollback scope, hosted recovery/load and website/MIS/SSO joint acceptance remain open. Preserve the website registration/operator/reflection/PDF/fallback roadmap and independent website approval. Fictional data only; no existing DB reset, production migration, deployment, email, live integration, automatic publication or force push. Routine completed/tested/privacy-reviewed GitHub synchronization remains authorized: inspect remote head first and verify the final remote tree. No routine approval question is required.

---

# Stage 286 atomic discussion rehearsal — retained historical handover

4 November 2026, Asia/Kathmandu. Stage 286 continues from `fd3df99418191801e2f8fa463c0a33d2f2e62011` on `development/website-mock-acceptance`. Inspect actual HEAD/tree/status and remote history before editing; preserve newer/unpublished changes. Read `audit/STAGE286_REPORT.md`, `audit/STAGE286_CODE_MANIFEST.json`, `audit/STAGE286_ATOMIC_CHECKS.txt`, `audit/STAGE286_REGRESSION.json` and `audit/STAGE286_VALIDATION.json`, then the relevant source/tests. Earlier handovers below are historical context; their next-task statements are superseded by this section.

Stage 286 adds default-disabled private candidate-effect/receipt transactions under `server/discussion-migration/`. It bounds selected-project messages/events/history, matching root audit and actual in-app reminder reconciliation; reconstructs the exact engine candidate; and saves the private candidate plus immutable operation receipt and correlated audit atomically through existing tables. Source, staged copies, approvals, files and active command services stay unchanged. There is no runtime composition, route, provider, dispatcher or storage switch.

Private namespace: `KCC-DISCUSSION-REHEARSAL:` plus SHA-256 of canonical JSON `[sourceWorkspaceId, operationId]`. Receipt schema: `KCC360_DISCUSSION_ATOMIC_REHEARSAL_V1`; effect schema: `KCC360_DISCUSSION_EFFECTS_V1`. Operation requests cannot supply actor/authority. Source, staged and authority revisions are required at commit. Retried or concurrent identical operations produce one receipt/audit; lost acknowledgements resolve from receipts without command reevaluation. Replay needs current access and a final authority fence, returns the original historical witness, and never applies old effects to newer source.

These are independent private candidates, not a live or shadow command execution chain. The candidate and receipt are one immutable row, not a new per-project head. Rollback evidence is failed-transaction atomicity, not permission to undo canonical commands. Unexpected initialization outside the contract is rejected. Trusted legacy policy still controls access and notification generation; structural effect checks do not replace it. Notification reconciliation is intentionally workspace-wide and may change on discussion no-ops. Full private effects remain internal; summaries contain witnesses/hashes/flags only. A payload over 1,990,000 UTF-8 bytes is rejected without source deletion or compaction.

`check-discussion-atomic-rehearsal.mjs` covers memory and real SQLite/WAL, full-engine parity, histories/IDs, notification lifecycle, durable receipts, races, rollback, lost acknowledgement and Stage 285 recovery inclusion. Tests remain fictional/disposable; no institutional authority or hosted acceptance is claimed. Existing service/engine/schema/migrations and earlier recovery/withdrawal modules are preserved.

**Next bounded task:** define revisioned private candidate-head advancement and guarded reversal/materialization against durable receipts, including same-record conflicts and shared reminder/audit coordination, before any storage cutover. Keep the canonical path active and all new storage behavior disabled. Do not interpret candidate receipts as completed source writes or improved campus capacity. Shared-root contention, whole-workspace reads, trusted identity/tenancy/header provenance, current withdrawal authority outside rollback scope and hosted recovery/load remain open; readiness HOLD. Website/MIS/SSO, registration operator/reflection/PDF/fallback dependencies and independent website approval remain unchanged.

Continue routine completed/tested/privacy-reviewed GitHub updates, checking remote head and final tree and preserving history without force push. Fictional data only; no existing database reset, production migration, deployment, email, live integration or automatic public publication. No routine permission question is needed.

---

# Stage 285 recovery checkpoint — retained historical handover

4 November 2026, Asia/Kathmandu. Continue this branch and inspect actual HEAD/status/remote history before editing. Stage 285 is the successor to `26c79a8fc766fd2142c2490350b5ba0b969c40ab`; the Stage 284 handover below is retained as historical context. Its recovery-inventory next task is now implemented and rehearsed locally, with limits documented below.

Read `audit/STAGE285_REPORT.md`, `audit/STAGE285_RECOVERY_PLAN.md`, `audit/STAGE285_CODE_MANIFEST.json`, `audit/STAGE285_REGRESSION.json` and `audit/STAGE285_VALIDATION.json`, then the relevant source/tests. The code manifest identifies the exact tested additions. Preserve all newer or unpublished changes and all existing records, identifiers, approvals, migrations and history.

Stage 285 adds `server/recovery/` domain/application/read-only Drizzle repository, without a runtime composition, route, default authority provider, writer or storage switch. It creates a private versioned DB/reference manifest for all workspace namespaces, audit and file metadata, verifies referenced private-object bytes and repeats the database/authority checks before release. Full private payloads and byte copies exist only in disposable fictional tests; GitHub receives code, documentation and aggregate evidence, never a live archive.

`check-private-recovery.mjs` rehearses JSON serialization, an independently retained checksum, restore into a fresh isolated SQLite/WAL store, exact DB/reference preservation, separately copied private objects, withdrawal denial through the actual public controller and file-access denial through the actual private controller. Restore is test-only, refuses populated targets and rolls back on injected failure. The reused fixture can explicitly create a fresh empty application store; it does not clear/reset an existing store. Existing fixture defaults are preserved.

Sessions are deliberately excluded from archive/replay; fictional fixture sessions are created separately. Unknown/private rows are retained verbatim, while only known relationships are semantically validated. The inventory reports top-level array counts, not a certified full graph census. Object listing is incomplete for unreferenced bucket objects. The boundary is bounded to 10,000 rows/table, a 32 MiB serialized snapshot and a separate 32 MiB referenced-object total, not a streaming or hosted-capacity solution.

A trusted independently retained checksum detects loss/change relative to the selected snapshot, but is not a digital signature or proof that the selected recovery point contains the latest withdrawals. A marker missing together with its audit cannot be inferred from old source alone. Hosted recovery still needs current withdrawal authority outside rollback scope, consistent DB/object versioning, identity/grant/consent revalidation, private encryption/key custody, approved operators and recovery objectives. A second DB read detects drift during object reads; it is not a joint DB/bucket transaction. Audit-retention gaps are reported while surviving markers remain authoritative. Do not reopen services merely because an archive checksum matches.

**Next bounded development task:** resume the Stage 281 discussion transition: constrain the exact discussion/history/audit/notification effect set and rehearse disabled atomic commit/rollback with durable receipts. Reuse existing source/staged codecs, permissions and repository boundaries; do not activate storage cutover. Address any defects found in the recovery boundary first. Shared-root contention, whole-workspace reads, institutional identity/tenancy/header trust, hosted recovery/load and website/MIS/SSO coordination remain open. Institutional/capacity readiness remains HOLD.

Keep fictional data only. No database reset, production migration, deployment, email, live integration, automatic website publication or force push. Routine completed/tested/privacy-reviewed GitHub updates remain authorized: verify remote head first, preserve history and compare the final remote tree with the intended local snapshot. No routine permission question is needed.

---

# Stage 284 handover — retained historical checkpoint

Prepared 4 November 2026, Asia/Kathmandu, for Dr. Pralhad Karki. Continue the existing project; do not restart or redesign it. This document accompanies a documentation-only successor to the tested code checkpoint below. Inspect the actual current branch before editing; preserve newer work.

## Project and exact checkpoint

| Item | Verified value |
| --- | --- |
| Repository | https://github.com/pralhad-karki/kcc_360 |
| Development branch | `development/website-mock-acceptance` |
| Latest tested code commit | `99067f1ced6621d5a994bd25cfc89f90f4cc083c` — Stage 284 |
| Tested code tree | `d43bcb69b16eee3e54413ed23b5922b9f4627829` |
| Previous checkpoint | `226d80b5167b5af0089241ce28ca5071e50dc8a3` — Stage 283 |
| Recoverable checkout | `/workspace/sites/kcc360-recovered270` |
| GitHub synchronization | Code commit/tree verified against local staged contents; clean working tree before writing this handover |

A later documentation-only commit adds this file; it does not replace the tested code or require resetting the branch. If the checkout is missing, locate recoverable source and any unpublished work first, then recover the verified GitHub checkpoint after checking remote history. Do not reconstruct unpublished work, substitute an old ZIP or rely on stale memories of Stage 253 as the current source version.

Read first:

1. Applicable AGENTS.md instructions, if present; actual HEAD, tree, status and remote development-branch head.
2. `audit/STAGE284_REPORT.md` and `audit/STAGE284_CODE_MANIFEST.json`.
3. Latest entries in `audit/PROTOTYPE_FINALIZATION_CHECKPOINT.md`.
4. `audit/STAGE282_TECHNICAL_AUDIT.md`, including Stage 283/284 follow-ups.
5. `audit/KCC360_10000_USER_READINESS_PLAN.md` and `audit/STAGE283_REPORT.md`.
6. Relevant source and test fixtures before choosing the next bounded implementation.

## Preserve the actual implementation

The current stack uses TypeScript/MJS, Vinext/Next-compatible routes, existing browser workflow sources, SQLite/D1 and Drizzle dependencies. Much legacy persistence still uses direct parameterized D1 calls. NestJS and better-sqlite3 have not replaced this stack. Do not introduce another ORM, framework rewrite or microservices merely to reorganize modules.

Preserve events, planning/approval routes, participation/contribution verification, reflections, portfolios, permissions, audit, file associations, stable identifiers, source records and migration/commit history. No database reset, production migration, deployment, email sending, live integration or automatic public website publication is authorized. Use fictional data and mock transports only. Keep KCC360 independent of website availability.

User direction: improve reliability for approximately 10,000 registered accounts over three years while controlling cost, and reduce future PostgreSQL or Java/C# migration risk. This is not a 10,000-concurrent-user capacity claim. The current readiness decision remains **HOLD**.

Apply the six architectural rules incrementally:

- Thin transport/controllers; application/domain decisions separated from repositories and framework code.
- Existing ORM query builders for new persistence; isolate exceptional SQL and driver/transaction behavior in adapters.
- Validated/versioned JSON for flexible data; normalize durable identities and relationships gradually. Text JSON does not automatically become PostgreSQL JSONB.
- Generic errors translated at persistence boundaries; no database-specific error codes in business services.
- WAL in native local SQLite fixtures; short transactions. Hosted D1 is managed, and SQLite remains a single writer.
- Pure/unit contracts plus real repository/SQLite tests; later run the same contract against PostgreSQL. Language migration still requires translation and acceptance testing.

Existing application-wide compliance is partial; do not claim the whole legacy core has already adopted these boundaries.

## What exists and what just changed

Stages 280–281 added disabled discussion staging and a read-only command rehearsal behind domain/application/repository ports. They preserve source IDs, optional legacy fields, Unicode, history and notification behavior. They do not activate per-project discussion writes or eliminate shared-root contention.

Stage 282 audited tenancy, portability and architectural debt. Stage 283 corrected commit-time selected-session checks and the remaining character-based workspace limits. Changed generic commands, uploads and authenticated share writes now use a captured subject/actor/session timestamp fence. Persona selection advances its existing timestamp monotonically with CAS, including rapid away/back selection. The shared application payload limit remains 2,000,000 UTF-8 bytes.

**Stage 284 completes the bounded withdrawal safeguard:**

- Existing under-limit revocation is preserved. If the proposed revoke cannot fit, a permanent private marker and correlated audit are written atomically through existing tables.
- New code lives in `server/share-withdrawal/`: pure domain, application repository port, Drizzle/D1 adapter and server composition. All new marker/read/fence/audit queries use ORM builders; legacy driver coupling elsewhere remains.
- Authoritative marker key: `KCC-SHARE-WITHDRAWAL:` plus SHA-256 of UTF-8 JSON array `[workspaceId, shareId, tokenHash]`. Payload schema: `KCC360_SHARE_WITHDRAWAL_V1`.
- The marker uses a separate `kcc_workspaces` row at revision 1 with its own commit UUID and UTC time. The audit uses `portfolio.share.quota-withdrawal` and correlates to that commit. No schema/table migration was needed.
- The canonical root payload, its revision, approvals, histories and files stay unchanged during fallback. Old source share state may remain ACTIVE: **raw source state and the pure shareStatus helper alone are not authoritative for disclosure.**
- Public share reads, Manage share links, active-link quotas and optional reflection responses consult withdrawal markers. An old ACTIVE source snapshot cannot reopen the same token. Ordinary audit-log pruning cannot reopen it because the marker is separate.
- Retried/concurrent identical withdrawals produce one marker and audit; different-link withdrawals can proceed without rewriting the root. A lost acknowledgment is resolved from the durable receipt. A new explicit grant creates a distinct new link; it does not revive the old token.
- Source/session/owner/subject guards remain mandatory. Corrupt or unavailable marker reads fail disclosure closed. Optional anonymous responses retain a commit-time denial guard; their feature remains disabled in production code.
- Existing private/public controllers were exercised locally. Existing client response fields remain; successful fallback may retain the same canonical revision. The current revoke client supports that response.
- `storageReview` is a private read-only size diagnostic. It does not free space, compact data, archive records or restore a database. Normal oversized writes remain blocked.

Markers are consent authority, not disposable diagnostics. Retain them with source, audit and private-file references in recovery/backup/export plans. Never delete them through generic workspace/audit cleanup. A full DB rollback that loses a marker is not covered by source-only replay protection; hosted recovery policy and acceptance remain open. Link withdrawal cannot erase copies already downloaded.

## Verified tests and practical limits

| Evidence | Result |
| --- | --- |
| `audit/STAGE284_REGRESSION.json` | 76/76 regression groups pass |
| `audit/STAGE284_WITHDRAWAL_FINAL_VERIFIED.txt` | 39 focused withdrawal checks pass |
| `audit/STAGE284_WRITE_GUARDS_COMPLETE.txt` | Existing 21 save-guard groups pass |
| `audit/STAGE284_AUDIT_EVIDENCE.json` | 10/10 targeted audit suites pass; old session race remains corrected |
| `audit/STAGE284_SUPPLEMENTAL_COMPLETE.json` | 9/9 affected audit/export/client/email suites pass |
| `audit/STAGE284_VALIDATION.json` | Visitor response, reflection sharing, TypeScript and production build pass |

Tests include memory/real file-backed SQLite contract parity, owner/role/subject denial, source/session races, concurrent requests, audit rollback, lost acknowledgment, marker corruption, delayed public reads, source replay, audit-retention independence, independent new consent and actual private/public controllers. Fixtures are fictional and disposable. No hosted Worker/D1, real browser, institutional identity or cross-system acceptance was performed for Stage 284. Historical/intermediate logs are retained; repeated compiled data-URL source bodies are elided. The final code manifest records source hashes.

Relevant commands, from the repository root:

- `node check-share-quota-withdrawal.mjs`
- `node check-workspace-write-guards.mjs`
- `node scripts/check-task-workflow.mjs --report audit/NEW_STAGE_REGRESSION.json` — refuses an existing report path.
- `node node_modules/typescript/bin/tsc --noEmit`
- `node scripts/run-framework.mjs build`
- `node scripts/audit-architecture.mjs --fictional-local-audit --report audit/NEW_AUDIT_EVIDENCE.json`

Run appropriate focused checks first; avoid overlapping the full regression with compiler/build jobs. Do not relax application guards to repair expired fixture dates. Several historical tests now control/advance the original October clock; production date rules and legacy IDs are preserved. Legacy timestamp/local-counter IDs remain a collision-risk review item; do not renumber historical records.

## Next smallest implementation task

**Read-only recovery inventory and private export/restore rehearsal, before structural migration or pruning.**

First locate/reuse existing recovery/export/backup utilities. Inventory canonical and private namespaces, record/relationship counts, bytes and stable references. Include withdrawal markers, audit and file/object references so recovery cannot revive withdrawn tokens or break attachments. Use a new disposable fictional dataset and stable versions/checksums; do not collect real institutional data into GitHub.

Produce a concise plan grounded in the code, then implement the smallest independently testable read-only inventory/export boundary. Rehearse restore into a fresh isolated store with source/marker/audit/file-reference verification and denial tests. Do not overwrite a hosted or existing database, activate a storage switch, delete records, infer official identities, or claim backup readiness from source Git history alone.

After that, resume the bounded discussion/history/audit/notification effect set and disabled atomic commit/rollback rehearsal. Shared-root serialization, whole-workspace reads and unrelated-edit contention remain scaling blockers.

## Identity, tenancy and operational dependencies

The active main application is an owner-email-restricted, fixed-workspace demo with selectable personas. Tenant-aware policy/identity/resource components exist but do not establish end-to-end institutional or shared-organization isolation. Do not broaden the owner allowlist/persona selector into real-user access.

Institutional MIS/SSO, stable person/department/role grants, revocation providers and the hosting trust for injected authentication headers remain pending. Dedicated single-KCC versus shared-institution deployment must be explicit. File/DB recovery, workload volumes, retention and actual hosted mixed-load acceptance remain open. No actual cross-organization disclosure was demonstrated by the local audit; do not turn a conditional deployment risk into a claimed exploit.

## Original website-integration roadmap stays open

Separate project: `pralhad-karki/kcc_website`, branch `development/cms-foundation`. Do not push KCC360 code there. Existing KCC360 reports for Stages 275–278 record local mock event publication/withdrawal, registration full-refresh preview and durable registration-only save. These remain local capabilities, not live integration or completed institutional acceptance.

Before claiming new compatibility, inspect actual current website artifacts:

- `production/integration-v1/openapi.provisional.json`
- `production/integration-v1/publication-package.schema.json`
- `production/docs/STAGE_91_PROGRESSIVE_INTEGRATION_REPORT.md`

The v1 contract is provisional. If unavailable, keep an explicitly provisional adapter and record the dependency; do not invent a competing shared contract. Preserve separate source/event/request/website/reflection/report identifiers and public URLs. KCC360 approval never authorizes website publication automatically. Website publication requires independent website approval. Registration is distinct from verified attendance/contribution; treat current exchange as full refresh until incremental semantics are agreed. Identity mapping, consent, authentication, permanent URLs and joint acceptance need coordination.

Remaining integration tasks include authorized registration status/operator controls, reflection publication, approved versioned/checksummed completion-report PDFs, and authorized fallback-event reconciliation without title-only matching or duplicate events. Stage 284 is private link withdrawal, not completion of those workflows.

## Working and GitHub discipline

Explain progress simply. Continue incrementally and preserve records/history. Use fictional credentials, identities and transports. Do not send messages to other people or activate services without explicit authorization.

The user authorized routine GitHub updates at completed, tested, privacy-reviewed checkpoints. Verify remote head before upload; preserve history, do not force-push or overwrite newer work, and compare the final remote tree with the intended local snapshot. Do not replace the existing origin unnecessarily. The checkout has a separate `github` remote; authenticated GitHub connector writes have worked. If the remote has advanced, inspect and reconcile safely before proceeding. Report the actual commit SHA and distinguish local evidence from hosted/institutional acceptance.

No routine permission question is needed to continue this authorized development. Respect any new explicit restriction or automatic approval rejection and report it honestly.
