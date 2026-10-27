# Stage 240 — read-only saved mock batch comparison

Recovered baseline: clean d92484839989ac4c953f3d5a6184ed4845d037a1, published version 251. Existing architecture, database schema/migrations and completed workflows preserved.

## Completed

- Added `compareMockCohortBatch` alongside the existing pure lifecycle. It reads one captured saved batch/source/placement snapshot and returns only batch identifier, original content digest, ledger revision, checked timestamp, status, bounded reason codes, readOnly true and officialWriteBack false. It returns no roster rows, placements, contacts, credentials, candidate ledger or permission grant.
- Pending records are Current only when their original content binding is intact, independent approval is consistent where required, current normalized planner result exactly matches the saved preview, and every before placement/enrollment matches the isolated ledger. Changed source/structure/cohort/membership/student/placement data produces Stale with explicit bounded categories.
- Invalid/expired/ambiguous/unavailable source or configuration produces Unavailable, rather than guessing a current preview. Invalid saved content/approval binding produces Blocked. Applied/rejected/withdrawn records are Historical and cannot enable progression. Adverse fee/grade/attendance/hold fields remain outside inclusion and comparison rules.
- Dedicated batch GET returns comparisons separately from original batch records. It does not persist comparison state or increment ledger/audit history. After asynchronous comparison it checks ledger revision and active account again; a competing update/account change returns a conflict. Comparisons are generated sequentially with only the selected record and placements captured, avoiding copies of all previous batches/history in each diagnostic.
- The dashboard validates comparison coverage/identity/content/revision/status/reason/read-only bindings, displays the checked time and human-readable reasons in list/details, and offers approval/rejection/application only for a Current pending record within the existing role rules. Original snapshot and decisions remain visible. Coordinator withdrawal of intact pending batches remains available without a current source/comparison.
- After any successful save, client comparison results are discarded. A fresh GET is required before further review/application; there is no optimistic diagnostic carry-over or command replay. The UI explicitly says every save checks current data again. The comparison is a point-in-time aid, never authority for later mutation.

## Validation

Passed `check-cohort-progression-comparison.mjs`: Current pending/approved; source, structure, cohort, membership, student status/version and placement conflicts; unavailable/expired/ambiguous/configuration sources; invalid saved binding/approval; Historical terminal records; ignored adverse/private fields; no mutation or raw/private output; and continued server mutation rejection for every stale case.

Expanded actual SQLite route/service/store checks verify unchanged persisted ledger/audit on comparison reads, separate nonpersisted reports, bound source/content/revision/read-only fields, stale source status, unavailable pending versus Historical retired status, rejected client-supplied comparison fields, and conflicts when account or ledger revision changes during comparison. Existing authorization/privacy/atomic audit/uncertain-save/withdrawal checks remain passing.

Expanded VM client checks verify Current and bounded Stale explanations, hidden approval/rejection/application for stale reports, retained withdrawal, Historical controls, malformed/missing/forged comparison denial, and existing request/late-response/account/dialog/uncertain-save guards. Existing core, withdrawal, preview API/client, academic progression, MIS/SSO isolation and shared server regressions pass. TypeScript no-emit and production build pass.

Added the pure comparison command to the reusable runner, now 32 configured commands. No fresh aggregate 32-command run is claimed; earlier aggregate evidence remains historical.

## Browser evidence

Actual scripts and API/service/store/core ran in a disposable local checkout with fictional in-memory SQLite, owner stub and the existing narrow HTTP fixture. Coordinator prepared a six-member/five-included/one-Left-College mock proposal, refreshed and opened details: Current status, checked time, original before versions and counts were visible. At 320 px frame width, modal clientWidth/scrollWidth were both 256 px and named H2 held focus. After reasoned withdrawal and refresh, the original record showed Historical with withdrawal details and zero repeat withdrawal/application controls. Ordinary shared workspace stayed revision 0/unplaced; all writes were to the ephemeral fictional ledger. Preview stopped afterward.

Stale/source-outage/forged-report and concurrent-read scenarios are proven by core/API/client tests, not a browser source-outage simulation. Full screen-reader/touch/institutional acceptance remains unexecuted. The local fixture's unrelated team invitation discovery route remains unsupported and may show its existing toast; it is not a cohort acceptance claim.

## Next and external boundaries

Next bounded task: run the expanded workflow regression suite and update the production-readiness checkpoint with exact results and unresolved institutional acceptance. Do not overwrite earlier execution reports or relabel them as current.

Only officially Left College is excluded from bulk progression; final-semester handling remains separate and no graduation/credit assignment is introduced. Actual academic placements, learning histories, project/research/internship/club flows and reflection/email timing remain unchanged. No official MIS source, authentication protocol, identity activation or write-back is invented. Live E-Digital Nepal synchronization/SSO and actual mail activation remain dependent on approved external configuration/access. All testing used fictional records only.
