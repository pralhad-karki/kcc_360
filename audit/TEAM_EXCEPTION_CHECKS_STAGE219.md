# Stage 219 — Exception-path developer verification

22 October 2026 · Asia/Kathmandu · Baseline bfe78c09b99d4ae06b21b063b531e18a162a6e61. Test and acceptance-record checkpoint only; published application remains version 233.

Extended the existing local fictional acceptance adapter self-test. No new HTTP endpoint, application route, permission, source provider, database schema or production data change. All writes use the existing in-memory SQLite fixture and real trusted dispatcher. Fixture authority is restored in finally blocks.

## Results

- Changing academic-master source version during trusted save reload rejects with 403, preserving the entire serialized workspace and audit. The initial test expected 409; inspection of the actual fail-closed source authorization response justified correcting the test expectation to 403. Production behavior was not changed.
- Revoking the accepted mentor source denies both progress preparation and saving with 403, preserving workspace and audit.
- A prepared s2 payload sent with the s1 session cookie rejects with 409 and unchanged state.
- A valid s2 update creates exactly one workspace revision, audit entry and execution-history entry. Replaying the exact original request then rejects with 409 and unchanged committed state. A peer save also denies with 403. No submission or task completion is created.
- Existing progress controller checks pass account changes during preparation, save and follow-up refresh; old-account responses are not applied. Duplicate pending clicks issue one write. Failed GET confirmation prompts inspection and does not replay the write. These are VM controller assertions, including a real dispatcher/SQLite scoped-view round trip, rather than browser observations.

## Verification

`node scripts/team-acceptance-server.mjs --self-test` — pass, exit 0.

`node check-intake-team-task-progress-client.mjs` — pass, exit 0.

No application files changed; the adapter is excluded from application routes/builds. A new runtime build or deployment is not warranted for this test-only checkpoint. Prior successful production build and deployed version 233 remain the runtime baseline; no new live-run claim is made.

## Remaining work

W10-14 and W10-15 now have explicit passing developer evidence; their manual browser cases remain Not run. W10-16 keyboard, focus and wide/narrow layout observation also remains Not run. This stage did not start a browser preview. Next bounded task is browser stale-dialog/account-switch behavior followed by keyboard/layout observation in the disposable acceptance environment. Preserve previous attempts and record unsupported viewport checks as blocked if necessary.

W10-13 official MIS/credit assertions remain blocked. Institutional acceptance remains Not run; trusted institutional sources stay disabled. No changes to MIS ownership, whole-activity completion or Left College-only semester progression.
