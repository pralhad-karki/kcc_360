# Confirmed manual MIS transfer requirements — 25 October 2026

Applies alongside SRS v3.4. Preserve the existing implementation, records, audit trail and approved authentication boundary. Manual transfers are official MIS-sourced records; they are not fictional fixtures and do not independently certify every field. E-Digital Nepal remains authoritative. No vendor endpoints, credentials or undocumented export columns are assumed.

## Required workflow

Upload → validate → preview differences → resolve errors → authorized explicit confirmation → atomic commit → import report. Support CSV/Excel for available student masters, stable source IDs, structures, programme/batch/semester/section, enrollments/class/course rosters, faculty/subject assignments, official status and supplied effective exit dates. Use actual export-compatible configurable column mappings or documented templates.

Identity is the tuple source system + institution + stable source identifier. Never match names/email alone. Preview new/changed/unchanged/duplicate/invalid/conflicting rows. Record file provenance/fingerprint, export/upload times, uploader, mapping version, declared full snapshot versus incremental mode, counts and results. Missing rows never delete, deactivate, or infer exit. Preserve enrollment/period/faculty history. Reject stale changes or reconcile; repeated imports must not duplicate entities. Define atomic commit, correction and audit behavior. Protect personal data with scoped authorization, private storage and validation. No passwords, sessions or roles may be created by data imports. Keep test fixtures separate.

## Planning and assignment

Upload strategic/annual plan → event → task group/team → individual task → responsible student/person, including applicable objectives/dates/budget references/team number/capacity/deliverables/evidence/mentor/evaluator. Validate stable parents and prevent duplicates. Uploaded plans begin as drafts. Approved locks require formal changes with responsible unit → Finance Administrator → Principal approval; uploads cannot bypass locks.

Academic workshop/seminar tasks are directly assigned by the Academic Department and assigned subject teacher/mentor using appropriate rosters, manually or through uploads, with eligibility/workload/permission checks. Students do not apply for these assignments. Club positions use capacities/eligibility/deadlines → student applications → authorized selection → confirmed execution teams. Student academic/research proposals and accepted groups retain established Academic/Research Department review and mentor routes.

## Progression and future API

Authorized cohort progression selects programme, batch, academic session and current semester, previews the exact cohort/effective date, and excludes only official Left College records whose exit date applies to that date. Missing/contradictory exit dates require explicit resolution. Fees, attendance, failed subjects, backlogs and incomplete evaluations do not block progression. Workload checks do not become progression exclusions. Preserve historical mappings, learning records, projects/contributions/evaluations; prevent duplicate progression and audit corrections. Final-semester completion is separate.

Distinguish local progression from latest imported MIS enrollment. Never claim MIS writeback. Reconcile later exports without reversing progression silently, overwriting history or progressing twice. Manual and future API adapters share normalized identities/validation/reconciliation. Switching transport must not recreate people or duplicate enrollments. API transfer does not establish SSO/login.

## Incremental implementation evidence

Stage261 starts from clean source a022b0f542f9286c9075bc58bbfa8cf6fb725f7e, published Version272. Its audit matrix distinguishes implemented backend foundation, existing partial coverage, and pending capabilities. No actual institutional export or approved live staff identity provider has been supplied.
