# Stage 276 — withdrawal browser acceptance and truthful status wording

2026-10-31, Asia/Kathmandu. Baseline: `741b3166c4d3ba57cd7b7e938e30be52a7bc0987`, branch `development/website-mock-acceptance`. The GitHub branch head and clean local tree were inspected before work. Existing migrations, databases, permissions, approvals and audit history were preserved. No production migration, live connection or hosted deployment was performed.

## Existing behavior and observed defect

Stages 273–275 already provide durable event publication requests, mock website transport, independent website approval, retry/correction/withdrawal protection, minimal operator projection and compiled API-route tests. Browser withdrawal delivery was unfinished at the previous checkpoint.

The local signed-in browser journey now reached website-confirmed withdrawal and retained the request/history after logout and login. It exposed ambiguous wording: the panel displayed “Withdrawal recorded” immediately after queueing, and an older superseded request displayed “published” without identifying that response as historical. Clearing a local URL does not prove that a website has removed content.

## Implemented independently

- Pending withdrawal now says website removal is not yet confirmed. Confirmation requires the current withdrawal request to be `RECEIVED`, its website response to be `withdrawn`, and its public URL to be null.
- Superseded responses are labelled “Historical website review”; they show “No current path”. Other empty paths say “No confirmed public path”. Immutable response history and independent website approval remain unchanged.
- Expanded existing operator tests to cover pending and confirmed wording, retry/queued states, incompatible website status/URL, terminal controls and exact prototype/public asset parity.
- Fixed UTF-8 declarations in the disposable local acceptance launcher after browser history displayed a corrupted separator. No production transport configuration changed.

## Browser evidence

Executed with the existing local launcher, actual KCC360 controller/runtime and fictional SQLite records. The final full journey used the supplied Stage 98 website consumer (service SHA-256 `7c3e63cad311576de18531e2730ede92b74f5c75e9b455ae31aeddaf22c0166d`). An earlier pass used the previously retained website consumer and is not represented as Stage 98 evidence.

| Case | Observed result |
| --- | --- |
| Signed-out controls | “Publication access unavailable”; no request data |
| Prepare event P101 | Request `246f9f9b-f848-43e6-a4c2-713fa40a5040`, queued |
| Send | Received, `pending_website_review`, no confirmed public path; website ID `4c144d29-2dbd-4a63-ac6d-29000fc5d5ba` |
| Separate website review fixture, then refresh | `published`, same website ID; relative path `/events/2026/kcc-fd915def246a0be45ba908c5` |
| Withdrawal reason submitted with Enter | New request `75381487-a837-4da6-ae05-1de498557634`, version 2, queued; removal explicitly unconfirmed; old response marked historical |
| Deliver withdrawal | Received, `withdrawn`, same website ID; no confirmed public path; confirmed-removal message |
| Logout, open controls | Access denied |
| Login, reopen | Same request IDs and confirmed withdrawal retained; no new-publication control |
| Keyboard response-history expansion | Enter expanded the withdrawal history |

The separate website review button invokes the website's independent service review workflow through a fixture; this is not acceptance of the website CMS review UI. The browser launcher directly calls the actual operator controller; it does not run the production framework route or hosted Worker authentication. Stage 275 compiled-route evidence remains separate. Test sessions are fictional cookies, not institutional sign-in.

After the charset-only launcher fix, a fresh disposable fixture repeated queued withdrawal, delivery and keyboard history expansion. Final history text displayed `2026-10-31T05:29:22.742Z — withdrawn` correctly. Restarting this disposable launcher discarded only its temporary fixture databases; no saved application database was opened or reset. Full keyboard/focus-trap, screen-reader, device and hosted acceptance remain pending.

## Automated evidence and contract

The expanded operator check passes with the bounded mock and again with the Stage 98 consumer (`STAGE276_STAGE98_OPERATOR.txt`). Consolidated regression: **69/69 checks passed, 0 failed** (`STAGE276_REGRESSION.json`). These checks include the existing 19 event-transfer groups and eight compiled-route groups. Earlier TypeScript/build evidence is retained; this increment changes only the JavaScript presentation, its test and local test-launcher encoding.

The retained website artifacts remain `audit/integration-v1/openapi.provisional.json`, `publication-package.schema.json`, and `STAGE_91_PROGRESSIVE_INTEGRATION_REPORT.md`. No schema or competing contract was added. Source event ID, publication request ID, website event ID and relative URL remain distinct. Request/response times retain explicit time zones. No reflection/report identifiers were repurposed. The provisional v1 mapping in Stage 275 still applies; no latest hosted website compatibility or formal schema-validation claim is made.

## Coordination and next smallest task

Next: inspect the website's current registration exchange and existing KCC360 participation/import functions, then implement a disabled full-refresh preview with fictional trusted identity mappings, explicit cancellations and unresolved-identity exceptions. Preserve existing students; registration never implies verified attendance/contribution. Before cross-system acceptance, the website team must agree participant-reference issuance and MIS/KCC360 mapping, consistent full-refresh paging/snapshots, and explicit cancellation rather than inferred deletion from missing rows.

Authentication/scopes, consent/guardian evidence, URL origin and withdrawal/reinstatement policy remain provisional. Reflection packages, approved completion-report PDFs and authorized fallback reconciliation remain later bounded increments. No new website-team decision is required to finish this event-only increment.

**Local mock workflow verified — cross-system acceptance pending** (event transfer and the bounded browser/operator workflow only).
