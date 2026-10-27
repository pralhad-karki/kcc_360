# KCC360 current requirements

The current user-confirmed specification is `KCC360_Master_SRS_v3_4_Event_Management_Public_Registration_Payment.docx`, supplied on 25 October 2026. Its bytes are unchanged. The retained v3.3 file remains an earlier baseline.

See `audit/SRS_INCREMENTAL_CHANGE_MATRIX_STAGE255.md` for the retained 35-module review and `audit/SRS_V34_CHANGE_MATRIX_STAGE257.md` for v3.4 additions and supersessions. Requirements are not implementation evidence. Version 3.4 retains AP-001 and Annex M; new Annex P acceptance criteria remain NOT RUN.

Preserve existing code, records, completed learning/attendance/certificates and audit history. Continue incrementally in the same application. No production payment provider or website registration service is activated by specification adoption.

The subsequent user-confirmed department event-task/student-data clarification is in `KCC360_Department_Event_Task_CSV_Addendum.md`. See Stage260 audit evidence for implemented task CSV/manual role control, preserved club/proposal routes and pending student-master/live MIS boundaries.

The confirmed interim official MIS transfer requirements are retained in `KCC360_Manual_MIS_Import_Confirmed_Addendum.md`. Stage261 adds tested student reconciliation/save services only; real upload transport, institutional activation, Excel and enrollment imports remain pending. See `audit/STAGE261_MANUAL_MIS_FOUNDATION.md`.

Stage262 adds protected CSV/XLSX byte decoding, private upload staging, recovery/purge and provenance-bound commit services. The actual API remains disabled pending approved institutional staff and storage configuration. See `audit/STAGE262_MIS_UPLOAD_STAGING.md` for test evidence and limits.

Stage263 extends the existing private import services with normalized academic structures and enrollment history, read-only class/course roster projection and reconciliation against a separate official local-progression snapshot. It adds no official progression command or live activation. See `audit/STAGE263_ACADEMIC_IMPORT_HISTORY.md`.

Student Affairs responsibilities cover club events, placement and wider student-development services as clarified on26 October2026; see `KCC360_Student_Affairs_Responsibility_Addendum.md`. Stage264 removes the legacy club final-approval shortcut and records unit endorsement separately; institutional final review/execution and full placement/departmental monitoring remain incomplete.

Stage265 adds owner-demo Student Affairs department draft planning across the six confirmed service areas, a DEPARTMENTAL source adapter for shared M30/AP-001 review, and factual club monitoring. Placement/internship outcome reporting and full departmental monitoring/evaluation remain incomplete; see `audit/STAGE265_STUDENT_AFFAIRS_DEPARTMENT_PLANNING.md`.

### Stage 266 — Student Affairs internship monitoring

The department page now receives a count-only server projection of the existing owner-demo internship workflow: placement, letter, start authorization, execution-source validity and independent final review remain separate. Private case access and evaluation/signing authority are unchanged. Job-placement cases and institution-wide internship outcome rates remain unavailable. See [Stage 266 implementation and verification](../audit/STAGE266_STUDENT_AFFAIRS_INTERNSHIP_MONITORING.md).

### Stage 267 — Approved club calendar and target hierarchy clarification

Protected finally approved club activities now feed the Student Affairs owner-demo dashboard, preserving approved dates while an amendment is pending and replacing them only after final successor approval. Legacy approval labels do not qualify. Principal-issued departmental targets and stable club/KPI allocations remain next. See [implementation and evidence](../audit/STAGE267_APPROVED_CLUB_CALENDAR.md) and the updated [Student Affairs clarification](KCC360_Student_Affairs_Responsibility_Addendum.md).

### Stage 268 — Annual departmental target backend

Added default-disabled Principal target issuance and atomic audited persistence using the shared permission resolver and existing storage schema. Targets reference a supplied approved strategic catalogue, department, cycle, KPI/version and explicit event scale. Earlier versions survive correction; repeated operations are idempotent. No official catalogue, Principal account, target-entry UI, club allocation or live provider is installed. See [backend implementation, tests and remaining dependencies](../audit/STAGE268_ANNUAL_DEPARTMENT_TARGETS_BACKEND.md).

### Stage 269 — Department/club target allocation backend

Added explicit authorized allocations of current issued target versions to department-retained work and registered clubs. Exact decimal capacity checks, duplicate prevention, immutable corrections and the existing atomic audited writer are tested. Allocation does not approve a plan or establish achievement. Live providers/screens and specific plan-item bindings remain pending. See [implementation, evidence and limits](../audit/STAGE269_DEPARTMENT_CLUB_TARGET_ALLOCATION.md).

### Stage 270 — Allocation links to draft plan items

Restored the published Version 281 source after workspace maintenance. Added default-disabled backend links from exact target/allocation versions to existing draft department/club plan items, with dual scoped permissions, contribution limits, source snapshots, protected-plan denial and atomic source revision checks. These prepared links do not yet form part of AP-001 approval snapshots. A scoped text review identified the current v3.7 strategic/monitoring annexes; this is not full v3.7 acceptance. See [implementation, recovery and evidence](../audit/STAGE270_ALLOCATION_PLAN_ITEM_BINDINGS.md).
