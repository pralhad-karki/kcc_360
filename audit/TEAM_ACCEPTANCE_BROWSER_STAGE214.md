# Stage 214 — Adapter fixes and student progress/submission checks

22 October 2026, Asia/Kathmandu. Production source baseline a9ac3d0fe80afff95876295d4481a123cce6a2de; the disposable runtime checkout used Stage 212 application assets plus the adapter-only edits in this commit. Fresh fixture project `197256c0-2657-4d2c-95fb-e2213b39d162`; revision started at 35. Actor s2 was the assigned student; s1 was the peer/team lead. The in-memory run is independent of Stage 213's assignment run.

## Adapter repairs

The local root now redirects to /workspace/ before relative assets load. A local-only served sync-client render wrapper removes unsupported account options after each render. The browser visibly redirected from the root, loaded the full workspace and showed only s1/s2/s7. Original production assets, account catalogue and server runtime are unchanged; the wrapper exists only in bytes served by the explicit acceptance launcher.

The adapter self-test passes root redirect, served wrapper presence, exactly three response accounts, session switch, stale actor/revision denial, same-origin protection, trusted discovery and no generic/file writes. No production build was necessary: this script is outside application build imports.

## Browser observations

- W10-03: s2 opened Develop research survey → Update my progress. Saved In progress with confirmation and reason (revision 36), reopened the fresh preview, then saved Blocked with detail/reason (revision 37). The overview showed In progress / Blocked / Not verified complete; it offered no score or completion control. Existing progress-controller/SQLite checks supply separate retained-history evidence; browser inspection did not read raw executionHistory.
- W10-04: while blocked, Submit evidence was absent. Reopened progress, chose Not blocked, cleared detail and supplied a new reason/confirmation (revision 38). Submission became available. This verifies the visible gate and authorized clearance, but an actual blocked-submit rejection and no-op/invalid negative request were not executed in this browser run. Full case remains Blocked pending those probes.
- W10-05: explicitly chose new evidence, entered W10 fictional pilot notes, a fictional description, own contribution and submission reason, left the optional URL empty, confirmed and saved (revision 39). Expanded the native history disclosure: Submission v1, exact contribution, evidence reference #1, frozen title, Evidence at submission: Unverified, Awaiting mentor review. Progress/submission actions disappeared for this submitted task. Activity stayed Started. No mentor review or score was created. Refresh retained revision 39.
- Partial W10-02/privacy observation: after switching from s2 to s1, the project overview showed s1's own assignment/actions, with no s2 private task-history section or contribution. The non-lead s2 view had no assignment action. Explicit unauthorized command probes were not executed in this browser; full permission case remains Blocked. These observations do not substitute for server rejection.

W10-03 is recorded as Pass for the observed browser reporting flow with separately identified automated history support; W10-05 is Pass. Prior W10-01 pass belongs to Stage 213's separate run. W10-02 and W10-04 retain partial observations and a Blocked disposition for their unexecuted negative subcases. Other cases remain Not run. No institutional acceptance or end-to-end lifecycle completion is claimed.

## Verification and next step

Fresh checks: adapter --self-test and check-intake-team-task-progress-client.mjs, plus syntax/whitespace. The latter checks actual progress previews/saves, SQLite-backed lifecycle, history preservation, stale/account/duplicate/refresh handling and role/source guards; it is developer evidence rather than an additional browser pass.

Next: add bounded negative probes to the local adapter self-test for unauthorized assignment/peer-task reads and blocked evidence submission, clearly distinguish them from browser observations, then continue shared evidence and independent mentor review. Keep live runtime disabled and preserve MIS ownership, progression policy, all previous records and existing architecture.
