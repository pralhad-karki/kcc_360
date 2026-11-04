# Stage 280 — portable discussion migration boundary

2026-11-04 UTC. Baseline `4a5213942449b438eae7b8aaad46828ced183112`, branch `development/website-mock-acceptance`. Existing branch, migrations, checkpoint, canonical service, discussion engine and Stage 279 capacity findings inspected. No database reset, production migration, framework replacement, deployment or live synchronization.

## Audit and implementation plan

The existing application uses TypeScript/MJS, Vinext/Next-compatible routes, Drizzle and hosted D1 bindings. It currently does not use NestJS or better-sqlite3. The canonical workspace contains project messages and optional discussionEvents; existing commands also affect project history and notifications. Stage 279 demonstrated safe conflicts from a shared root revision, including different-project writes. Preserve these behaviors while preparing a bounded transition.

First independently testable increment: isolate the discussion extraction/reconstruction domain and application service behind repository, authority, digest and clock ports; implement a disabled staged-copy adapter using existing tables; prove lossless reconstruction and behavioral parity before designing active command cutover. This checkpoint completes that increment only.

## Implemented independently

- `server/discussion-migration/domain.ts`: framework/driver-independent JSON validation, typed generic errors, snapshot extraction and reconstruction. Preserves array order, Unicode, optional events absence, unknown message metadata and legacy messages without IDs. Does not synthesize IDs that would break existing index-based thread references.
- `ports.ts` and `application.ts`: injected repository/authority/digest/clock; disabled by default. Inspection binds a proposed copy to project, full-source digest, discussion digest, canonical revision and staging revision. Staging checks authority twice and repository commit fences protect against source or authority changes after validation.
- `infrastructure/drizzle-repository.ts`: Drizzle D1 adapter using existing private workspace rows and existing server audit. Parameterized query expressions stay inside infrastructure. Copy and audit use one atomic batch, guarded by CAS and source/authority fences. Generic storage exceptions prevent driver-message leakage. No route, production authority implementation or startup wiring is added.
- Existing staging versions are retained. Exact replay of the current operation is a no-op across service reconstruction; changed identity conflicts. This is a current-head receipt, not a complete historical operation registry. An earlier operation submitted after later versions fails with its old revision; historical receipt lookup requires a separate design before active command integration.
- `check-discussion-migration.mjs` runs the same service/repository contract with memory and file-backed real SQLite, using disposable fictional databases and a D1 binding shim. The fixture verifies WAL, foreign keys and bounded busy timeout. No existing database is opened.
- `fixtures/discussion-migration-v1.json` contains independent expected canonical text/SHA-256 vectors. This is an internal migration codec, not a website shared contract. Full project reconstruction preserves non-discussion fields; the staging snapshot contains discussion fields only. Discussion text remains private institutional data, not an approved public package.

## Six-rule implementation review

| User rule | Applied boundary and remaining work |
| --- | --- |
| Separation of concerns | Pure domain, application service and infrastructure adapter. No active controller added for a disabled rehearsal. Existing production modules are preserved, not all refactored. |
| Database abstraction | Existing Drizzle reused; query builders and parameterized expressions are inside the adapter. A PostgreSQL repository must implement and pass this same contract. |
| Dynamic JSON | Versioned validated JSON snapshot over the existing text payload schema; no new schema migration. Future relational identities/relations remain relational. SQLite JSON is not a binary JSONB migration artifact. |
| Error handling | Generic validation/access/conflict/not-found/storage errors; DB translation in the adapter. HTTP translation belongs to a future controller. |
| Concurrency | Short guarded atomic batch, no network/authority calls inside it. Local fixture uses WAL; hosted D1 is managed and does not accept native better-sqlite3 connection configuration. SQLite remains a single writer. |
| Testing | Pure codec vectors, memory/SQLite contract, unchanged-engine behavior comparison, CAS/race/replay/corruption and rollback tests. Hosted D1 and institutional grants remain untested. |

## Continuing architecture plan

Use the existing application as a modular monolith. For each touched capability, move decisions behind typed application ports without replacing existing workflows: controllers translate authenticated input and output; domain/application services own policy; repositories own persistence and transactions. Avoid introducing a second ORM. Keep institution/user/project identities and relationships explicit, with versioned validated JSON for dynamic template values. M&E indicator matrices and calculations should become pure functions with approved fictional input/output vectors before any storage change. A future language implementation must reproduce those behaviors and stable identifiers; it cannot directly reuse TypeScript classes.

