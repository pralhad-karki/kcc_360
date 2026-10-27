# Stage 166 — Routing and mentor decision audit references

## Review and minimum change

The existing intake stores versioned routing decisions and mentor assignment/response records with actor, time and reasons. The server already writes an atomic ledger event for each successful command, but these three commands used legacy selected-record metadata, often null on the intake screen. Extend the existing mapper dispatcher and service's audit command list for `reviewActivityIntake`, `assignIntakeMentor` and `respondIntakeMentor`. No database migration, route, command, permission, workflow module, new authority or data population is introduced.

Routing metadata uses the INTAKE ID, submitted version and SUBMITTED → RETURNED / ROUTING_CONFIRMED state. Mentor metadata uses a bounded additive `INTAKE_MENTOR_ASSIGNMENT` record type in the existing v1 codec, the assignment ID, its retained sequence version and REQUESTED → ACCEPTED / REASSIGNMENT_REQUESTED state. A replacement is a new assignment ID, so its versionBefore/stateBefore are null even when its retained sequence version is 2 or later. Both the mapper and reader deploy together; existing metadata and legacy ledger records are unchanged. An older codec without this additional type cannot interpret these new assignment records.

Reason references contain IDs/versions and a controlled field name only. For routing the command resolves `decisions` at the referenced submitted version; assignment resolves `mentorAssignments` by assignment ID/version; response resolves that same assignment's `response.reason`. The action identifies the relevant reason path. No free-text reason, proposal title/content, fit/capacity notes, source snapshot or student details are copied into audit metadata. Workspace revision and commit correlation bind the event to the stored change. Guarded engine execution remains the authorization boundary; the mapper validates the expected trusted transition and fails rather than silently downgrading invalid transitions.

## Tests and impact

`check-intake-review-audit.mjs` uses the actual service with in-memory SQLite and guarded commands for intake submission, routing return/resubmission/confirmation, first assignment, reassignment request, replacement and acceptance. It checks source IDs, assignment versions/states, ledger correlation, private-content exclusion, retained earlier assignments, no activity creation, rollback/retry for each mapped command, no audit on duplicate/stale/unauthorized calls, required conflict declaration and a concurrent winning commit. Invalid trusted transitions are rejected. Existing strict preservation checks normalize only the added dispatch/import lines, and the service's negative probe continues to reject unrelated changes.

Full local results: `AUTOMATED_BASELINE_STAGE166.json`; TypeScript and production build checked separately. Browser/keyboard/print and institutional acceptance remain **Not run**. No live institutional roster/roles, team/research first-review activation or wider audit acceptance is claimed; G22 remains open. Semester progression and full demonstration data remain parked.

Next recommended step: check intake withdrawal and supporting-responsibility decision audit coverage using this same bounded mechanism; preserve the existing records and approval rules.
