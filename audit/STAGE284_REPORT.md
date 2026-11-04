# Stage 284 — quota-independent withdrawal of existing share links

4 November 2026, Asia/Kathmandu. Baseline `226d80b5167b5af0089241ce28ca5071e50dc8a3`, branch `development/website-mock-acceptance`. Local HEAD/status, remote branch, Stage 283 checkpoint, sharing/public controllers, private sharing rules, audit/schema and existing test loaders inspected before editing. No production database access, reset, schema migration, deployment, email or live synchronization.

## Audit and bounded plan

The existing revoke action changes a share in a cloned workspace, appends history and rewrites the canonical payload with session/source fences. The 2,000,000-byte cap can reject that write, including a small withdrawal against already-oversized legacy state. Source records must not be deleted or silently trimmed to make room.

This increment preserves normal revocation and adds a separate permanent denial record only when the proposed revoke payload cannot fit. A dedicated private workspace row and its audit are committed atomically through the existing tables. Readers enforce that denial independently of old source state. The source remains byte-identical, while read-only storage diagnostics identify the remaining recovery need. No automatic compaction, archive, record deletion, capacity-limit increase or data recovery is claimed.

## Implemented independently

- `server/share-withdrawal/domain.ts`: generic errors, validated versioned receipt fields, owner binding, explicit UTC timestamps and stable SHA-256 key. No framework/ORM/driver imports, no SQL and no hard-coded demo role catalogue. Role eligibility remains in the existing authenticated sharing path.
- `application.ts`: repository port, injected clock, durable per-link withdrawal/replay, source/session fences and ownership checks. Existing share ownership comes from the trusted server snapshot, never body-supplied authority. When an original subject exists, it must match the authenticated subject.
- `drizzle-repository.ts`: type-safe Drizzle builders create all new marker/read/fence/audit queries. The adapter executes their compiled SQL through D1 prepare/bind/first/batch, keeping driver result mapping and generic storage-error translation inside infrastructure. Explicit aliases map database snake_case fields to the typed result. A future PostgreSQL adapter must reproduce this contract; no compatibility claim follows from using Drizzle alone.
- `runtime.ts`: server-only composition over the existing DB binding. No new provider, scheduler, public route or integration flag is activated.
- `server/shares.ts`: the existing owner/student/revision/form guards remain. If a proposed revoke exceeds the byte cap, the new service commits a withdrawal without rewriting the root. Repeat withdrawal reads the existing receipt with a current source/session fence. Successful fallback returns the normal private workspace response plus withdrawal status and a storage-review message. The source revision remains unchanged, as with existing no-op/replay responses; the current revoke client accepts this.
- Public share reads, Manage share links, active-link quota calculation and optional reflection-response processing consult the withdrawal marker. A delayed public read checks it after preparing its view. Optional responses also have a commit-time NOT EXISTS marker guard in their existing parameterized legacy write path. That optional feature remains disabled in production configuration.
- `storageReview` exposes only byte count, limit and whether the source is already oversized through the existing private management response. It is a diagnostic, not a recovered workspace or an export. No new UI or hosted-browser acceptance is claimed.

## Proposed internal field mapping

This is KCC360 internal persistence, not a replacement website v1 contract.

| Existing source / authority | Private withdrawal record |
| --- | --- |
| Canonical workspace ID | workspaceId, part of key scope |
| Existing share UUID/reference | shareId, unchanged |
| Existing tokenHash | tokenHash, separate from shareId; raw token is never stored here |
| Authenticated subject and selected actor | subject and actor; source owner binding checked |
| Canonical revision at decision | sourceRevision, a witness rather than a source revision increment |
| Selected session timestamp | Commit fence only, not persisted in receipt |
| Trusted UTC clock | time, preserved across retries |
| Private marker ID | `KCC-SHARE-WITHDRAWAL:` + SHA-256 of UTF-8 JSON array `[workspaceId, shareId, tokenHash]` |

Marker schema: `KCC360_SHARE_WITHDRAWAL_V1`. It uses existing `kcc_workspaces` with revision 1, bounded JSON payload, a fresh commit UUID and updated_at equal to the decision time. The marker is logically immutable; there is no update, delete or un-revoke method. Existing source share state may still say ACTIVE because the old payload is intentionally retained; **raw source state or the pure shareStatus helper alone is therefore not authoritative for disclosure. All public consumers must use the withdrawal-aware resolver.** Current source inspection found public share consumers in `server/shares.ts`, which is covered here.

The accompanying `kcc_server_audit` row records `portfolio.share.quota-withdrawal`, a marker reference, share/token binding and source revision. It uses the same fresh commit UUID to correlate the batch. The audit revision is the witnessed source version, not a claim that the root changed. It stores no reflection text, grade, feedback, attachment content or raw bearer token.

The marker INSERT is conditional on canonical ID/revision, current subject/actor/session generation and marker absence. Its audit INSERT is conditional on that attempt's inserted commit UUID. Audit errors roll back the marker in the D1 transaction. Concurrent identical requests share one marker/audit; concurrent different-link withdrawals use independent keys while preserving the root. A lost acknowledgment can be resolved by reading the original marker rather than writing again.

