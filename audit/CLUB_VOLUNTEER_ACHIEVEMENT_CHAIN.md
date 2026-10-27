# Stage 151 — Club achievement, portfolio and reporting reconciliation

Reviewed the existing selected-volunteer/domain task path through individual contribution, task assessment, reflection/final evaluation, activity completion, portfolio, certificate and report workflows.

| Function | Working-code finding |
| --- | --- |
| Selected roster and domain responsibility | Existing controlled selection/handoff/appointment/task commands reused |
| Individual task progress and performance | Existing student submission plus independent mentor evidence/review; assigned vs verified vs assessed remain distinct |
| Contribution hours | Existing own claim and mentor verification; unverified hours excluded; attendance and contribution remain separate measures |
| Final achievement | Existing reflection, individual final evaluation and activity completion gates; task verification or hours alone do not create an achievement |
| Portfolio and legacy JSON | Confirmed gap: numeric completion-state filters could include cancelled activities and omitted the delivery-ready check used by private export |
| Certificate and sharing | Existing independent explicit issuance and separate student consent; neither happens automatically |
| Reports | Existing task verification/domain mean and verified contribution totals read the same records; cancelled activities excluded from verified activity counts |

Minimum fix: align on-screen portfolio, legacy JSON achievement selection and new showcase-consent selection with existing active/verified activity, successful individual and delivery-ready predicates. No new scoring rule, role, module, route, database structure, command or automatic award. An existing participant may still withdraw their own earlier showcase consent after eligibility loss. Historical tasks, hours, evaluations and issued-certificate records are not deleted or rewritten by filtering.

The full-file preservation assertion permits only the three exact reviewed portfolio predicate/consent changes in addition to the previously verified task recorder extraction. Unrelated app code and original task validation remain protected. Existing model/controller privacy and certificate/share enforcement are unchanged.

Validation: check-club-volunteer-achievement-chain.mjs builds a generic club Event through approved plan, member application, independent selection, roster handoff, domain appointment/task assignment, actual start/progress transitions, task/evidence verification, individual contribution verification, reflection/final evaluation and verified completion. It checks portfolio/report agreement, four-domain performance, explicit certificate issuance, no automatic consent, cancelled/postponed exclusions, failed evaluation, resolved outcomes, incomplete workshop delivery, retained histories and withdrawal after cancellation. Workshop/seminar delivery-specific lifecycle remains covered by existing delivery tests; a generic event fixture does not replace that evidence.

Scope: local engine and projected-screen fixtures only. Browser, keyboard, PDF and institutional acceptance remain Not run. No production dataset was seeded and no transport or institutional integration was activated. Full regression evidence: AUTOMATED_BASELINE_STAGE151.json.

Next: consolidate the club scenario coverage and remaining acceptance cases, then continue the role-dashboard/workflow coverage sequence. Full demonstration data, semester progression, real institutional multi-role identity, and MIS/LMS/website activation remain separate pending work.
