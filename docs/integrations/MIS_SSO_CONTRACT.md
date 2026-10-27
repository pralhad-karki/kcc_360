# KCC360 MIS and SSO boundary — internal contract v1

Stage 229. KCC has requested official API/SSO documentation from E-Digital Nepal. No vendor endpoint, response field name, credential scheme or authentication protocol has been confirmed. The names below are KCC360's internal normalized fields; they are not claims about E-Digital Nepal's product/API.

## Ownership and isolation

E-Digital Nepal MIS remains authoritative for official identity, enrollment, college status, results and fees. KCC360 retains projects, research, internship and club workflows, reflection/evaluation, portfolio consent and application permissions. MIS data must not directly grant KCC360 roles. No result, fee, attendance, credit or enrollment write-back is installed.

Existing identity-grant-adapter.mjs, permission-policy.mjs and intake-source-adapter.mjs remain unchanged. The adapter and SSO interface remain isolated from institutional sign-in. Stage 235 adds one owner-restricted demo endpoint, /api/academic-cohort-preview, that explicitly composes MOCK roster data for existing academic-reader personas. It is read-only, has no apply/approve command, and never treats mock identity selection as authentication. The default MIS adapter and SSO composition remain disabled. Mock principal results cannot be passed as trusted authorization contexts. No database tables, migrations or saved records are changed.

## Configurable development modes

| Mode | Behavior |
| --- | --- |
| DISABLED (default) | No data access or authentication; no network or database I/O. |
| MOCK | Explicitly fictional in-memory roster/enrollment/contact reads and identity selection. Every response carries mock provenance; all IDs use MOCK_ and all addresses use example.test. |
| OFFICIAL | Reserved configuration choice; returns an explicit awaiting-official-adapter/specification result. It cannot activate guessed endpoints or authenticate anyone. |

Configuration belongs to server composition; there is no browser/request enable flag. Factory configuration is copied into an isolated fixture snapshot. The adapter has loadStudents(), purpose-scoped loadContacts(), resolveMockIdentity(), and readiness(). Mock loading does not seed or overwrite the shared owner demo. The fixture has a finite validity period; tests inject a deterministic clock, and expiry is denied rather than silently renewed.

## Required normalized information

| Record | Required KCC360 fields | Rule |
| --- | --- | --- |
| Snapshot | contract, tenantId, snapshotId, version, validFrom, validUntil, provenance/mode | Explicit institution, revision and freshness. Official source approval/provenance must be established by the eventual server adapter. |
| Person | personId, displayName, active/inactive status | Local stable canonical identity; display names are labels, never login keys. |
| Person mapping | externalPersonId, personId, version | Explicit unique MIS-to-application mapping. Never infer a merge from matching email, phone, name or student number alone. |
| Student | studentId, personId, version, collegeStatus | Preserve official status/history; no inference from fees, attendance or failed subjects. |
| Enrollment | id, studentId, departmentId, programmeId, batchId, semesterId, courseIds, version, current/historical status | At most one unambiguous current enrollment in this internal fixture contract; official multi-enrollment cases must be modeled explicitly after vendor documentation, never guessed. |
| Contact | id, studentId, personId, kind, email, version, verification status, validFrom, validUntil | Purpose-scoped private reads; addresses alone do not prove identity or relationship. |
| Guardian relationship | relationshipStatus, relationshipVersion, linked student and guardian person | Institution-verified current relationship; no self-declared guardian trust. |
| Communication permission | communicationPermission, communicationPermissionVersion, purpose | Grant/withdrawal tracked separately from having an address. Normalized contact validity must be the intersection of contact, relationship and permission validity. The official translator must preserve their individual source/version evidence for the email registry. |
| Identity link | provider, issuer, subject, tenantId, personId, version, status, validFrom, validUntil | Exact tenant-bound tuple, unique stable link, active person and unexpired/revocable binding. |

The fixture vocabulary ENROLLED / LEFT_COLLEGE / ON_BREAK / REPEATING / UNKNOWN is internal. An official translator needs documented vendor status codes. LEFT_COLLEGE must mean an explicit official “Left College” record. Do not exclude other students from semester-wise bulk progression because of fees, attendance, failure, repeat or hold status. Existing progression approval/history/final-semester rules remain intact. Ambiguous external data is an integration error to resolve, not a new exclusion policy.

The cohort fixture extends the same normalized contract with fictional break/repeat/unknown and final-semester records. Its four-period programme structure is explicitly fictional, not a KCC programme definition or vendor schema. Preview source ambiguity blocks the whole preview instead of silently dropping students; only official LEFT_COLLEGE classification produces a row exclusion.

The fixture has no staff permission grants. Department evaluator/sender assignments are KCC-approved application configuration, distinct from MIS contacts. Staff mapping and any official multi-role directory will extend this contract only from documented fields. The existing reflection-email registry requires additional approval and per-contact consent/relationship evidence; mock contacts are not automatically converted into approved live recipients.

## SSO preparation without an invented protocol

mis-sso-interface.mjs exposes readiness(), beginSignIn(), completeSignIn(). Default and official-pending results are unauthenticated with no redirect URL. Mock begin uses local fictional identity selection; mock completion maps an exact tuple and always returns authenticated:false, canAccessLiveWorkspace:false, grants:[], authorizationContext:null. It issues no token or cookie and does not replace the existing owner sign-in.

The future official implementation must verify authentication evidence on the server using the actual vendor-supported protocol, bind it to the intended tenant and login transaction, reject expired/replayed/invalid evidence, resolve the unique approved person mapping, and then use existing approved KCC360 role grants. No role supplied by a client or arbitrary claim is sufficient. Required vendor details include supported SSO mechanism, trusted issuer and audience/application identifiers, proof/key verification, subject stability, transaction/replay protections, session expiry/refresh/logout/revocation, and sandbox acceptance. These are requirements to resolve, not asserted vendor capabilities.

## External blockers versus independent development

| Work | Status while API is unavailable |
| --- | --- |
| Projects, research, internships, clubs, tasks, evidence, human evaluation and portfolios | Continue development and isolated tests with fictional personas. |
| Semester progression previews/rules/history and reporting | Continue with explicit mock inputs; official roster/status synchronization is blocked. |
| In-app submission acknowledgment and post-evaluation email policy | Implemented/testable independently; no real recipients or mail transmission in mocks. |
| Live MIS roster/enrollment/status synchronization | Blocked by official schema, read access, stable IDs, pagination/change tracking and sandbox. |
| Student single sign-in from MIS portal | Blocked by official SSO specification, trust registration and institutional identity acceptance. |
| Live contact/guardian/permission synchronization | Blocked by documented source evidence and authorized MIS access. |
| Real Google departmental email | Separately blocked by approved sender configuration and authenticated mail/reconciliation integration; Google confirmation is not authorization credentials or delivery proof. |
| Official results/fee/credit updates or MIS write-back | Outside installed integration; no invented endpoint or authority. Any future direction must preserve the approved ownership boundary. |

## Executable checks

Run node check-mis-adapter.mjs. It tests default/official-pending denial, detached mock snapshots, schema/namespace restrictions, duplicate and cross-tenant mapping, revoked/expired/inactive identity, no email/name login, scoped guardian permission and no live I/O. Existing workflow tests remain separate from the external provider.
