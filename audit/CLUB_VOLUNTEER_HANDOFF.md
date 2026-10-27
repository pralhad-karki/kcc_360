# Stage 148 — Selected-volunteer roster handoff

Minimum change: one explicit organizer command in the existing shared workspace and event Overview. Existing club/event authority, routes, SQL schema and workspace revision controls remain in place.

The preview lists all selected applications not previously handed off, additions versus already-enrolled students, existing roster size and pending application count. Submission recalculates the complete selection and checks source currency, membership, unique application identities, position capacity, participant outcomes and the preview basis. Any failure rejects the complete handoff. The command derives students from saved selections, never request-supplied student IDs.

Existing participants, tasks, attendance, evaluations, evidence, portfolios and certificates are retained. Already-enrolled selections are recorded without duplicate roster entries. New selections can be handed off in a later version; each selection is recorded once. Each batch records application revisions, position references, actor, time, reason and whether an entry was added. Workspace CAS and audit persistence continue through the existing save pipeline.

Handed-off decisions cannot return to pending through application review: subsequent participant changes use the existing participant-outcome process. A resolved participant is never reactivated by handoff. Pending applications are not enrolled and do not block other selected applicants. Enrolment creates no task assignments or achievements.

Internal handoff history is removed from ordinary project projections; existing organizer/mentor/Student Affairs read access is reused. Existing legacy club-event rosters are not converted into selection-only rosters.

Validation: `check-club-volunteer-handoff.mjs` exercises actual engine commands and projections, authorized and denied actors, membership/capacity/source/outcome/duplicate failures, stale previews, replay, legacy enrolment, access after handoff, privacy, record preservation and correction lock. Full local regression evidence is in `AUTOMATED_BASELINE_STAGE148.json`. Browser, keyboard, PDF and institutional acceptance remain Not run.

Pending: domain-lead delegation and task-monitoring alignment, followed by the evaluation → verified achievement → portfolio/report chain. No full demonstration data or semester progression was introduced. Real identity, multi-role grants, MIS integration and institutional acceptance remain separate gates.
