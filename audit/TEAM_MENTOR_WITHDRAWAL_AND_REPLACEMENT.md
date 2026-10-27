# Stage176 — Controlled mentor withdrawal and replacement backend

Essential change: an existing reviewed-team mentor request could be answered but could not be withdrawn or replaced. Added a dedicated withdrawal command using the existing trusted loader, assignment history and atomic workspace/audit save. No SQL, route, provider or generic engine permission changes.

Only the current explicitly scoped MENTOR_ASSIGN authority can withdraw the current assignment. Confirmation and a reason are required. REQUESTED, ACCEPTED and REASSIGNMENT_REQUESTED become WITHDRAWN, retaining request, source basis and any response; withdrawal records actor, date, reason and prior state. Inactive/revoked mentor eligibility does not prevent removal. Current reviewed proposal and assigning authority remain mandatory.

The existing mentor request command accepts a replacement only after controlled withdrawal and a matching expected assignment version. It appends a new ID and incremented version, with fresh eligible mentor/source validation and no inherited response. Earlier records are unchanged. A reassignment request alone is not authority to replace: the coordinator must explicitly withdraw it first.

Double fresh source checks, workspace compare-and-swap, atomic audit insertion, duplicate protection, minimal responses and private reason projection are retained. Mentor acceptance does not complete consultation, approve the project or authorize execution.

Validation: new real SQLite/dispatcher lifecycle test covers all three withdrawal states, role and field rejection, inactive mentor removal, stale/duplicate rejection, original record preservation, replacement and fresh acceptance, audit rollback and concurrent-write conflict. Existing HTTP route test covers disabled integration/no writes. Full regression evidence: AUTOMATED_BASELINE_STAGE176.json. TypeScript and production build checked separately.

Pending: coordinator withdrawal/replacement screens and fresh scoped history/detail projections; consultation and final approval handoff; browser/keyboard and institutional acceptance. Existing initial-request UI is unchanged and does not expose replacement yet. Institutional sources and runtime remain disabled; no real accounts, notifications or demonstration dataset were provisioned. Semester progression remains parked.
