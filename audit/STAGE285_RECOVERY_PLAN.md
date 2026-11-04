# Stage 285 — bounded private recovery plan

4 November 2026, Asia/Kathmandu. Baseline `26c79a8fc766fd2142c2490350b5ba0b969c40ab`, branch `development/website-mock-acceptance`.

The recoverable checkout `/workspace/sites/kcc360-recovered270` was found clean at the supplied HEAD/tree `ff41d001099a7bd74ec43d63e876db3df8fa31ef`. GitHub's branch and recent history matched it. The extra scratch checkout was not used to replace existing work. Read the handover, Stage 284 report/code manifest, latest finalization entries, Stage 282 audit with follow-ups, three-year readiness plan and Stage 283 report before implementation. No applicable filesystem AGENTS.md was found in the source/ancestor directories; the user's project instructions remain applicable.

## Existing boundaries and inventory scope

`db/schema.ts` and the two existing migrations define four tables. `server/files.ts` couples private object keys to stored-file metadata and embedded source references. `server/share-withdrawal/` makes a separate workspace row the permanent denial authority, with a correlated audit. `server/portfolio-exports.ts` is a permission-scoped portfolio/print export, not a database backup; it is retained unchanged. Discussion staging and registration stores demonstrate private namespaces and atomic audit. No complete database-plus-file recovery boundary was found in the inspected utilities.

| Store / relationship | Rehearsal treatment |
| --- | --- |
| `kcc_workspaces` | Read every row, including canonical root, withdrawal markers, staged/private ledgers, authority/catalog rows and unknown future namespaces; preserve exact payload text, revision, commit ID and timestamp |
| `kcc_server_audit` | Preserve every row and stable reference; verify surviving withdrawal audits have their markers and correlated receipt fields |
| `kcc_stored_files` | Preserve every metadata row/object key; verify source association for AVAILABLE files and embedded references; require matching object bytes/hash |
| Private bucket | Read every metadata-referenced object through an injected port; transfer bytes separately in the disposable rehearsal; no public object URLs |
| `kcc_demo_sessions` | Deliberately excluded from archive and replay. Fresh fictional test sessions are created separately; restoring data never restores login authority |
| Unknown/private JSON | Retain bytes verbatim. Top-level array counts are diagnostics, not a full semantic graph validator for every legacy/private schema |
| Unreferenced bucket objects | Not listed by this boundary; `objectListingComplete=false`. Retention, orphan review and hosted snapshot coordination remain open |

## Small implementation and acceptance

1. Add a framework-independent private recovery application with an explicit authority port, read-only repository and object reader. No default authority, runtime composition, route, scheduler, object writer or database restore API.
2. Read the three recovery tables in one ORM-built D1 transaction batch, bounded to 10,000 rows/table. Validate a 32 MiB serialized snapshot bound and a separate 32 MiB referenced-object total. These are offline safety bounds, not hosted capacity claims or a scalable streaming implementation.
3. Build a versioned private manifest with deterministic ordering and SHA-256 over schema plus exact snapshot. Recheck the DB after asynchronous object verification and recheck authority before releasing content. Use an independently retained expected digest for verification; a checksum inside an archive cannot authenticate itself.
4. Rehearse JSON export/verification and restore into a freshly created isolated SQLite/WAL store only. Test-only inserts refuse a populated target and roll back the whole DB transaction on failure. Copy private bytes separately; revalidate their hash and application access.
5. Exercise the actual public-share and private-file controllers after restoration. Reject missing/corrupt marker, audit, metadata and object evidence, altered payload/version, duplicate IDs, unauthorized/revoked access and changed source. Preserve marker denial even when a historical audit is legitimately absent, reporting that gap explicitly.

## Operational limits

This is a private DB/reference export plus object verification, not an encrypted archive, signed manifest, identity backup, hosted point-in-time recovery service or database repair tool. It never compacts the oversized source or bypasses its ordinary write limit. Unknown relationships are losslessly retained but are not all semantically checked. Missing/corrupt evidence blocks verification rather than triggering deletion or guessed repair.

Database and bucket have no joint transaction here. A second database read detects drift during object reads; it cannot guarantee a globally atomic snapshot or that objects remain unchanged afterward. Hosted restore must stop publication/delivery/other writers, establish a consistent DB/object recovery point, retain current withdrawal authority outside rollback scope, verify a trusted external manifest, and revalidate identity/grants/consent before reopening. Actual procedure, encryption/key custody, recovery time/data-loss objectives, retention, orphan listing, hosted D1 behavior, object versioning and institutional operator authority still need acceptance. Loss of both marker and its audit cannot be detected from an old source alone without a newer trusted anchor; never reactivate service on that assumption.

No database reset, production migration, hosted read/write, deployment, email or live integration is part of this stage. Git contains implementation and fictional aggregate evidence only; source Git history is not a backup of hosted data. Institutional/capacity readiness remains HOLD.
