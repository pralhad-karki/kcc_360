# Stage 225 — Disabled email delivery and receipt protocol

23 October 2026 · Asia/Kathmandu · Baseline 0e47c6af3958ee07e2c9aa94892b9ff741c26069 / published version 236.

## Scope

Added `server/reflection-email-delivery.mjs`, a server-side, default-disabled transition protocol following the existing website-delivery pattern: callers must persist returned data with workspace CAS/audit before using any prepared transport request, and reload before applying receipts. The module makes no network calls. No mail transport, scheduler, worker, receipt endpoint, sender secret or institutional source is installed or activated.

The protocol is not wired to a production runner yet. Its normalized receipt format is an internal adapter contract, not a claim that an unselected mail vendor supports that exact format. A future adapter must authenticate real provider events and translate them into this contract. The fixture's signed receipts are synthetic developer evidence, not actual delivery evidence.

## Behavior implemented

- Disabled begin returns no send request and leaves data unchanged. Enabled configuration requires institutional/workspace/transport/sender scope, a private receipt-authentication secret and an explicit provider idempotency guarantee. These are server inputs, not request fields.
- Before a pending/retry job can start, the protocol reuses the registered-contact policy against the current approved registry and current reflection version/time. Contact address/record version, guardian relationship, consent, source approval/version, person mapping and immutable message content must match the queued intent. A change invalidates the pending job; it never silently retargets an email.
- Starting returns a cloned state with IN_FLIGHT, a unique attempt, fixed payload digest/target and 30-second lease. The returned request contains only the intended recipient, minimal appreciation template and internal message/attempt/idempotency identifiers. The receipt secret is never serialized.
- An active attempt cannot be started again. A timeout or expired lease becomes UNCERTAIN; even a much later call does not blindly resend. Reconciliation is required.
- Authenticated ACCEPTED is distinct from DELIVERED. BOUNCED is retained as a separate terminal outcome. Only an authenticated REJECTED_NO_SEND proof can permit a retry, with 30/60-second backoff and at most three total attempts. All attempts retain the same provider idempotency key and payload digest.
- Receipt verification binds exact field shape, HMAC, workspace, transport, sender, job, attempt, key, digest, provider message identity and canonical timestamp. Duplicate identical receipts are idempotent. Conflicting/reused receipt IDs, cross-message provider identities, forged signatures and changed payload/target are rejected.
- Late acceptance does not downgrade delivery. Terminal delivery/bounce facts follow provider event time; conflicting terminal facts at the same timestamp leave an uncertain state requiring reconciliation. No known accepted/delivered job is blindly retried.
- Existing attempts, events and receipts are retained. Queue/recipient/history details remain excluded from every role's workspace projection. No assessment, academic completion, sharing consent or reflection content is changed by the protocol.

## Verification

`check-reflection-email-delivery.mjs` passes with actual pending intents generated through the Stage224 reflection save service and fictional registered .test contacts. It covers disabled/unconfigured behavior; request minimization; immutable source/target revalidation; active/expired attempts; uncertain outcomes without retry; signed acceptance/delivery/bounce/no-send receipts; exact duplicate and conflicting/out-of-order history; sender/transport/workspace/attempt/key/digest/provider-ID/timestamp/signature denial; cross-recipient receipt/provider-ID reuse; consent/contact/guardian/source/submission/content changes; and bounded retries/backoff with the same key and payload.

Its isolated SQLite helper demonstrates the existing CAS/audit-before-transport pattern: a failed audit or lost CAS leaves the workspace payload unchanged and the mock send counter at zero. A successful persisted attempt increments only a mock counter. This demonstrates the intended integration contract; it is not a production runner implementation and sends no actual email.

Existing reflection-email save/policy, actual workspace route, reflection sharing and server checks pass. TypeScript no-emit and production build pass. Diff whitespace check passes. No browser preview was started: this is a disabled internal protocol with no new browser UI or live delivery surface. No browser or institutional acceptance is claimed.

## Pending and next bounded task

Completed: delivery/receipt/retry state transitions and registered-contact/message revalidation, with targeted tests. Partial overall feature: automatic registered-email appreciation. Production staging and delivery remain disabled, and there is no real email acceptance/delivery evidence.

Next bounded task: connect this protocol to a disabled server-side runner that atomically persists attempts/results before/after a provider call, uses approved source reloads, and reconciles unknown outcomes without replay. Test it with an injected fake transport and real SQLite failures. Live activation requires the designated contact authority, communication policy, approved mail service/sender, idempotency guarantees and authenticated delivery/receipt contract. Do not invent endpoints or send through personal accounts.

No schema/migration, database reset or architecture replacement. Stage222 sharing remains available any time after submission. Link-visitor replies remain disabled. E-Digital Nepal MIS boundaries, role permissions, retained academic history, individual/whole-activity verification separation and Left College-only semester progression remain unchanged. Existing institutional integration and accessibility acceptance blockers remain unchanged.
