# Stage 289 — recovery of an active private discussion stack

5 November 2026, Asia/Kathmandu. Baseline `4f4600cbe3d39fdd78df23dd332966113a293d2d` on `development/website-mock-acceptance`.

The rehearsal exports a fictional SQLite workspace with two active discussion candidates and a third prepared candidate awaiting advancement. It verifies the JSON package against an independently retained digest and restores it into a fresh disposable SQLite database. The discussion and private-file recovery checks share the test fixture that verifies the package and imports its rows in a transaction. The destination must be empty.

A new service instance reproduces the complete private view, replays the saved preparation and advancement requests, and rejects an out-of-order reversal. It then advances the pending resolution and reverses all three commands latest first. Each view matches the existing engine result. The check compares the original canonical and staged rows, candidate and transition receipts, and audit history against the restored records. It also verifies that removing an active receipt from the export blocks restoration, and that revoking the current fictional authority blocks replay.

This evidence covers a local SQLite recovery rehearsal with fictional records. The separate private recovery suite exercises file object verification and withdrawal markers. The next combined rehearsal can include those records in the same export as an active discussion stack.

All six focused checks and [81 regression groups](STAGE289_REGRESSION.json) passed.
