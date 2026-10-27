# Stage 273 — KCC360 → KCC Website progressive integration

27 October 2026 (Asia/Kathmandu). Baseline main commit 3d3f59f06db37ae21ac9b7ab2149e5fea6d10bb5, Version284 / Stage272. Source snapshot and existing migrations inspected; no production database operations, schema changes, live synchronization or credentials.

**Local mock workflow verified — cross-system acceptance pending.** This label covers the bounded event service workflow only, not overall integration readiness.

## Delivered

- `STAGE273_INTEGRATION_PLAN.md`: implementation audit, reuse map, ordered increments and provisional field mapping.
- `server/website-v1-mock.mjs`: disabled by default, accepts only explicit mock mode and owner-demo workspace; no endpoint, background scheduler or live networking. Uses existing engine approved activity-listing/delivery records. Source event and listing approval remain untouched.
- Distinct source event, request, existing delivery/listing version, monotonic transfer version, website event and URL fields. Public packages allowlist approved event text; no members, student identities, evaluations or portfolios are exported.
- Durable private outbox and source-side audit use the existing workspace CAS and transactional server-audit tables. Lease-before-send, immutable request reuse, retry after lost acknowledgement/reopen, correction versions and withdrawal history. No new module/application or migration.
- Explicit trusted fictional scope and release providers; consent is rechecked before send. Timestamps must agree with the approved local dates/times and timezone. No default category/timezone or real permissions inferred.
- Website receipt/draft/published/withdrawn states remain separate from source approval. Exact request, source/version and website-binding checks; relative public URLs only. Unsafe/foreign/stale responses cannot update the projection. The same durable request is replayed to retrieve current website state; no unsolicited callback is exposed.
- Correction supersedes the old transfer but does not send a permanent withdrawal. Withdrawal is terminal under the current website contract and clears cached URLs; later responses cannot revive it.

## Evidence

`STAGE273_MOCK_TESTS.txt`: 19 grouped checks against a bounded mock.
`STAGE273_CONSUMER_TESTS.txt`: the same 19 grouped checks against the actual website `production/integration-v1/service.mjs`, using separate temporary SQLite databases and fictional approved KCC360 records. Consumer creates its existing private CMS event draft; its existing editor/verifier/approver workflow independently publishes. Incorrect website department is rejected. No website source files changed.

Includes disabled/live-mode rejection, scoped actor denial, unapproved/tampered source rejection, consent denial/revocation, schedule mismatch, atomic audit rollback, CAS conflict, duplicate enqueue, timeout, stale/foreign response rejection, unsafe URL rejection, lost response then process/store reopen retry, one website event, independent publication, rejection, higher-version correction and same website identity, delayed response after withdrawal, terminal withdrawal and canonical source preservation.

These are service/database tests, not browser or hosted Worker acceptance. Optional consumer run:
`KCC_WEBSITE_SOURCE=/absolute/website-checkout node check-website-v1-mock.mjs`
Self-contained run: `node check-website-v1-mock.mjs`.

## Contract provenance and coordination

Copied unchanged website artifacts live in `audit/integration-v1/`; the website specification remains provisional. No alternative shared contract was introduced. OpenAPI SHA256: 36c234d0e06ba72dab436d9be631f5d9f4c858b2a23f9073800a6a73e78b0906. Publication schema SHA256: f2a431d238da3c3968976cae3a03954c85a0eebe3a23862a80fe0076992bf2e5.

Still jointly required: authentication/signing and trusted staff scope/fence integration; identity issuer and participant mapping; consent/guardian evidence and revocation rules; publication URL origin; response sequence/rejection vocabulary; withdrawal/reinstatement semantics; agreed registration full-refresh snapshot consistency; PDF storage/scan/transfer/retention; source completion attestation and explicit fallback reconciler authority. Mock authorization callbacks are not production institution permission adapters.

## Partial and not run

Event path is a local composition service, not a staff upload/publication UI or hosted integration route. No production permission configuration, migration, authentication, transport, outbound connection or synchronization activated. The production application remains independent of website availability.

Registration sync, reflection packages, approved completion PDFs and fallback reconciliation are NOT implemented in this increment. Existing source participation, reflections/portfolios and report capabilities remain intact, but their authoritative identity/release mappings are not sufficient to safely connect those later paths yet. Reconciliation authorization/conflict tests therefore remain not run on KCC360. Cross-system signed HTTP/Worker and browser journeys, public URL routing, load/fault/replay testing and institutional acceptance are still pending. Full AT-ECO journeys are not claimed.

## Next smallest task

Add an authorized mock operator/status view over this existing event adapter, with trusted actor/department and release-evidence providers, then run the KCC360 frontend → backend → website mock CMS approval → returned URL journey. Keep live mode absent. Next, agree opaque registration identity mapping and implement staged full-refresh reconciliation into existing participation without creating students or attendance verification.

Final verification: 67/67 regression groups passed, zero failures (`STAGE273_REGRESSION.json`). Final focused runs passed 19/19 groups for each consumer after added response/supersession guards. TypeScript passed. Production build passed. No browser tests run in this service-only increment. Saved development checkpoint only; hosted version and hosted databases are not changed by this stage.
