# Stage 258 protected academic and club plan review

25 October 2026. Baseline: Version 269, commit `60fc15da4cd30fa530bf8f1c868b98bd9603d1a3`. Reopened through the source helper at the exact retained checkpoint. Requirements remain SRS v3.4, with its Annex P event/registration/payment acceptance still NOT RUN.

## Result

The existing AP-001 policy and atomic storage now have an authenticated HTTP boundary, trusted runtime composition and contextual academic/club review screen. The composition root is disabled by default because official identity, approved source mappings and reviewer providers are not installed. No demo persona, request field, email match or page action can activate institutional review.

The runtime validates verified session/issuer identity using the existing identity adapter, loads a current scoped workspace and approved source/assignment registry, projects the exact existing academic or club source, checks current plan capability, and validates authorization/configuration versions against an authority-fence reference. Providers remain server-owned injection points, not invented MIS APIs. The production contract must advance the persistent authority fence for relevant identity/grant/configuration changes before activation.

`GET /api/plan-approvals` returns only unavailable status when the runtime is disabled. With an installed approved runtime, a reference-specific preview shows whitelisted plan headings and item details, title, budget, version, current review state, permitted actions and decision history. Raw identity maps, approval source snapshots, receipt internals and canonical binding strings are excluded. A digest binds the browser preview to exact server source content. Capability is checked again on writes; reads do not provision reviewers or change records.

`POST /api/plan-approvals` uses existing owner authentication and same-origin/JSON checks plus request size/schema checks. It accepts a current plan/version, binding digest, operation identifier, expected revisions, action, reason and explicit confirmation. The server reconstructs the full binding and delegates to the Stage257 transactional writer, preserving duplicate-receipt and concurrency guards. Existing submitted/approved legacy sources cannot initialize fabricated historical Finance/Principal decisions.

The review page is linked from visible academic and club plan cards. It shows only server-permitted actions, renders supplied content as text, requires a reason and confirmation, prevents double submission and preserves an identical request identifier on explicit retry after an uncertain response. It has no browser-authority or local-storage fallback.

## Legacy bypass guard

The generated shared engine now checks AP-001-controlled sources after a generic command and notification reconciliation. Generic commands cannot change raw approval records, mutate the registered source baseline, change an unreviewed sibling in the same family, clone a successor through the old plan route, or create a new activity from the controlled family without separate execution authorization. This covers academic sourcePlan/sourceItem, club plan linkage and special-activity source references. Historical existing project learning/history remains available.

Controlled sources receive a minimal review-management marker in their already-scoped generic views; raw approval records remain excluded. Browser edit/submit controls defer to the protected review link for managed drafts. The server guard remains authoritative even if client controls are bypassed.

This increment does not grant execution after APPROVED: `executionAuthorized` remains false. Versioned amendment authoring, approved successor activation, item-level execution authorization under EV-001, and other plan kinds are next integration work. Legacy records that have not been registered with AP-001 retain prior behavior; this is not all-plan adoption or a completed migration.

## Verification

- 13 fictional trusted-runtime/SQLite integration cases passed: academic and club complete routes/history and receipt retry, disabled runtime, client identity/field rejection, stale digest, inactive/revoked identity/capability, cross-plan/tenant mapping, no fabricated legacy approvals, changing preview authority, academic and club legacy-controller denial, source-family clone/execution denial, preservation of historical work, sibling-version execution denial, and transaction-time fence change.
- 14 existing persistence scenarios passed with source-bound fixtures. The fixtures were updated to reflect the source metadata required by the new engine guard.
- API route check passed for actual default-disabled composition: unauthenticated/non-owner denial, no-store responses, origin/content-type/JSON/size checks, disabled writes and no DB access.
- Client DOM harness passed for inactive/malformed responses, text-only rendering, exact-version fields, required confirmation, same-origin fetch, identical retry and frozen pending fields. This is not an active browser decision-flow test.
- TypeScript and production build passed; the new API route is present in the compiled build. Existing workflow regression: 32/32 passed in `STAGE258_REGRESSION.json`.
- Browser preview at the supported Sites preview URL showed the new screen and its actual API sign-in protection. Layout was visually inspected. No sign-in was performed and no active institutional or sandbox decision flow was executed in that browser. Do not present backend/DOM fixtures as full browser acceptance. No retained screenshot artifact is claimed.

No production authority, grants, providers, migrations, authentication configuration, real accounts/messages/payments or existing database records were installed/reset. Source, earlier audit reports and historical requirements remain intact.

## Next bounded task

Implement a versioned return/amendment drafting path and successor review without unlocking approved baselines, then add exact item-level execution authorization separately from review approval. Continue using isolated fictional fixtures until institutional identity/authority activation is independently available. Keep pending/rejected amendments from extending dates or granting execution. Principal-originated approval still requires an explicit independent-authority rule.