## Privacy and recovery behavior

- A successful quota withdrawal blocks the original public URL/QR and reports REVOKED in management views, even after an older ACTIVE source snapshot is replayed or the source is later repaired.
- Ordinary audit-log cleanup cannot reactivate the link: the authoritative marker is separate from the audit row. No audit cleanup was performed outside disposable tests. Markers are consent authority and must never be treated as disposable diagnostics or swept up by generic workspace cleanup.
- A new explicitly consented share has a new share ID and token, and may work independently after size recovery. This does not reopen the old link. Per-link withdrawal is separate from source-wide consent and official website publication approval.
- Marker corruption/unavailability fails disclosure closed. Public controllers retain generic 503 responses, no-store, no-referrer and existing CSP/robots protections. Valid unknown/withdrawn links remain unavailable without exposing receipt details.
- Already downloaded or externally retained copies cannot be erased by link withdrawal. The safeguard requires writable/readable application storage; it does not solve physical database exhaustion, an offline DB, or a full database rollback that loses the marker itself.
- Recovery/backup acceptance must include canonical data, private withdrawal records, audit and private files. Replaying only an old source is tested; full hosted database/file restore and external revocation durability remain acceptance dependencies.
- The root remains oversized where applicable; normal new data writes and share creation still respect the byte cap. Existing records, files, approvals, source identifiers and histories are retained. Storage decomposition/recovery is still required.

## Automated evidence

Final focused withdrawal checks: **39/39**, including an independent Python-produced key vector; the same application/repository contract with memory and real file-backed SQLite; and actual private/public controllers. `STAGE284_WITHDRAWAL_COMPLETE.txt` and the final fixture recheck `STAGE284_WITHDRAWAL_FINAL_VERIFIED.txt` record them. Coverage includes ownership/subject/role denial, forged fields, source and session races, replay, competing and independent withdrawals, audit rollback, lost acknowledgment/retry, corrupt markers, delayed public reads, old source restoration, audit-retention independence, fresh consent/new token, active-link quota and optional-response commit denial.

The existing 21 write-guard groups pass, with the prior expected quota-denied revoke test updated to require successful source-preserving withdrawal. Fresh architecture audit **10/10**, visitor-response and reflection-sharing checks pass. TypeScript and production build pass (`STAGE284_VALIDATION.json`). Final complete regression: **76/76 PASS**, zero failures with the existing time limits (`STAGE284_REGRESSION.json`). Supplemental audit/export/client and affected email entry points pass **9/9** (`STAGE284_SUPPLEMENTAL_COMPLETE.json`). Every changed test entry point is covered by the full run, targeted validation or these supplements. The last fixture-only refinement models both the winning marker and its correlated audit in the optional-response race; the full focused withdrawal suite was rerun successfully after it. Production sources remain those exercised by the successful compiler/build and 76-group run. These are local fictional checks over actual services/controllers and SQLite, not browser, hosted D1, official MIS/SSO or institutional acceptance.

A test-only TypeScript module loader resolves the new infrastructure imports, including the existing schema and installed Drizzle packages. The existing capacity fixture now transpiles types before resolving imports and supports bare-package resolution. Test import-map changes do not alter authorization expectations. Its optional response flag is only an isolated test-module substitution, false by default. Historical file-freeze guards allow only the exact reviewed sharing patch while uncommitted; other files remain protected.

Intermediate audit-only denial storage was replaced before acceptance by the separate marker plus atomic audit, avoiding a dependency on audit retention for privacy. During that change, an initial adapter check exposed raw-driver snake_case/camelCase mapping; explicit ORM aliases corrected it. Intermediate logs are retained and repeated compiled data-URL bodies are elided. No intermediate implementation was uploaded as accepted functionality.

## Architecture and next step

New business/domain code does not know SQLite. The new repository is the only layer that knows D1 and the existing text-payload schema. All new persistence queries use ORM builders; the old optional-response query gains only a bound denial guard. Existing raw-SQL/core-engine debt remains. Versioned JSON is bounded to this receipt; no institution-wide graph is copied into it. Sessions and schema/migrations stay unchanged. Transactions are short and contain no external network or source loading. Local fixtures use WAL; managed D1 and PostgreSQL acceptance remain separate.

The existing owner-private demo restriction is preserved. Tenant isolation, institutional identities/departments/grants, hosting authentication-header trust, real recovery and campus load acceptance remain open. Readiness for 10,000 accounts remains HOLD. Withdrawal namespace scoping is not proof of end-to-end multi-tenant isolation.

Next smallest task: a read-only recovery inventory and private export/restore rehearsal that includes source, marker, audit and file references, before any structural move or pruning. Then resume the bounded discussion/history/audit/notification transition. Official website event/registration/reflection/PDF/fallback integration dependencies remain unchanged and disabled; this private link safeguard makes no website contract or cross-system readiness claim.
