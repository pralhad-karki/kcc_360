# Stage 217 — Saved-result digest confirmation without WebCrypto

22 October 2026 · Asia/Kathmandu · Baseline a94c4bed997c5c401b56c2f263a663dd5396a8cf.

## D216-02 — cause confirmed and fixed

The supported HTTP preview supplied crypto but no crypto.subtle. Browser diagnostic logging captured Cannot read properties of undefined (reading 'digest') in teamTaskClientHistoryDigest, called by teamResubmitFreshValid. Rounds 1–2 use legacy content bindings; round 3 onward computes SHA-256 history digests. A server save therefore succeeded before client proof verification threw. Manual refresh correctly recovered the saved result; it was never a lost-write defect.

The shared client digest helper now uses native WebCrypto when available and an identical local SHA-256 implementation when the API is absent. Canonical serialization and UTF-8 encoding are unchanged. Native failures still propagate; the fallback does not swallow errors, skip verification, trust save-response data or grant authority. Review and student revision confirmation still require the exact fresh scoped workspace, immutable prefixes, source/version/account checks and matching digests. No new API, table, package dependency, permission or record format is added. Existing legacy bindings and saved records stay unchanged.

## Automated evidence

- check-intake-team-history-digest.mjs: PASS. Native/absent/empty crypto contexts match Node crypto SHA-256 across canonical nested values, key-order equivalence, tampered values, Nepali/emoji/lone-surrogate text, 130 short lengths, one-million-character input and raw-byte padding boundaries. Native digest failures reject rather than silently fall back.
- check-intake-team-task-cycles.mjs: PASS. Existing actual dispatcher/SQLite/controller round-3–9, provenance, audit rollback/CAS, scoped history and account-handoff checks remain. Added a real mentor round-3 review and student round-4 revision with crypto={} in the client VM; both confirm automatically with exact saved-record proofs. Round-3 proof tampering is still rejected by that helper's existing assertions.
- TypeScript --noEmit --incremental false: PASS. Production build: PASS. Whitespace: PASS. Full regression suite not rerun.

## Browser reproduction and retest

Used a complete disposable checkout and the existing asserted second-review fixture as prerequisites. A diagnostic-only adapter imported check-intake-team-task-rereview-save.mjs and logged caught error stacks. These diagnostics never entered production source. Frozen provider time stayed 2026-10-19T12:30:00.000Z; actual browser execution occurred 22 October. Initial fixture revision 62; project `0cb1591e-7ff5-40fb-8f1b-2731ca5cc24f`.

Before the fix, s2's genuine third submission saved at revision 63 but client confirmation threw the missing digest error. That write was retained; no duplicate submission was replayed. After loading the fixed client, s7 independently reviewed the current third submission with an explicit PARTIAL decision, Concept 2 and fresh feedback. The interface applied revision 64 itself and displayed Fresh review saved. The original review and submissions remain in history. No manual refresh was used to obtain this success.

Then s2 genuinely revised the contribution against the same verified evidence, acknowledged feedback and confirmed submission 4. Revision 65 was applied automatically and displayed Revision submitted. Earlier feedback is retained; fresh mentor assessment is required. The overview showed four retained rounds and revised work under review, not complete. Both student and mentor paths therefore exercised the previously failing HTTP-preview digest case.

An automation attempt selected an account immediately after reload before workspace boot settled; the subsequent fresh snapshot showed s2 still selected. It was corrected by selecting the mentor after boot and inspecting the returned state. This produced no write and is not counted as a workflow defect.

D216-02 is closed by the diagnosed exception, automated regression and browser retest. W10-10's original Fail entry remains in its attempt history; the passing retest is appended. No institutional acceptance, official scoring policy, MIS identity, complete activity or academic credit is certified. W10-11–16 still require their remaining cases.

Next: complete the scoped history/verified task-completion browser cases, checking preserved rounds and separate activity completion. Keep live institutional activation disabled and preserve all MIS and progression boundaries. Preview stopped after observations; no live data or database migration changed.
