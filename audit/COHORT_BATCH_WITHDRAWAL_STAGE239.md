# Stage 239 — mock batch withdrawal and fresh preparation

Recovered baseline: clean e3d28ceb637fb21dfc602ceaf23813f1c33dee5a, published version 250. Existing architecture, schema/migrations, ordinary workspace and learning histories preserved.

## Completed

- Added WITHDRAW to the existing pure mock batch lifecycle. Only the original coordinator c1 can retire PROPOSED or APPROVED batches, with a required bounded reason, expected ledger revision and exact original content digest. APPLIED, REJECTED and WITHDRAWN records cannot be withdrawn.
- Withdrawal changes no placement. It retains the original preview/source, reason, before placement snapshot, content digest and any independent approval. A separate withdrawal object records coordinator, timestamp, reason, prior state and original digest. History appends one revisioned event. A later proposal has a new identifier and source binding; old records are retained.
- Withdrawal intentionally does not require a current roster or unchanged placement: retiring an obsolete pending record must still work during source failure. It cannot authorize approval, advancement, correction, graduation or source reconciliation. New proposals and existing approval/application keep their current-source/placement checks.
- Added exact WITHDRAW API fields: action/actor/revision/batchId/bindingHash/reason. The service does not call the source adapter for withdrawal. Existing owner/role guards and transactional revision/session checks remain in force. Store audit records include the withdrawal reason/prior state and original source/count/digest. Ledger and audit remain atomic.
- GET can return existing saved batches with source null and UNAVAILABLE status during provider failure. It does not create or reset a missing ledger from an unavailable source. New source-dependent writes still fail closed. Withdrawal success reports NOT_REQUIRED rather than pretending a current source was checked.
- Dashboard shows a reasoned withdrawal action only for the coordinator's pending records; withdrawn details retain any department-head decision and show the retirement reason/time/prior state. Terminal records offer no repeat withdrawal/application action. During source failure saved records remain readable, withdrawal remains possible, and new proposals/approval/application controls are unavailable. Refresh is required for fresh preparation; no old command is automatically replayed.
- No vendor endpoint, protocol, real identity, official MIS update, browser data fallback or schema migration was introduced.

## Validation

Passed `check-cohort-progression-withdrawal.mjs`: proposed/approved withdrawal without source; complete original source/approval/before/history retention and unchanged placements; coordinator/content/revision/reason/time guards; immutable terminal batches; repeat/late action denial; malformed or absent source; changed placements retained without silent reconciliation; new snapshot/version/status-based proposal after retirement with only Left College exclusions.

Expanded actual SQLite route/service/store checks pass for exact withdrawal fields, role denial, unavailable-source reads and denied new progression actions, zero source loads during withdrawal, audit failure rollback, session change at commit, two competing withdrawals with one winner, retained approval and original records, fresh changed-source proposal, and lost withdrawal response recovery without replay. Ordinary workspace/privacy and prior lifecycle checks remain passing.

Expanded VM client checks pass for withdrawal request body, unavailable-source control restrictions, valid retained decisions, required reasons, malformed withdrawal records, terminal/admin/department-head denial, fresh preparation and uncertain-save no replay. Existing pure batch, preview API/client, individual academic progression, MIS/SSO isolation and shared server regressions also pass. TypeScript no-emit and production build passed.

The reusable runner now contains 31 configured commands. No fresh aggregate 31-command run is claimed. Previous reports remain historical.

## Browser evidence and limits

Disposable local checkout, actual UI and API/service/store/core with fictional in-memory SQLite and owner identity stub. Initial narrow rehearsal verified saved coordinator proposal and independent department-head approval. Browser tooling temporarily became unavailable; after restoration a new disposable process completed coordinator proposal → reasoned withdrawal → refresh → fresh proposal. List at mock revision 3 retained Withdrawn and Proposed entries together. No actual database was reset or written.

At 320 px child frame width, the withdrawal modal clientWidth/scrollWidth were both 256 px, textarea width 200 px and named H2 held focus. The required Withdrawal reason field and explicit Save fictional withdrawal control were usable. Before/after source failure and approved withdrawal are covered by actual API/client/core tests; a full source-outage or approved-withdrawal browser scenario is not claimed. Original ordinary shared workspace remained revision 0 with unchanged unplaced profiles. Managed preview stopped. Full institutional/screen-reader/touch acceptance remains unexecuted.

## Next and external dependencies

Next bounded task: read-only comparison of saved pending batch against the current mock source/placement state, with clear stale/current/unavailable status before approval or application. Never rewrite the original proposal or imply official MIS synchronization. Server rejection and withdrawal already enforce the safe boundary; explicit comparison will make it visible before a failed save.

Official E-Digital Nepal API/schema/status synchronization, institutional SSO and any authorized MIS write-back still require vendor documentation/access. Actual mail delivery remains unconfigured. All records used for this stage's tests are fictional; production credentials and real student data were not used.
