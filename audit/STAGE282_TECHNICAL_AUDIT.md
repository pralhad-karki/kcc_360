# KCC360 technical audit — Stage 282

4 November 2026, Asia/Kathmandu. Audited code checkpoint: `2c0616f51b296a96c9918eafe388ee0a9d3b05c4`, branch `development/website-mock-acceptance`. Local HEAD, clean starting tree, schema/migrations, current routes/service, file/share access, identity/permission components, generated engine, recent migration boundaries and prior test evidence were reviewed. This is a source and local-fictional audit, not a hosted penetration test, exhaustive security review, PostgreSQL migration acceptance or an assessment of developers' intentions. No application code, database, configuration, deployment or live integration was changed.

## Executive decision

**Keep the owner-private fictional prototype restricted. Do not treat the current main application as tenant-isolated, institutionally authenticated or database-portable.** Continue incremental remediation; a restart or language replacement is unnecessary to address these findings. The recent discussion ports and rehearsals are useful migration preparation for one bounded workflow, not proof that the legacy application has already adopted clean architecture.

| Requested check | Verdict | Main evidence |
| --- | --- | --- |
| Tenant isolation | Not implemented end-to-end for shared multi-organization use | Main workspace is a fixed owner-demo record; session persona selection is intentional; tenant-aware policies exist separately |
| PostgreSQL portability | Partial preparation; substantial legacy coupling remains | 36 server files contain direct prepare calls; schema and migrations are SQLite-specific; persistence uses D1 APIs |
| Architecture | Mixed: mostly thin routes and useful policy modules, but a coupled legacy core | Main service mixes HTTP errors, policy selection, engine execution and SQL; generated engine is 1,223,373 bytes and includes UI code |
| Costly shortcuts | Several deliberate prototype choices would become costly if carried into real rollout | Shared JSON root, demo identity, duplicated persistence rules, uneven transaction guards and incomplete adapter adoption |

## Findings, priorities and correction criteria

P0 means a gate before changing the relevant access/hosting model, not a claim of an exploited vulnerability today. P1 means fix before institutional rollout or the relevant storage transition. P2 means bounded maintenance debt that should be resolved before it spreads.

### TA-01 — Owner-demo access is not tenant or institutional user isolation

**P0 before shared-tenant or real-user activation; confirmed design limitation.** `server/service.ts:6,9,11-16`, `app/api/session/route.ts:3`, `db/schema.ts:2-5`.

The active main path authenticates one configured owner email, loads `KCC-OWNER-DEMO`, and allows that owner to select any recognized demonstration persona. Sessions are keyed by subject alone. The four SQL tables have workspace identifiers in relevant rows but no tenant/organization column or database-enforced institution relationship. No central organization-bound repository context, tenant interceptor or global query filter protects every active persistence path. A workspace ID is not automatically a tenant boundary.

There is valuable groundwork: `permission-policy.mjs` denies mismatched tenants and departments; `identity-grant-adapter.mjs` binds issuer/subject/tenant to verified people; `intake-trusted-loader.mjs:4,18-45` validates tenant-scoped source data. However, the trusted intake runtime is default-disabled and the generic workspace still uses demo identity. Existing tests explicitly preserve that separation. This is not full live tenant enforcement.

**Leakage conclusion:** no present cross-organization disclosure was demonstrated. The current intended deployment has one owner and fictional KCC data. If the owner restriction were widened without replacing persona selection and fixed-workspace loading, additional users could enter the same demo data/roles. A shared multi-institution deployment would have inadequate isolation. This is a conditional high-impact risk, not evidence that another organization has already read KCC data.

For KCC's single-institution scope, the smallest approach may remain one dedicated database and private bucket with an explicit immutable KCC deployment context. Multiple organizations do not require speculative microservices. If institutions will share a deployment/database, require trusted tenant context, tenant-qualified unique keys and relationships, scoped queries/object keys/jobs/exports and cross-tenant negative tests everywhere; consider PostgreSQL row-level security as additional defense when appropriate. In either model, replace demonstration personas with verified institutional identities and scoped grants before real users. A tenant column alone is insufficient.

### TA-02 — Authentication depends on a hosting trust boundary that must be verified

**P0 before exposing a new origin/Worker; conditional deployment risk.** `app/chatgpt-auth.ts:21-38`, `server/service.ts:9`, `build/sites-worker.ts:6-26`.

