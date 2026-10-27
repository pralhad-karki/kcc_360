# Stage192 — Authorized team handoff preview and confirmation form

## Minimum change

Connected the Stage191 handoff backend to the existing Activity Intake readiness detail. Changes are limited to the readiness binding hook, its existing handoff browser controller and asset versions. No backend policy, schema, route, permission, mapping or institutional source was changed. Current working individual and institutional workflows are preserved. No demonstration dataset or real institutional assignment was added.

## Behavior

A final-approved, unlinked proposal with currently accepted prerequisites offers a read-only 'Check authorized draft handoff' action. This action is not a permission grant. It calls the existing fresh readIntakeTeamHandoffDraft command with the exact proposal, reviewed submission and final-decision references. Only a current authorized server response with a valid approved mapping and canCreate=true opens the creation form. Missing/revoked authority, mapping or sources produce no form and never fall back to the individual/demo handoff.

The form displays submitted versus mapped activity type, programme, description, dates, semester/course, outputs/SDGs, every confirmed student's identity and mapped execution account, the team lead and accepted mentor. Source field changes, duplicate/missing members, inconsistent owner/mentor, wrong final references, malformed metadata and an execution-authorized preview are rejected. Research retains its original source type and shows the explicit server-approved mapped execution type. A nonempty reason and unchecked-by-default explicit confirmation are required.

Creation sends only source/final references, the fresh preview token, reason and confirmation through handoffIntakeTeamDraft. Users cannot choose substitute team members, owner, mentor, programme or type. The existing backend revalidates permission, mapping, sources, token and workspace revision and prevents duplicate creation.

The controller validates the minimal CREATED/non-execution result and then fetches a complete fresh workspace. It checks current actor/revision, the unique linked draft, source/final references, owner, mentor, full membership and mapped activity fields before applying that workspace. It never applies a command response as workspace state. A failed or ambiguous save/refresh clears the form and asks the user to refresh and check whether a linked draft already exists; it never automatically replays a write. Pending-operation guards preserve lock ownership, account context, modal identity and queue/source generations. A committed save still synchronizes if the modal was closed; an old account's result cannot update or unlock a new account.

A created draft continues to appear as read-only. Draft editing, submission, approval changes and permission to start remain blocked by Stage191's controlled activity guards. The final-approved intake and all earlier records are preserved.

## Validation

New actual-controller VM checks cover readiness/action binding, separate fresh preview, escaped full team/mentor/activity details, exact commands, explicit confirmation/reason, denied/malformed previews, strict result and full-GET validation, failed refresh/no replay, duplicate clicks, account changes during preview/save/fresh GET, closed modal handling and explicit research mapping. Existing backend SQLite and HTTP default-disabled checks remain in the regression suite. Evidence: AUTOMATED_BASELINE_STAGE192.json. TypeScript and build checked separately. Browser/keyboard and institutional acceptance remain Not run; approved real providers, authority/mappings and live institutional runtime are not activated.

Next: review and implement the minimum controlled activity permissions and start-readiness checks for linked team drafts, reusing their final approval rather than repeating it. Notifications and formal institutional acceptance remain pending; semester progression is parked and full demonstration data is deferred.
