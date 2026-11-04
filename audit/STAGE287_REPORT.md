# Stage 287 — revisioned private candidate heads and guarded reversal

4 November 2026, Asia/Kathmandu. Baseline `30c1b82752acfde487f09e8771b4e80046b2a77b`, tree `4cb0f24f54642633714fb9a080b1280c79074360`, branch `development/website-mock-acceptance`.

## Recovery, inspection and bounded plan

The available local checkout was clean at `4a52139`, behind the already verified GitHub history. Fetched the development branch, verified Stage 286 at `30c1b82`, then fast-forwarded the existing checkout. No unpublished changes were present; no reset, history substitution or origin replacement occurred. Read the current continuation, Stage 286 report/manifest/validation/focused evidence, actual candidate/effect/repository implementations, shared fixtures and schema before editing. The source handover and latest finalization checkpoint retain earlier operational/institutional gates. No applicable filesystem AGENTS.md was found; the user's project and preservation instructions remain applicable.

Stage 286 stores independent, immutable candidate effects and operation receipts against canonical source. It does not maintain a revisioned head. This stage adds a disabled private head service that can select a compatible candidate, materialize its exact prospective workspace, and reverse only the latest coordinated candidate. The plan was to preserve existing receipts/codecs, bound whole-workspace shared effects, write head/coordinator/transition/audit atomically, then exercise races, reversal, rollback and recovery with new fictional stores. Existing source records, IDs, approvals, files, audit and migrations remain unchanged.

## Behavior and limits

A candidate changes selected-project discussion/history but can also change root audit and workspace-wide reminders. Independent project pointers alone could lose those shared effects. The rehearsal therefore uses a source-scoped shared coordinator in addition to each project head. A new candidate must match the exact current virtual workspace before-digest; its effects must reconstruct the recorded after-digest. Candidates based on an older canonical view are rejected rather than merged by guessing.

Reversal is last-in-first-out across the shared coordinator. It swaps captured before/after values and presence flags, requires the exact current after-digest, then independently rematerializes the remaining candidate stack from canonical source. Both results must match. It advances head/coordinator revisions even when returning to the original baseline, preventing a stale request from succeeding merely because a pointer has returned to its earlier value. Earlier candidates, transition receipts and audits are retained; reversal changes the active private view, not the canonical discussion or stored history.

This is an intentionally conservative intermediate step. The global coordinator serializes shared audit/reminder effects. Different-project concurrent candidates can conflict safely; this stage does not establish independent-project throughput or remove the active shared-root bottleneck. Stage 286's normal independent candidates are still evaluated against canonical source. After selecting a changed candidate, another independent candidate usually has an obsolete before-digest and is rejected. Compatible no-op candidates demonstrate ordered multi-project coordination and reversal, but do not establish a sequence of newly evaluated, stateful discussion commands. That evaluator/materialized-source boundary remains the next bounded task.

## Implementation and mapping

| Private row | Key / schema / purpose |
| --- | --- |
| Per-project head | `KCC-DISCUSSION-HEAD:` + SHA-256 of canonical JSON `[sourceWorkspaceId, projectId]`; `KCC360_DISCUSSION_HEAD_V1`; monotonic revision, selected candidate digest/reference and last transition reference |
| Shared coordinator | `KCC-DISCUSSION-COORDINATOR:` + SHA-256 of canonical JSON `[sourceWorkspaceId]`; `KCC360_DISCUSSION_COORDINATOR_V1`; source witness/digest, virtual digest, ordered active candidates and last transition |
| Immutable transition receipt | `KCC-DISCUSSION-HEAD-OP:` + SHA-256 of canonical JSON `[sourceWorkspaceId, operationId]`; `KCC360_DISCUSSION_HEAD_OPERATION_V1`; request identity, ADVANCE/REVERSE, before/after digests, resulting revisions and previous transition reference |
| Server audit | `discussion.candidate.head`; workspace references the immutable transition row at revision 1; references/hashes/revisions only, no discussion or reminder contents |
| Existing candidate | Stage 286 `KCC-DISCUSSION-REHEARSAL:` and receipt/effect schemas remain unchanged; source/staged creation witnesses and legacy identities are retained |

`head-domain.ts` validates versioned private rows and checksums, validates candidate/key bindings using Stage 286's existing receipt validator, reverses effect presence flags losslessly, and materializes candidate stacks without framework/ORM/driver imports. Materialization checks each active candidate's project, source witness, digest and previous-project pointer, then verifies full before/after workspace digests.

`head-application.ts` adds default-disabled inspect/transition methods over injected source, authority, storage, digest and clock ports. There is no runtime provider, route, dispatch or storage cutover. Inputs contain only project/candidate/operation references, ADVANCE/REVERSE and explicit expected project/shared revisions; actor and authority are never body-supplied. The current subject and actor must own the stored candidate, and current access is checked again before release/commit. No new delegation, institutional role or ability to reverse someone else's candidate is inferred.

Current head/coordinator and active/current transition references are validated before materialization. An absent/corrupt current operation is not reconstructed silently. ADVANCE also requires the candidate's staged version to remain current. REVERSE does not require restaging an earlier proposal; it requires the current canonical witness, topmost selected candidate and exact shared virtual state. Canonical source drift blocks new transitions and materialization; the service does not rebase private heads over changed source.

