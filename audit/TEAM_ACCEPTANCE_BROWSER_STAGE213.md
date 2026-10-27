# Stage 213 — Complete isolated preview and first browser case

22 October 2026 · Baseline cad8405d6cbd584be5c511368956da81b81815f6.

## Environment recovery

A complete disposable checkout was prepared under `/workspace/scratch/0c4274cba085/kcc360-acceptance213`. Tracked files came from `git archive HEAD`; installed node_modules were copied with `cp -a --reflink=auto`. Only that disposable package.json changed its dev script to `node scripts/team-acceptance-server.mjs --local-fictional`. No production package script, runtime registry, application code or live database changed. The original Site was neither redeployed nor reconfigured.

The supported `sites-preview start` supervisor successfully started the complete checkout. The browser loaded `http://terminal.local:4173/workspace/` and visibly showed the local-fictional banner, current scoped records and controlled task actions. The earlier nested-directory filesystem blocker is resolved by supplying the whole checkout. Prior blocked attempts remain historical evidence.

The root URL rendered the shell but its relative assets failed to load; navigating to `/workspace/` loaded the complete UI. This is a test-adapter entry-path issue, not a verified production defect. Use `/workspace/` until the adapter root redirect is repaired. The generic dropdown also retains unsupported legacy personas; choose only s1, s2 or s7. Server acceptance remains restricted to these fictional accounts.

## W10-01 — Pass in isolated browser

Tester: Codex browser automation. Baseline fixture project: `3f1e5c2a-981a-4e73-8799-b28326eb3c6d`. Initial revision 35; save revision 36. Actor s1 is the fixture team lead; actor s2 is the independently mapped assignee.

1. Opened Projects → Research review fixture → Prepare task assignment. Existing tasks were Develop research survey (s2) and Interpret the pilot findings (s1).
2. Assigned **W10 browser evidence synthesis** to s2, due 2026-11-20. Output: A fictional one-page synthesis. Responsibility: Explain the fictional observations independently. Evidence requirement: A fictional evidence description. Selected Concept criterion: Explain the relationship between observations and conclusion. Entered a fictional acceptance reason and explicit confirmation.
3. Saved through the real browser form. The UI refreshed at revision 36. Reopening preparation listed all three assignments, including both original tasks and the new task, all not verified complete.
4. Closed the dialog with Escape, used Refresh shared data, selected s2 and reopened the project. The new task appeared in the assignee's own progress/evidence sections. No lead task-assignment action was shown to s2; this is an observation only, not server-denial acceptance for W10-02.
5. Opened the new task's evidence preview. It displayed the exact due date, output, responsibility, evidence requirement and Concept criterion. No evidence was submitted. The task remained not verified complete and the activity remained Started.

The generated task ID was not captured; title, assignee, project ID and workspace revision identify this disposable observation. Browser accessibility/DOM observations were used; no real private information or screenshots were saved. A label-locator timeout during form automation was resolved using the observed combobox role, with no duplicate save. It is not classified as an application defect.

## Limits and next step

Only W10-01 is passed. W10-02–16 remain Not run. This adapter uses a frozen fixture clock and synthetic account selector; it does not accept institutional authentication or application HTTP-route security. The earlier handoff/start history is fixture setup, not a browser acceptance result. Stopping the preview destroys this fixture database; the acceptance record preserves observations, not reusable live records.

Next: repair the adapter-only root entry and restrict its visible persona selector to supported fictional accounts, then execute W10-02–05 with a fresh documented fixture run. Do not alter production authorities or enable institutional sources. Broader task revision, mentor review, privacy, keyboard and institutional acceptance remain pending.
