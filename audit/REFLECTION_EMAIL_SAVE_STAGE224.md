# Stage 224 — Atomic reflection save and private email queue

23 October 2026 · Asia/Kathmandu · Baseline be7544663bea0db083cfaa65c6deec85c5a0bdcc / published version 235.

## Completed change

The existing workspace execute service now accepts an optional server-only reflection-email runtime. The workspace HTTP route supplies the new default-disabled runtime from its composition root. Request JSON cannot supply this runtime, enable flags, contact snapshots or recipients.

Only a changed submitReflection result invokes the hook. In an explicitly configured fixture, it loads the approved registered-contact snapshot, prepares the Stage223 minimal student/guardian appreciation intents, reloads the snapshot, checks it is unchanged and rechecks current time/permissions. It stages pending intents in the same JSON payload as the new reflection. The existing workspace revision compare-and-swap and audit batch commit that single payload; there is no second queue save and no mail call.

Default configuration has no provider installed and queues nothing. Enabling a runtime requires a server-supplied institution and registered-contact provider. The internal provider contract is not an implemented or inferred E-Digital Nepal endpoint. Existing registration/identity/guardian/communication-permission checks are reused without accepting demo names or user-entered email as trusted contacts.

The hook returns only status and count (DISABLED, BLOCKED, QUEUED or ALREADY_QUEUED), plus a bounded reason for blocked preparation. Registry exceptions are not exposed. Missing, unavailable, changed or expired contacts leave the student reflection save intact with no new queued email. The runtime prepares additions in a separate local copy before attaching them, preserving any existing pending jobs if preparation fails. No email is labelled sent or delivered.

A submitReflection update additionally checks the current server demo-session actor inside its SQL update predicate. An account switch between preparation and commit therefore cannot save an old-account reflection or its queue, even if the workspace revision did not change. Existing command allowlists, form validation, owner authentication, same-origin checks and role/source guards remain in place.

Queue addresses and metadata remain excluded from every role's workspace view; the normal save response contains only scoped data and the small queue-status summary. No reflection text, scores or mentor feedback enter the mail templates. Genuine revisions create distinct version-bound intents; retrying the old successful-save request fails its existing revision check and creates no duplicate job.

## Verification

`check-reflection-email-save.mjs` uses the actual transpiled workspace service, real workflow engine, registered-contact policy/runtime and in-memory SQLite migrations. It passes:

- Default-disabled save, without source-provider calls or outbox creation.
- Approved fictional source: one commit stores reflection v1, two PENDING intents and one audit row. The scoped response contains no email addresses or outbox.
- Stale retry creates no additional work; a genuine reflection v2 preserves v1 and adds only its two new intents.
- Forged form recipients are denied; extra request-body runtime/enable/recipient data cannot activate the server composition.
- Source exception, missing source, changed consent/source version and expiry between reads still save the reflection without new queued mail.
- Audit insertion failure rolls back both reflection and queue in the actual service transaction.
- Account switch immediately before the batch, or a competing workspace revision, rejects the save without inserting a queue or audit row. The competing actor/session/revision change itself is retained as the winning external event.
- Unrelated discussion commands do not call the reflection-email hook.

Existing policy, actual workspace HTTP route, server, achievement/reflection sharing, reflection-share client and sync checks pass. The route fixture's transpiled import map was updated for the new server runtime module; no policy assertions were removed. TypeScript no-emit and production build pass, as does diff whitespace validation.

This is server-path work with a disabled production feature and no UI flow change. No preview/browser acceptance was run or relabelled for this checkpoint. No actual email, provider API, live database record, schema/migration or institution access setting was changed.

## Remaining production work

The atomic hook is implemented and tested; automatic registered-email appreciation remains incomplete as a whole. No contact provider or mail transport is installed, and the runtime remains disabled. Future delivery must revalidate pending recipient/contact/guardian/consent/source versions, handle retry and uncertain outcomes idempotently, and record accepted/delivered/failure receipts separately. Blocked preparations currently return a save-status summary; there is no reconciliation scheduler or automatic later backfill.

Next bounded task: implement the disabled delivery/revalidation seam and targeted attempt/receipt/retry tests. Live activation still requires an approved institutional registered-contact source, communication policy, mail sender/service and its delivery/receipt contract. Do not invent those endpoints or silently send through a personal account.

Stage222 student-controlled sharing remains available anytime after submission. Link-visitor response code remains disabled. E-Digital Nepal ownership, approved SRS/workflows, role dashboards, preserved academic history, task/activity completion separation and Left College-only bulk progression are unchanged. Existing institutional integration and full accessibility acceptance blockers remain unchanged.
