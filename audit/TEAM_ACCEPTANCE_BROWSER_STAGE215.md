# Stage 215 — Negative HTTP probes, shared evidence and partial mentor review

22 October 2026 · Asia/Kathmandu · Production baseline f37bf8f7ad7e9afacd52b448ede79d42507fb3a9. Disposable browser run: Stage 212 application assets with Stage 214 adapter; this stage adds self-test-only HTTP probes. Production assets, database, provider configuration, authority and deployment are unchanged.

## Explicit negative checks

`node scripts/team-acceptance-server.mjs --self-test` now makes real loopback HTTP requests to the local adapter and existing trusted dispatcher. It denies non-lead assignment preparation and save (using a complete request with a valid lead preview), peer-task progress read, a valid-field TO_DO/no-change progress report, an invalid DONE report, and blocked task submission preparation/save. Each denial must return 403 and leave the serialized workspace and audit unchanged. Authorized blocker and clearance reports preserve two prior execution snapshots, leave submissions absent and keep done=false. These changes occur only in the self-test's own in-memory workspace.

The first development run used TODO instead of the valid TO_DO no-op value. That could demonstrate invalid input denial but not a valid no-op; it was corrected to TO_DO and rerun successfully. The blocked-save probe reuses the last pre-block submission token because blocked preparation is itself denied; it demonstrates rejection of that attempt, not isolation of every possible stale-token/blocked reason. Existing server submission tests provide additional blocked/source guard evidence.

This closes the previously missing local negative probes for W10-02/W10-04. Their Pass dispositions combine Stage 214 browser UI observations with Stage 215 local HTTP evidence, not a new deployed-route or institutional security acceptance. Previous Blocked attempts remain preserved.

## Browser execution

Fresh fixture project `a9d1fae6-26bc-41cf-b523-69a582414843`, revision 35 initially. Frozen fixture time was 2026-10-19T12:30:00.000Z; browser execution occurred 22 October. Personas s2, s1 and s7 were separately mapped fictional people. No real student or official result was used.

### W10-06 — Pass, isolated browser

s2 submitted new evidence titled W10 shared fictional survey, with a fictional pilot description and own contribution: Student s2 designed the fictional questionnaire (revision 36). s1 selected that exact unverified shared evidence, left all new-evidence fields empty, and supplied a different contribution: Student s1 independently interpreted the fictional pilot findings (revision 37).

s1's expanded history showed only s1's contribution, evidence reference #1, the shared frozen evidence title and Awaiting mentor review. It did not copy s2's private contribution. The independent mentor overview showed one shared-evidence verification entry and two distinct individual review entries, both unverified/incomplete.

### W10-07 — Pass, isolated browser

s7 opened the s2 individual review. The preview displayed the s2 contribution and exact criteria, unverified shared evidence, and Evidence not verified — completion unavailable. The decision selector offered only partial work or return for revision; verified completion was absent.

The mentor explicitly selected partial work, Concept 0 / 4 and left Skills/Leadership/SDG Impact Not assessed. Entered fictional feedback, declared independence and confirmed. Revision 38 displayed Partial work — not verified complete, the saved feedback, Concept 0 / 4 and the three blank scores as Not assessed. The activity remained Started. s1's separate submission remained awaiting review.

After switching to s1 and reopening the activity, the overview showed only s1's private history. The s2 result displayed the partial-work status and an explicit restriction message; private feedback and scores were absent. Shared evidence therefore did not grant peer assessment access.

## Scope and next task

W10-01,03,05,06,07 have isolated browser evidence (03 also has separate automated history support). W10-02/04 use explicitly mixed UI/HTTP evidence. W10-08–16 remain Not run. No claim is made for institutional acceptance, actual MIS sign-in, full application HTTP authentication, task completion, activity completion, academic credit or live activation.

Next: execute W10-08–10: student revision with genuine-change validation, shared evidence verification without automatic task completion, and fresh independent revised-work assessment with original history preserved. Use a documented fresh fixture run; stopping the current preview discards its data. Preserve current live disabled defaults and all previously approved workflow boundaries.

Validation: extended adapter self-test PASS; syntax and whitespace PASS. No production runtime edit or build required. Preview stopped after observations; no browser screenshots or real private data saved.
