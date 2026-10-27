# Stage 210 — Scoped chronological task history

The existing linked team activity overview now includes a collapsed, keyboard-native Submission and review history for tasks whose retained submissions and reviews are present in the existing server-scoped workspace response. Rounds appear in submission-version order and each review is paired by its submissionVersion, not by array position. No new read command, endpoint, schema, authority or workflow transition is added.

Each round shows the contribution, submission time, revision explanation where recorded, evidence reference and frozen evidence status/title at submission. Reviews show their recorded reviewer account, time, decision, feedback, criterion snapshot and scores. Zero remains 0 / 4; null or missing remains Not assessed. The newest review is labelled current verified completion only when the task's existing assessmentCurrent and VERIFIED state agree. Earlier reviews remain historical. Missing reviews show Awaiting mentor review; ambiguous review bindings show an unavailable message. Evidence verification is explicitly separate from individual completion. All user text is escaped, and no evidence links are fetched or made active.

Privacy continues to rely on the existing server projection: a teammate receives no private submission/review arrays and therefore no private history view. The renderer performs no requests, writes or fallback lookups. It does not change account, role or institutional source configuration. Ordinary non-team overviews retain their existing behaviour.

## Verification

- PASS: check-intake-team-task-history.mjs — rounds 1–9, review pairing, immutable evidence/criteria, zero/null, stale/current labels, escaping, omitted peer arrays, missing/ambiguous reviews, and no record mutation.
- PASS: check-intake-team-task-cycles.mjs — existing real dispatcher/SQLite student revision, mentor verification/review and provenance/tamper/rollback checks, plus history rendered from actual student, peer and mentor projections. This includes its imported assignment, submission and review checks.
- PASS: TypeScript with --noEmit --incremental false; production build; git diff --check.
- The first integrated rerun failed an assertion against wording that changed while the test was running. The assertion and renderer were aligned, then the full targeted cycle script passed. No persisted workflow record was changed to resolve it.
- Full 206-check baseline not rerun. Browser, keyboard and institutional acceptance remain Not run.

## Next task

Prepare the bounded acceptance walkthrough for the complete controlled team task lifecycle: assignment, contribution/evidence, independent verification/review, repeated revision and history inspection, peer denial, stale-source denial and separate task/activity completion. Record actual results only when executed. Live institutional activation, private uploads, semester progression and full demonstration data remain pending/deferred under their existing boundaries. Progression must ultimately exclude only officially Left College students and preserve history; no progression rule changes here.
