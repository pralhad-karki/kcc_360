# Whole-committee approval — isolated pilot, Stage 126

2026-10-19. Proposed policy model only. No live role authority, committee appointment, term completion, handover or website publication changed.

## Minimum scope

A pure helper models one club/cycle committee proposal with named stable-person IDs, positions, responsibilities, active membership references and term dates. The supplied roster version and source fields bind every decision. DRAFT → SUBMITTED → MENTOR_VERIFIED → SA_REVIEWED → APPROVED. Mentor checks the committee eligibility/responsibilities, Student Affairs reviews the complete proposal, and an explicitly scoped final approver represents Principal/delegated authority in this proposed arrangement. The existing SRS permits authorized mentors/administrators; this pilot does not silently amend that authority or assign a demo account as Principal.

Explicit caller-supplied trusted grants are required for every capability and default to none. Each grant has stable person, club, cycle, version, validity and revocation data. Earlier accepted grants are rechecked before subsequent decisions. Proposed independence controls prevent nominees/proposer approving their own committee and prevent one person filling multiple review stages through role aliases. This is a pilot policy choice for review, not an adopted institutional rule. No numerical academic, attendance or conduct eligibility threshold is invented. Active membership alone is not a claim that all eligibility rules are satisfied: that assessment remains the mentor's recorded judgment against approved rules.

Each review/return requires a reason. The next reviewer can return the proposal. Revision creates a fresh committee version with no carried-forward approvals and retains all previous source snapshots/decisions. An approved version can be superseded through a fresh draft; earlier approval is retained historically, while the new version needs the full sequence. Stale revision, changed roster/source/term, revoked or changed earlier grant and invalid dates fail closed. Input records are copied, not mutated. Pilot timestamps and grants must come from future trusted server loaders, never request fields. The helper is not an authentication boundary, general-purpose record tamper validator or storage transaction.

## Preserved workflows and remaining work

Existing mentor appointments and Student Affairs activation/renewal are unchanged. An approved pilot is not an active live committee, financial clearance, verified handover, outgoing-term completion or permission to run activities. There is no live persistence, API, dashboard queue, consent, public snapshot or website transport. Current committee versus former-team views need a scoped projection linked to existing leadership/term/handover history before any integration. Bulk member replacements must not overwrite historical appointment or activity responsibilities.

A later publication step should select the approved current committee version, minimize fields, obtain required member photo/name visibility decisions, and use separate editorial approval, exact-version delivery and acknowledgment. Private eligibility reasons, contact details, reviews, finances and handover documents must not flow into that snapshot. Existing activity delivery is not automatically a committee payload. Approval does not mean published. Transport remains disabled.

## Validation

check-club-committee-pilot.mjs verifies the complete sequence, scoped/default-deny grants, expiry/revocation/changed earlier authority, stage ordering, independent stable-person review, stale/source-change rejection, valid dates/active nominees/duplicate appointment checks, return/revision and immutable previous versions. Existing club/membership/evaluation/audit tests, TypeScript and build are separate regressions. All data is fictional and local. No live records or full demonstration dataset created. Browser/institutional policy acceptance is Not run.

Next: assess a trusted read-only adapter from existing club membership, leadership and handover records, including current/former committee projection and authority-source dependencies. Keep final approval and publication disconnected until those bindings and approved policy are explicit. Semester/year progression remains deferred.
