# KCC360 — 10,000 registered users / three-year readiness plan

Accepted planning direction: 2026-11-03, Asia/Kathmandu. Continue the existing stack and preserve completed workflows, identifiers, approvals, migrations and audit history. The target is approximately 10,000 registered users over three years, not 10,000 simultaneous users. No capacity guarantee, deployment, database replacement or production migration is authorized by this document.

## Current evidence

Stage 279 exercises the actual compiled workspace route, service and engine with disposable SQLite and 10,000 fictional session rows. Those rows point to existing fictional personas; they are not institutional accounts, enrolled students or a completed SSO integration. Diagnostic datasets contain 8, 100 and 500 minimal projects. Concurrent-write samples contain two or eight requests with the same loaded revision and different projects. This is a controlled contention probe, not a realistic campus workload forecast or browser/hosted load acceptance.

Two bounded production-code fixes are now tested: existing session reads avoid INSERT attempts, and workspace write limits count UTF-8 bytes. Core storage still serializes a shared workspace payload and rejects concurrent unrelated edits under one revision. That is a remaining scaling blocker. The current system is not certified for the planning target.

## Work in priority order

| Priority | Work | Acceptance evidence needed |
| --- | --- | --- |
| 1 | Separate frequently updated records from the shared workspace, starting with one existing workflow | Different-project writes succeed independently; same-record conflicts remain safe; permissions, immutable approvals and audit remain identical |
| 2 | Rehearse migration and rollback locally before enabling any new storage path | Stable-ID/relationship counts and checksums match; concurrent changes are not lost; legacy records remain readable; no production migration in this stage |
| 3 | Add bounded server-side list/detail reads and indexes | Correct pagination/filter/scope; minimum necessary fields; no whole-campus download to ordinary students; measured read/write costs |
| 4 | Agree the real campus workload and run mixed-load tests | Concurrent users, request rate, deadline bursts, record/attachment volumes and response/error targets agreed; measured percentile latency, errors and recovery |
| 5 | Complete institutional identity and security acceptance | Approved MIS/SSO mapping, scoped roles, revocation, independent approval, private-file checks and cross-department denial |
| 6 | Test backup and restoration of database plus private files | Point-in-time recovery rehearsal, relationship/hash checks, application reopen and permission tests, agreed recovery time/data-loss objectives |
| 7 | Add operational monitoring and review each semester | Storage growth, conflicts, errors, slow requests, failed jobs, backup age, restore evidence and operating cost visible to responsible staff |

First storage candidate: audit the existing project-discussion write path and design a per-project storage transition that reuses current discussion permissions, message/thread IDs, notification behavior and audit. Do not split data blindly: existing source approval, project history and notification side effects must remain consistent. Test a disabled local transition before activating anything. No new application or microservice is required merely to organize this work.

## Workload assumptions requiring agreement

- Actual active students, staff and alumni within the 10,000-account target; peak active users versus simultaneous writes.
- Peak periods: assignment deadlines, attendance marking, plan approvals, event registration and result/portfolio access.
- Three-year growth of activities, tasks, reflections, immutable revisions, audit records and private attachments.
- Candidate future test envelopes may include 25, 100 and 500 active clients. These are planning scenarios, not measured demand or approved capacity commitments.
- Availability, acceptable response/error rates, recovery objectives, retention and hosting budget remain to be agreed from institutional needs and measurements.

## Existing roadmap retained

The Stage 278 registration operator/status controls, reflection publication, approved completion-report PDF packages, fallback event reconciliation and MIS/SSO acceptance remain on the roadmap. All integrations remain disabled by default. The reliability work is a prerequisite to dependable institutional rollout, not permission to alter the shared publication contract or activate live services.

Source-code Git history is not a backup of hosted databases or private-file storage. Restore tests must include those stores and revalidate identity, consent and publication state before service activation. No restoration or production reset was performed here.

**Readiness: HOLD — the target remains unproven pending storage, security, recovery and realistic hosted-load acceptance.**
