---
name: weekly-insights-report
description: Produces a weekly 4-number business insights report (theme trend, safety-escalation rate, published-article trust coverage, submitter-vs-triage classification agreement) from the Google Sheet's Submissions and Drafts tabs, and appends it to the Insights tab. Use on a weekly schedule.
---

# Weekly Business Insights Report

**Trigger:** Scheduled Task, weekly.

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

This skill reads **Submissions** and **Drafts** and appends to **Insights**. It writes
nothing back to Submissions or Drafts.

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

Never add, rename or reorder columns.

## Steps

Read the Submissions tab for the last 7 days and the prior 7 days (by `timestamp`).
Read the Drafts tab for all rows to date. Compute exactly 4 numbers:

1. **Theme trend** — the fastest-growing `category` this week vs. last week in
   Submissions, and its % change. Consider only Longevity, Brain, Vision and
   Physical Health; report `Unclassified` volume separately only if it is the single
   largest group, as a data-quality note.
2. **Safety-escalation rate** — % of all Submissions rows flagged TRUE this week, and
   which category flags most.
3. **Trust/coverage stat** — of all Drafts rows where `status` = "published", how many
   are well-supported vs. mixed evidence vs. contested (from `confidence`), and which
   categories have at least one published row.

4. **Classification agreement** — of this week's Submissions rows that have BOTH a
   non-blank `category_submitted` and a non-blank `category`, the % where the two
   match, plus the single most common mis-file direction (e.g. "most often submitted as
   Longevity, triaged as Physical Health"). Ignore rows where `category_submitted` is
   blank — they say nothing about agreement. If fewer than 5 rows qualify, say
   "sample too small (N rows)" instead of reporting a percentage.

   This number is the case for the classifier: a low agreement rate means the dropdown
   alone would have mis-routed that share of questions to the wrong curated source
   list.

If a category had zero rows last week, describe the change in words ("first submissions
this week") rather than reporting a division-by-zero or an infinite % change.

Append ONE new row to the Insights tab with: `week_ending` (today's date),
`theme_trend`, `safety_escalation_rate`, `trust_coverage`, `classification_agreement`
— all four written as short readable strings, not raw numbers alone. These strings are
rendered verbatim on the ops dashboard, so keep each under roughly 140 characters.

Report aggregate counts only. Never copy an individual `question`, `name`, `email` or
any other visitor-level value into an Insights row.
