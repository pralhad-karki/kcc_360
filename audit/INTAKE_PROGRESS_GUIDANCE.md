# Stage160 — intake progress and handoff guidance

Adds a read-only Current intake step / Next responsible / What happens next panel within the existing Activity Intake record. No workflow state, route, table, permission, command, recipient, assignment or student record is added or changed by the panel.

The existing browser-extension pattern is reused through `prototype/intake-progress.js`, loaded after the core application and existing club extensions in the browser and generated server engine. It wraps the existing mentor panel to display guidance before current controls; core `prototype/app.js` stays unchanged. Browser asset version queries advance to v181 so the current assets are requested after publication.

The panel reads the existing draft/returned/submitted/withdrawn states, submission/routing freshness, current mentor assignment and supporting-unit readiness. It distinguishes student revision, coordinator review, mentor request/response/reassignment, pending support, linked workspace and activity-specific readiness. Mentor/support acceptance never becomes activity approval or permission to start. Internship guidance explicitly separates letter issue, host acceptance and commencement authorization.

Only records already visible through existing intake access can receive guidance. Supporting representatives receive a limited supporting-responsibility message rather than the full private intake/mentor context. Raw and server-projected views use the same limited scope. No new project links, mutation controls or private reasons are emitted by this panel.

Validation: `check-intake-progress.mjs` exercises actual engine intake/review/mentor/support transitions, current-source invalidation, reassignment and withdrawal, copied internship/linked-workspace guidance branches, role/peer denial, raw/projected parity, read-only rendering and existing page integration. Existing intake and support checks and TypeScript pass. Full candidate evidence is in `audit/AUTOMATED_BASELINE_STAGE160.json`; application build is checked separately.

Browser/keyboard/institutional acceptance remains Not run because supported browser control is unavailable. The UI states the current coordinator-led prototype flow; it does not claim live Research/faculty first-review routing. Real approved identity, roster/course and reviewer sources are still pending. Semester progression and full demonstration data remain deferred.
