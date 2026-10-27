# Student project initiation routing — Stage 127

2026-10-19. Isolated resolver, not connected to live intakes, sessions, directories or notifications. Existing coordinator triage remains unchanged. Club-source work is paused and preserved outside this checkpoint.

The agreed student flow is searchable authorized directory → invitations → accept/decline → membership verification → submission. This checkpoint implements only the pure routing decision after trusted group confirmations exist; it does not implement invitation sending, student directory UI, MIS integration or acceptance persistence.

## Routes

MULTIDISCIPLINARY_RESEARCH requires confirmed active students from more than one programme/department combination. One currently assigned Research Coordinator receives first review and is responsible for arranging mentorship and consultation. The resolver signals that consultation is required; it neither decides which consultation is sufficient nor records any department acceptance.

SAME_BATCH_ACADEMIC requires the exact programme, batch, semester and course membership for every confirmed student. One current subject-faculty assignment receives first review. Explicit UNAVAILABLE faculty, or no current faculty assignment, routes to one scoped Academic Coordinator assignment. UNKNOWN availability blocks until resolved. Conflicting subject/fallback/research assignments block rather than selecting an arbitrary reviewer. The fallback is not a background timeout or a finding that a faculty member is generally inactive.

Final approval is independently configured by institution and activity kind, and academic course/cohort scope when applicable. No Principal, HoD or mentor is silently assigned final authority. Candidate group members cannot review or approve themselves through alternate roles because comparisons use stable person IDs. First reviewer and final authority may be the same nonparticipant when explicitly configured; a separation-of-duties policy beyond this remains an institutional decision.

## Boundaries

Caller inputs must come from authenticated authoritative loaders: proposal/version/team version, student identity/enrolment snapshots and versions, exact member confirmations, reviewer assignments, approved routing policy and server time. The pure resolver does not authenticate or grant data access. Grants default to none and must be scoped, versioned, current and unrevoked. No email/contact/fee/grade fields are read or returned. The internal route binding includes only necessary IDs, source versions and scope; it is not a public payload or cryptographic authorization token.

All named members, including the lead, must have one accepted confirmation for the current team version and current student version. These are trusted test inputs, not a new live invitation feature. Duplicate member IDs/stable identities, missing/declined/ambiguous confirmations, stale roster versions and wrong academic scope block routing. No annual-plan item is required. Existing fee, attendance or performance restrictions are not introduced. Technical fixture bounds are not institutional group-size policy.

Successful output names exactly one lead reviewer and a configured final authority with assignment references. It only means READY_FOR_FIRST_REVIEW; it never authorizes execution, assigns a mentor, approves a proposal or populates any queue. Optional expectedBinding lets a future caller reject changed proposal/team/student/assignment/policy bindings before acting; the future save still needs server re-resolution and existing workspace CAS. Real roster, assignment, availability and policy adapters remain required.

## Evidence and next step

check-intake-routing-pilot.mjs covers both routes, scoped faculty fallback, unknown availability, competing reviewers, final role configuration, stale inputs, dates/expiry/revocation, same-person review, member/course checks, detached results and unchanged live sources. Existing intake, mentor, support, notification and report suites provide separate regression evidence. Browser/institutional acceptance remains Not run. No live records seeded, no schema/route/command/permission changes.

Next: implement an isolated minimal student-directory projection and invitation/acceptance model, with privacy-scoped search and versioned membership consent, before connecting this resolver to live intake. Preserve current intake history and the existing mentor/support/execution workflows. Full demonstration data and semester/year progression remain deferred.
