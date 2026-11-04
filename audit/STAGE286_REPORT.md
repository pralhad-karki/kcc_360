# Stage 286 — bounded discussion effects and disabled atomic rehearsal

4 November 2026, Asia/Kathmandu. Baseline `fd3df99418191801e2f8fa463c0a33d2f2e62011`, tree `2b10d941b3ac2fd8ffe15a1bdd9b7779d26876e6`, branch `development/website-mock-acceptance`. Inspected the clean existing checkout, actual GitHub head, Stage 285 handover/report/manifest/validation, Stage 281 implementation/report, staged codecs, engine discussion/notification functions, schema and existing memory/SQLite fixtures before editing. No restart, database reset or replacement of working modules.

## Bounded plan and result

Stage 281 evaluates a command against a current staged discussion without saving it. This stage adds a default-disabled **private candidate-effect transaction**: the exact candidate changes and an immutable receipt share one new private row, and its server audit commits in the same database transaction. The canonical workspace and existing staged head remain unchanged. There is no active command route, runtime composition, dispatcher or storage switch.

The grounded implementation sequence was: constrain actual engine effects; losslessly materialize the prospective result; reuse the existing read-only preview's source/copy/authority checks; add a durable private operation receipt with commit-time fences and audit; verify rollback, retry/concurrency and Stage 285 recovery compatibility in fictional stores. No new schema or ORM was introduced.

This is deliberately one independently testable transaction boundary. It does not advance a live or shadow per-project head, persist a sequence of executed discussions, undo previously committed canonical commands, or remove shared-root contention. Different operation IDs can describe independent candidates against the same source. They are proposals, not a chronological execution chain. Transaction rollback here means a failed candidate/audit transaction leaves neither row committed.

## Allowed effects

`effect-domain.ts` preserves presence/absence, order, stable legacy references and unknown metadata on retained records. It rejects changes outside the following contract rather than expanding a general allowlist to accommodate legacy initialization.

| Scope | Accepted behavior |
| --- | --- |
| Project list | Same length, order and IDs; all unrelated projects remain identical |
| Selected messages | POST/REPLY append one correctly bound actor/text/time/ID; existing messages and metadata remain identical; replies retain the original parent reference |
| Selected discussion events | SET_STATE appends one OPEN/RESOLVED event with bound reason, actor, thread/version/count; other commands preserve events and optional-field absence |
| Selected project history and root audit | Exactly one matching prepend for a changed discussion, with the existing action label/project/time; no rewrite of older entries; no addition for a discussion no-op |
| Root reminder inbox | Retain old ID/order and history; append structurally bound in-app candidates; preserve active read/acknowledgement state; allow recorded resolve/supersede/reopen lifecycle transitions |
| Other project/root fields | Unchanged, including approvals, activity state, participants, grades, file references, permissions, policy/preferences and integration queues |

Notification reconciliation can affect other projects and governance reminders; the original engine does this even for some discussion no-ops. That behavior is preserved, with `discussionChanged` separate from `workspaceChanged`. A normalized no-op can have no effects at all while still receiving a private rehearsal receipt/audit. Unexpected initialization outside the bounded fields is rejected and requires a separately reviewed source-preparation decision; this stage does not initialize missing policy/preferences or rewrite canonical records.

The trusted unchanged legacy adapter remains responsible for actual access decisions and notification candidate generation. The new pure guard constrains effect structure/lifecycle and preserves all retained fields; it is not a second complete implementation of the campus notification policy. Do not accept an untrusted transition provider as an authorization substitute. Tests compare the complete candidate workspace with the unchanged engine, including reminder reconciliation and author/mentor behavior.

The captured fields contain before/after values and presence flags under `KCC360_DISCUSSION_EFFECTS_V1`. Applying them to the exact source must reconstruct the full engine output; incomplete/unexpected effects fail. Projection helpers accept only the reviewed project/root fields. Full workspaces stay internal and are not returned through the summary.

## Private operation and persistence mapping

| Item | Binding |
| --- | --- |
| Private row key | `KCC-DISCUSSION-REHEARSAL:` + SHA-256 of canonical JSON `[sourceWorkspaceId, operationId]` |
| Receipt schema | `KCC360_DISCUSSION_ATOMIC_REHEARSAL_V1` |
| Operation identity | Trusted subject/actor, project ID and validated typed command, bound by SHA-256; same operation ID with different content/project is rejected |
| Source/copy witnesses | Canonical source workspace/revision and current Stage 280 staged revision |
| Authority witness | Existing injected versioned authority fence; no new identity or role provider |
| Exact result | Whole-workspace before/after digests plus the private versioned effect set |
| Receipt integrity | SHA-256 over the complete receipt body; schema/field, row revision/time and key binding checked before replay |
| Server audit | `discussion.command.rehearsal`; workspace points to the private receipt row, revision 1; commit UUID correlates the transaction |

