# Stage 281 — read-only discussion command rehearsal

2026-11-04 UTC. Baseline `95daa575c80d59e9a1da50d0f5578f19cd4de843`, branch `development/website-mock-acceptance`. Local HEAD/status, remote branch, Stage 280 checkpoint, existing migration files, workspace service, engine generator, form validation, discussion rules, audit mapping and readiness plan inspected. Clean starting working tree; no history replacement.

## Grounded plan and implementation

The canonical service still loads one workspace, checks session actor/revision and executes the generated legacy engine. Discussion commands also affect project history, workspace audit and notification reconciliation. Separate discussion writes cannot safely be enabled merely by extracting message arrays. Continue the existing TypeScript/MJS, Drizzle and D1 architecture; do not introduce NestJS, another ORM or a backend rewrite.

This increment adds a default-disabled, read-only command rehearsal over Stage 280 staged copies. It has no writer dependency, active route, commit token or production bootstrap. The adapter calls the actual existing engine and form guards, rather than reimplementing access policy. The rehearsal reconstructs only an exact current copy, evaluates one command, rechecks source/copy/authority and returns a private-data-free summary. It does not save its proposed result or grant real institutional authority.

Implemented files:

- `command-domain.ts`: typed command validation, unique project lookup, lossless materialization and changed-field summaries. Domain imports no framework, ORM, driver or HTTP code.
- `command-ports.ts`: transition interface with private workspace input/output; future implementations must preserve observable behavior.
- `command-application.ts`: injected source-reader, staged-copy reader, authority, transition and digest ports. Default disabled; authorization precedes reads. Requires exact source revision, staged project identity, source digest and discussion checksum. A changed source, staged head or authority proof invalidates the advisory result.
- `infrastructure/legacy-command-adapter.ts`: maps typed inputs onto existing commands and preserves the current engine's permissions, participant outcomes, paused/cancelled restrictions, history, notifications and plan guards. Only this adapter knows the legacy command API. No database dependency in the application service.
- Existing Drizzle migration adapter gains an additive `readWorkspace()` method with generic error translation. Its previous selected-project reader is preserved. No table or migration is added.
- `fixtures/discussion-migration.mjs` extracts the existing shared fictional memory/SQLite fixture instead of duplicating it. Both old and new contracts use the same fixture and codec. SQLite files are new temporary databases with WAL, foreign keys and busy timeout, removed at fixture close. Hosted D1 is not claimed to use native SQLite connection flags.

## Proposed internal mapping

These are internal rehearsal commands, not a shared website contract or a new public API.

| Typed input | Existing command | Existing binding |
| --- | --- | --- |
| POST: text | sendMessage | Selected project supplied separately from trusted application scope |
| REPLY: text, threadRef, expectedVersion, expectedCount | replyDiscussion | Stable legacy/stored thread reference, current per-thread version and message count |
| SET_STATE: reason, threadRef, state, expectedVersion, expectedCount | setDiscussionState | Existing author/current-mentor rules, OPEN/RESOLVED only |
| Trusted authority actor | Engine actor | Never accepted from the command payload |
| Source workspace ID/revision | sourceFence | Same canonical revision required, including unrelated source changes |
| Current staged version | stagedRevision | Rechecked after evaluation; no historical copy over newer data |
| Before/after snapshot | SHA-256 digests and field names | Full proposed workspace remains internal; no message/reason/grade/private portfolio values in the returned summary |

New summary fields distinguish `discussionChanged` from `workspaceChanged`. A stale or already-satisfied discussion command may leave messages/events unchanged while the existing engine still reconciles notifications or normalizes source data. The full proposed workspace is compared against the unchanged engine in tests, including those effects. No new timestamp convention is imposed on legacy records; existing timestamps are preserved. Tests use an explicit fixed UTC clock only within their own process. Production time handling is unchanged.

## Automated evidence and findings

Final focused command checks: **31/31**, comprising 15 contract groups on each memory/Drizzle-SQLite implementation plus an actual SQLite missing-table error test. Stage 280 migration contract remains **25/25**. TypeScript and production build pass; command lines and exit codes are in `STAGE281_COMPILER.json`. Full regression: **74/74 PASS**, zero failures, with the original time limits (`STAGE281_REGRESSION.json`). Final focused/type/build rechecks and source-file SHA-256 values are recorded in `STAGE281_VALIDATION_FINAL.json`. The active workspace service, engine/generator, existing schema/migration and dependencies remain byte-identical to baseline. Credential-pattern scan and `git diff --check` pass.

Tests cover POST/reply/resolve and author/current-mentor reopen; exact full-workspace behavior including history/notifications; no persisted source/copy/audit changes from previews; repeated evaluation; no-op discussion decisions; paused/cancelled/withdrawn/former-mentor denial; cross-project references; forbidden scope and subjects; malformed/forged fields; missing/corrupt/stale copies; unrelated source changes; source, authority and staged-head races; and generic repository failures. Fictional grants only cover two fixture projects. Actual institutional department authorization is not wired or accepted here.

Two initial focused failures are retained. First, an assertion treated every workspace change as a discussion change; investigation found existing notification reconciliation on no-op commands. The summary now exposes both facts and retains whole-workspace parity checks. Second, a missing-table test accidentally removed its fixture authority store before reaching the reader; it was corrected to capture the fictional grant before fault injection, so the actual repository error translation is tested. Diagnostic data-URL module bodies in retained logs are replaced with `<compiled-test-module>` to avoid embedding repeated compiled source; failure messages and locations remain. No existing production rule or assertion was relaxed.

## Six-rule review and limitations

Domain/application/legacy infrastructure remain separate. Repositories use the existing ORM; database errors are translated there. Versioned JSON and stable identifiers are preserved; no SQLite JSON binary export or PostgreSQL JSONB compatibility is implied. Local tests use WAL; there is no new write transaction or longer lock. Ports can be mocked and are also exercised with real SQLite. Existing M&E calculations, other modules and the active storage service are not yet refactored by this step.

The rehearsal is an advisory observation with optimistic rechecks, not a transaction or a promise that nothing changes after return. Repeated runs can use new legacy timestamps; repeat evaluation is not durable command idempotency. No production command receipts, cutover, rollback writes, SQL migration, deployment, email or live integration are implemented. Current private workspace data is still read as a whole internally, and shared-root write contention remains. Capacity readiness for 10,000 accounts stays HOLD.

Next smallest task: define and validate the exact allowed command-effect set for discussion data, project history, root audit and notification reconciliation, including initialization effects. Then implement a disabled atomic commit/rollback rehearsal with source/authority fences and durable operation receipts before considering any active per-project storage switch. A future PostgreSQL adapter and Java/C# implementation must pass the behavior contracts and migration/recovery acceptance; translation is still real work.

The website integration roadmap and provisional specification dependencies remain unchanged. No website source/specification is copied or altered here. Existing Stage 278 registration operator work, reflection publication, approved completion-report PDFs, fallback reconciliation and MIS/SSO acceptance remain open. Official identity, consent, authentication, permanent URLs, synchronization semantics and cross-system acceptance still require the responsible teams. No live or full integration readiness claim follows from these local tests.
