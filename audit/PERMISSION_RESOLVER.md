# Multi-role permission foundation — pilot, not active authorization

Stage 52 adds `server/permission-policy.mjs` as a pure, server-only capability resolver. No live endpoint imports it. Existing owner-only identity, persona selection, workflow guards, permissions, routes, database structures and historical actor identifiers are unchanged.

The consolidated SRS (current Library copy, 13 October 2026, pp.3–5) requires MIS-owned KCC identity/base roles, multiple context-specific application roles, granular scoped permissions and backend enforcement. This pilot is a component toward those requirements, not completion of them. The internal pilot permission catalogue is not an institutionally adopted permission policy.

## Trusted input contract

Call `resolvePermission({principal, grants, request, personMap, now})` only with data loaded and validated by server-side adapters. Do not accept these objects, identity links, classifications or relationships from an HTTP body. The resolver does not validate MIS tokens, grant approval authority or record provenance itself.

- `principal`: stable canonical `personId`, owning `tenantId`, and `active: true`.
- `grants`: approved-source records with `id`, positive integer `version`, `personId`, `roleId`, `status`, `effect`, `scope`, explicit `permissions` and `clearance`. Optional fields are `validFrom`, `validUntil`, `revokedAt`, and non-empty `relationships`. Unknown fields, unknown permissions and duplicate grant IDs deny resolution.
- `request`: a catalogue `permission`, trusted resource `scope`, `classification`, trusted `relationships`, and the relevant source `record` for independent review.
- `personMap`: authoritative actor-ID-to-person-ID links. Names/emails are not used to infer that two actors are the same person.
- `now`: trusted UTC ISO timestamp, optionally injected for deterministic tests. Time and calendar validity are checked. Starts are inclusive; end/expiry and revocation instants are exclusive.

## Resolution rules

The principal and requested resource must share a tenant. A grant must belong to that person, be approved and currently active, contain the exact permission, and match every scope dimension it constrains. No wildcards or implicit organisation-tree inference are implemented. A tenant-only scope is broad within that tenant; extra department/programme/project/club/record constraints narrow it conjunctively. The trusted resource loader must supply accurate scope relationships.