The authentication helper trusts `oai-authenticated-user-id` and `oai-authenticated-user-email` headers. It does not verify a signed identity assertion in that helper. This can be appropriate behind a platform gateway that strips client headers and injects authenticated values. That guarantee was not established for an independently reachable Worker or other future host by this local audit.

Do not assume the owner-email comparison makes untrusted headers authentic. Require documented and tested gateway provenance/origin protection or a verified institutional session/token boundary, issuer/audience/expiry checks and revocation. Test direct-origin requests with forged headers in an approved staging environment. **No live header-spoofing test was attempted, and current hosted exploitability remains unverified.**

### TA-03 — One JSON workspace creates contention and weak database-level integrity

**P1; confirmed structural limitation and measured local contention.** `db/schema.ts:2-5`, `server/service.ts:12,16`, `audit/STAGE279_CAPACITY.json`, `audit/KCC360_10000_USER_READINESS_PLAN.md`.

Projects, participation, reflections, relationships and histories largely live in a single text payload. A changed command rewrites it under a global revision. Unrelated project writes can therefore conflict. Prior Stage 279 probes recorded one winner and seven safe conflicts for eight synchronized different-project edits; the five current reliability groups were rerun successfully. Those are fictional diagnostics, not campus load acceptance. There is a 2,000,000-byte main-workspace budget, not a scalable three-year data model.

The schema declares primary keys but no foreign-key relationships among its four tables; business links nested in JSON are not relational database constraints. `payload` is plain text, not an ORM JSON-mode field or PostgreSQL JSONB column. Flexible form values are a good use of JSON; the entire institutional record graph as one mutable blob is a different design choice. Moving that blob to PostgreSQL alone will retain much of the contention and application-level integrity burden.

Continue the bounded discussion transition, preserving stable identifiers, approvals, audit and notification effects. Normalize frequently updated records and essential relationships gradually, with indexes, scoped paginated reads, export/import reconciliation and rollback rehearsals. Do not reset data or apply production migrations during preparation.

### TA-04 — ORM presence does not mean the data layer is abstracted

**P1 before claiming PostgreSQL readiness; confirmed portability debt.** `server/service.ts:11-16`, `server/files.ts:7-8`, `server/shares.ts:11-16`, `server/plan-approval-save.mjs:83-103`, `db/schema.ts:1`, `drizzle.config.ts:7`, `drizzle/0000_motionless_nova.sql`.

The source scan found direct `.prepare(...)` calls in **36 server files** and `.batch(...)` in **35**, including disabled pilots as well as active services. Only one server implementation imports Drizzle: the recent discussion migration repository. Counts are reproducible search inventories, not counts of live endpoints, vulnerabilities or SQL injection sites.

Concrete replacement work includes `INSERT OR IGNORE`, SQLite schema builders/backtick-quoted migrations, `?` prepared-statement bindings, D1 `.first()`/`.batch()` and D1 result metadata. PostgreSQL uses its own driver/parameter/result conventions and `ON CONFLICT` handling. A D1 batch's transaction/rollback guarantees must be reproduced, not replaced by an uncoordinated set of PostgreSQL queries. SQLite and PostgreSQL migration histories need separate, rehearsed plans. Drizzle itself has dialect-specific schema definitions; changing a connection string does not translate them.

The specified scan found no uses of `json_extract`, `json_set`, `json_each`, `json_group_array`, `julianday`, `strftime` or `last_insert_rowid` in server TS/MJS files. This limited negative search is not proof that all SQL is portable. The larger problem here is pervasive driver and storage-model coupling.

Raw SQL is not inherently a defect, and examined queries bind values rather than concatenate request data. Complex transactional/security predicates can remain parameterized inside a repository adapter. The debt is that most persistence is not behind swappable repository/unit-of-work contracts. Apply ORM builders for routine operations and isolate exceptional SQL. Require the same repository, concurrency and error contracts against real PostgreSQL before asserting compatibility.

### TA-05 — The legacy engine mixes presentation, policy and application state

**P1 for migration cost; confirmed architectural debt.** `scripts/prepare-workspace.mjs:3-6`, `server/engine.mjs:8`, `prototype/assessment.js:10-21`, `server/service.ts:7,16`.

Most reviewed route handlers are thin: they authenticate/validate, delegate and map responses. The principal separation problem is deeper. The generator concatenates browser workflow files into a server engine with DOM/local-storage/FormData shims. Presentation templates, global `db`/`uid`, hard-coded persona IDs, decisions, history and notifications share this runtime. The main service also combines orchestration, direct SQL and HTTP-oriented errors. This is not uniformly Controller → Application/Domain → Repository architecture.

