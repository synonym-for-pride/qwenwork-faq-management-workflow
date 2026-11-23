---
name: send-approved-responses
description: Sends every Draft Responses row a human has approved via the QwenWork Page, then marks it sent and flips the matching flag back on Submissions. Use on a frequent schedule.
---

# Send Approved Responses

**Trigger:** Scheduled Task, every ~5–15 minutes (same frequency as auto-response, so
approved safety responses go out quickly).

## Shared data source

**Google Sheet:** "<YOUR SHEET NAME>"
**Spreadsheet ID:** `YOUR_SPREADSHEET_ID`
**URL:** https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit

> **⚙️ Setup required — this skill will not run as-is.**
> Replace `YOUR_SPREADSHEET_ID` above with your own Google Sheet's ID, and
> `<YOUR SHEET NAME>` with its title. The ID is the long string in your sheet's
> URL between `/d/` and `/edit`. Create the four tabs and headers first — see
> **Set up your own sheet** in the repository [README](../../README.md).

Always resolve the sheet by the ID above. Do not search Drive by name — there may be
older logs with similar titles.

This skill reads and writes **Draft Responses**, and writes one Submissions cell per
sent row (`responded` or `notified`).

## Sheet schema (shared by every pipeline skill)

- **Submissions** — `timestamp`, `question`, `name`, `email`, `category`, `flagged`, `responded`, `drafted`, `notified`, `safety_draft_created`, `notify_draft_created`, `category_submitted`
- **Drafts** — `date`, `category`, `title`, `article_body`, `sources_cited`, `confidence`, `status`, `published_url`
- **Draft Responses** — `draft_id`, `type`, `recipient_email`, `subject`, `body`, `context`, `submission_ref`, `status`, `created_at`
- **Insights** — `week_ending`, `theme_trend`, `safety_escalation_rate`, `trust_coverage`, `classification_agreement`

`category_submitted` is the submitter's own pick from the website form. It is a hint
for humans and for reporting only — it is NEVER authoritative, and no skill routes,
counts or drafts on it. `category` is written solely by intake-triage and is the only
classification downstream skills act on.

Never add, rename or reorder columns. Never write to a column this skill is not
explicitly told to write to.

## Steps

Read the Draft Responses tab. Find every row where `status` = "approved".

For each one:

1. Send an email to `recipient_email` with the subject and body from that row, using
   the Email connector.
2. On success, set that Draft Responses row's `status` to "sent".
3. Find the Submissions row whose `timestamp` matches this row's `submission_ref`.
   Compare the two values as trimmed strings; if the sheet renders them in different
   formats, compare the underlying date-time value instead.
   - If `type` = "safety_disclaimer", set that Submissions row's `responded` to TRUE.
   - If `type` = "notify_submitter", set that Submissions row's `notified` to TRUE.

   If `submission_ref` matches **no** Submissions row, or matches **more than one**,
   still mark the Draft Responses row "sent" (the email did go out) but do not write to
   Submissions. Output a one-line warning naming the `draft_id`, so the ambiguity is
   visible rather than silently flipping the wrong row's flag.

**Send exactly once.** Set `status` to "sent" immediately after each successful send,
before moving to the next row — never re-send a row that is already "sent". If the send
fails, leave `status` as "approved" so it's retried next run.

Rows where `status` = "rejected": do nothing — leave them as a record. Optionally, if
you want a rejected draft to be eligible for a fresh attempt, clear the matching
Submissions `safety_draft_created` / `notify_draft_created` flag so the drafting skill
queues a new one next run — only do this if the user has set that up as the intended
behavior, since by default a rejection is final.

Never invent or alter the subject/body of an approved row — send exactly what's there.
