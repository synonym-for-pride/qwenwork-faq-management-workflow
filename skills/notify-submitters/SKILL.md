---
name: notify-submitters
description: Drafts a "your question was covered" email for everyone whose question contributed to a now-published article, and queues it in Draft Responses for human approval. Use on a daily schedule, after newsroom-drafting and human approval of the article.
---

# Notify Submitters — drafts only, does not send

**Trigger:** Scheduled Task, daily.

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

This skill reads **Drafts** and **Submissions**, appends to **Draft Responses**, and
writes one Submissions cell (`notify_draft_created`).

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

1. Read the Drafts tab. Find rows where `status` = "published" and `published_url` is
   filled in.
2. For each such Drafts row, read the Submissions tab and find rows where `category`
   matches that Drafts row's category, `drafted` = TRUE, `notified` is blank, and
   `notify_draft_created` is blank. Never match on `Unclassified` — those rows did not
   contribute to any article.
3. For each matching Submissions row, append a new row to Draft Responses:

   - `draft_id`: "NS-" + current unix timestamp (ms)
   - `type`: "notify_submitter"
   - `recipient_email`: that row's `email`
   - `subject`: "We covered your question"
   - `body`: "Thanks for your question about {category}. We just published an article
     that covers it: '{title}' — read it here: {published_url}."
   - `context`: "{category}: {title}"
   - `submission_ref`: that Submissions row's `timestamp` value, copied **exactly** as
     it appears in the cell
   - `status`: "pending"
   - `created_at`: current ISO timestamp

   If a Submissions row's `email` is blank, skip it and leave `notify_draft_created`
   blank.

4. Mark that Submissions row's `notify_draft_created` cell TRUE.

If two published Drafts rows share the same category, queue each submitter only once —
use the most recently published of the two. Do NOT send the email yourself and do NOT
set `notified` — that happens only after a human approves it and
send-approved-responses actually sends it. Matching is by topic/category, not exact
question wording.
