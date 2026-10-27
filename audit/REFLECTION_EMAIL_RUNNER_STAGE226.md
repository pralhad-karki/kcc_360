# Stage 226 — Persisted email runner with injected providers

23 October 2026 · Asia/Kathmandu · Baseline dbadba014fdfb86c78811a748db7124e2074f033 / published version 237.

## Completed implementation

Added an internal disabled-by-default runner and an adapter for the existing workspace/D1-style SQLite persistence model. There is no new database schema, HTTP route, browser authority, scheduler or transport implementation. The default runner has no store or providers installed and performs no I/O.

An explicitly enabled server composition requires scoped configuration, provider idempotency support, receipt authentication, a store, an approved registered-contact loader, a send adapter and a lookup adapter. Those interfaces are server injection boundaries, not client form fields or an invented E-Digital Nepal/mail-provider API.

`server/reflection-email-store.mjs` uses the existing workspace revision/commit ID/audit batch. It checks expected revision, preserves every non-email field, preserves other jobs, rejects immutable recipient/content/identity changes and binds the worker update to one existing intent. Worker audit records contain intent IDs and generic operation labels, never contact addresses or message content. Queue details remain excluded from every role's workspace view.

`server/reflection-email-runner.mjs` loads current state and approved contacts, checks contact-source stability and asks the Stage225 protocol to prepare an attempt. The attempt and audit entry must commit before the transport adapter is called. Lost CAS or audit failure stops before invocation. Two concurrent workers cannot both invoke transport for the same pending claim.

After the claim commits, the owning worker reloads state, loads contacts again, reloads workspace state after that asynchronous contact read, and revalidates the exact queued recipient/source/message and current lease. Source/submission/consent changes cancel before invocation. A temporary post-claim source outage or expired lease can record a bounded retry with positive local evidence that the owning worker has not called transport. That cancellation method is used only by the process that just committed its new attempt, before its local transport call. Existing uncertain attempts are never cancelled as if known unsent.

Transport exceptions, malformed/unbound responses or unauthenticated results leave an uncertain outcome. Result-persistence failures also require reconciliation. The runner performs provider lookup on the existing idempotency key/attempt and applies authenticated receipts without invoking send again. No lookup evidence is not treated as proof of non-delivery. ACCEPTED remains distinct from DELIVERED. Signed no-send receipts permit bounded due retries with the same key and payload.

Receipt CAS conflicts are retried up to three times by reloading and reapplying only the receipt transition; the transport call is never replayed. Exact repeated receipts remain idempotent. A reply scoped to another message/attempt/key/digest cannot be applied as this send's response. A trusted future receipt adapter may call the internal receive method; no public callback endpoint exists in this checkpoint.

Runner metadata uses transportInvoked rather than sent: a called adapter may have an uncertain outcome, so it must not be labelled delivered or even assumed accepted. Exceptions/secrets/raw contact data do not enter returned status summaries.

## Targeted evidence

`check-reflection-email-runner.mjs` generates actual pending intents through the existing reflection-save service, then exercises the real new store and runner against in-memory SQLite and injected fictional providers. Provider calls are local test functions only; no actual email is sent.

Passing cases include default no-I/O behavior; provider invocation only after a persisted attempt and audit; academic/recipient/other-job immutability; claim-audit rollback; lost claim CAS; timeout/reply loss resolved by authenticated lookup without resend; absent lookup evidence held uncertain; signed no-send due retries with stable key/digest; two workers sharing one pending job; receipt-audit failure and later reconciliation; receipt-only CAS recovery; pre-claim missing/changing contacts; post-claim permission change, workspace/reflection change during contact loading, temporary source failure and lease expiry; cross-message/malformed replies; private queue projection and absence of receipt secrets in stored data.

The Stage225 protocol gains revalidation and a narrowly scoped owned pre-send cancellation transition to support those actual runner cases. Its original delivery/receipt/backoff tests still pass. Existing atomic reflection/email-save, workspace HTTP route, server and reflection-sharing checks pass. TypeScript no-emit, production build and diff whitespace checks pass.

No browser QA was run for these disabled internal modules; no browser or institutional delivery acceptance is claimed. The source/workspace reload sequence reduces stale preparation risk but is not a distributed transaction with an external contact authority or mail service. A real provider integration must honor the stated identity, idempotency and receipt contract.

## Current status and next requirement

Completed: guarded save/outbox preparation, delivery-state protocol, persisted attempt/result runner and actual persistence/fake-provider tests. Actual automated registered-email appreciation is still incomplete and disabled. There is no installed institutional contact source, real sender/transport, authenticated receipt endpoint, operational scheduler or actual delivery evidence.

Next bounded task: prepare operational readiness and delivery-monitoring controls for pending/blocked/uncertain/failed messages, while preserving role privacy. Live activation additionally requires the approved institutional registered-contact source and communication policy, chosen mail service/sender, provider idempotency/lookup guarantees, authenticated callback/receipt mapping and operating schedule. Do not fabricate contact records/endpoints or send through personal email accounts.

Existing reflection sharing remains available any time after submission; full reflection disclosure stays separate from minimal appreciation mail. Link-visitor replies remain disabled. Architecture, schema/history, role permissions, E-Digital Nepal MIS ownership, individual/whole-activity verification separation, institutional acceptance blockers and Left College-only bulk progression remain unchanged.
