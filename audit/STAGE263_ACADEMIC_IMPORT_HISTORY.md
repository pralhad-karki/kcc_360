# Stage263 — academic structure/enrollment imports and progression reconciliation

## Preserved checkpoint

Sites confirmed latest Version274. Started with clean source `1c4d3d0cb5f083dbe4e44ac942395111c935b553`. Existing owner authentication, private staging, plan approval locks, department assignment rules, club recruitment, proposal routes, fictional adapters/cohort ledger and learning histories remain intact. No production database or personal-data object was created or changed.

## Coverage and implementation

| Requirement | Prior coverage | This increment |
|---|---|---|
| Official academic structures | Fictional normalized MIS adapter; existing local programme settings | New normalized structures: programme, batch, academic session, semester, section, course. Stable typed IDs, explicit parents, semester sequence/final marker and versioned column/value mappings |
| Enrollment/class/course rosters | Fictional MIS enrollments; local/demo event rosters | Stable enrollment IDs + exact student and structure references; explicit class versus course records; current/historical status and optional supplied effective dates |
| Same upload/validation/save path | Student CSV/XLSX staging + atomic save | Dispatcher extends existing staging, decoder, HTTP service and one SQL writer; no second upload module or recruitment process |
| Academic history | Existing learning snapshots | Separate academic ledger with append-only reports containing before/after records for every observation; no missing-row closure, deletion or status inference |
| Reconciliation with local progression | Fictional cohort comparison only | Read-only comparator over an explicit trusted official local-progression snapshot; later old/divergent MIS placement blocks commit for reconciliation; matching MIS observation commits without advancing anyone |
| Current class/course roster reading | Local/demo task roster references | Read-only imported-roster projector; exact scope/date selection and stable IDs; explicitly grants no assignment/progression permission |
| Production activation | Disabled institutional import service | Remains disabled. Approved staff/source/storage mapping, actual headers and ledger provisioning still required |

## Normalized contract and limits

The field names are KCC360's internal contract, **not assumed E-Digital Nepal export fields**. Actual export headers and enum values must be configured. Academic mappings have `version`, `columns`, `valueMaps`; allowed enum maps are structureKind/finalSemester or enrollment status. Parent and source IDs must be explicit; names/email are never identity keys. IDs retain leading zeros. Existing CSV/Excel bounds and Excel text-cell rules apply.

The bounded first structure model uses programme roots, programme-owned batches/semesters/courses, independent academic sessions, and semester-owned sections. Enrollment supplies programme+batch+session+semester and optional section/course. Structures are imported before enrollments; rows within a structure file can reference parents elsewhere in that same file in any order. Exports that need a different authoritative structure relationship require an explicit mapping/schema extension, not invented parent IDs. Semester sequence is supplied, never guessed from labels. Final-semester marker may remain unknown; no completion decision is inferred from the maximum semester number.

Structure identity is source+institution+entity kind+stable ID. Enrollment identity is source+institution+stable enrollment ID. Duplicate physical enrollment tuples under different IDs, multiple current class placements for the same programme/batch/session, missing/foreign parents and stable-ID reassignment are conflicts. Multiple current course enrollment rows are permitted, including different courses/periods, so backlogs are not treated as a progression bar. No academic eligibility filtering uses fees, attendance, grades, backlogs or incomplete evaluations.

Supplied optional dates are ISO calendar dates; roster projection treats both endpoints inclusively. Omitted optional section/course/date columns preserve existing values; explicit mapped blanks undergo validation. Actual vendor date semantics must be documented before translating a vendor export. CURRENT/HISTORICAL is explicitly mapped, not inferred from a missing row or elapsed date. A later explicit HISTORICAL record can accompany a new CURRENT record atomically. Same-ID semester observations retain their prior mapping in before/after report history; no learning/project/task snapshot is rewritten.

Label changes with newer source timestamps can commit. Parent/semester-sequence/final-marker changes to an existing structure, or reassignment of an enrollment ID to a different student/programme/batch/session, require reconciliation and cannot be force-imported. Equal-time contradictory or stale observations also require reconciliation. No override/correction UI was added; pending cases remain in protected staging until resolved through an explicit future reconciliation workflow.

## Persistence and authorization

`server/mis-import-dispatch.mjs` selects the existing student ledger or new institution-private `KCC-MIS-ACADEMIC:<institutionId>` ledger. `saveMISImport` reuses the existing atomic D1 CAS+audit implementation; `saveMISStudentImport` remains a backward-compatible alias. Existing student request/report contracts are preserved. The shared SQL writer guards relevant student/staging/local-progression ledger revisions in the same transaction, as well as target revision and authorization fence. There is no independent enrollment write that can skip confirmation or audit.

