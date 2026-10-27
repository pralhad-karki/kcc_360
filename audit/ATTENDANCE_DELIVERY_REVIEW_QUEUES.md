# Stage 156 — Attendance and delivery review follow-ups

Minimum change: extend the existing mentor record responsibility queue with submitted attendance roster counts. Only the current assigned mentor sees active-source rosters that do not include their own attendance. These are review responsibilities, not claims that every roster passes verification. Existing overlap, eligibility and correction controls remain authoritative.

Filter existing delivery-plan and individual-output notifications against current source, lifecycle stage, independent mentor, exact source version and deadline. Stored notices recheck canonical identity and existing escalation recipients; prior notification history is retained. Output review can still return deficient evidence or an old plan link; verification prerequisites remain in the detailed process.

No commands, roles, schema, routes, grades, attendance rules or external transport added. Existing Action Centre delivery cards are unchanged; this correction concerns assigned dashboard actions and notification access. No live records seeded. Semester/year progression and the full sample dataset remain deferred.

Validation: check-attendance-delivery-queues.mjs exercises actual attendance submission, return and verification; mentor/self/source revocation; delivery notification freshness and old-notice denial; privacy and raw/projected parity. Full baseline evidence is AUTOMATED_BASELINE_STAGE156.json. Browser/keyboard/PDF and institutional acceptance remain Not run.
