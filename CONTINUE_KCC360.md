# Continue KCC360 development — Stage 284 handover

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