`atomic-application.ts` is default disabled and uses existing reader/copy/authority/transition/digest ports plus a new atomic repository port. It reuses Stage 281 preview validation, adds exact effect reconstruction, rechecks authority, and returns only IDs, witnesses, hashes and change flags. Message/reason/grade/notification contents are not returned in the summary. Request payloads cannot supply actor, authority, arbitrary metadata or source fences.

`infrastructure/atomic-repository.ts` builds all new queries with the existing Drizzle/schema. A conditional insert requires current source, staged and authority revisions plus operation absence. Audit insertion is tied to that attempt's commit UUID. Candidate/effects and receipt are one immutable revision-1 row: there is no separate partially written projection. D1 batch rollback on SQL failure is exercised with actual SQLite; new driver errors are translated to generic domain storage errors. The receipt payload is bounded to 1,990,000 UTF-8 bytes. No network, command evaluation or authority lookup occurs inside the database transaction.

Concurrent identical operations yield one receipt and one audit. A retry after lost acknowledgement reads the durable receipt without evaluating the command again. Current access and a final authority fence are required even for replay. An intact receipt copied under another operation key is rejected. Authorized replay may return the original historical source witness after canonical data changes, but never reapplies old effects or rewrites current source/staging. This is an operation receipt, not a new successful execution against the newer source. Source-only history, standalone checksums and audit retention do not establish hosted recovery authenticity.

## Local evidence

`STAGE286_ATOMIC_CHECKS.txt` records **54 focused grouped checks**: 21 contract groups each on memory and ORM-backed real file SQLite/WAL, plus 12 SQLite-specific/integration groups. Coverage includes POST/reply/resolve and author/mentor reopen; exact whole-engine materialization; no-op reminder changes and fully normalized no-ops; retained read/acknowledgement and recorded reopen; immutable source/staging; duplicate/concurrent/rebound operations; lost acknowledgement; complete audit-failure rollback; source/authority/staged races at commit; denied subjects/forged inputs/invalid clocks; current authorization for historical replay; corrupt/swapped receipts; unsupported initialization; unrelated fields, history/audit rewrites, message actor changes and reminder deletion/forged acknowledgement; byte budget and generic real-driver failures.

The new private row and correlated audit are included losslessly by the Stage 285 recovery reader/verifier, using a separately retained digest and JSON round-trip. That test creates only the existing file-table schema in its new disposable database; it does not migrate an existing store. The original fixture gains only a `first()` adapter method and explicit test access to its isolated client/SQLite connection. Existing defaults and tests remain intact. The complete regression launcher adds this suite.

Final complete regression: **78/78 PASS**, zero failures. Focused atomic checks: **54/54 PASS**; TypeScript and production build pass. No hosted or browser acceptance was executed. Final regression, TypeScript/build and source-hash evidence are recorded in `STAGE286_REGRESSION.json`, `STAGE286_VALIDATION.json` and `STAGE286_CODE_MANIFEST.json`. Existing application service, generated engine, adapter policies, earlier recovery/withdrawal modules and all schema/migration files remain unchanged.

Initial local diagnostics found a TypeScript tuple-union `includes` typing issue and a notification-deletion test whose empty baseline could not prove removal of an existing notification. The typing was corrected without changing runtime policy; the test now establishes a real existing reminder inbox before injecting deletion/acknowledgement changes. Final tests require those mutations to fail. Diagnostic observations concern fictional disposable stores only; no application data or policy was relaxed to repair them.

## Privacy, architecture and limits

The domain/application boundary has no ORM, SQL, framework or HTTP dependency. Only the infrastructure adapter knows D1 and the existing text-payload schema. Generic errors, versioned JSON, stable IDs, short transactions and memory/real SQLite contracts continue the agreed architectural direction. PostgreSQL adapter equivalence, Java/C# translation, hosted D1 acceptance and institutional authorization remain unproven.

Candidate rows contain private discussion/history and potentially workspace-wide reminder/audit metadata. They have no public/read-persona route and must remain private in any later recovery/export/operator design. Only fictional data and transports were used; GitHub receives source, documentation and aggregate evidence, not live candidates, private archives or real student/staff records. Audit metadata contains references/hashes, not discussion text. Checksums are integrity witnesses, not digital signatures or a defense against an attacker controlling storage and recomputing them.

This does not activate a new storage path, remove whole-workspace reads, solve independent-project contention, establish tenant isolation, implement SSO/MIS, or grant real selected-session/institutional rights. The main owner-demo path and its existing commit-time session rules are unchanged. A later runtime must bind every actor and authority fence to trusted current identity and scope; the fictional grant is not that provider. Existing canonical source/files/approvals/history are not pruned or renumbered. The private budget can reject a large candidate without repairing or compacting its source.

**Readiness remains HOLD.** Next bounded task: define revisioned private candidate-head advancement and guarded reversal/materialization against those receipts, with same-record conflicts and shared reminder/audit coordination explicitly tested before any cutover. Preserve the existing canonical path, recovery consent authority and website/MIS/SSO roadmap. Hosted restore/load, institutional identity/tenancy/header trust and independent website publication approval remain open. No deployment, production migration, database reset, email or live integration occurred.
