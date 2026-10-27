# KCC Website — progressive integration report, Stage 91

27 October 2026, Asia/Kathmandu. Application: existing KCC Dynamic Website, branch `development/cms-foundation`. KCC360 remains a separate application. This work supersedes the previously planned scheduling increment for Stage 91.

**State: progressive mock integration implemented locally; shared-contract confirmation and integrated acceptance pending.** This is not live integration and is not labelled “Integration-Ready — Pending Cross-System Testing”: the specification remains provisional and several UI, identity and policy dependencies remain open.

## What already existed

- Existing CMS revisions, departmental permissions, independent editor → verifier → publisher route and immutable audit.
- `eventDrafts`, stable website event pages, T05 directory with name/date/search/filters, four validated palettes, reviewed event lifecycle and manual-source event creation.
- Private uploads/quarantine, trusted scanner interface, separately reviewed website PDF copies, source-version reconciliation and immutable withdrawal history.
- Public Node/D1 projection gates, private saved-revision previews and mock notice adapters. KCC360 remains responsible for planning, participation/contribution verification, portfolio linkage and execution-team PDF submission.

Detailed responsibility audit: `STAGE_91_INTEGRATION_GAP_MATRIX.csv`. Original SRS/185 requirements and earlier checkpoints were retained; this matrix is an integration delta, not a replacement SRS.

## Implemented independently now

| Workflow/interface | Local result |
| --- | --- |
| Approved source event → website draft | Signed mock v1 package creates an existing event draft and separate website event UUID. Incoming source ID is retained; a stable public path is reserved. No automatic publication. |
| Website approval → status/URL | Existing release evidence, independent verification and publishing are reused. Signed status queries return current CMS state, website ID/revision and a relative public URL when the destination reader is enabled. |
| Updates and withdrawals | Higher source versions create new drafts and hold stale public content. Old source versions do not replace current state. Withdrawal tombstones prevent delayed upserts from resurrecting content. Event withdrawal/unavailability holds related public reflection/report content. |
| Registration | Mock-only public registration endpoint uses a trusted server identity resolver; capacity/deadline and duplicate prevention are atomic. Owner cancellation is idempotent. No name/email/phone collection was added. |
| Registration exchange | Scoped signed export returns bounded pages of opaque participant references, website event IDs and registration/cancellation states. This is a full refresh interface, not a durable incremental change feed. |
| Reflection package | Source reflection/portfolio IDs remain private. Eligible signed source text becomes an existing T01 draft. Independent website consent, privacy and release references plus existing verification/publishing are required. No student evaluation/portfolio engine was created. |
| Completion PDF | Signed package validates stable report ID, size, canonical base64 and SHA256. Operator import reuses private uploads/quarantine and existing report service. Independent scanning, four-domain/privacy/rights checks and publication remain mandatory. Repeated import reuses the existing staged upload. |
| Administrator fallback | Existing manual-source event creation remains. An approver can bind an existing manual website event to a source ID without creating another event. Conflicting source/website bindings fail closed. |
| Independent mock peer | In-process signed adapter and loopback HTTP tests simulate unavailable services and retries. There is no configured remote host, outbound synchronization or supported live mode. |

The service entry points are in `integration-v1/service.mjs`. Public candidate interfaces are in `integration-v1/http.mjs`. Administrative reconciliation, registration configuration, reflection release and report import currently have explicit service methods exercised by tests; they are not yet connected to a complete CMS integration workspace. General existing CMS controls do not silently perform this source reconciliation.

## Proposed contract and field mapping

Machine-readable files: `integration-v1/openapi.provisional.json` and `integration-v1/publication-package.schema.json`. Contract version is `v1`; approval state is **provisional-pending-both-teams**. Website route names are proposed candidates, not assertions about actual KCC360 endpoints.

| Proposed shared field | Website mapping / boundary |
| --- | --- |
| `request_id` + `Idempotency-Key` | Immutable receipt bound to canonical package hash; conflicting replay returns 409. Same request/key/hash returns original outcome plus current status. |
| `record_type`, `source_id`, `source_version` | Separate event/reflection/report identities and monotonic source updates; never match by name/email. |
| `kcc360_event_id` | Parent source identity. Event `source_id` must equal it. Maps to existing `event_pages.source_record_id` for controlled imports, or an explicit fallback binding. |
| `website_event_id` | Existing website event UUID, separate from KCC360 identity. Unique event binding prevents duplicate reconciliation. |
| `canonical_path`, `public_url` | Reserved permanent website-relative path; public URL is null until current publication and an enabled reader exist. Absolute public origin remains a joint decision. |
| `reflection_id`, `portfolio_reference` | Private linkage only. Website stores public text projection; KCC360 retains verification and portfolio ownership. |
| `report_id`, `sha256`, `pdf_base64` | Source report identity/checksum transferred to existing `event_report_pdfs.source_report_id/source_version` and private upload record. Inline base64 is a bounded mock-transfer candidate, not the agreed live transport. |
| `eligibility` | Signed source attestations of verification, consent and release, with evidence reference. These do not replace website authorization or public consent/rights review. |
| `occurred_at`, event timestamps | Explicit ISO timestamps accepted and normalized to UTC. Existing IANA event timezone is retained for display. No naive local timestamps accepted. |
| `participant_reference` | Opaque verified registration subject reference. Actual MIS/student identity mapping remains unconfirmed; no typed identity claim is trusted. |

