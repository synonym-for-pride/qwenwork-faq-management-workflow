---
name: auto-response
description: Drafts a fixed safety disclaimer for any Submissions row flagged TRUE by intake-triage and queues it in Draft Responses for human approval. Use on a frequent schedule.
---

# Auto-Response (flagged path) — drafts only, does not send

**Trigger:** Scheduled Task, every ~5–15 minutes.

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

This skill reads **Submissions**, appends to **Draft Responses**, and writes one
Submissions cell (`safety_draft_created`).

## Sheet schema (shared by every pipeline skill)

- **Submissions** — `timestamp`, `question`, `name`, `email`, `category`, `flagged`, `responded`, `drafted`, `notified`, `safety_draft_created`, `notify_draft_created`, `category_submitted`
- **Drafts** — `date`, `category`, `title`, `article_body`, `sources_cited`, `confidence`, `status`, `published_url`
- **Draft Responses** — `draft_id`, `type`, `recipient_email`, `subject`, `body`, `context`, `submission_ref`, `status`, `created_at`
- **Insights** — `week_ending`, `theme_trend`, `safety_escalation_rate`, `trust_coverage`, `classification_agreement`

Valid `category` values: **Longevity, Brain, Vision, Physical Health, Unclassified**.
There is no "Other" category.

`category_submitted` is the submitter's own pick from the website form. It is a hint
for humans and for reporting only — it is NEVER authoritative, and no skill routes,
counts or drafts on it. `category` is written solely by intake-triage and is the only
classification downstream skills act on.

Never add, rename or reorder columns. Never write to a column this skill is not
explicitly told to write to.

## Steps

Read the Submissions tab. Find every row where `flagged` = TRUE, `responded` is blank,
and `safety_draft_created` is blank. This applies to every category, `Unclassified`
included — a flagged question always gets the disclaimer.

For each one, append a new row to the Draft Responses tab:

- `draft_id`: "SR-" + current unix timestamp (ms)
- `type`: "safety_disclaimer"
- `recipient_email`: that row's `email`
- `subject`: "Re: your question"
- `body`: "This touches on personal medical guidance we can't respond to directly. Please
  consult a qualified healthcare professional — here's how to find one [link]. General
  disclaimer: nothing on this site is a substitute for individualized medical advice."
- `context`: that row's `question` (truncate to ~100 chars if long)
- `submission_ref`: that row's `timestamp` value, copied **exactly** as it appears in
  the cell (used later to flip `responded`)
- `status`: "pending"
- `created_at`: current ISO timestamp

If a Submissions row's `email` is blank, skip it — do not queue a draft with no
recipient, and leave `safety_draft_created` blank so it is reconsidered if the address
is filled in later.

Then mark that Submissions row's `safety_draft_created` cell TRUE so it isn't queued
again.

Do NOT send the email yourself and do NOT set `responded` — that happens only after a
human approves it in the Draft Responses queue and the send-approved-responses skill
actually sends it. Never touch `category`, `flagged`, `drafted` or `notified`. Never
generate a custom message — the body is always the fixed text above.
