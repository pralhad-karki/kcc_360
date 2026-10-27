# Club corrective-action closure feasibility pilot

Status: isolated pure logic tested; not activated. No route, engine command, identity grant, database migration, UI control or notification was added. The published Club Evaluation remains read-only for action follow-up.

## Minimal proposed flow

A server-loaded independently verified assessment identifies an exact criterion and its recorded open action. A trusted, explicit assignment maps the recorded owner to a stable person and binds a different reviewer to that club, cycle, assessment ID/version and criterion. Titles and demo persona IDs confer no new authority. This helper validates that input; it does not authenticate users or establish that an institutional assignment is approved.

The owner submits a nonempty completion explanation and current verified evidence references. Each reference must match the trusted evidence registry's club/cycle, version and content binding. The reviewer returns the submission with a reason, or verifies it after rechecking the exact source, assignment and evidence. Returned work can be submitted again as a new version. Previous submissions and decisions remain preserved. Verified records are locked in this pilot; reassignment, reopening and exceptional evidence routes remain undefined rather than silently allowed.

Pure transitions return detached copies, require the expected revision and retain actor/time history. Source assessment, recorded action state, annual review, club renewal and membership remain unchanged. A verified pilot record is not a live closure decision. Historical pilot states do not establish continuing evidence validity after later source changes.

## Inputs required before live implementation

- Institutionally approved reviewer authority and owner eligibility, including owners who are not currently Club Evaluation readers. Do not broaden existing read access implicitly.
- Policy for departed/replaced owners, reviewer conflicts, reopened assessments and stale evidence after closure.
- Accepted completion evidence categories; the pilot only accepts current verified registry entries in the same club/cycle. It does not implement new uploads or certify evidence sufficiency.
- Trusted identity/source/evidence loaders and a protected projection, followed by atomic persistence, audit, concurrency and idempotency checks through the existing architecture. Pure expected-revision checks alone do not provide a database transaction or uniqueness guarantee.
- Browser and institutional acceptance; any conditional-renewal consequence requires its own approved rule.

## Verification

`node check-club-action-closure-pilot.mjs` covers submit/return/resubmit/verify, immutable prior submissions, independent actors, exact source and assignment scope, expiry/revocation, duplicate/wrong-scope/stale evidence, content binding changes, replay/conflicting revision, safe detached values and no source/renewal mutation. Existing club evaluation regression checks and TypeScript also pass. Fixtures are fictional in-memory objects and do not populate the demonstration workspace.

Next: review the authority/evidence/access decisions above and design the minimal protected read boundary before any live command or persistence integration. Semester progression and full demonstration data remain deferred.

## Protected read projection checkpoint

`readClubActionClosurePilot` revalidates the supplied trusted assignment, its effective dates/revocation, exact source/action and caller's stable-person identity. Owners can read Open, Submitted, Returned and Verified pilot states. Reviewers can read only Submitted/Verified states; returned content remains available to the owner for revision. Outsiders are denied. This is a proposed minimal pilot boundary, not approved institutional visibility policy or a new grant.

The explicit field whitelist exposes record state/revision, exact assessment reference, indicator/action title and recorded deadline, plus only the latest submission explanation, timestamp, evidence count/currentness and decision state/reason/time. Internal stable-person identities, assignment metadata, evidence IDs/content bindings, raw history and earlier submissions are excluded. No attachment viewing or file permission is implied. Data are untrusted display text and need escaping in any future renderer.

Evidence currentness is checked against the supplied registry. Changed/missing/unverified evidence produces a false currentness flag without rewriting a past verification. Missing registry entries are treated as not current for this pilot; no claim of registry freshness or actual evidence inspection is made. Changed assessments and assignments fail closed; special historical-access policy remains pending. Responses are detached; tests cover reads and mutations of returned values.

No persistence collection or live endpoint was introduced. Before storing pilot records, generic workspace projections and command responses must explicitly exclude the raw collection, and all reads must use a server-authenticated trusted loader and approved read boundary. Trusted assignment input alone is not proof of institutional approval. Next: check exact action-owner mapping through the existing identity foundation with default-denied configuration before considering storage or UI integration.

## Identity compatibility checkpoint

`check-club-action-identity.mjs` connects the unchanged `prepareAuthorizationContext` foundation to the isolated closure helper with a fictional, test-only explicit assignment mapping. It exercises owner creation/submission, independent reviewer verification and protected reads. Stable-person alias equivalence prevents self-review; session renewal preserves assignment identity. Unknown issuers, cross-tenant sessions, stale authorization versions, expired/revoked identity links, inactive people, unresolved/duplicate actor mappings, outsiders and cross-assessment reuse are denied. No live account or MIS API was exercised.

The mapping function exists only inside the regression script. It is not an approved production assignment adapter, and does not validate institutional assignment approval provenance. No deployment grant/configuration or role inference was introduced. Live integration still needs a server-owned exact action assignment contract, independent assignment-approval authority, owner eligibility/read scope and revocation handling. Before persistence, exclude raw pilot collections from generic projections; then establish atomic save/audit/idempotency and the trusted protected-read path. Do not represent this test as real SSO, institutional acceptance or closed G14.

Next bounded step: specify and validate a default-denied assignment contract with explicit independent approval provenance, using the existing identity foundation. Keep it isolated until institutional authority and owner-access decisions are approved.

## Default-denied assignment validator checkpoint

