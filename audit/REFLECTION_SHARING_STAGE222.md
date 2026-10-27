# Stage 222 — Share a reflection any time after submission

23 October 2026 · Asia/Kathmandu · Baseline source d8e43d6bba8293c7beda260141fa3a6ae52dff72. Last published version at start: 233; Stage221 dialog fix had been committed but not yet saved/deployed when the discussion intervened. This release carries that tested fix forward with the reflection-sharing change.

## Approved behavior and scope

The user confirmed that students may share any time after submission, without waiting for mentor review or evaluation. Added student-controlled link sharing for the student's own current submitted reflection. Guardian acknowledgment/appreciation replies remain a separate unfinished task; no messages, invitations, email or SMS are sent by this change.

The existing reflection submission workflow and existing expiring portfolio-link service are retained. No database schema, migration, architecture, institutional provider, permission catalogue, semester progression or MIS integration change. Only the student grants disclosure consent; institutional sign-in remains simulated in this owner-controlled environment.

## Implementation

- The own-reflection card offers Share reflection and Manage share links after a versioned, dated reflection is submitted, regardless of mentor-review/completion stage. It remains available on return visits.
- Successful server-confirmed reflection submission thanks the student and states that sharing is available now or later. No appreciation is shown as proof of academic verification.
- The student selects 7, 30 or 90 days, previews the exact server-prepared content and explicitly checks consent. Audience is clearly anyone with the link; the student decides whom to send it to. This is not a recipient-authenticated guardian portal.
- A REFLECTION kind reuses the existing preview/create/revoke API, random-token hashing, atomic workspace/audit update, anonymous view and no-store/CSP/referrer/robots protections. Existing achievement-sharing requirements are unchanged.
- The snapshot contains name, activity title/programme/type, current submitted text/version/time and status only. Scores, mentor feedback, prior reflection versions, files, contacts, peer records and internal authority details are excluded. Reflection HTML is escaped.
- Status is Submitted — awaiting review, Reviewed for a final assessment of the same reflection version, or Verified activity contribution when the existing verified achievement checks also hold. Submission alone never creates verified completion.
- Creation does not set the existing achievement showcase flag, alter assessment/activity state or create an official publication request. Official website nomination, editorial review, exact consent and publishing approval retain their existing rules.
- Revocation stops future access. Expiry, source membership/text/version/title or displayed review-status changes invalidate a link; a fresh preview and consent create a new current link. Someone who already read a page may retain a copy, as stated in the consent preview.
- Client generations, account/revision checks, dialog markers and one-use pending drafts prevent applying old-account/closed-dialog responses or replaying an uncertain save. Manage share links shows the reflection kind and uses the existing owner-scoped revoke flow.

## Verification

Passing targeted checks:

- `check-reflection-sharing.mjs`: actual submitReflection service call before any evaluation; exact consent, minimal snapshot, no public-showcase/academic/publication side effects, anonymous route headers/escaping, status transitions, ownership, source changes, expiry, revocation, stale/invalid requests and real SQLite optimistic-write/audit behavior. The race fixture intentionally advances only the competing revision; the rejected share leaves payload and audit count unchanged.
- `check-reflection-sharing-client.mjs`: own submitted entry before review, exact escaped preview, unchecked consent, consent-bound create, duplicate-click/failed-save non-replay, old-account/closed-window response suppression and server-confirmed appreciation wording.
- Existing `check-sharing.mjs`, `check-sharing-client.mjs`, `check-server.mjs`, `check-sync.mjs`, `check-reflection-nomination.mjs`, `check-reflection-consent.mjs`, `check-dialog-accessibility.mjs` pass.
- The old publication-consent VM dialog stub initially failed because it omitted DOM methods used by the Stage221 dialog fix. Added the missing querySelector/attribute methods to that test stub; the publication policy itself was unchanged and the check then passed.
- TypeScript no-emit check and production build pass; generated browser assets/static engine are synchronized. Diff whitespace check passes.

## Isolated browser evidence

A complete disposable checkout used the existing sharing-test service harness with in-memory SQLite, transpiled real service/sharing code, existing browser assets and local-only fictional identity. The temporary adapter was placed only in the disposable checkout; no production route or launcher was changed. Its P101 baseline was put at REFLECTION_PENDING with no reflection or evaluation, solely as a fixture prerequisite. Real official identity and MIS were absent. The local banner identified this explicitly.

As s1, opened P101 Community Waste Mapping → Reflections & Evaluation. Before submission there was Write reflection and no Share reflection. Submitted a fictional reflection containing literal script-looking text through the existing form: revision 0 → 1. The own card immediately displayed the saved version and Share reflection while the activity remained Reflection Pending and no evaluation existed.

Opened sharing, retained 7 days, and inspected the exact preview: name, activity metadata, Submitted — awaiting review, version/time and escaped literal text. Consent was initially unchecked. Explicitly checking consent and creating the link saved revision 2. The dialog stated that no message was sent automatically. Opened the generated URL through browser navigation; its read-only view displayed only the selected reflection/status and no marks or mentor feedback. The script-looking text remained literal.

Returned to Manage share links and observed Reflection / Active. Revoked once: revision 2 → 3. Reloading the previously opened URL showed Share link unavailable with no reflection content. Temporary share reference PF-960267f5-83a2-4835-8161-3361abdbc16a; raw token is not recorded here.

The separate background intake-discovery request is unsupported by this narrow disposable service fixture and produces an unrelated access-unavailable toast. Therefore the appreciation text is verified by the targeted submission-controller test rather than claimed as a clean browser-toast observation. It did not prevent submission, preview, create, anonymous view or revocation. No live data was used; preview stopped after testing.

## Next task and limits

Next bounded task: guardian/recipient acknowledgment and appreciation for a student-shared reflection, with an explicit distinction between an authenticated guardian and an unverified link visitor. Do not label anonymous responses as verified guardian acknowledgments. Keep responses separate from academic evaluation and completion.

W10-13 official MIS/credit assertions and W10-16 full accessibility/narrow-layout acceptance remain blocked. Institutional acceptance remains Not run. E-Digital Nepal ownership, student-history preservation, task/activity verification separation and Left College-only semester progression remain unchanged.
