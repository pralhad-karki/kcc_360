# W-10 — Controlled team task lifecycle

Stage 211 · 22 October 2026 · Prepared against Stage 210 / commit c9ddc737ebffd5863d08915224e978e50c7dce8d / published version 231.

This is a supplemental execution guide, not a new SRS acceptance identifier or institutional sign-off. Existing AT cases, W-01–W-09, open gaps and approved institutional workflows remain unchanged.

## Execution gate

Current disposition: **Blocked for the live controlled-team browser journey**. Source inspection confirms `intakeTrustedSourceConfiguration.enabled` is false and no providers are installed by default. No live account, roster or approved source configuration was supplied or activated by this stage. No live browser journey was attempted. Individual manual cases below remain **Not run**, rather than falsely recording attempted failures.

Before execution, designate an isolated fictional acceptance environment, its source commit/version and a tester. The deployment must use the existing server-side provider seam with explicitly configured fictional session/person mappings, roster, academic masters, reviewer assignments, approval policy and effective dates. Keep it separate from shared/live records. Never enable a runtime using browser fields, use arbitrary demo persona switching as institutional identity, fabricate real grants, reset a database, or alter a shared dataset to satisfy this guide.

Choose a final-approved linked team activity with recorded controlled start, confirmed consenting members, an accepted independent mentor and current source versions. Record the intake, first-review, final-decision, project, start and workspace revision references. If this prerequisite is absent, stop before task assignment and record Blocked. Handoff/start acceptance uses the existing Stage 191–194 evidence and controls; this guide does not authorize bypassing them.

Use three separately mapped fictional people: assigned student A, team peer B, independent mentor M. A lead or accepted mentor assigns tasks under existing authority. Do not assume a role label or account name grants access. Use fictional text only; no real student data or external messages. Existing private-file upload limitations remain in force.

## Cases

Run in order where indicated. Exceptions that mutate trusted sources belong only in the isolated environment. Resetting that environment is not required by this guide; preserve previous rounds and record revisions.