`server/club-action-assignment-adapter.mjs` now validates the proposed contract in isolation using the existing identity foundation. Default authority and assignment arrays are frozen and empty. Its two inputs are server-trusted snapshots/configuration; the adapter does not authenticate a request or prove that configuration came from approved institutional policy.

Scope is exact: tenant, workspace, club, cycle, assessment ID/version, annual-report version, criterion and closure record ID, plus current workspace revision. The source must be a unique verified assessment with one recorded open action. Active stable-person mapping must match the recorded owner; reviewer aliases resolving to that same person are denied. Exactly one assignment must reference the current scoped approval authority. Independent approval provenance includes requester/approver, time and reference; approver must be active, explicitly authorized, distinct from requester and both participants. Effective periods and revocations constrain assignments and context expiry. No institutional title implies authority.

Prepared assignments include scope/configuration/authority bindings. The closure helper checks their closure-record binding during create, transition and protected read; it cannot reuse a prepared assignment for another record. Session renewal does not rewrite assignment identity; caller must rebuild context for every operation. Configuration changes invalidate existing exact assignments in the pure helper; reassignment/migration policy remains pending.

`check-club-action-assignment.mjs` tests empty defaults, malformed/ambiguous assignments, all scope dimensions, stale workspace/source, active identities, aliases, self-review, approval conflicts, expiry/revocation, detached values and trusted-adapter to submission/independent verification/protected read. The identity and closure pilot regressions and TypeScript pass. Browser/institutional acceptance, actual approvals, atomic persistence, private collection projection and live integration remain unimplemented. G14 stays open. Next: one isolated save/audit/protected-read design using existing persistence, ensuring generic responses never expose raw closure records before introducing storage.

## Isolated save/audit and generic privacy checkpoint

`server/club-action-save-pilot.mjs` reuses the existing D1-compatible workspace compare-and-swap and commit-token audit pattern, with existing tables and no migration. The helper is not imported by live services/routes. A server-only loader must authenticate and freshly supply session, identity/assignment authority, exact source/workspace and evidence before each operation. The command and field allowlist admits only Create, Submit, Return and Verify; client-provided evidence verification assertions and identity fields are rejected.

Each command has an opaque request key and exact workspace/closure revisions. SHA-256 fingerprints bind retries to command content, stable actor and prepared assignment. Successful duplicate requests return minimal stored receipts after current authorization checks; conflicting reuse is rejected. Workspace payload, request receipt and server audit commit together. A failed audit rolls back all of them; a losing CAS does not overwrite the winner or add an audit entry. Audit metadata includes exact source versions and assignment/authority provenance, but only a reason-present flag rather than private explanation, decision reason or evidence content. Protected closure records retain the full reasons. Returned receipts contain no private content or identity mapping.

The loader is called twice before staging the transaction. This catches changed permissions/evidence between loads but is not a distributed policy lock: production must coordinate policy changes after the final load with storage commit. Request receipt uniqueness and history are tested in the isolated workspace model, not a new multi-tenant production service.

Before any live storage use, generic engine projections now unconditionally strip `clubActionClosures` for every demo actor. Internal snapshots and ordinary command data preserve it for persistence; general reads and command responses omit it. Real service fixtures verify select-role/GET/POST responses exclude raw closure narratives and receipts while unrelated saves retain the collection. No closure collection was populated in the live workspace.

Verification: new in-memory SQLite tests cover duplicate/replay/conflict, concurrent save, audit-trigger rollback, CAS winner preservation, fresh revocation, stale evidence and protected read. All-role projection and server persistence tests pass, alongside closure/identity/assignment, monitoring-save, dashboard regressions and TypeScript. No live endpoint, UI closure control, new role, grant, schema migration or renewal decision. Browser and institutional acceptance remain pending. Next: review the isolated flow as one complete acceptance case and record policy/access blockers before any activation. Semester progression and full samples stay deferred.

### Stage 105 — Isolated club closure walkthrough
Added /workspace/club-closure-sandbox.html, linked from Dashboard → SRS Coverage → sandbox in a separate tab. One fictional action supports owner submission, reviewer return, revised submission and verification with exact copied pure rules. Latest-content visibility, escaped input, stale evidence, simulated revocation/restoration and reset are exercised in automated controller/render/delegated event checks. All data stay in tab memory; CSP denies network connections. No API/storage, persistent save/audit, real sign-in/grant, action closure, club renewal or live dataset population. The rule helper is copied for the sandbox, not imported into live engine commands. G14 remains open; browser/keyboard/institutional acceptance are Not run. Next: use the short walkthrough for human review and resolve owner/reviewer authority and exception policy before activation. Progression/full sample data remain deferred.

### Post-Stage 105 — Sandbox focus restoration
The isolated club closure sandbox now restores focus to its recreated role selector after a role change and focuses the result message after a successful action/reset. The result target uses tabindex=-1; role focus avoids a scroll jump. Rejected actions do not redraw the form or move focus; live status feedback remains available. Initial loading does not steal focus. Delegated-handler fixtures verify those targets/options and preservation, alongside the full sandbox workflow and TypeScript. Actual browser, screen-reader and keyboard acceptance remain Not run. No closure rules, live permissions, persistence or dataset changes. Next: include these focus cases in human acceptance; keep closure activation blocked by existing policy/identity/integration requirements. Progression/full samples stay deferred.
