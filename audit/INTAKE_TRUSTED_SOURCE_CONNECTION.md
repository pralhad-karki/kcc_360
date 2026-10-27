# Stage158 — trusted intake source connection

Approved increment: compose existing identity, roster, academic-master and reviewer-authority inputs server-side, without activating live team/routing authority.

## Change and impact

`server/intake-trusted-loader.mjs` adds one server-only composition function, `createIntakeTeamRuntime`. The existing `server/intake-team-commands.ts` calls it with no providers; the resulting runtime stays disabled. The existing HTTP route, owner authentication, actor selection, workspace revision guard and command dispatcher are retained. No database tables, routes, permissions, engine commands, UI module or shared data are added or migrated.

The configured loader requires server callbacks for verified session, identity authority, institution-scoped workspace, approved roster, approved academic masters and approved review authority. It reuses `prepareAuthorizationContext` for fresh account/person/tenant resolution. Snapshot headers must carry approved status, stable ID/version, approval reference and effective dates. Workspace ownership and unique proposal reference are checked. Existing normalization, source context, directory and invitation validators retain responsibility for detailed relationships and action eligibility.

Each load is fresh; no identity/source cache is introduced. Returned values are detached. Provider functions are captured at composition time. Client-supplied fields cannot install providers, choose identity/grants or enable the default runtime. Missing providers, unapproved/cross-institution/expired sources, revoked identity, invalid actor mapping and expiry during loading are denied. Provider error details are sanitized. Existing dispatcher double-load/source-binding and SQLite compare-and-swap/audit checks remain in force.

## Validation

- New `check-intake-trusted-loader.mjs`: default-disabled behavior; required providers; verified person/tenant and proposal/workspace scope; approved source dates; revoked/expired identity and source handling; expiry during loading; output isolation; captured readers; forged fields; sanitized errors.
- `check-intake-team-chain.mjs` now supplies its existing fictional authority/roster data through the real loader factory. It exercises discovery → minimum directory → invitation → own acceptance → confirmed-team faculty/research routing using existing engine intakes and SQLite. No pre-consent route or execution grant is created.
- `check-team-command-route.mjs` imports the updated server composition and confirms the actual HTTP route remains disabled, rejects client enablement and preserves owner/origin/session/revision checks and data/audit.
- TypeScript and application build passed. Full local results are retained in `audit/AUTOMATED_BASELINE_STAGE158.json` once the suite completes.

## Remaining boundary

This is a connection point, not an implemented E-Digital Nepal adapter or active institutional source registry. No provider callbacks are installed in the live runtime. No live team invitations, Research/faculty first-review queues, new role grants or student accounts are activated. Existing coordinator-led intake remains unchanged. Next increment should configure an explicitly approved server source registry and team opt-in policy, then connect existing team controls; real-source authority must not be inferred from demo personas.

Browser/institutional acceptance remains Not run because supported browser control is unavailable. First-review persistence, configurable real reviewer/approval assignments, mentor acceptance, notifications and complete lifecycle tracking still require subsequent bounded integration. Semester progression and full demonstration data remain deferred. SRS gaps and formal AT statuses are unchanged.

The previously saved v178 source handover archive remains the earlier baseline; it does not contain Stage158. Use the newly saved site source revision for this increment and refresh the archive at the next handover milestone.
