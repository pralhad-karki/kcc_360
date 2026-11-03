# Stage 279 — reliability fixes and local capacity baseline

2026-11-03, Asia/Kathmandu. Baseline `7919b32dc384e6cec3fca4d18651913985a4c35f`, branch `development/website-mock-acceptance`; clean local source and GitHub branch head inspected before work. User direction: preserve the current stack and prepare a reliable KCC deployment for about 10,000 registered users over three years. The integration/operator roadmap is retained; no architecture restart, deployment, production migration, database reset or live connection.

## Audit and plan

`server/service.ts` currently reads/serializes the canonical workspace and saves changed state with a shared revision and atomic audit. Existing `check-performance.mjs` tests student performance analytics, not capacity. Existing full-stack acceptance and SQLite fixtures supply useful service/route test patterns, but no evidence establishes 10,000 institutional accounts or three-year growth.

First increment: remove unnecessary session-write attempts; enforce the existing payload budget in bytes; run the actual workspace route/service/engine against disposable SQLite; compare the baseline and candidate with bounded synthetic datasets; record remaining bottlenecks and launch gates. Continue with a measured storage transition rather than replacing the language/framework or resetting data.

## Implemented independently

- Existing session reads now SELECT first and return the stored actor. Only a missing session uses INSERT OR IGNORE followed by SELECT. Concurrent first creation and a competing actor insertion preserve the existing winner. Authentication, owner restriction, persona guards and session updates remain unchanged.
- The workspace save guard now counts UTF-8 bytes with `TextEncoder`, retaining the existing 2,000,000-byte payload budget. It rejects oversized changes before workspace/audit writes. This is a payload safeguard, not completed hosted D1 row/request-limit acceptance.
- `fixtures/workspace-capacity.mjs` supplies a new disposable file-backed SQLite fixture using the existing schema, actual compiled route/service/engine, and only substituted platform binding/fictional identity. It never opens an existing database and its transaction batches are serialized/atomic.
- `check-workspace-reliability.mjs` adds five grouped checks to the existing regression launcher: indexed session reads with 10,000 fixture sessions; concurrent initial creation; Unicode rejection/rollback; valid large Nepali saves; and different-project conflict/data-integrity behavior.
- `scripts/workspace-capacity-probe.mjs` records a repeatable baseline/candidate diagnostic, source hashes, fixture sizes, SQL counts, bytes rewritten, individual timing samples and conflict outcomes. It requires explicit local-fictional execution and refuses to overwrite existing evidence.

## Measured local findings

See `STAGE279_CAPACITY.json`. Each variant used 10,000 session rows and 8/100/500 minimal fictional projects. These sessions all use existing fictional profiles; they do not model institutional user identity or 10,000 concurrent users. Each sequential timing case has only three samples; it is not a production percentile/SLA. Timings were collected before the broader build/regression work, without those jobs intentionally running alongside the probe.

| Finding | Baseline | Candidate |
| --- | --- | --- |
| Three existing-session workspace reads | 9 SQL calls, 3 session INSERT attempts | 6 SQL calls, zero session INSERT attempts |
| Unicode input near the payload budget | Local SQLite accepted a 2,032,457-byte payload because the old guard counted characters | HTTP 413; original 1,998,000-byte payload and audit unchanged |
| Two synchronized writes to different projects | 1 success, 1 conflict | 1 success, 1 conflict |
| Eight synchronized writes to different projects | 1 success, 7 conflicts | 1 success, 7 conflicts |
| Three short messages with 500 minimal projects | 725,844 payload bytes rewritten | 725,844 payload bytes rewritten |

The query-count improvement is deterministic in this fixture; no latency speedup percentage is claimed. The Unicode test exposes a gap in the old application guard using local SQLite, whose limits differ from hosted D1. The shared-revision conflicts preserve committed data but remain a storage scaling blocker. These expected-conflict assertions pass as integrity diagnostics; they are **not** acceptance of enterprise concurrency.

## Regression evidence and calendar-fixture repair

The initial full run passed 57/72 groups and failed 15. All failures originated in the shared `check-intake-team-task-save.mjs` fixture: it used a fixed trusted date in October 2026 but its engine intake setup used the real date, now after the fixture's November 1 start. This fixture imports no changed service code at that failing setup point. The initial failure evidence remains in `STAGE279_REGRESSION.json`; the first bounded repair attempt and final fixture recheck are also retained.

Aligned that shared test process's Date clock with its existing trusted fictional date using Node's test clock. No production calendar validation, date rule or application clock was weakened. Each regression check already runs in a fresh Node process; the clock is limited to tests importing this fixture. The final complete rerun passes **72/72 groups, 0 failed** (`STAGE279_REGRESSION_FINAL.json`).

Final TypeScript, production build and all five reliability groups pass; exit codes and evidence paths are in `STAGE279_CHECKS.json`. No deployment was performed. The capacity probe is backend route/service execution without a network server or browser; it does not replace Stage 253 hosted/Worker/browser acceptance. No copied website-team source or new shared integration contract is included.

## Next task and open gates

See [KCC360_10000_USER_READINESS_PLAN.md](KCC360_10000_USER_READINESS_PLAN.md). Next: inspect the existing discussion workflow and prepare a bounded per-project storage transition with preserved IDs, source/permission fences, thread/history semantics, audit and migration/rollback rehearsal. Keep any transition disabled until its equivalence and concurrency tests pass; do not run production migrations.

Institutional identity/MIS/SSO, scoped grants, private-file acceptance, database-plus-file recovery, monitoring, actual peak workload, three-year volume projections and hosted mixed-load acceptance remain open. Registration controls and later publication/report/reconciliation increments remain on the roadmap; integrations stay disabled.

**Capacity readiness remains HOLD. No claim of 10,000-user or three-year production capacity.**
