# Student-directory search — Stage 128

2026-10-19. Pure isolated search helper; not a live directory screen, endpoint, MIS lookup, invitation sender or membership grant.

The next shared foundation is a privacy-scoped student directory, followed by versioned invitations/acceptance and then first-review integration. Event volunteer recruitment should reuse that foundation rather than create a parallel student roster. Operational event domains, positions/capacities, applications/selection, domain-lead delegation and recruitment reports remain planned work. Existing club events and their historical participant lists are unchanged.

## Behavior and source contract

Only the current proposal lead's stable person can search while the proposal is DRAFT or RETURNED. One explicit current unrevoked STUDENT_DIRECTORY_SEARCH grant must bind that person, institution, proposal ID and proposal version. No grants are provisioned. Caller must authenticate and load the trusted proposal, student roster, grant registry and server time; this pure helper is not an authorization boundary by itself.

Same-batch academic search requires the lead and returned students to match the proposal's programme/batch/semester/course. Filters cannot broaden those fields. Multidisciplinary research permits institution-scoped cross-programme/department search. Both exclude inactive student records, the lead's own person, missing source fields and ambiguous student/person identities. ACTIVE here is the trusted roster status, not an engagement, fee, grade or attendance threshold. The university/MIS authoritative status mapping still requires confirmation; this does not implement progression rules.

Results include only student ID/source version, display name, department, programme, batch and semester identifiers. Contact details, financial data, grades, private declarations, eligibility narratives and underlying roster rows are omitted. Names/IDs support bounded case-insensitive normalized search (minimum two characters), optional programme/department/batch/semester filters and deterministic pages of at most 20 rows. No full-list count, download or public link is exposed. A future live UI must escape returned display text, reauthorize every page and recheck the exact selected student before issuing an invitation. A search result does not add a member or grant access to the project.

## Validation and remaining stages

check-student-directory-pilot.mjs covers author scope, current grants, invalid/duplicate/out-of-scope grants, minimal fields, name/ID and normalized search, paging, programme/course restrictions, research cross-programme filters, inactive/cross-institution exclusion, ambiguous identities, input immutability and unchanged live workflow files. All data is fictional/local; no demonstration roster was populated. Existing routing/intake/mentor/support/report suites are run separately. Browser, institutional and real MIS API acceptance remain Not run.

Next: isolated versioned team invitations, accept/decline and withdrawal/replacement, preserving history and requiring fresh confirmation after affected team/source changes. Then connect confirmed membership to the routing resolver and existing intake screens/notifications. After that, add event-specific positions/applications/selection and domain-lead task scope using the same identity foundation. Full demonstration data and semester/year progression remain deferred.
