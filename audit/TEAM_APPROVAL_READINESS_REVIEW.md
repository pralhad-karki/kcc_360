# Stage184 — Team final-review readiness inspection and preview

## Current implementation and minimum gap

The team route resolver already identifies one first reviewer and a configured independent FINAL_APPROVE assignment from approved authority sources. Reviewed team proposals remain SUBMITTED, with frozen proposal/member/review records. Mentor and department request/response/withdrawal/revision are controlled. The existing individual intake-to-draft handoff explicitly excludes institutional teams and uses legacy demonstration identities; it cannot be reused as team approval authorization.

No source-backed overall consultation scope/completion record is currently implemented. Existing department acceptance records commit supporting responsibilities, not delivery or final approval. Therefore all accepted issued requests must not automatically mean all necessary consultation is complete, and every participating department must not be inferred mandatory.

Minimum next changes are: read-only readiness review using existing records; a controlled explicit consultation-scope confirmation aligned with institutional rules; then scoped final-review decisions and an authorized, duplicate-safe handoff to the existing activity workflow. Final project approval and permission to start must retain their distinct roles. No new module or copied MIS/LMS functions are needed.

## This increment

Added readIntakeTeamApprovalReadiness to the existing trusted command bridge. It returns a source-validated snapshot only to current explicitly authorized mentor-assignment coordinators and/or the configured final approver. Multi-role grants are retained as a roles list. It checks current reviewed source, mentor acceptance, latest issued department request states and final authority availability. Responses omit stable person IDs, private narratives and raw source bindings.

Same-batch academic projects with a current accepted mentor and available final authority can be READY_FOR_FINAL_REVIEW. Research proposals remain REVIEW_REQUIRED while overall consultation scope is unconfirmed, including when all issued department requests are accepted. Missing/stale mentors, unavailable final authority and unresolved/withdrawn/stale consultations are identified. The preview always returns canApprove=false, approvalRecorded=false and executionAuthorized=false; it writes nothing and appends no audit entry.

Impact: no existing state, record, permission, route, SQL structure or working screen changed. This is a read-only backend preview; dashboard presentation and any scope-confirmation/final-decision controls remain subsequent work. Existing institutional activation remains disabled without approved sources.

Validation: actual reviewed same-batch and research request/mentor/consultation fixtures through the real dispatcher and SQLite. Covers coordinator/final-approver scope, unrelated actor denial, missing/stale/current mentors, pending/declined/accepted-all consultation fixtures, unconfirmed scope, inactive final authority, source-change rejection, private response and no read writes/audits/approval/execution. Existing default-disabled HTTP path covered. Full evidence: AUTOMATED_BASELINE_STAGE184.json; TypeScript/build separately checked. Browser and institutional acceptance not run.

Next: present the readiness snapshot in the existing dashboard/module/detail flow, then define the minimum explicit consultation-scope confirmation before implementing final approval. Notifications and execution handoff remain pending. Semester progression and full demonstration data remain parked.
