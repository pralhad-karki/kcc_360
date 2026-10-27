# Stage 221 — Accessible shared-dialog names

22 October 2026 · Asia/Kathmandu · Baseline 16848e9a6c81bf8b40effffc5a4ef922ca47c69a, deployed version 233.

## Confirmed defect D221-01

The existing shared helper rendered content into a native dialog and called showModal. The dialog had no aria-label or aria-labelledby. In the disposable fictional browser workspace, the prepared progress form visibly contained Update my task progress, while both naming attributes were null; the accessibility tree identified only container modal. This confirmed an accessible-name defect.

Stage220's boundary focus samples did not prove a focus-trap defect. The application uses native modal behavior and no custom Tab interception. No custom focus trap or focus movement was added.

## Targeted change

The existing modal helper now associates the dialog with the first visible-content heading via aria-labelledby. It retains an existing heading ID or supplies modal-title. Each body replacement clears stale naming attributes and binds the new heading; heading-free content receives Workspace dialog. No heading text is interpolated into new HTML. Existing import cancellation and native showModal/close behavior remain unchanged.

Updated the browser app asset revision to 234 and regenerated browser assets/static engine through the existing preparation script. No data model, API, permission, workflow or provider change.

## Verification

- `node check-dialog-accessibility.mjs`: pass. Exercises actual helper across loading/form replacement, existing heading IDs, heading-free fallback and stale-label removal, while retaining native invocation and import cancellation.
- `node check-sync.mjs`: pass, shared boot/actions/persona switching and conflict/failure freshness.
- `node check-intake-team-task-progress-client.mjs`: pass, including real trusted dispatcher/in-memory SQLite round trip and existing account/duplicate/confirmation guards.
- `node check-server.mjs`: pass, access/concurrency/atomic audit and scoped-read regressions.
- TypeScript `--noEmit --incremental false`: no diagnostics.
- `npm run build`: exit 0, production build complete.
- `git diff --check`: pass.

Browser baseline project bccf80e1-8b02-4756-aad7-f850c2f81628, revision 35, s1's Interpret the pilot findings task. The local fixture reused existing asserted setup; no real student or MIS source was involved. After updating the disposable browser assets and reloading, Enter opened the progress dialog. The accessibility tree first named Checking current task progress…, then Update my task progress when preparation finished. DOM aria-labelledby resolved to the current modal-title heading. Tab moved from the stage select to the blocker select. Escape closed the prepared dialog and document focus returned to Update my progress. No workflow save occurred in this retest; workspace stayed at revision 35. Preview was stopped afterward.

## Limits and next task

D221-01 is fixed and browser retested. W10-16 remains Blocked: no supported narrow-viewport resize API and no completed assistive-technology/full keyboard acceptance. This change does not claim accessibility conformance. W10-13 remains blocked by absent approved official MIS/credit surfaces; institutional acceptance remains Not run.

Next bounded task: inspect the existing whole-activity completion path for controlled linked-team activities, identify its first unfinished production seam and preserve task-level versus activity-level verification. Continue with existing architecture and targeted tests; do not activate institutional sources or invent integration contracts to close acceptance blockers. E-Digital Nepal boundaries and Left College-only semester progression remain unchanged.
