# Stage 259 versioned plan amendment drafting and successor review

25 October 2026. Baseline: published Version 270, commit `cc12881e30c1b62325a97adb566428fe5b903d24`. The source helper reopened the exact checkpoint; SRS v3.4 remains the current requirements baseline. No new application or schema was created.

## Implemented scope

Academic and club plan owners can draft a separate proposed version for date/reporting extensions and additional planned activities when the exact root source mapping explicitly permits amendments. The authenticated plan API accepts only supported changes, current version/revision references, a binding digest, reason and explicit confirmation. A future-version configuration entry cannot enable amendments for a disallowed root version.

The draft retains the exact previous review and baseline binding/revision, the approved/previous-reviewed distinction, baseline and proposed values, owner, reason and time. It does not edit the approved raw plan, existing activities, attendance, learning evaluations, certificates, budgets or historical audit. Versions are allocated from the latest terminal review. An existing pending/newer version blocks an alternative draft; simultaneous requests compete through workspace CAS. Repeated identical requests return the same receipt without another version/audit. Reused operation identifiers with different commands/content are rejected.

A returned/rejected/withdrawn proposal is corrected through another version; the rejected proposal and its original values remain intact. If an initial plan was returned before any approval, its revision explicitly records `baselineApproved: false` and links to the previous terminal review. No historical approval is manufactured.

Additional activities require supported planning fields and currently mapped active planned lead/mentor identities. They are explicitly PLANNING_ONLY and create no event, participant allocation, accepted mentor assignment, expenditure authority or certificate. Subsequent operational/eligibility/readiness validation remains separate.

The proposed version is projected through the existing trusted runtime and reviewed by the same owner → unit → Finance Administrator → Principal policy. Reviewer assignments must bind to the exact successor version; original-version assignments are not reused automatically. Current grants and directory status are still checked. Final successor approval uses the existing atomic workspace/audit transaction and exact source binding. A newer approved baseline makes a pending proposal stale, hides review actions and requires rebase/fresh review rather than silently changing its baseline.

Approved successor content is retained in its own immutable approved snapshot. The legacy raw source remains the original historical record. This stage does not activate changed work or propagate changed dates into events: every result still has executionAuthorized false. There is no automatic approval-to-execution conversion.

## Review screen

The page displays recorded versions, amendment reason and baseline-versus-proposed comparisons. Eligible owners can request a date extension or an additional planned activity. The resulting version is selected for a fresh load/submission. Save retry preserves the identical command identifier, and confirmation wording states that the baseline and completed work remain unchanged. Stale baseline status explicitly calls for rebase and fresh review.

Raw amendment snapshots and receipts are excluded from generic role views. The generic engine guard now resolves amendment sources against the retained original raw source version and prevents writes to amendment records through legacy commands. Existing protected-source, family and new-execution bypass guards remain in force.

## Verification

The standard workflow runner now includes six approval/amendment checks alongside the original 32 checks. `STAGE259_REGRESSION.json` records 38/38 passing. These groups include the 26 policy cases, 14 SQLite persistence scenarios, source projections, route and client checks, 13 existing trusted-review integration cases and 10 new amendment integration cases.

The new cases cover academic/club successor routes, unchanged original raw/approved/project history, duplicate retry, two competing drafts, wrong-owner/malformed/forged requests, disabled or wrong-version enablement, revoked owner capability, audit rollback, transaction-time authority-fence change, returned-proposal correction, initial return without fabricated approval, zero-cost planning-only addition, exact-version reviewer assignments, and stale approved-baseline rejection. Fixtures are fictional and in-memory SQLite. Their explicit successor assignment updates advance configuration/fence versions; they do not provision live grants.

Targeted amendment/review and client checks were rerun after the later source-version enablement guard, stale-baseline display and table layout refinements. TypeScript and the final production build passed. The temporary browser fixture was removed before the final build, and an exact-name search confirmed it is absent from public/dist.

A visibly labelled read-only browser layout fixture showed the comparison and extension form. Inspection identified a desktop table overflow; table sizing/wrapping was fixed and visually checked again. The reusable fixture generator remains a development script only. Its mock browser GET response and DOM harness do not establish a real framework/identity/DB amendment submission flow. No browser save, institutional sign-in, native D1 concurrency or full mobile/screen-reader acceptance was executed. No retained screenshot artifact is claimed.

## Release boundaries and next step

Institutional runtime activation remains disabled. No live source mappings, identity providers, reviewer grants, authority-fence records, messages, payments or production database migrations/changes were installed. Principal-originated final approval remains blocked pending the independent-authority rule.

This is a bounded Annex M increment, not all-plan or complete change-management adoption. General edits to existing scope/budget fields, removals, cancellation/postponement workflows, automated rebase assistance and all other module entry paths remain separate work. New v3.4 event/public-registration/payment acceptance criteria remain NOT RUN.

Next: explicit item-level execution authorization under EV-001 and controlled propagation of an approved successor. Pending/rejected proposals must never extend current authority; completed attendance/evaluation/certificate records remain historical and propagation failures must block only changed work.
