# Stage 253 — integrated browser and persistence checkpoint

25 October 2026, Asia/Kathmandu. Continued from Stage 252, published Version 264, source `e35876f7114e24e8b8f515f90972574d1eadeeab`. **Partial acceptance: not an all-workflows pass or production go-live approval.**

## Execution boundary

Actual `public/workspace` controllers called existing application routes, services and generated engine. A clearly labelled, local-only acceptance transport provided fictional owner identities, a file-backed SQLite implementation of the used D1 API, and a filesystem implementation of the used R2 API. Uploaded bytes, file metadata, workspace changes and audit rows were persisted. No frontend success handler or business-operation response was fabricated. No production database, migrations, credentials, real student records or institutional permissions were changed.

This verifies local application integration, not the full Vinext/Cloudflare production transport, cloud D1/R2 implementation, ChatGPT credential validation, Google login, E-Digital SSO or independent institutional accounts. Persona selection is an owner-controlled demonstration boundary. Test auth is isolated in `scripts/full-stack-acceptance-server.mjs`, explicitly requires a dedicated scratch fixture database, and is never imported by deployed routes.

Run A on 24 October exercised academic, research, club and initial internship paths. Its temporary browser fixture/database/journal did not survive the interruption; those observations below remain session evidence, not downloadable database proof. Source changes and regression reports survived. Run B on 25 October used a distinct fresh fixture, preserving surviving source and production data. Its actual records and sanitized evidence are retained in this checkpoint. Internship placement preconditions in B were created through unchanged route handlers; subsequent readiness, review, authorization and handoff were browser actions. No time was changed to force execution.

## Workflow results

| Requested workflow | Frontend / browser | Backend / database evidence | Result and remaining boundary |
| --- | --- | --- | --- |
| Student login and role dashboards | Fictional student entry; student, mentor/faculty, coordinator, administrator and research dashboards rendered in B | Workspace GET and session POST use real services; persistent actor/session selection | Pass for scoped fictional roles. Institutional/student credentials and SSO not tested or enabled. |
| Academic project submission, approval, evaluation | A: student intake, coordinator routing/mentor request, mentor acceptance, linked proposal, approval/start, task/evidence submission and mentor verification, reflection, evaluation, verified completion | A: observed committed main revision 33; its DB artifact later lost. Targeted linked-delivery and task-mapping rechecks pass | Browser lifecycle observed passing after semester fix; durable raw DB evidence for A unavailable. Provisional rubric remains labelled demo, not institutional grading policy. |
| Research routing and mentor assignment | A: Research intake routed to RESEARCH and mentor accepted | Actual commands saved; source/current tests preserve routing and acceptance | Partial. No linked research execution handoff offered. Dedicated research queues and real authority activation await configuration; not an MIS API necessity. |
| Club membership and activity | A: club review/authorization, s2 request and mentor membership approval, s1 leadership nomination/eligibility/appointment, annual-plan mentor and Student Affairs approval, club activation and confirmed two-member event creation | A: observed main revision 47. Club enrolment and achievement-chain regressions pass | Partial. Activity execution, evaluation and annual closure were not completed in the browser. |
| Internship application, supervision, evaluation | A: placement/letter/readiness draft. B: readiness submit, mentor verify, department authorize, coordinator execution handoff; premature Start rejected | B: main revisions 1–15, stored file hash/bytes match, readiness START_AUTHORIZED, linked execution APPROVED, authorized start 2026-11-01 | Partial. Full browser supervision/final evaluation not executed before authorized period. Existing execution/final regressions pass. Browser file upload failed as described below. |
| Reflections and verified portfolio | A: reflection submitted before final evaluation, sharing option immediately available; human evaluation and completion verification; own portfolio and private achievement preview | Actual reflection/evaluation/export controllers exercised in A; sharing/export/email regressions pass | Scoped browser pass observed in A; raw A DB unavailable. No real email sent, public publication or automatic certificate. |
| Semester progression | B: coordinator proposal → independent department persona approval → explicit coordinator apply; final-semester read-only preview | Separate ledger revision 3 and three audit rows; A,C,D,E,F advance 3→4/version 2, official Left College B remains 3/version 1; main revision remains 15 | Pass for fictional adapter/ledger. On Break, Repeating and Unknown included; no automatic graduation. No actual MIS or student-placement update. |
| Persistence after logout/login | B: authorization/file metadata remain after logout/login and supervised server restart | Same persistent SQLite file and object bytes; source hashes/audit preserved | Pass within the running local environment. Scratch fixture loss across the long interruption is explicitly recorded, not mistaken for production data loss. |
| Unauthorized access and audits | B: peer cannot see private intake; anonymous GET rejected; premature start denied | Anonymous 401, peer file 403, cross-origin 403, forged actor 409, stale revision 409, unapproved fields 400; denied peer command leaves records unchanged | Pass for tested controls. Some business denials return HTTP 200 with unchanged revision and explanatory message; not a successful mutation. Broader penetration testing/institutional account isolation not established. |
| MIS adapter | B: fictional cohort preview, proposal, review, apply and final-semester boundary | Mock isolation regression passes; separate ledger and unchanged main payload verified | Pass for fictional isolated behavior. Default live adapter stays DISABLED; OFFICIAL mode fails closed without a vendor adapter. |

