# Project discussion threads — Stage 122

The existing activity/project Discussion tab now presents root messages with append-only replies and an Open/Resolved discussion status. It remains shared project communication, not a confidential evaluation, finance or personal-support channel. No new module, SQL table, identity grant or public sharing path was added. Two guarded commands and one optional discussionEvents array in the existing project payload extend the current architecture.

## Preservation and authority

Existing messages are not rewritten. Legacy roots receive deterministic project/index references at read time; the message array remains append-only. New messages receive project-bound identifiers, and replies refer only to an existing root in the same selected project. The thread author remains the displayed thread owner. Root author or current assigned mentor may resolve/reopen the discussion with a required shared reason. This is communication housekeeping, not an academic approval, project completion or faculty evaluation power. Other project readers may reply while the thread is open under existing write access, but cannot mark another author's thread resolved merely because they have reporting access.

Resolution history appends version/state/actor/time/reason entries and leaves message text intact. A resolved thread pauses replies until authorized reopening. Current root reference, thread version and message count are checked in addition to the existing workspace CAS. Current record visibility and mentor assignment are rechecked. Official participant outcomes keep historical read access but block writes; paused/cancelled activities block message, reply and discussion-state writes. No new closed-activity approval or record-amendment workflow is implied.

Messages/replies allow 1–4,000 characters, status reasons 1–1,000, with whitespace/control validation and escaped display. Client-injected author/state form fields are rejected. Existing optional routine project-discussion notifications also cover appended replies; no new mandatory queue, deadline, background sending or external message is introduced. Resolution events do not alter task verification or activity state. Other record-specific private discussions, mentions, attachments, configurable responsible-user routing and broader thread contexts remain G18 work; no requirement is declared excluded or fully accepted.

## Evidence

check-project-discussion.mjs verifies preserved legacy text, scoped root references, replies, author/current-mentor resolution/reopening, immutable history, required reasons, stale versions/counts, cross-record/role/transfer/outcome/control denial, escaping, pure rendering and all-persona raw/projected parity. check-server.mjs adds actual SQLite-backed root/reply/status persistence and stale request rejection. The command-list guards permit only the two reviewed discussion additions; all previous commands and live authorization remain protected.

Final automated baseline: 105/105 scripts passed, with TypeScript. Per-script evidence is in AUTOMATED_BASELINE_STAGE122.json. Existing audit, notification, outcome, activity-change, synchronization and role workflows pass. This is fictional automated evidence, not browser/keyboard/institutional acceptance. Progression and full demonstration data remain deferred.

## Manual acceptance addition (Not run)

1. Open an activity Discussion as an existing student; read legacy messages and post a root.
2. Reply as a second current participant; verify shared audience and timestamps.
3. Confirm that a reader who is neither root author nor assigned mentor cannot resolve that thread.
4. Resolve with a reason as root author or current mentor; check retained replies/history and paused reply control.
5. Reopen with a reason; check versioned history and resumed replies.
6. Change records/mentor or use a stale tab; confirm scope/version rejection without altering stored discussion.
7. Check paused/cancelled and official-outcome read-only behavior, long/Unicode text, keyboard controls, mobile layout and screen-reader labels.

Next: incorporate recent CV/report/multi-role/discussion checkpoints into the consolidated acceptance walkthrough and retain all unverified results explicitly.
