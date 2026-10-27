# Stage 254 Worker upload and session continuity checkpoint

25 October 2026, Asia/Kathmandu. Existing application recovered from published Version 265 / commit `56e1f62c95ac8a87f045b48378406be27b5aa3be`. Workspace maintenance removed an earlier temporary test environment; its observed repeat-upload run is not substituted for retained raw database evidence. Production data was not reset or populated.

## Verified result

The actual framework home renders the existing workspace iframe. Its existing client creates fictional evidence and uploads a TXT attachment through `/api/files`, the compiled Vinext Worker, existing identity/service/file policies, and **native local Wrangler D1 and R2**. No response or frontend success is simulated. A separate local-only edge fixture establishes fictional owner identity and strips caller-supplied identity headers; it is not imported by the production Worker or application authentication.

Retained recovered-run checks pass: framework/iframe load; evidence save; multipart upload HTTP 200; continued authenticated refresh after file selection/upload; logout followed by file GET 401; fresh login displays retained attachment; authenticated file GET 200; out-of-scope Research persona file GET 403; native R2 object's size and SHA-256 agree with the D1 attachment record. Rejected requests leave workspace hashes/revision/audit count unchanged. Main workspace revision 2 has two real audit commits: evidence submission and file upload. File bytes are 146 bytes, SHA-256 `d530ea5ed597f69aef31a8019f68ba472150dd0c7458fbf30b7c659f8b2cffbd`.

Earlier in this session, two repeated uploads and a refresh also succeeded through the compiled Worker. Maintenance later removed that first fixture, so only the recovered run is used for retained D1/R2 proof. Browser download artifact collection was unreliable (the event timed out / returned artifact path was unavailable); authenticated delivery is established by the actual GET 200 and native R2 byte verification, not a claim that a downloadable browser artifact was retained.

The Stage 253 custom-transport 401 could not be reproduced on the actual compiled Worker path. No production authentication bypass, cookie relaxation, endpoint change or invented MIS/SSO protocol was added. The earlier failed scenario remains in Stage 253 evidence. This closes the independent full-framework upload/session verification task, not institutional login acceptance.

## Confirmed defect corrected

`check-files.mjs` exposed a separate real server-engine defect: the controlled-document revision command opens its existing form, but the generated headless DOM stub lacked methods used by the existing dialog naming code. The backend returned 400 instead of saving the revision. Added `querySelector`, `removeAttribute` and `setAttribute` to the headless stub in `scripts/prepare-workspace.mjs`, regenerated `server/engine.mjs`, and reran the same regression successfully. No business rules, document approvals, attachments, architecture or historical records were rewritten.

## Evidence and checks

- `STAGE254_NATIVE_WORKER_EVIDENCE.json`: real native D1 payload/audits, attachment metadata and HTTP before/after proofs; authentication/session tables and cookies omitted. Collection verifies actual R2 blob bytes. No D1/R2 API shim.
- `STAGE254_WORKER_UPLOAD.jpg`: browser view of the saved private attachment after fresh login.
- `STAGE254_REGRESSION.json`: 32/32 workflow checks pass after correction.
- `STAGE254_BUILD_AND_CHECKS.json`: file/readiness regressions, TypeScript and production build pass; relevant runtime source hashes.
- `scripts/worker-upload/{prepare,run,edge}.mjs` and `collect.py`: repeatable isolated test setup and read-only collection. Preparation refuses an existing fixture; schema initialization never resets a fixture. Production build excludes all acceptance edge/authentication code.

Default trusted team-provider discovery remains disabled with 503 and no writes; that is unrelated to cookie/session continuity. Official MIS/SSO, real member identities, live email and institutional acceptance remain pending. All Stage 253 evidence remains intact.

## Required checkpoint boundary

Upload/session task verified and checkpointed before requirements adoption. Next action is review of the supplied SRS update and confirmed incremental adoption requirements, with a change matrix and explicit gaps. No next business workflow was started before this checkpoint.