## Browser totals and failures

Run B retained **13 scoped assertions passed, 1 failed** in `STAGE253_BROWSER_RUN_B.json`. These are assertions, not 14 complete workflows. A's observations are listed above and are not added to the retained count. Research/club completion and internship final evaluation remain incomplete; they are not counted as passes.

The failed browser scenario is private file upload: after file selection, the fictional session identity was absent on `/api/files`, returning 401. A following workspace GET also lacked identity. No file, workspace or audit write occurred. Root cause is unresolved test-session continuity; a production application defect has not been established. Re-entering the fictional workspace restored access. Actual upload/download handlers were separately executed with multipart input against persistent SQLite and filesystem storage; stored size and SHA-256 match, and peer download is rejected. This is controller evidence, not a passed browser upload. Reproduce this in the full framework/Worker transport before closing the failure.

The empty trusted team-provider registry returns 503 for `discoverIntakeTeamAccess`. This is a deliberate disabled integration boundary with unchanged records, not a successful team backend operation. No fake trusted authority was activated to make the scenario pass.

## Corrected defects

**D253-01 — linked intake task semester missing.** Linked proposals retained semester 3 in planning metadata, but new task mapping read only `p.semester`, producing null/“Not mapped.” Baseline assertion reproduced `null !== '3'`. New mappings now use retained intake planning metadata when the project semester is absent. Existing task academic snapshots and prior mappings remain unchanged. Browser retest in A created a semester-3 task while retaining the original null snapshot. Linked-delivery regression checks the new semester and verifies later planning changes cannot rewrite the existing task snapshot. Generated engine and deployed workspace assets match the source; cache revision is 253.

Three stale test dialog stubs (task mapping, individual handoff and club event enrolment) lacked the existing dialog naming methods. Updated test-only stubs; no product dialog behavior changed. The initial club test failure remains in `STAGE253_TARGETED_REGRESSION.json`; the successful correction is separately recorded in `STAGE253_TARGETED_RECHECK.json`.

## Retained verification evidence

- `STAGE253_REGRESSION.json`: **32/32** existing workflow checkpoint scripts pass (24 October); not the complete repository's entire test inventory.
- `STAGE253_TARGETED_RECHECK.json`: **7/7** targeted checks pass after the test-stub correction.
- `STAGE253_MODULE_REGRESSION.json`: **6/6** additional internship, club achievement-chain, reflection sharing and email-preparation checks pass.
- TypeScript `tsc --noEmit`: exit 0. Production build helper: exit 0 (25 October). Source input hashes in `STAGE253_SOURCE_MANIFEST.json` bind baseline plus local patch, rather than implying tests used clean baseline HEAD.
- `STAGE253_PERSISTENCE_EVIDENCE.json`: sanitized fictional workspace/ledger snapshots, **15 main and 3 mock-ledger committed audit rows**, stored file metadata and asserted byte/hash agreement. Authentication/session tables are excluded.
- `STAGE253_HTTP_EVIDENCE.jsonl`: actual browser-facing route statuses and before/after workspace revisions, commit IDs, payload hashes and audit counts. Rejected requests leave proofs unchanged. Read-only requests do not fabricate commits.
- `STAGE253_CONTROLLER_SETUP.jsonl`: nine real route-driven internship precondition commits, explicitly separate from browser actions.
- `STAGE253_CONTROLLER_CHECKS.jsonl`: actual multipart upload/download and denial assertions; expected statuses documented above.
- `STAGE253_FICTIONAL_PROGRESSION.jpg`: browser screenshot of applied fictional cohort, five included and one Left College exclusion.

No schema/migration, institutional workflow, role grant, assessment policy, production fixture population, public consent or official MIS behavior changed. Prior acceptance cases and institutional status remain intact; W10-16 remains Partial and W10-13 remains blocked on official sources.

## E-Digital Nepal readiness and next task

Ready for technical contract discussion and sandbox mapping, **not live integration or go-live**. Existing isolated normalized contract covers stable tenant/person/student/enrollment IDs, department/programme/batch/semester/course IDs, enrollment versions/status, official college status, scoped student/guardian contacts, verified relationship/communication permissions, validity windows and exact `(provider, issuer, subject, tenant)` identity mapping. Mock identities explicitly cannot authenticate or grant live access. No vendor URL, endpoint, token format or authentication protocol was invented.

External inputs still required: official API/schema and sandbox authorization; identifier, update, status and freshness semantics; official SSO protocol/trust/session/revocation details; approved institutional role/authority activation; real sender/provider/contact setup for appreciation email. None prevented the independent testing above.

**Next bounded development task:** reproduce and correct private-upload session continuity in the full framework/Worker test path, rerun browser upload/download and role denials, and retain evidence. Then complete club execution/closure and research handoff coverage using approved workflows. Use a separately identified fictional internship with a valid current approved period for supervision/final-review testing, rather than bypassing the existing date gate. Institutional acceptance and official integration remain separate approvals.