Existing website editorial, event calendar/lifecycle and report status vocabularies are documented separately in the OpenAPI extension. Event calendar position never proves execution completion. No unconfirmed source status is translated into website completion evidence automatically.

## Security and privacy

- Standard configuration is disabled. Only `disabled` and `mock` modes exist; `live` is rejected.
- Candidate server authentication uses body-bound HMAC-SHA256, key ID, method/path/query, timestamp and idempotency key; five-minute clock skew window and server-owned scopes. Keys are passed in memory. Production TLS, credential ownership, rotation, replay retention and final mTLS/OAuth/HMAC selection need joint approval.
- Source `publication:write`, `publication:read` and `registration:read` scopes are distinct. Public registration uses a separate trusted identity callback; clients cannot supply a verified identity in their request body.
- Department staff and independent publisher controls are reused; no real staff grant or institutional identity was provisioned. Website source-service editor configuration is trusted server configuration, not caller-selected department authority.
- Reflection release checks are immutable. Report PDFs remain quarantined until existing scan/review controls pass. No public storage path, source evidence, contact data or portfolio record is returned by public pages/status projection.
- Node, D1 public readers, event directory/report links and PDF byte retrieval honor integration holds. Retained old URLs do not bypass source withdrawal.
- Source integration payloads, including mock PDFs, are private staging data. Retention, encryption/backup ownership, source attestations, consent expiry and deletion/legal-hold policy are unresolved production requirements.

## Test evidence

See `stage91-tests.txt`, `stage91-contract-results.txt`, `stage91-emulator-results.txt` and `stage91-preservation-results.txt` for final counts and complete outcomes. The contract verifier uses installed Ajv 2020 + ajv-formats solely as test dependencies; it imports no KCC360 application implementation.

Tests cover signed loopback delivery, approved-source event draft, independent website release, returned public path resolving over HTTP, consent rejection, department/role denial, duplicates/conflicts, stale updates, correction holds, withdrawal-before-arrival, delayed revival refusal, unavailable-peer retry, registration capacity/owner cancellation/export scopes, PDF checksum/quarantine/review/withdrawal, transactional audit failure rollback and persistence after reopen. They run with fictional events, identities, reflection links and PDFs.

This is independent mock testing. Actual KCC360 service, real keys, hosted identity/storage/scanner, browser CMS integration UI, cross-system fault/replay tests, performance/load, mobile and institutional acceptance were not exercised.

## Coordination and integrated testing still required

1. Both teams confirm the same v1 identifiers, payloads, status/eligibility meanings, error envelope, source version/correction/withdrawal semantics and contract-change procedure. The current files must be reviewed by KCC360 before compatibility is claimed.
2. Agree identity issuer/mapping for registration participants and student reflections; eligibility/payment/waitlist, privacy/consent/guardian rules; authoritative event completion and report-source release contracts.
3. Confirm URL base, reflection localized URLs, manual fallback ownership/reconciliation decisions and duplicate handling across both real stores.
4. Confirm authenticated transfer method, scopes, credential rotation, TLS/audience binding, time skew/replay retention, PDF transfer and private-storage/retention policies.
5. Wire the current service methods into authorized CMS controls and the registration frontend. Connect configured identity/provider adapters only after approved sandbox access. Production synchronization remains off.
6. Run actual producer/consumer contract tests, signed sandbox exchanges, browser operator approval, failed-delivery/retry, revocation/correction propagation, registration refresh/cancellation, report scan/publication and rollback tests. Approve migration deployment before changing a hosted database.

## Next smallest implementation task

Add a scoped **Source publication requests** panel to the existing CMS that shows the source/website binding, request/current status and pending revision, and calls the existing source-aware website publication service after independent verification. Start with events only; retain the already passing mock contract and default-disabled ingress. This makes the simplest workflow reviewable through CMS controls before expanding the integration UI.