There are already useful pure helpers: `calculateAssessment(r, values)` at `prototype/assessment.js:20`, monitoring policy modules, and the new discussion domain/application ports. Preserve them. Extract calculations into independent tested modules with fixed input/output vectors, then migrate one command at a time with observable-behavior equivalence. A Java/C# implementation would still translate behavior and adapters; it cannot directly reuse the TypeScript/MJS implementation. Do not describe the codebase as completely future-proof.

### TA-06 — Session authority is not rechecked consistently at commit

**P1; locally reproduced race in the owner demo.** `server/service.ts:16`; `audit/STAGE282_EVIDENCE.json → probes.commitSessionRace`.

The main command service checks the selected session actor early. Its UPDATE adds a matching session predicate only for `submitReflection` and `submitEvaluation`. A deterministic SQLite barrier probe changed the selected actor from `s1` to `a1` after authorization but before a `sendMessage` write. The response was **200**, workspace revision advanced to **1**, current session actor was **a1**, and the committed audit actor remained **s1**.

This demonstrates stale persona authorization at a save boundary. It is not an unauthenticated escalation, cross-organization breach, or measured multi-host race: the scenario uses the authenticated owner's demonstration session and a controlled local transaction barrier. Before institutional use, apply a consistent commit-time actor/authority-version fence to all relevant writes, including files and shares, through the transaction boundary. Define whether already-authorized in-flight actions survive revocation; enforce the approved rule consistently. Retain conflict/rollback tests.

### TA-07 — Remaining character-count guards disagree with the byte limit

**P2; confirmed arithmetic defect, practical priority for Nepali content.** `server/files.ts:7`, `server/shares.ts:11,16`, `server/cohort-progression-store.mjs:26`, compared with `server/service.ts:16`.

The main service was corrected to use UTF-8 bytes, but several other save paths still use `payload.length`. The audit sample has **700,016 UTF-16 code units** and **2,100,016 UTF-8 bytes**. A character-count check accepts it while the 2,000,000-byte check rejects it. This is an arithmetic reproduction of those guards, not a hosted upload acceptance test. Such divergence can admit state through one path that later saves reject through another.

Centralize and reuse the byte-budget policy across all writers, with real Unicode save/rollback tests. The 2 MB budget is an application safeguard, not proof of hosted database/request-limit compatibility.

### TA-08 — Durable retry receipts and operational acceptance are uneven

**P1 before a storage cutover; design and acceptance gap.** `server/service.ts:16`, `server/plan-approval-save.mjs:40-55`, `server/discussion-migration/application.ts:22-24`, `audit/STAGE281_REPORT.md`.

Some newer pilots implement operation receipts and CAS fences. Generic legacy commands do not accept a durable operation identifier or return a persisted command receipt. An exact retry with its old revision safely conflicts; that does not tell a client whether a lost-acknowledgment operation previously succeeded, and resubmission after refresh can be indistinguishable from a new action. The discussion staging receipt is explicitly current-head-only; the Stage 281 rehearsal saves nothing.

Before active storage changes, require durable operation receipts and receipt-conflict handling across command versions, plus atomic history/audit/notification effects and rollback. Local SQLite shims and pure policy tests do not establish actual hosted D1, institutional SSO/MIS, realistic concurrency or PostgreSQL behavior. Database-plus-private-file restore acceptance and recovery targets remain unproven in the reviewed evidence; this audit cannot determine what external hosting backups may exist. Source Git history is not a backup of those stores.

## Explicit shortcuts that can cost time and money later

| Shortcut visible in code | Why deferral increases rework | Relative rework exposure | Required response |
| --- | --- | --- | --- |
| Owner identity plus freely selected demo personas | Real access rules must be connected across every record, file, export and job | High; rollout blocker | Keep restricted; integrate verified institutional identity/grants |
| One JSON root and one revision | More records and concurrent edits increase conflicts and make normalization harder | High | Continue measured per-workflow decomposition |
| Direct D1 calls spread across services/pilots | A database/provider change touches many implementation files | High | Establish repository and atomic transaction contracts |
| UI-generated engine with global state/persona IDs | Language rewrite requires untangling behavior and side effects | High | Extract pure calculations and bounded command services |
| Bespoke guards, limits and receipt handling per writer | Fixes drift; one path remains weaker after another is repaired | Medium to high | Shared commit fences, errors, byte budgets and durable receipts |
| Passing mocks treated as rollout approval | Integration/recovery/security problems are discovered late | High impact; effort unknown | Keep explicit hosted, identity, recovery and cross-system gates |

