# Stage 288 — private discussion preparation from the current head

5 November 2026, Asia/Kathmandu. Baseline `7adeae9d3d78b742794a7230eb51ac8bac416808` on `development/website-mock-acceptance`.

The private candidate-head service can prepare a command against the workspace reconstructed from the current coordinator stack. It calls the existing discussion engine and effect validator. The staged discussion is checked against the canonical project before evaluation. The service records the exact before and after digests, project and shared revisions, canonical source digest, staged commit UUID and current authority fence.

Prepared candidates use a checksummed `KCC360_DISCUSSION_HEAD_CANDIDATE_V1` envelope around the existing effect receipt. The stack uses the envelope digest. Legacy Stage 286 receipts retain their original digest and continue through the same reader. Advancement of a prepared candidate checks the recorded revisions and authority before applying its effects. A shared revision change invalidates the candidate even when the virtual digest is identical. Reversal uses the recorded effects and the existing latest-first coordinator rules.

The repository commits the immutable candidate and its metadata audit together. The transaction checks the canonical and authority revisions, observed private row versions and commit IDs, and candidate-key absence. A repeated request with the same operation identity returns the recorded candidate summary after a current authorization check. The eight-entry stack, private witness budget and per-row byte budget apply.

The focused check executes post, reply to the new thread, resolve, and reversal of all three commands against fictional memory and SQLite stores. It compares each materialized workspace with the legacy engine result, including reminders and audit effects. It also covers same-digest staleness, concurrent retries, lost acknowledgement, authority and staged races, receipt tampering and rollback on audit failure.

Preparation uses the existing rehearsal flag, which defaults to off. Hosted recovery, institutional authorization and throughput acceptance are pending. The next bounded check is to export and restore a nonempty prepared stack in a fresh disposable SQLite store, then verify replay and reversal across a new service instance.

Verification passed all 18 focused checks and [80 regression groups](STAGE288_REGRESSION.json). The TypeScript check and framework build passed.
