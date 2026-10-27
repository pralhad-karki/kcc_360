# Stage261 — official manual MIS student foundation

## Checkpoint and inspected coverage

Started from clean a022b0f542f9286c9075bc58bbfa8cf6fb725f7e; Sites confirmed latest version272. No database mutation was performed in development or publication. Existing source/architecture, approval locks and owner authentication are retained.

| Confirmed requirement | Existing coverage | Stage261 / remaining work |
|---|---|---|
| Official student master import | Known-student academic placement CSV only; fictional MIS adapter explicitly restricted | New normalized student reconciliation and transactional save service; no live upload route yet |
| Configurable actual-export mapping | Existing plan/task CSV and XLSX-specific pilots | CSV student header/status mapping with version; vendor mapping needs actual headers; Excel student decoding pending |
| Stable identity | Strict fictional MIS mappings | Source + institution + stable student ID, preserving leading zeros; no name/email merge |
| Preview and errors | Domain-specific existing preview flows | New/changed/unchanged/duplicate/invalid/conflicting student rows; all blocking rows prevent entire commit |
| Provenance and confirmation | Existing workflow audit | File text UTF-8 SHA256, filename, export time, server processing time, actor, mapping snapshot/version, full/incremental declaration, counts, preview digest, exact confirmation, private before/after report |
| File upload/private retention | Existing R2 file controls in other workflows | No original student file upload/retention added. Processing time is not labelled upload time. Upload timestamp/bytes/private retention policy must be implemented in transport increment |
| Missing/stale/repeated records | Existing mock cohort protections | No missing-row actions; stale/same-time conflicting values blocked; unchanged newer observations advance watermark; exact receipt replay plus no duplicate students on new operation |
| Correction and history | Existing learning snapshots | Correction is a newly confirmed later-source import; append-only before/after reports. Equal-time contradictory corrections require future explicit reconciliation; never force overwrite |
| Authorization | Existing owner-only service and disabled institutional provider composition | Save requires server-trusted scoped identity/permission and authority fence, rechecked twice; no route or browser authority accepted; live staff provider still pending |
| Atomic save | Existing D1 workspace CAS + audit batch | Reuses tables in isolated institution ledger, one CAS/fence guarded D1 batch with audit. Audit failure rolls back all writes |
| Structures/enrollment/faculty | Fictional adapter and existing course/planning references | Real normalized schemas, history stores, parent mapping and import services pending |
| Official status/exit | Fictional status and local progression workflows | Mapped status/validated effective date imported as data only; ambiguous/undated exit blocked for resolution, no automatic account/progression side effect |
| Direct academic assignment vs clubs/proposals | Stage260 department/mentor task CSV and existing distinct routes | Preserved unchanged; current roster references remain demo/local, not official imported rosters |
| Strategic/task uploads/approved locks | Existing plan import pilots and guarded approval/amendment services | Preserved; full official stable-ID import chain and institutional activation remain incomplete |
| Cohort progression | Mock cohort ledger and known-student placement | Preserved; official enrollment/local progression overlay and later-export reconciliation pending |
| API transition / authentication | Disabled official adapter; independent approved auth boundary | New normalized service independent of transport and fixtures; no vendor API/SSO added |

## Implementation boundary

`server/mis-manual-import.mjs` is a pure validation/preview/commit-preparation service. `server/mis-manual-save.mjs` supplies durable D1 transaction logic through trusted dependency injection. Server configuration is disabled by default. There is deliberately no request endpoint, UI, automatic ledger provisioning, official adapter activation, production fixture seeding, or personal-data upload in this increment. This is tested backend foundation, not a completed institutional importer.

Institution ledger ID is `KCC-MIS-STUDENTS:<institutionId>`, separate from KCC-OWNER-DEMO. Existing generic workspace views do not read this ledger. Future provisioning must occur only under approved institutional configuration and authorization. No SQL migration is required for this bounded increment: it uses existing workspace/audit tables without altering existing rows. No original CSV content is persisted; mapped student data and before/after report entries are sensitive and must stay in this server-private ledger. UTF-8 text hashing is implemented; real file byte/decode validation remains part of transport work.

A trusted provider must resolve current authenticated subject/person, institution/source scope, approved permission, expiry and authorization-fence revision, and advance the fence for relevant revocations. This service is not an identity provider. A request must not supply these trusted values. Only explicit mapped fields are imported; unused role/password columns have no effect. Omitted optional status/exit fields preserve prior values rather than clearing them. Exit dates are not interpreted into progression exclusions by this service.

Atomicity relies on the existing D1 transactional `batch` contract; SQLite-backed tests execute the exact SQL statements in a transaction. Reports retain raw mapped before/after student fields privately; the generic audit row contains counts/fingerprint/reference, no names. Ledger bounded at 2MB and batch at 1,000 rows / 250KB CSV; growth fails before writes and will need a separate indexed history migration for institutional volume. Do not present these bounds as institution-wide scale validation.

## Verification

See STAGE261_MIS_TEST_OUTPUT.txt for focused parser/reconciliation/SQLite transaction cases and STAGE261_REGRESSION.json for existing workflow groups. TypeScript/build and final git whitespace checks are recorded at closeout. All new test data is explicitly fictional and isolated in in-memory SQLite; no real MIS exports, institutional login, browser file upload, production migration or live personal-data commit tested.

Next increment: protected upload/staging transport with actual-byte provenance, private retention, approved staff-loader composition and Excel reader reuse. Then normalized academic structures/enrollment/roster history and local-progression reconciliation. Actual MIS headers and institutional staff identity/permission mappings are dependencies for affected live activation, not for continuing independent backend work.

Closeout: 22 focused cases PASS; all 47 existing workflow groups PASS. The new focused group was registered in the runner after that broad run began, so its evidence is separate. TypeScript and bundle build PASS; final packaging repeats the build. No new browser UI was added, so no browser upload acceptance is claimed.
