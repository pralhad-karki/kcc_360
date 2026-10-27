# Discussion state audit mapping — Stage 124

2026-10-19. Isolated mapper tested; not connected to live saves.

The minimum G22 extension maps only successful setDiscussionState transitions from trusted guarded-engine before/after snapshots. It identifies one appended event in one existing project, preserves other projects and all message/record fields, and validates append-only event history, existing project-bound roots, independent per-thread versions, alternating Open/Resolved states, actor/time and bounded required reasons. Root author/current recorded mentor must match the appended event actor. These consistency checks do not replace authenticated engine authorization or authorize reading audit data.

The existing metadata codec adds the DISCUSSION_THREAD record type. Version/state refer to that thread's discussion-event sequence, not an academic record version. The thread ID is already project-bound. A reason reference points to the matching thread/version reason field in the retained event history; no narrative, message content, names, hashes, grades or confidential feedback is copied. Institution remains null. Codec version 1 and all old valid envelopes/legacy values remain readable; older readers lacking the new type would need the updated codec before consuming these future events. No new event is written live in this step.

The isolated module server/discussion-audit-map.mjs has no service import. It returns UNMAPPED for other commands and NO_CHANGE for unchanged discussion events. A future live integration must preserve the legacy audit fallback if notification reconciliation alone changes workspace data; NO_CHANGE must not suppress a workspace audit. Invalid changed transitions fail closed. Existing CV mapping, service transaction, SQL schema, commands, roles, routes and stored records are unchanged.

check-discussion-audit-map.mjs exercises actual engine resolution/reopening by author/mentor, legacy and new roots, interleaved thread versions, denied/empty/no-op/stale actions, immutable history, cross-project mutations, malformed versions/states/references/actors/timestamps, content exclusion, ledger binding and unchanged live files. Focused existing codec/CV/audit-save/project-discussion tests and TypeScript are also run. Automated fixture evidence is not browser or institutional acceptance; W-01–W-09 remain Not run.

Next: connect only this tested command mapping to the existing atomic workspace/audit save, then verify rollback, conflicts, denied/no-op behavior, reason-reference binding and content exclusion with real SQLite. Live structured coverage remains CV-only until that step. G22 and all 21 open gap entries remain open. Progression and full demonstration data remain deferred.


## Stage 125 — Atomic discussion-state audit integration

The existing save dispatcher now maps setDiscussionState as well as saveCVDeclarations. Discussion resolution/reopening metadata shares the existing workspace CAS update and commit-token-conditioned ledger INSERT. Malformed mapped transitions reject before the transaction. NO_CHANGE retains the prior legacy fallback when ancillary reconciliation changes workspace data. No schema, route, permission, audit reader access or old ledger value changed. The service source guard permits only the exact reviewed command-dispatch extension; authorization code remains protected.

check-discussion-audit-save.mjs uses actual service code and in-memory SQLite to verify resolution, current-mentor reopening, retained event/reason reference binding, no private text in ledger or audit metadata in API responses, no-op/denied/stale rejection, rejected form spoofing, ignored client metadata, audit INSERT rollback/retry, concurrent winner preservation and invalid-history no-save. Existing CV integration tests remain applicable. Only CV declaration saves and discussion-state changes use this structured mapping; G22 and all 21 open gaps remain open. Browser/institutional acceptance, progression and full demonstration data stay pending.

Final Stage 125 baseline: 107/107 root check scripts passed, plus TypeScript and diff validation. Per-script exit codes/durations/output are recorded in AUTOMATED_BASELINE_STAGE125.json. These are automated fixture results, not browser/institutional acceptance.
