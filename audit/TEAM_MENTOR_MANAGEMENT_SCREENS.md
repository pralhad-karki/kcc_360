# Stage177 — Coordinator mentor management screens

Minimum change: connect the Stage176 withdrawal/replacement backend to the existing mentor detail and selection screens. Reuse the existing dashboard → Activity Intake overview → detailed record flow; no new module, route, SQL schema or permission grant.

The current explicitly scoped mentor assignment authority sees live and withdrawn assignment records, limited chronological history (version, mentor alias, state and dates), and a reason plus explicit confirmation form for withdrawal. The current authority can remove an assignment even when its mentor is inactive or no longer eligible. Shared management validation is reused by server reads and withdrawal saves. Ordinary mentor acceptance retains its strict current-source eligibility checks. Other reviewers, students and final approvers gain no management access.

After withdrawal, the existing mentor request section offers replacement selection. It binds the expected prior assignment version and freshly checked eligible candidate token. Replacement confirmation retains the fit/capacity/reason assessment; the response must contain the next assignment version. History and responses remain retained on the server; previous acceptance never transfers. No consultation, final approval or execution authorization is inferred.

Controller guards retain current actor/snapshot/revision, fresh detail retrieval, explicit confirmation, exact response references, full-workspace refresh only, no automatic retries and stale account lock ownership. History and display strings are validated/escaped. Private source snapshots, capacity and withdrawal narratives are not exposed in history summaries.

Validation: existing request/response/read checks plus new management projection, withdrawal controller and replacement controller tests. Includes actual SQLite/dispatcher lifecycle, inactive mentor removal, scoped history, replacement discovery and token-bound request, v3→v4 browser-controller fixture, wrong roles, malformed responses, stale accounts and failed refresh. Evidence: AUTOMATED_BASELINE_STAGE177.json. TypeScript and production build checked separately. Browser/keyboard and institutional acceptance are not run.

Pending: controlled consultation and final approval/execution handoff, approved institutional source activation and acceptance testing. No real providers, users, notices or full demonstration dataset added. Semester progression remains parked.