Summaries contain witnesses, IDs, revisions, digests and flags, never full source, message/reason/grade/reminder effects. Full materialized workspaces are internal. Historical operation replay still requires current authorization and current source/authority/receipt witnesses. It returns the original recorded revisions/digests, explicitly marked historical/replayed, without rewriting a newer head or applying effects to newer canonical data. Reusing an operation ID with changed request, scope, actor or versions is rejected.

`infrastructure/head-repository.ts` compiles all new reads/writes through the existing Drizzle schema, executes a short D1 batch, and translates driver errors into generic domain errors. The first conditional coordinator write checks source and authority revisions, observed private row revisions/commit UUIDs, and absence witnesses. The subsequent head write, immutable transition insert and audit require that attempt's coordinator commit UUID. All three private rows and audit correlate to that UUID. No engine evaluation, hashing, network request or authority provider runs inside the transaction. SQL failure rolls back all writes; a lost acknowledgement can be resolved from the immutable operation receipt on retry.

The supported active stack is bounded to eight candidates; read/commit guards accept at most 24 unique private observations. Each written row has a 1,990,000 UTF-8 byte limit. At the maximum tested stack, every generated query uses fewer than 100 bound parameters. These are conservative rehearsal bounds, not a measured hosted capacity claim, retention policy or permission to prune history. Full source/candidate reads, in-memory hashing and repeated materialization remain scaling work.

## Local acceptance evidence

`STAGE287_HEAD_CHECKS.txt` records **65 grouped checks**: 31 contract groups each on memory and actual ORM-backed file SQLite/WAL, plus three SQLite-specific query/recovery/error checks. They cover:

- Disabled providers; read-only/private-safe inspection; exact engine materialization; unchanged canonical/staged source; correlated head/coordinator/operation/audit UUIDs and metadata privacy.
- Guarded reversal, baseline restoration, explicit reapplication and monotonic revisions; duplicate active candidates and obsolete versions after pointer reversal are rejected.
- Historical retry/replay, changed operation identity and lost acknowledgement; concurrent identical operations commit once.
- Competing same-project and different-project candidates safely conflict; a fresh independent canonical candidate cannot overwrite a newer shared prospective workspace.
- Cross-project last-in-first-out reversal, including compatible no-op candidates whose before/after hashes are equal.
- Failures at coordinator, head, immutable operation and audit writes, complete snapshot rollback and safe retry; reverse-audit failure restores the previous committed private state exactly.
- Source/authority/private-candidate commit-witness races; newer staged copies; wrong subject/actor, forged fields, corruption/swapped receipts, missing current operation, oversized writes and bounded stack refusal without pruning.
- Changed canonical source blocks materialization/new transitions while authorized replay remains historical; revoked access blocks inspect and receipt replay.
- Actual maximum-stack bind counts, generic real SQLite failure translation, and Stage 285 private recovery preserving head, coordinator and immutable transition references/checksums.

The recovery check round-trips the private manifest through JSON and its separately retained checksum, then decodes recovered head/coordinator rows and rematerializes the recovered baseline view. Full hosted database/object restore is not claimed. Existing Stage 285 private-file/withdrawal restoration remains separately tested in the complete regression. The new fixture uses only new disposable stores and fictional identities; its file-table schema is installed only inside the new recovery test database. No existing database is reset or migrated.

Final complete regression: **79/79 PASS**, zero failures. Final focused head checks: **65/65 PASS**; TypeScript and production build pass. Compiler/build, complete regression and exact source hashes are recorded in `STAGE287_VALIDATION.json`, `STAGE287_REGRESSION.json` and `STAGE287_CODE_MANIFEST.json`. No browser, hosted D1, real institutional identity or hosted capacity acceptance is performed by these local tests. Existing application services, engine, schema, migrations, Stage 286 candidate/effect modules and Stage 285 recovery/withdrawal behavior are preserved.

## Privacy, architecture and next work

Only fictional test data were used. GitHub receives code, documentation and aggregate evidence, not live candidates, database archives, objects, credentials or real student/staff records. New head/coordinator records contain private references/digests; existing candidate effects may contain sensitive discussion/history/reminder data and remain private. An eventual operator surface needs explicitly approved authority and scope; no live provider is supplied here. Checksums detect corruption relative to trusted stored evidence, not an attacker who controls storage and recomputes all hashes.

The agreed domain/application/repository separation, generic persistence errors, existing ORM, bounded versioned JSON and real WAL SQLite contract tests are retained. PostgreSQL adapter equivalence and language translation still require their own implementation and acceptance. No new framework, schema migration, automatic record cleanup or identifier replacement is introduced.

Transition receipts and their previous-operation references must remain with source, candidates, heads/coordinator, audits and file/object recovery evidence. The application validates active/current references rather than walking an unbounded historical chain on every read. It does not implement a retention policy or certify that all historical/offline records can be discarded. Hosted recovery must retain current withdrawal authority outside rollback scope and revalidate identity/grants/consent before reopening; earlier readiness gates remain open.

**Readiness remains HOLD.** Next: prepare new command candidates against the exact materialized private head, with current canonical/staged/authority/head witnesses and receipt binding, then test a genuine multi-command sequence and reversal. Keep canonical storage active and all new behavior disabled. Shared audit/reminder coordination and independent-project throughput remain unresolved. Website/MIS/SSO, independent publication approval, real identity/tenant/header trust, hosted recovery and realistic load acceptance remain separate dependencies. No production migration, database reset, deployment, email, live integration or public publication occurred.