Each complete grant is evaluated independently. Two partially matching grants cannot be combined into a grant neither actually provides. An applicable explicit denial overrides every allow. Allow grants must cover the requested classification (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`) and any relationship constraints. Catalogue-required record scope and relationships are also checked.

Pilot approval/evaluation/verification permissions resolve all required source actor IDs through `personMap`. A matching canonical person blocks review even when another role alias is used. Missing legacy author/subject mappings deny independent review; the pilot never rewrites old records or invents identities. Role-assignment approval also requires independent requester and grantee identities.

Results contain a reason, policy version, canonical person, evaluated time and matched grant IDs/versions/roles. They do not contain student reflection text or counterpart identifiers. Inputs are not mutated. A denied result carries no grant list.

**An allowed result has `capabilityOnly: true`. It is not a complete workflow authorization.** Existing record ownership/assignment, workflow state, record/version freshness, evidence validity, classification restrictions, independent-decision and CAS/audit guards remain mandatory. The pilot is deliberately unconnected to live handlers until those adapters are reviewed and tested.

## Next integration step

Define authoritative identity links and scoped grant loading, including revocation/session freshness and explicit treatment of unmapped historical actors. Add server adapters to load record scope and same-person relationships. Connect one narrow read path first, prove denied access across roles/tenants, and preserve its existing checks before broadening coverage to commands, files, shares, certificates, letters and exports. KCC authentication remains MIS-owned; no local-password system or broader access is introduced here.

Evidence: `check-permission-policy.mjs` covers multi-role matching, split-scope denial, tenant boundaries, classification, explicit denial, relationships, invalid configuration/time, expiry/revocation boundaries, same-person aliases, unknown legacy mappings, immutable inputs and unchanged live authorization files. The full existing regression suite remains required before publication.

## Stage 53 — Identity and role-assignment snapshot adapters

`server/identity-grant-adapter.mjs` adds `prepareAuthorizationContext` and `resolveTrustedPermission`. These are server-only, pure functions, not HTTP handlers or login verification. No live handler imports them. They validate and prepare an already authenticated session and an already authoritative, approved source snapshot; they do not establish the trust of that source themselves.

The session carries provider/issuer/subject/tenant, a server-bound authorization version and expiry. The snapshot carries the same tenant, its current version, explicit validity window, approved issuers, canonical people, unique identity links, historical actor links and role assignments. A missing/expired/revoked/inactive identity, conflicting subject binding, duplicate actor binding, stale version or malformed record denies preparation. No name/email matching or automatic person creation occurs. Snapshot uniqueness is for current records; persistent loaders must prevent later identity/actor rebinding and version rollback and retain the immutable historical mapping.

Role assignments explicitly identify KCC360 application responsibility, reuse the resolver's strict grant schema and carry an approval reference, requester, independent approver and approval time. Approved/revoked assignments without that provenance fail preparation; pending assignments must not pretend to have approved provenance. This checks completeness and person independence, not the institutional authority or authenticity of the approval. The trusted source loader must verify those against its audited grant-approval records. MIS base-role ownership is not copied into a locally authoritative role source.

Only the current canonical person's grants are returned. Verified actor mappings can include inactive people for historical attribution; unresolved legacy actors remain absent so independent approval still fails safely. The adapter neither rewrites records nor grants access to counterpart records. Output objects are detached from inputs. Context provenance records identity/actor/assignment versions and approval references without exporting the external login subject.

The context refresh deadline is the earliest of session expiry, snapshot expiry, identity expiry and the next known grant activation/expiry/revocation. It is only an upper bound: callers must load current authorization state, honor a changed/revoked version immediately and must not cache a context merely until that time. A future persistent loader, token verifier and revocation mechanism are still required. No account, SQL migration, MIS connection, role-administration screen or broader access was added.

Evidence: `check-identity-grant-adapter.mjs` exercises the adapter/resolver composition with multiple roles, alias independence, unresolved history, expiry/revocation, stale versions, issuer/tenant mismatches, conflicting links, approval provenance, isolated outputs and untouched live entry points. Next: derive resource scope and record relationships from trusted records, then integrate one narrow protected read path while retaining existing guards.

## Stage 54 — Project resource scope and protected summary read

`server/project-resource-policy.mjs` adds a trusted project resource adapter and a protected summary-read helper. It is not imported by a live route. The caller supplies an authoritative workspace snapshot, a separate approved resource index, the validated identity/grant source inputs and a server-selected actor. No project, department, programme or classification is inferred from display names or a browser request.

The resource index names the workspace and exact workspace revision, its tenant/version/validity and unique project bindings. A binding supplies stable tenant/department/programme/project/club/record identifiers and classification. Project and record IDs must agree with the requested stored project. Club scope must agree with the actual linked club. Missing mappings, conflicting project identities, another tenant/workspace, stale revision, invalid classification, expired mappings and caller scope/relationship overrides deny preparation.

Owner, participant, assigned mentor and record-author relationships are derived only from the stored project and verified canonical actor mappings. Unknown legacy authors are not invented: approval capability remains denied when its independent-person checks cannot be resolved. This pilot supports project RECORD.READ and ACTIVITY.APPROVE capability checks; it does not implement task/evidence/file/document/aggregate resource adapters or authorize a write transition.

`readProtectedProjectSummary` is the first narrow read helper. It requires a RECORD.READ grant, verifies that the selected actor belongs to the authenticated canonical person, then intersects that decision with the existing engine's record-access view. It returns only id, title, programme, type, state and due date, plus policy/version provenance. Reflection text, evidence descriptions/files, assessments, host contacts and relationship identities are not returned. Capability alone never bypasses existing access. Inputs remain unchanged. This is an internal tested read path, not a newly opened HTTP endpoint or production account service.

Persistent approved resource indexes, authoritative loader freshness/atomicity, institutional scope grants and complete endpoint integration remain pending. The shared owner-only site, all live routes, existing permissions, current schema and historical records are unchanged. Evidence: `check-project-resource-policy.mjs` covers known scope/relationship derivation, same-person denial, source/version conflicts, classification and grant denial, existing-access intersection, narrow output and no mutation.