| Case | Actor and action | Expected result | Manual status |
| --- | --- | --- | --- |
| W10-01 | Lead/M: Projects & Activities → linked started activity → Prepare task assignment. Explicitly select A; enter title, due date, responsibility, expected output, evidence requirement and selected-domain criteria. Confirm. | One assignment persists after refresh with exact criteria and assignee. Earlier tasks remain. No submission, score, completion or award is created. | Not run |
| W10-02 | B/unrelated actor: attempt assignment or A's task action through the visible interface and approved negative-test requests. | Server denies unauthorized commands; no records or audit success event changes. Missing buttons alone do not prove server denial. | Not run |
| W10-03 | A: Update my progress → In progress with reason/confirmation. Then report a blocker with detail. | Fresh preview/save/refresh confirms append-only execution history. A cannot set completion or scores. | Not run |
| W10-04 | A: attempt evidence submission while blocked; then clear blocker with a reason and blank blocker detail. | Blocked submission is denied; authorized clearance persists. No-op/invalid reports do not silently change work. | Not run |
| W10-05 | A: Submit evidence → explicitly choose new fictional title/description and optional source link; enter own contribution and confirm. | Evidence begins unverified; contribution is submission v1, task is under review and not complete. Task criteria and prior execution remain. No private upload is implied. | Not run |
| W10-06 | B: submit own contribution to an independently assigned task, choosing permitted shared evidence. Inspect A's task history. | Shared evidence does not copy A's contribution or assessment. B cannot read A's private submission/review history. | Not run |
| W10-07 | M: open initial individual review before evidence verification; record PARTIAL or RETURNED with explicit feedback, including a zero and a blank selected-domain score. | Partial/return can be saved without completion; zero displays 0 / 4 and blank displays Not assessed. VERIFIED completion is unavailable/denied with unverified evidence. | Not run |
| W10-08 | A: Prepare my revision. Read earlier feedback; try unchanged work, then genuinely revise contribution or evidence and provide explanation/acknowledgment/confirmation. | Unchanged work is rejected. Submission v2 appends; v1 and review v1 remain. Revised work returns under review. New evidence starts unverified. | Not run |
| W10-09 | M: open revised-evidence verification, inspect all contributions referencing it, give reason/conflict declaration and confirm. | Evidence verification persists independently; it does not complete any individual's task. Saved historical evidence snapshots remain unchanged. | Not run |
| W10-10 | M: independently assess revised contribution with fresh feedback, decision and explicit domain scores. Choose PARTIAL/RETURNED; repeat A revision/M review to round 3 or later. | Each review binds to its exact submission. Previous feedback/scores are never prefilled as a new decision. All earlier records remain. | Not run |
| W10-11 | A and M: activity overview → Individual task history → expand Submission and review history. | Chronological rounds show matching reviews, revision explanations, recorded evidence status/title and criterion snapshots. Earlier rounds are labelled historical; pending latest work says Awaiting mentor review. | Not run |
| W10-12 | M: verify current evidence if needed, then freshly assess A's latest contribution as VERIFIED. A refreshes. | Only eligible independently reviewed work is task-complete. Exactly the current valid round is labelled current mentor-verified completion. Earlier partial/returned reviews remain historical. | Not run |
| W10-13 | A and B inspect project state, portfolio and official results after task completion. | Individual task completion does not silently complete the activity, create academic credit or change MIS results. Later activity evaluation/verification requires its separately implemented and authorized process. Absence of that handoff is recorded as pending, never bypassed. | Not run |
| W10-14 | Tester: prepare an action, then advance the workspace revision or change/revoke a required source/authority using approved isolated controls; attempt the stale action. | Stale/changed-source action is denied without overwriting the winning state or losing history. No browser-provided capability re-enables it. | Not run |
| W10-15 | Tester: change account during preparation/save/refresh; double-submit and exercise a failed refresh using approved isolated controls. | No old-account private result is displayed/applied; duplicate writes do not append duplicate rounds. Uncertain writes require refresh/history inspection, not automatic replay. | Not run |
| W10-16 | Tester: Tab/Shift+Tab through overview/dialog/history; use Enter/Space on the native history summary; inspect narrow/wide layouts and long escaped fictional text. | Visible focus, usable labels/order, expandable history, readable criteria/feedback and no injected markup. Record actual keyboard/browser results separately from controller tests. | Not run |

## Evidence and result rules

For every attempted case retain: case ID, tester, date/time/timezone, environment, source commit/deployed version, actor/person mapping reference, intake/project/task IDs, workspace and submission/review versions, expected and observed result, redacted evidence reference, status, defect ID and retest outcome. Do not include session tokens, credentials, private contribution/feedback text or real student data in shared evidence.

Pass requires an observed match; Fail requires observed incorrect behaviour; Blocked means the attempted case lacks a prerequisite; Not run means unattempted. A fixture pass is developer evidence only. Keep append-only execution entries for retries and never overwrite a failed attempt with its passing retest. A full-suite total is not a browser result.

The companion `TEAM_TASK_ACCEPTANCE_EXECUTION.json` contains the preparation/preflight record and manual case placeholders. Institutional tester/approver assignment remains unset. No institutional acceptance is claimed.

## Developer evidence checked in this preparation

Fresh passes: `check-intake-trusted-loader.mjs`, `check-team-command-route.mjs`, `check-intake-team-task-history.mjs`. These check default-disabled configuration and trusted-source rules, actual HTTP route disabled/authorization guards with preserved data/audit, and read-only history rendering. They do not probe or modify the deployed database.

Stage 210 already records a passing real dispatcher/SQLite round-3–9 cycle, scoped student/peer/mentor history, TypeScript and production build. That evidence was inspected, not rerun or relabelled as Stage 211 acceptance. No runtime source changed; a new build/deployment is unnecessary for this documentation-only checkpoint.

## Next bounded step

Inspect and prepare a reproducible isolated browser-acceptance environment using the existing trusted-provider seam and fictional fixtures, preserving the live disabled default. Confirm the configuration and account/scope boundaries before executing W10-01. Do not create another application or turn fixture personas into institutional authorities. Report any missing supported provisioning/browser capability as a blocker with the exact prerequisite.
