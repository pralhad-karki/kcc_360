# Stage 266 — Student Affairs internship workflow summary

Baseline: Version 277 / Stage 265, commit 0dab890e729d4bc6e4c1ad0c1469e9568c14cad1.

## Delivered

Student Affairs receives a count-only, server-computed internship summary in the existing owner-demo department page. This reuses the existing placement, letter, host-readiness, execution and final-review validity predicates. It does not add a parallel placement or evaluation module.

The server computes the summary before private records are removed from its response. Only the existing sa1 owner-demo persona receives this DTO; other actors receive no summary. A stored or browser-supplied summary is replaced by fresh computation. The browser consumes the DTO and does not need private source records. Viewing the summary changes no stored record or audit history.

Measures distinguish submitted/withdrawn intakes, current approved placement proposals, approach letters, start authorizations, execution workspaces, changed execution sources, paused/cancelled workspaces and current independently approved final reviews. Counts overlap across stages and count records/workspaces rather than unique students. Draft intakes and withdrawals without a prior submission are excluded. Withdrawn intakes do not contribute current intake authorization counts. Source/evidence changes invalidate the corresponding current counts through existing workflow controls. Classification failures are reported as counts without private error messages.

No names, stable student IDs, host details, documents, contact information, review narratives, grades or individual scores are included in this summary. Existing case-read, mentor, signing and independent-review permissions remain unchanged. No new command, role, API activation, database migration or production data write is needed.

## Verification

- New actual-engine regression uses the existing fictional internship acceptance chain through independent final approval. Tests stage separation, revoked-letter/source changes, evidence invalidation, cancellation, draft/withdrawal handling, unauthorized actors, DTO privacy, read-only preservation and server recomputation.
- Isolated projection test confirms source-classification failure produces an unclassifiable-record count. Arbitrarily corrupted legacy workspace storage is not a supported import path; a trial corrupting its placement array failed earlier in existing dashboard initialization. No claim of general corrupted-storage recovery is made.
- Existing browser-script harness checks summary rendering alongside unavailable job-placement and institution-wide outcome labels.
- Full standard developer regression evidence is STAGE266_REGRESSION.json. Final targeted summary and client regressions were repeated after adding the isolated classification test and excluding never-submitted withdrawals; its output is retained separately.
- TypeScript passed. Production bundle is built during final packaging.
- Managed-browser read-only fictional fixture inspected: stage table, counts, unavailable source labels, scope and privacy explanation. This did not exercise native authentication or backend saves. Temporary fixture removed before packaging.

## Dependencies and next task

This is owner-demo reporting, not an activated institutional reporting grant. Real institutional Student Affairs scope, trusted identity and source mappings remain unconfigured. Counts are not whole-college outcomes, placement rates, credit or MIS writeback. Job-placement opportunity/application/offer/joining records remain unimplemented; they must stay distinct from academic internship placements. No eligible-cohort denominator or semester/session filter is inferred.

Next: extend the existing periodic monitoring/evaluation and corrective-action controls to exact approved departmental plan items through scoped assignments and evidence, preserving the independent approval and private case boundaries. Job-placement tracking remains a separate incremental workstream.
