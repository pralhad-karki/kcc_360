# W-01 — Student proposal, routing, mentor and research-support acceptance

Status: Browser / institutional walkthrough not run

Preparation through accepted responsibilities only. Not activity approval, execution authorization, host acceptance, financial commitment or website publication.

Use a designated acceptance workspace or agree before adding one clearly labelled fictional proposal to the shared prototype. Do not reset existing records. This guide creates no records and does not populate the demonstration dataset. Record the generated intake ID and versions; use that exact record across roles.

Aarati Sharma (s1); Programme Coordinator (c1); Dr. Maya Adhikari (m1); Research Coordinator (r1). Bikash Rai (s2) checks peer denial; Dr. Nisha Shrestha (m2) is an optional reassignment test. These are fixed demo personas, not real institutional grants.

Proposed fictional title: QA-W01 Research Methods Project. Type Project; programme BCA; semester 3; course QA-W01 (descriptive only, not MIS assignment). Purpose: explore a supervised study. Outputs: methods note and activity report. Primary unit Academic; supporting unit Research; no club. SDG 4. Choose a start date after today in Nepal and an end date after the start; record an alignment reason and draft-change reason.

## Step 1 — Aarati Sharma (s1)

Navigation: Dashboard → Activity Intake → + Initiate activity

Action: Enter the proposed fictional fields above and save the draft. Record its intake ID and revision.

Expected: One own DRAFT intake exists. No project, club membership or budget is created.

Record: Intake ID/revision and visible DRAFT state; browser result not recorded.

## Step 2 — Aarati Sharma (s1)

Navigation: Activity Intake → same record → Open detailed process → Submit to coordinator

Action: Confirm the current draft and submit it once.

Expected: State SUBMITTED; the submitted revision is retained and editing is locked. Coordinator receives a current routed action.

Record: Submitted revision and coordinator action; browser result not recorded.

## Step 3 — Programme Coordinator (c1)

Navigation: Dashboard → Activity Intake → same record → Open detailed process → Review routing

Action: Return to student with reason: clarify expected methods output.

Expected: State RETURNED with the decision reason. The original submitted version remains in history; coordinator review action resolves.

Record: Return reason and retained submission; browser result not recorded.

## Step 4 — Aarati Sharma (s1)

Navigation: Dashboard → Activity Intake → same record → Edit draft

Action: Clarify outputs, save a new revision with reason, then Submit to coordinator.

Expected: New submitted revision; previous content and return decision remain unchanged. No duplicate intake is created.

Record: Old/new revision references; browser result not recorded.

## Step 5 — Programme Coordinator (c1)

Navigation: Dashboard → Activity Intake → same record → Open detailed process → Review routing

Action: Confirm Academic as primary and Research as supporting unit, with a routing reason.

Expected: State ROUTING_CONFIRMED. Proposed alignment and confirmed routing remain distinguishable. No activity approval or execution is granted.

Record: Confirmed routing and reason; browser result not recorded.

## Step 6 — Programme Coordinator (c1)

Navigation: Same detailed intake → Lead mentor assignment → Assign lead mentor

Action: Choose Dr. Maya Adhikari. Enter expertise/fit, availability assessment and assignment reason.

Expected: One current REQUESTED mentor assignment; the mentor receives an assigned action. No acceptance is inferred.

Record: Assignment ID/version and REQUESTED state; browser result not recorded.

## Step 7 — Dr. Maya Adhikari (m1)

Navigation: Dashboard → Activity Intake → same assigned intake → Open detailed process → Accept assignment

Action: Review current activity and assignment; confirm availability/no unresolved conflict and provide reason.

Expected: Current assignment ACCEPTED. Supporting-unit requests can now be defined; activity execution is still unauthorized.

Record: Accepted assignment/version and resolved mentor action; browser result not recorded.

## Step 8 — Programme Coordinator (c1)

Navigation: Same detailed intake → Supporting-unit responsibilities → Research → Define / request support

Action: Set responsibility: review methods; deliverable: written methods feedback; valid completion date within the proposed activity and reason.

Expected: REQUESTED support goes to Research Coordinator only. Research sees scoped supporting information, not unrestricted student history.

Record: Support request ID/version, recipient and stated deliverable; browser result not recorded.

## Step 9 — Research Coordinator (r1)

Navigation: Dashboard → Activity Intake → assigned intake → Open detailed process → Accept responsibility

Action: Confirm authority for the stated support and provide an acceptance reason.

Expected: Current Research support ACCEPTED; its pending action resolves. Student/coordinator can see all required support accepted. No new approval, finance, membership or execution rights arise.

Record: Acceptance/version and resolved research action; browser result not recorded.

## Negative and exception checks

- **Peer access:** Switch to Bikash Rai (s2) and check Activity Intake for the recorded intake ID. Expected: The peer intake and its private decisions are not readable or editable.
- **Required fields and date validity:** Before initial save, attempt an end date before start or omit purpose/output. Correct the form afterward. Expected: Invalid entry is not saved; current valid records remain unchanged.
- **Stale or duplicate action:** If a stale form remains open after another valid decision, attempt its earlier action; repeat a completed submission where available. Expected: No duplicate submission or overwritten newer decision. Record actual conflict/rejection behavior; automated context/version denial does not prove browser behavior.
- **Mentor reassignment (optional branch):** Coordinator withdraws the current assignment with reason and assigns Dr. Nisha Shrestha. The new mentor must accept afresh. Expected: Previous assignment is historical; former mentor loses current intake responsibility, and affected support commitments require fresh acceptance.
- **Declined research support (optional branch):** Use a revised support request to exercise Decline, then coordinator withdrawal/revision and fresh acceptance. Expected: Decline reason/history persist; readiness is not shown as complete until current support is accepted.

Record tester/date/timezone, site version, intake/assignment/support IDs and versions, each step as Not run/Pass/Fail/Blocked, expected versus observed result and any defect reference. Keep notes appropriately restricted; do not attach private records to public reports. A passing walkthrough does not sign off MIS identity, multi-college isolation or production integration.

Automated evidence: check-activity-intake.mjs, check-intake-mentors.mjs, check-intake-support.mjs, check-role-dashboards.mjs

W-02: internship placement approval, formal approach letter and host/readiness controls. General project intake must not be represented as automatically converted to an execution workspace.