Academic operation requires server configuration `academicImportsEnabled`, current trusted `canImportAcademics` and a correctly scoped provisioned academic ledger. These are server-side controls, never file metadata roles. Local progression mode must explicitly be NOT_INSTALLED or INSTALLED. INSTALLED requires the private `KCC-LOCAL-PROGRESSION:<institutionId>` snapshot with `KCC360_LOCAL_PROGRESSION_V1` contract and APPLIED records; its revision is a transaction dependency. The existing MOCK cohort ledger is not accepted or relabelled as official local progression.

No new SQL migration is needed for this bounded storage increment because it uses existing workspace/audit tables and alters no existing rows. No production ledger is auto-provisioned. The existing 2MB ledger/1,000-row/CSV-byte limits remain; indexed large-volume history storage is still a later migration. A size failure occurs before a write.

## Progression reconciliation boundary

For current class enrollment only, compare exact student/programme/batch/session and effective date against trusted local progression:

- MIS_ONLY: no matching local progression record.
- MIS_BEFORE_LOCAL_EFFECTIVE_DATE: source export predates the applicable local effective date.
- MIS_CONFIRMS_LOCAL_PROGRESSION: imported semester equals the locally recorded destination; record the MIS observation without progressing again.
- MIS_BEHIND_LOCAL_PROGRESSION or MIS_DIVERGES_FROM_LOCAL_PROGRESSION: require reconciliation; do not commit that batch or modify local history.
- Ambiguous same-date local progressions or invalid source structure references: block for review.

No local progression operation, MIS writeback, SSO, final-semester completion, official exit-date cohort filter or audited progression correction command was added here. Those must use the real normalized ledger in a later increment. Existing fictional cohort tests still cover their earlier boundary; they do not demonstrate official effective-exit-date progression acceptance.

The comparator validates stable references and ordinary adjacent semester transitions. The future official progression writer must enforce cohort authorization, duplicate prevention, approved correction history and final-semester handling. It must not manufacture local records to satisfy reconciliation. Historical course enrollments do not become class progression decisions.

## Actual verification

See STAGE263_ACADEMIC_TEST_OUTPUT.txt for26 academic cases: out-of-order parents; malformed/unknown/duplicate/stale imports; reference and current-placement conflicts; explicit historical transitions; immutable reports; replay; academic permission gates; local progression before/behind/matching/ambiguous/invalid references; exact SQLite SQL transactions, audit rollback/concurrency/dependency fences; real pinned XLSX and CSV staged imports; read-only roster projection.

STAGE263_STUDENT_TEST_OUTPUT.txt retains23 foundational student checks; STAGE263_STAGING_TEST_OUTPUT.txt retains26 staging checks; STAGE263_ROUTE_TEST_OUTPUT.txt retains compiled disabled-route checks. An invalid-status preview defect found while extending the mapper was corrected: unknown/prototype-named status values now classify as invalid rows rather than failing canonical digest generation. Canonical hashing now tolerates undefined values in invalid previews; valid request digests remain unchanged. The final23-case student suite includes the new status case.

The broad report STAGE263_REGRESSION.json runs51 groups. It began before the additional student-status test/fix and final progression-mode guard, so the final focused student/staging/academic/route checks were rerun separately after that change. TypeScript and production build are checked; final packaging repeats the build after final source changes. No new UI was created; no browser upload, live native R2/D1 institutional transaction, actual MIS export or institutional acceptance test is claimed. Test data is fictional and SQLite databases are in-memory.

## Remaining dependencies and next increment

Approved institutional identity/storage configuration, actual export headers and live provisioning remain activation dependencies. Staff upload/mapping/reconciliation UI, faculty/subject assignments, course offerings, richer curriculum structures, indexed history scaling and full institutional acceptance remain incomplete. Official enrollment is now represented independently from local progression. Next implement real normalized cohort preview/progression using programme/batch/session/semester, applicable official exit dates, duplicate prevention and audited correction, preserving the independent final-semester route.

Final targeted closeout also verifies that INSTALLED mode requires its scoped progression snapshot and NOT_INSTALLED cannot hide a supplied nonempty official progression ledger.26 academic,23 student and26 staging cases pass after that guard; the51-group broad result remains separately retained.
