# Stage 209 — Sequential individual task revision cycles

The previous route stopped after review 2. The same controlled student revision and mentor revised-work actions now operate on the latest sequential round after any PARTIAL or RETURNED decision. Student screens show the latest contribution, feedback, scores and round numbers. Mentor screens show the preceding review and current revised contribution; new decisions, scores and feedback remain explicit empty inputs. Evidence verification remains separate from individual completion.

Each submission appends to the existing array and each fresh mentor review assesses that exact submission version. Submission/review prefixes, domain criteria, execution history and source approval remain unchanged. Verified completion ends the revision route. Shared evidence can be reused with a genuinely changed contribution, while verification status alone is insufficient revision. New evidence begins unverified; VERIFIED completion requires verified current evidence and an independent accepted mentor.

## History integrity and compatibility

Rounds 1 and 2 retain their exact legacy bindings. From round 3, `priorTaskDigest` binds the entire prior task; review provenance stores `submissionDigest`, `taskDigest` and `priorReviewDigest`. Digests use SHA-256 over canonical values (the task review binding is itself a canonical string). This avoids recursively storing complete prior histories in every later record. Original records are neither migrated nor discarded.

The trusted context awaits an iterative validation of every chronological prefix before any controlled task operation. It checks sequential versions, prior partial/returned decisions, genuine changes, acknowledgment, source and current authority, criteria, scores, evidence bindings and chronology. Later verification of shared evidence preserves earlier unverified partial/returned assessments as historical. Changed historical content or provenance fails validation.

Preview tokens bind current project, actor, authority and workspace revision. Saves reload twice and use the existing atomic workspace compare-and-swap plus content-free audit. Initial-only commands retain their version-1 restrictions. Client success requires the exact append-only scoped GET proof, including digests and preserved prefixes, and rechecks account/generation after asynchronous hashing.

The technical history limit is 100 rounds per task; the existing 2 MB workspace limit and evidence-register limit still apply. This is an implementation bound, not an institutional attempt/eligibility rule. It must be reconsidered before adopting an approved institutional policy. No SQL schema, role grant, score scale, provider configuration, audience or academic progression policy changes.

## Validation

`check-intake-team-task-cycles.mjs` exercises real dispatcher/SQLite/scoped-engine student and mentor screen controllers through rounds 3–9, including new and shared verified evidence, distinct zero/null scores, fresh verification, PARTIAL/RETURNED and final VERIFIED decisions, retained prefixes, compact storage growth, malformed versions, stale previews, unauthorized actors, initial-command denial, audit rollback, compare-and-swap races, tampered historical content/digests/criteria/times/verification, and account changes during asynchronous saved-record proof. Existing revision and second-review checks continue to pass.

Full regression evidence: AUTOMATED_BASELINE_STAGE209.json. Browser/keyboard/institutional acceptance, approved live-source activation and private uploads remain pending. Semester progression stays deferred.

Next: expose a scoped chronological task history view so students and authorized mentors can inspect every retained round together, then prepare the acceptance walkthrough for the complete task lifecycle.
