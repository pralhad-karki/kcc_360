# Stage 273 — progressive integration audit and plan

Baseline inspected: main, 3d3f59f06db37ae21ac9b7ab2149e5fea6d10bb5, published v284 / Stage272. Clean checkout. Existing drizzle migrations 0000/0001 preserved; no migration will be added or applied. Historical Stage272 evidence: 66 regression groups; this stage reruns them.

Website specifications located in /workspace/scratch/c396ed34321c/website/production and copied unchanged under audit/integration-v1 for reproducibility. v1 remains provisional. No live transport or production migration.

| Area | Existing code | Increment / dependency |
|---|---|---|
| Events/public release | engine + activityWebsiteDraft, independent scoped review, immutable deliveries | Reuse canonical project ID and exact approved public content; adapter must not treat legacy PUBLISH receipt as draft receipt |
| Persistence/audit | kcc_workspaces revision CAS + kcc_server_audit transactional batch | Reuse storage pattern for private v1 outbox; no new event or student table |
| Website draft/status | Older website-delivery-protocol handles only PUBLISHED/REMOVED | Separate v1 receipt/current status; website UUID and relative URL separate from source ID |
| Registration | existing participation, external participants and MIS identity services | Later: full-refresh staging, opaque participant mapping, cancellation exceptions; never infer attendance |
| Reflections | verification, consent, editorial release, portfolios and delivery records | Later: exact public projection and revocation; source evidence must not become website approval |
| Completion PDF | reports/evidence workflows and private files | Later: confirm canonical report approval/checksum and source evidence mapping; no invented approval |
| Fallback | No v1 reconciliation client | Later: explicit authorized stable-ID binding; no title matching |

Sequence: (1) disabled/mock-only event adapter + persistent retry/status history, (2) actual producer/website consumer acceptance + scoped operator controls, (3) full-refresh registrations with agreed identity map, (4) reflection release, (5) approved PDF package, (6) fallback reconciliation. Expand only when source and identity prerequisites are proven.

Field mapping: project.id → source_id and kcc360_event_id; existing delivery.id → local source delivery reference; distinct durable UUID → request_id and Idempotency-Key; monotonically sequenced outbox version → source_version; approved listing title/description/venue + reviewed category/palette mapping and explicit zoned dates → allowlisted payload. Website UUID, website revision, canonical_path and public_url are response fields, never source approval. Existing listing version retained separately. Eligibility evidence requires explicit trusted mock release configuration; not inferred from a plan APPROVED label. No automatic timezone/category defaults.

Important semantic gap: v1 withdrawal is a permanent source tombstone. A normal correction must be a higher-version upsert, NOT a withdrawal of the earlier listing. Reinstatement after withdrawal is blocked pending an agreed contract. v1 has no rejection status or response sequence token; model rejection as a rejected request, retain diagnostic code, and do not invent a shared status. Status polling/authentication and same-version out-of-order response semantics need coordination.
