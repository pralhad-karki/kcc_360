# Stage 223 — Registered-email appreciation foundation

23 October 2026 · Asia/Kathmandu · Baseline 42b7797895355ca75e96103103f63d216f586eac / published version 234.

## User steering and current behavior

The user clarified that appreciation/acknowledgment should be automatic through email addresses registered in the system. The source inspection found in-app notifications but no connected registered student/guardian email authority or mail transport. Stage222 student-controlled reflection sharing remains available immediately after submission or later.

The first bounded task is the internal registered-contact/message/deduplication policy. Actual email sending is not implemented or enabled in this checkpoint. It is not a ChatGPT scheduled task and no email tool or external messaging service was used.

## Foundation implemented

`server/reflection-email.mjs` defaults to disabled. Its pure planning helper consumes before/after submission state, institutional/workspace context and a server-supplied approved registration snapshot. No request route accepts this registry or an enable flag. The snapshot structure is an internal adapter contract for tests and future composition, not a claim about an E-Digital Nepal API.

With explicit isolated configuration, it requires a new own reflection version, current approved registration source and a single verified actor/person link. A registered contact needs a valid verified address record, current period and purpose-specific communication permission. Guardian contacts also need a verified institutional relationship and relationship version. A self-declared relationship or typed email address cannot qualify. Ambiguous current contact records are skipped; missing/invalid guardian records do not invent recipients or stop a separately eligible student message.

Separate student and guardian appreciation messages contain no reflection text, grades, assessment feedback, public link, files or other recipient address. The student wording says that sharing is available now or later; the guardian wording explains that reflection content is shared only when the student chooses. Submission is not described as academic completion.

Intent identifiers bind workspace/activity/student/reflection-version/recipient-role/person. Repeating preparation adds no duplicate job. Correcting a registered address does not silently create a second email for the same event/person. Recipient and approval/contact/consent versions are retained for future delivery revalidation. Staged intents are PENDING, never SENT or DELIVERED.

`stageReflectionEmailIntents` is an internal no-I/O helper for staging alongside the eventual submission transaction. It is not called by the production submission service yet. No actual submission currently creates an email queue entry. The generated engine projection removes reflectionEmailOutbox for every role, so future stored contact/job details will not leak through dashboards.

## Earlier response work preserved and deferred

Before the email clarification, link-visitor acknowledgment/appreciation code and tests were written. It is retained in source rather than discarded, but `reflectionResponseConfiguration.enabled` is false. Production shared-reflection GET has no acknowledgment form; direct response attempts are denied without a write. The public page retains restrictive form-action policy when no form is available. Owner management does not display a response section while disabled.

Its isolated tests explicitly enable that separate fixture only. They check bounded same-origin URL-encoded forms, private responses labelled UNVERIFIED_LINK_VISITOR, exact replay idempotency, source/expiry/revocation guards, escaped owner rendering and atomic response/audit updates. These passes do not mean the feature is enabled or that it verifies guardians. Do not activate it as a substitute for registered-email automation.

## Verification and limits

`check-reflection-email.mjs` passes against an actual existing engine submitReflection result, fictional .test contacts and in-memory SQLite. It checks default-disabled behavior; registration/identity/contact/guardian/consent periods and status; ambiguity; exclusion of reflection text/scores; per-recipient/event deduplication; immutable staged targets; a subsequent reflection version; private projection for every role; and rollback when an isolated staged submission/audit commit fails. The SQLite test demonstrates the proposed atomic staging pattern; it is not evidence that the production service has that hook.

Existing reflection-sharing, achievement-sharing, client, server, sync, publication-consent and dialog-accessibility checks pass. The reflection-sharing regression explicitly checks that default production policy provides no response form and denies the response service without changing workspace/audit. The deferred response fixture passes only with its explicit local configuration. TypeScript no-emit and production build pass. No browser preview was started for this policy-only/default-disabled checkpoint, and no new browser acceptance is claimed.

No schema/migration, database reset, live email, real recipient record, institutional provider activation or sharing-consent change. Existing architecture and tested workflows are preserved. E-Digital Nepal retains official identity/enrollment/result/fee ownership. Semester progression remains bulk with only officially Left College excluded. W10-13 and W10-16 institutional integration/full accessibility blockers remain unchanged.

## Completed, partial and next

Completed: minimal registered-email planning, strict internal source guards, immutable/deduplicated pending intent staging and private outbox projection; existing shared reflections retained. Deferred/disabled: link-visitor response feature. Partial: automatic registered-email appreciation as a whole.

Next bounded development task: add a disabled-by-default server composition and atomic submission/outbox hook, reusing the existing workspace/audit transaction, with an approved-contact provider boundary and failure tests. Sending must wait for a designated institutional contact source, approved communication rules, mail service/sender configuration and a delivery/retry/receipt contract. The future sender must revalidate contacts, guardian relationship and permission before delivery, invalidate changed targets, and never mark an uncertain attempt as delivered or blindly resend it.