These are observable technical choices, mostly inherited prototype boundaries. They are not evidence of misconduct. Exact cost or duration cannot be responsibly estimated without the chosen hosting/tenancy model, identity sources, representative volumes and acceptance requirements.

## Strengths to preserve

- Existing owner restriction and deliberate default-disabled institutional/live adapters avoid pretending fictional identities are official users.
- Permission, identity and resource components have explicit tenant/department denial, expiry, revocation and independence checks; fresh local suites pass.
- Main writes use optimistic revision checks and atomic workspace/audit batches. Existing rollback tests preserve winners and history.
- File downloads check both workspace and record access plus current attachment association. Sharing uses random hashed bearer tokens, consent/expiry/revocation and scoped snapshots; fresh checks pass. Bearer-link access is an intentional sharing model, not a tenant bypass by itself.
- Recent discussion ports separate domain/application/infrastructure, use generic storage errors and exercise both memory and real SQLite. They remain disabled and limited in scope.

## Evidence and follow-up

`STAGE282_EVIDENCE.json` records **10/10 freshly executed targeted suites**, source inventory and two finding probes. It reruns permissions, identity/grants, resource scope, trusted-loader, files, portfolio sharing, discussion rules, workspace reliability, migration and command rehearsal. Finding probes confirm risk conditions; they are not security-acceptance passes. No test suite is called a live tenant-isolation test. The previous unchanged Stage 281 application checkpoint records 74 regression groups plus TypeScript/build passing; the entire 74-group run was not repeated solely for this documentation audit.

Reproduce locally: `node scripts/audit-architecture.mjs --fictional-local-audit --report audit/NEW_TECHNICAL_AUDIT_EVIDENCE.json`. It refuses existing report paths, opens only new disposable fictional SQLite fixtures, and runs no network transport or hosted migration.

Recommended sequence:

1. Keep owner-demo restrictions. Confirm a dedicated single-KCC deployment versus a future shared-institution service; never broaden the allowlist/persona selector into institutional access.
2. Correct the bounded commit-fence and Unicode-budget inconsistencies first, preserving exact permissions and atomic audit; add regression cases for every affected writer.
3. Continue the existing discussion effect/atomic-save/rollback plan and gradual repository extraction. Preserve working modules and migration history.
4. Before real-user rollout, complete verified institutional identity and department grants, origin/header trust acceptance, private-file controls, database-plus-file restore and representative hosted load. Before PostgreSQL, execute real adapter/migration equivalence tests. Before Java/C#, port pure behaviors against golden vectors rather than assuming source reuse.

**Six-rule status:** separation is partial; ORM abstraction is incomplete; dynamic data mostly remains plain text JSON; generic errors are inconsistent outside new boundaries; WAL is verified in local fixtures rather than a configurable D1 guarantee; local decoupled tests exist but cross-driver/hosted acceptance remains open. Do not claim full compliance yet.

Primary references checked: [PostgreSQL INSERT and ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html), [Cloudflare D1 binding and batch transaction semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Drizzle dialect schema example](https://orm.drizzle.team/docs/schemas). These document platform differences; source findings above come from the pinned KCC360 checkpoint. Website contract, source approvals, consent rules and integration readiness are unchanged by this audit.


## Local remediation follow-up — Stage 283

The original findings above describe pinned source 2c0616f and are retained as historical audit evidence. [STAGE283_REPORT.md](STAGE283_REPORT.md) records the subsequent bounded fixes. TA-06's reproduced owner-demo selected-persona save race is now rejected at commit for generic commands, uploads and authenticated share writes, including same-actor/new-generation changes. TA-07's identified character-based workspace save guards now use the shared UTF-8 limit. This does not close institutional identity/tenancy, hosting trust, storage architecture or recovery acceptance. A quota-denied revocation leaves the existing link unchanged; safe recovery/withdrawal for already-oversized state remains a rollout dependency.


## Local withdrawal follow-up — Stage 284

[STAGE284_REPORT.md](STAGE284_REPORT.md) supersedes Stage 283's quota-denied per-link revocation limit: a private permanent withdrawal marker and atomic audit now stop the original token without rewriting or pruning the oversized source. Public/management readers enforce it even if old source state is restored or ordinary audit logs are pruned. This is local owner-demo verification; source-size recovery, complete marker/audit/file backup restoration, institutional identity/tenancy and hosting trust remain open.
