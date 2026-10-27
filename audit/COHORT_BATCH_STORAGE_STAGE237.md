# Stage 237 — durable, isolated mock cohort batch storage

Recovered baseline: clean b2299ab269e84c1cd536b1fd675648ef5fc92566, published version 248. Stage 236 pure batch core, Stage 235 read-only UI and existing architecture retained.

## Completed

- Added `server/cohort-progression-store.mjs` and the `KCC-MOCK-COHORT-LEDGER-V1` server-private record in the existing `kcc_workspaces` table. Payload has its own versioned kind envelope. No schema or migration change, database reset, ordinary workspace overwrite or browser persistence.
- Missing ledger reads return an in-memory fictional initial state; GET does not initialize storage. The first successful proposal inserts revision 1. Invalid/foreign stored payload fails closed without replacement or reset.
- Added GET/POST `/api/academic-cohort-batches` through existing owner identity and same-origin JSON guards. The service composes only the fixed fictional MIS adapter and explicit fictional programme structure. Clients cannot supply source records, placements, ledger content, tenant, database namespace, approval actors or an official-provider mode.
- GET is restricted to existing c1/d1/a1 academic review personas. Only c1 prepares/applies, and d1 independently approves/rejects. a1 has read access without a write override. Roles are authenticated-owner-controlled demo personas, not institutional identities or two independently authenticated people.
- POST uses exact action-specific fields, a bounded body and validated reasons, expected persona/revision and current snapshot references. Proposal identifiers are server-generated. The stored proposal determines the cohort for review/application.
- The existing pure core revalidates complete cohort source/structure/placement bindings before returning a candidate. Only Left College is excluded; break/repeat/unknown and fee/attendance/grade/hold flags do not exclude. Final-semester application is refused for separate handling. Approval and application replays are denied.
- Each insert/update checks the expected ledger revision and captured subject/persona/session timestamp inside SQL. A random commit marker binds the conditional audit insertion to the winning write. D1 transactional batch commits ledger and audit together. No retry loop, browser fallback or blind replay exists.
- History, original proposal, decision and complete before/after placements remain in the isolated ledger. Audit records bind the batch/source/counts/content digest and before/after revisions. Ordinary workspace reads retain the fixed existing workspace scope; no ledger or audit subject/session proof is returned through student/mentor/other ordinary views. Dedicated academic reads return batch records but omit raw ledger placements and global history/session/audit data.
- An uncertain commit response returns an unavailable message instructing refresh. A fresh GET reveals the actual persisted revision/state; old-revision replay conflicts rather than applying again.

## Validation performed

`check-cohort-progression-batches-route.mjs` compiles the actual new TypeScript service/route, uses the real store/core/fixture and an isolated SQLite database with existing migrations. Authentication and the runtime binding are test substitutions; no production database, real student record, mail provider or institutional identity is used.

Passed cases include:

- Owner/unauthenticated/intruder boundary; every non-academic persona denied before source loading; academic reader and write-role separation; exact fields, origin, JSON, size, reason and source references.
- Empty GET without initialization, competing revision-zero proposals with one winning batch/audit, stale requests and repeated approvals/application.
- Account change during source load, change before transactional save, same-persona changed session stamp, and a competing SQL revision update.
- Audit-trigger failure rolls back both initial insert and later placement update. A simulated lost response after committed application is recovered by GET with exactly one application/audit, without retrying.
- Persisted proposal → independent approval → explicit mock application; five students advance, official Left College and other-cohort/final student remain unchanged; before/after versions and original history are retained.
- Current source status change blocks approval. Final-semester proposal is denied. A second isolated database verifies persisted rejection, no application of rejected batches, corrected proposal retention and unchanged placements.
- Corrupt/foreign ledger is neither returned nor reset. Ordinary workspace row is byte-for-byte unchanged. Every ordinary persona's workspace response omits the mock batch and ledger namespace.

Also passed: pure cohort batch, cohort planner, existing read-only cohort API/client, individual academic progression, MIS/SSO adapter isolation and shared server regressions. TypeScript initially required an explicit result union at the JS store boundary; that was added without suppressions. Final no-emit check and production build pass. The new route is included in the production build.

Added the new command to the reusable runner (29 configured checks). No fresh aggregate 29-command run is asserted. No UI changed, so browser acceptance was not rerun; Stage 235 UI evidence remains historical. These are developer/isolated database checks, not institutional acceptance.

## Remaining work and external dependencies

Next: dashboard proposal/review/application controls for the persisted fictional workflow, with named dialogs, explicit mock labels, role-aware actions, reason entry, duplicate/stale-dialog/account guards, and refresh-only recovery after uncertain saves. Existing preview UI is still read-only.

No automatic rewriting of the immutable mock MIS snapshot follows application. Its old enrollment versions cannot be reused for a second advancement; source/placement conflict intentionally stops that attempt. A later mock snapshot revision must explicitly represent any subsequent rehearsal source. No official MIS synchronization is implied.

Live E-Digital Nepal API data/status synchronization, institutional SSO and any authorized write-back remain dependent on vendor specifications/access. Real-mail activation is also unchanged. Existing source, academic profiles, activity/research/internship/club workflows and learning records remain intact. This stage uses fictional records only.
