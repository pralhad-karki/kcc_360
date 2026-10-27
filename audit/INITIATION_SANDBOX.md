# Combined student-initiation walkthrough — Stage 130

2026-10-19. Isolated interactive fictional fixture at /workspace/initiation-sandbox.html, linked from the workspace footer. Main dashboard, module navigation and live intake behavior are unchanged.

The static module imports exact copies of the existing pure directory, invitation and routing helpers. Prepare-workspace copies those reviewed helpers unchanged to the static sandbox directory; it does not add any live engine command or service import. The CSP disables network connections, forms, images and third-party resources; the controller does not fetch, send invitations, use storage or authenticate. It contains three explicitly fictional students and scoped fixture assignments. Reload/Reset discards all changes. No real workspace data is loaded or seeded.

## Manual walkthrough (all Not run)

1. Open the footer link or direct URL. Read the fictional/no-live-save notice.
2. Use Same-batch academic project. Search Example or ST02; select Bikash. ST03 is outside this fixture's course scope.
3. Prepare invitations. Check routing before acceptance: it must block. Use the labelled simulated ST02 accept action, then check routing: Faculty is the lead reviewer.
4. Mark fictional faculty unavailable and recheck: Academic Coordinator becomes the one lead reviewer. This only changes a fixture assignment.
5. Withdraw as ST02; routing blocks. Revise the team, prepare a fresh round and accept again. Earlier rounds remain visible.
6. Simulate changed invitee roster version. Routing blocks until a fresh team round with new source and consent is prepared. An old success must not remain displayed after an error.
7. Reset to Multidisciplinary research. Search ST03, select Chandra, prepare invitations, decline and verify blocked readiness. Revise, obtain fresh acceptance and verify Research Coordinator routing.
8. Confirm configured final authority is displayed separately and execution is never authorized. Review the club-members-first recruitment notice; no broadcast action exists here.
9. Test keyboard/focus/status announcements, narrow-screen layout and full browser behavior. Record Pass/Fail/Blocked/Not run and defects; none is certified by automated rendering tests.

The scenario controls explicitly simulate invitees; they are not permission for a lead to accept on another student's behalf. Production needs real authenticated invitee actions and source-scoped permissions. The UI uses no live role switching, MIS roster, subject assignment or delegated authority. Display output is escaped. The technical fixture uses a fixed clock and three fictional people, not the full requested demonstration dataset.

## Validation and next step

check-initiation-sandbox.mjs combines the actual helpers across all three routes, refusal/withdrawal/source changes, fresh team rounds, controller actions/errors, safe/pure rendering, exact public helper copies and unchanged live authorization. Focused existing directory/invitation/routing/intake/mentor/support/report checks and TypeScript are also run. Browser acceptance is Not run.

Next: assess the minimum live integration into existing Activity Intake forms, source loaders, commands, notifications and audit transactions. Specify which demo capabilities can safely connect now and which remain blocked by authoritative MIS identity/cohort/subject assignments and configured approval authority. Do not silently relabel fixture grants as institutional permissions. Club-first event recruitment follows this common membership foundation. Semester/year progression and full demonstration data remain deferred.
