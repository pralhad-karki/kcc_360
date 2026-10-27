# Stage 272 — target-linked date amendments

Baseline: published Version 283 / Stage 271, commit 6fd976f626b918be9c09ef89ccb0c70b879d248a. SRS v3.8 remains the requirements baseline.

Implemented a bounded extension of existing plan amendments: target-linked club plans may extend activity/report dates within their existing contribution scope. No new module, table, contribution, event or target allocation is created. Existing raw sources and approved snapshots remain unchanged. Successor versions must complete owner submission → responsible unit → Finance Administrator → Principal. Reviewer assignments must cover the successor version.

The runtime revalidates original contribution proofs against current canonical targets, allocations and catalogue before loading a successor. Amendments keep the exact contribution proofs; date changes cannot change other material fields or exceed the target cycle. Target/catalogue revision checks now participate in amendment atomic saves as well as approval saves. Missing, changed or stale sources fail closed. The UI offers only date extensions for target-linked plans.

Evidence: STAGE272_TARGET_AMENDMENT_TESTS.txt exercises actual existing review runtime and transactional SQLite persistence, both source revision conflict denials, out-of-cycle rejection, full successor review, exact historical preservation and unchanged target ledger. The actual approved-club-calendar projector retains old dates at every pending review step and substitutes the final date once, with no duplicate rows. Existing amendment regression covers replay, competing drafts, wrong owner, rollback, returned versions and additional unbound activities. STAGE272_REGRESSION.json records the wider regression results.

Limits: this is date-only carry-forward of unchanged proofs, not allocation reassignment or new contribution approval. Target-linked additions, value changes and revised target/allocation versions still require a separate controlled rebase. Departmental amendment activation remains restricted by existing source policy. Institutional providers remain disabled. No live institution browser approval journey, notification delivery or AT-ECO01–AT-ECO08 completion is claimed. Stage271 integrated upload/session evidence remains historical; upload code is unchanged. No production data write/migration or fixture seeding.

Next: controlled contribution rebase for target-linked additions/changed allocations, preserving the existing approved version and exactly-once contribution accounting. Institutional activation still needs adopted catalogue/cycle/department, stable identity/role/reviewer mappings and configured source providers.

Final checks: 66/66 regression groups passed, zero failures; TypeScript and production build passed. Additional final target/calendar and date-only UI assertions passed (STAGE272_TARGET_AMENDMENT_TESTS.txt, STAGE272_CLIENT_TESTS.txt). Browser approval flow not run; institutional providers remain disabled.