Future database transition requires a PostgreSQL adapter/schema mapping, export/import rehearsal, record-count and relationship reconciliation, digest/behavior comparisons, backup restoration, rollback and representative concurrency acceptance. Migration tools may use database-specific operations inside infrastructure; business rules remain independent. No date for a rewrite or capacity promise follows from registered-user count alone.

## Proposed internal field mapping

| Existing source | Staged copy |
| --- | --- |
| Canonical workspace row ID/revision | sourceFence.recordId/revision; rechecked in the write |
| Project id | snapshot.projectId, separate per-project staging key |
| messages, including absent legacy message IDs | snapshot.messages, unchanged ordering and values |
| Optional discussionEvents | snapshot.eventsPresent plus snapshot.events |
| Complete project JSON | sourceDigest only; non-discussion project fields are not copied |
| Discussion snapshot JSON | discussionDigest, SHA-256 over UTF-8 canonical JSON |
| Trusted subject/actor and persisted authority revision | document subject/actor and commit authority fence |
| Staging operation/revision | operationId and monotonically increasing staged revision |
| Explicit UTC clock | occurredAt, ISO UTC string |

Private row key: `KCC-DISCUSSION-STAGING:` plus JSON-encoded `[sourceWorkspaceId, projectId]`. Envelope `{current, history}` has internal format 1; existing server audit records IDs and hashes rather than message text. A 1,990,000-byte history budget fails safely; pagination/normalization is still needed for growth. Source stays canonical and is never edited by this workflow. Reconstruction is semantic JSON equality, not identical whitespace or object-key ordering. The canonical codec uses JavaScript number/string serialization and sorted keys: another language must explicitly reproduce/verify the codec, especially numerical edge cases, before accepting its digests.

## Automated evidence

Final focused checks: **25/25**, memory and Drizzle/SQLite. TypeScript check and production build pass. See `STAGE280_DISCUSSION_FINAL.txt`, `STAGE280_TYPESCRIPT_FINAL.txt`, `STAGE280_BUILD.txt` and regression evidence recorded below. The earlier 23-check run is retained as intermediate evidence.

Coverage includes disabled-provider isolation; absent IDs/optional fields/Unicode; no source writes; current-operation retry; stale revision; independent staged copies; source and authority races; unauthorized access; changed inspection; corrupt checksum; first-write and replacement audit rollback; history retention. The original engine reply/resolve/reopen transitions produce the same full workspace including notifications/history after reconstruction; cancellation denial is preserved. The injected authority is fictional and scoped to two projects, not accepted institutional role/department integration.

Final complete regression: **73/73 PASS**, zero failures (`STAGE280_REGRESSION_FINAL.json`). Initial complete run: 69/73 with four 60-second ETIMEDOUT results retained in `STAGE280_REGRESSION.json`; no assertion failures were reported for those four. Separate evidence/review/revision reruns passed, followed by this complete successful run with unchanged time limits. No production behavior or test assertion was relaxed to obtain the final pass. The first run overlapped compiler/build work; environment timing is a suspected contributor, not a proven diagnosis. Evidence filenames with RECHECK/FINAL record the successful reruns. Credential-pattern scan and `git diff --check` passed. Checkpoint code is on the stated development branch; commit ID is supplied in the GitHub checkpoint link.

## Limits, coordination and next task

This provides a tested boundary for adapter replacement and migration rehearsal. It does not activate per-project discussion writes, eliminate active shared-root contention, prove PostgreSQL compatibility, or make a Java/C# rewrite automatic. Readiness for 10,000 users remains HOLD under the existing readiness plan. Original source remains the rollback authority; restoring staged data into production requires a separately authorized guarded process, not this helper alone.

Next smallest task: place existing discussion command execution behind a boundary that preserves trusted authorization, history and notifications; test materialized reads, atomic side effects, stale versions and cutover/rollback guards before any activation. Then measure the active path with representative data. No production migration is part of this checkpoint.

Website publication and registration work remains disabled and provisional. This stage makes no website contract changes or compatibility claim. Previously recorded website specification provenance and dependencies remain in Stages 275–278. Official identity, department grants, consent, authentication, URL ownership, full-refresh synchronization semantics and joint acceptance still require website/institution coordination. Reflection, PDF, fallback reconciliation and registration operator work remain on the integration backlog. No cross-system acceptance was executed here.
