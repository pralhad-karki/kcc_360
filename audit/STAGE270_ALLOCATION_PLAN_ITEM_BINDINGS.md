# Stage 270 — Exact allocation links to draft department/club plan items

Baseline: Version 281 / Stage 269, b8aec22a84e37e049b42d165f115a956cb052ed9.

## Recovery and requirement scope

Workspace maintenance removed the earlier local checkout. The existing Sites source was restored into `/workspace/sites/kcc360-recovered270`, verified at the published baseline commit, and dependencies restored using the supported installer. Existing source, requirements and audit history were recovered; no production data was reset.

A recovery lookup also located the current Library requirements identity `libfile_37111883d8648191a1996be28ef0e99f`, version 3, filename `KCC360_Master_SRS_v3_7_Event_Completion_Records.docx` (modified 26 October 2026). The revision/precedence text and text of Annexes T–U and part of V were reviewed. STR-002/003/005/006 confirm stable parent references, distinct issuance/plan approval/execution, dated named items and traceability. This was a scoped text review, not a complete v3.7 comparison, diagram review or acceptance execution. The retained earlier SRS bytes/history are unchanged. Remaining v3.7 requirements, including broader dashboards and completion records, are not claimed implemented here.

## Completed backend increment

`server/annual-target-plan-binding.mjs` prepares and saves append-only links from an exact issued target version and exact allocation version to one existing draft department/club plan item. It requires current approved catalogue/club mappings, a current approved plan source mapping, mapped plan-owner identity, explicit `PLAN.TARGET_BIND` permission and the existing target-allocation capability. Scope fragments are not combined to bypass either permission. No role/grant is provisioned and no institutional identity is inferred from a name/email/demo persona.

Links record canonical source workspace, club/department kind, family, plan/version/item, contribution value, unit/category, complete draft source snapshot, responsible person/grants and reason. The target/allocation/plan records are not duplicated or rewritten. A helper reports changed sources as stale without returning private source content. It does not silently rebind, free capacity, approve a plan or calculate achievement.

Named event-count items contribute exactly one event unit; dates must exist and fit the target period. Duplicate canonical family/item links to the same target are denied, and linked values cannot exceed the allocation. Existing links prevent ordinary allocation correction. Source changes require later reconciliation/change handling rather than reusing old authorization.

Raw approved/submitted plans and any draft already registered in protected plan review are rejected. Existing club lifecycle restrictions apply. This phase accepts no amendment overlay and cannot bypass locked plans; future approved-plan link changes must use a formal versioned route.

The existing annual-target save service is extended with a typed BIND command and the same atomic audit/receipt writer. Its transaction also checks the source-plan workspace revision, in addition to target, catalogue and authority revisions. A concurrent approval/source edit invalidates the save. Source mapping and identity context are reloaded/fingerprinted; the commit time must precede effective configuration, used-grant and supplied identity expiry horizons. Historical receipts are re-authorized and do not create new links.

## Actual evidence

- `check-annual-target-plan-binding.mjs`: 32 focused cases with fictional contexts. Covers exact provenance, department and club source routes, no source mutation, contribution limits, duplicate identities, missing/out-of-period schedules, stale references, suspended clubs, scope/owner/grant denial, protected locks, source staleness and allocation correction blocked by an actual stored link.
- Same test uses the actual shared writer with in-memory SQLite: issuance → allocation → item binding; source row unchanged; idempotent replay/conflict; stale source revision; audit-trigger rollback; target/catalogue/authority/plan transaction fences; and used-grant expiry between load and commit.
- Earlier target issuance/allocation checks run through the same writer and pass. Permission-policy and identity/grant adapter checks pass; `server/service.ts` and live authentication entry points are unchanged.
- Standard evidence: STAGE270_REGRESSION.json. Final focused output: STAGE270_PLAN_BINDING_TEST_OUTPUT.txt. The focused run was repeated after tightening the shared expiry horizon and recording both binding/allocation grants; the broad new-group run preceded that narrow tightening.
- TypeScript passes. Production build runs during final packaging. No UI change/browser acceptance, native D1, live SSO or real institutional data test is claimed.

## Still pending / next task

This is a default-disabled backend composition boundary. No target/binding HTTP route, real provider, official catalogue/club map, real role assignment or entry screen is installed. No live database migration/write occurs. Existing size/operation bounds remain.

The current AP-001 review source does not yet adopt these external link records into its immutable approval snapshot. These are prepared draft-source links, not approved planned contributions. Formal unbind/rebind/rebase and approved-plan amendment adoption remain pending; frozen/stale links are conservatively retained. Cross-department supporting contributions and parent department-plan → subordinate-plan relationships beyond these target/allocation links also remain separate gaps. No outcome/achievement, execution, budget, individual scoring or MIS authority follows from binding.

Next: include exact allocation/item-link proofs in protected plan review and approval snapshots, preserving source/fence consistency and formal amendment controls; then add scoped entry and reporting interfaces once official configuration is supplied.
