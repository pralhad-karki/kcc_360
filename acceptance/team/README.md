# Isolated controlled-team acceptance launcher

Run from the existing repository with its installed dependencies:

```bash
node scripts/team-acceptance-server.mjs --self-test
node scripts/team-acceptance-server.mjs --local-fictional
```

For revision acceptance, `--local-fictional --reviewed-fixture` additionally runs the existing initial-review assertions and starts from their partial/returned/verified task baseline. It is optional fixture setup, not browser execution of those earlier phases. Keep ordinary self-test mode on its default assignment baseline.

The second command serves http://127.0.0.1:5173/workspace/. Stop the process to discard its in-memory SQLite workspace. It never opens the live D1 database, resets saved data or changes production source configuration. Do not deploy this launcher or expose it as an institutional service. No package scripts or application routes import it.

It imports the existing assignment fixture, which runs its assertion/setup sequence before exporting a started activity with two assignments. The frozen fixture clock and seeded approval/start history are test prerequisites, not new institutional acceptance. Setup output is intentionally visible. A fixture failure stops startup. This dependency is deliberate reuse for local testing; extract a reusable factory before treating it as a general QA service.

Three fictional accounts are available: s1 (lead), s2 (assigned student), s7 (independent mentor). Selection is a test cookie, not institutional sign-in. The mentor is added only to the served local account-list bytes because the generic demo account catalogue omits this fixture alias. The application source and real role catalogue stay unchanged. Account-scoped workspace responses use the existing engine projection; controlled commands call the existing dispatcher/trusted fixture providers. Writes are serialized, same-origin JSON is required, and actor/workspace revision mismatches fail before dispatch. Generic commands, private-file endpoints and external notifications are unavailable.

The top banner marks this as local fictional acceptance. Shared-demo wording elsewhere in the existing interface is legacy UI, not a claim of persistent storage or real authentication. No MIS/LMS service is contacted.

## Stage 212 verification

The self-test passed after correcting a missing mentor in the adapter account list. It serves real workspace assets, confirms exactly three fictional accounts, executes trusted capability discovery, denies wrong-account and generic writes, rejects cross-origin requests, denies file endpoints and confirms unchanged stored state for reads/denials. It includes the existing assignment fixture assertions. This does not replace browser or application HTTP-authentication acceptance.

Managed browser preview was attempted but **Blocked**. The supervisor isolated `acceptance/team` as its filesystem root, so relative and then absolute references to the parent repository failed with MODULE_NOT_FOUND before startup. The temporary nested package entry was removed. No preview is left running. Do not modify the production dev command or authentication to bypass this boundary.

Stage 213 resolved the nested-preview limitation with a complete disposable git-archive checkout and copied installed dependencies. Change only that disposable checkout's dev entry to this launcher and start it through sites-preview. Never register or deploy it as another Site. The original repository's dev command and disabled institutional runtime must remain unchanged. Stage 214 repairs the local root redirect and filters the local account selector to s1/s2/s7, without changing production assets. See the Stage 213–214 audit notes for executed browser cases and limits.

Manual W-10 cases remain Not run; the adapter starts after handoff/start and therefore does not independently accept those earlier phases. The frozen fixture workspace lives only for one process, with existing source/authority rules. Progression, policy, live activation and real uploads remain pending under existing boundaries.
