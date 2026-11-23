---
name: intake-triage
description: Classifies an incoming health FAQ question into Longevity, Brain, Vision, Physical Health, or Unclassified and flags it if it asks for personal dosage, medication-interaction, or lab-result advice. Writes results directly into the Submissions tab of the shared Google Sheet. Use on a frequent schedule.
---

# Intake Triage

**Trigger:** Scheduled Task, every ~5 minutes.

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

This skill reads and writes the **Submissions** tab only.

## Sheet schema (shared by every pipeline skill)

- **Submissions** — `timestamp`, `question`, `name`, `email`, `category`, `flagged`, `responded`, `drafted`, `notified`, `safety_draft_created`, `notify_draft_created`, `category_submitted`
- **Drafts** — `date`, `category`, `title`, `article_body`, `sources_cited`, `confidence`, `status`, `published_url`
- **Draft Responses** — `draft_id`, `type`, `recipient_email`, `subject`, `body`, `context`, `submission_ref`, `status`, `created_at`
- **Insights** — `week_ending`, `theme_trend`, `safety_escalation_rate`, `trust_coverage`, `classification_agreement`

Valid `category` values: **Longevity, Brain, Vision, Physical Health, Unclassified**.
There is no "Other" category — anything that fits none of the four is `Unclassified`.

`category_submitted` is the submitter's own pick from the website form. It is a hint
for humans and for reporting only — it is NEVER authoritative, and no skill routes,
counts or drafts on it. `category` is written solely by intake-triage and is the only
classification downstream skills act on.

Never add, rename or reorder columns. Never write to a column this skill is not
explicitly told to write to.

## Steps

1. Read the Submissions tab. Find every row where the `category` column is blank —
   these are untriaged. A row with a value in `category_submitted` but a blank
   `category` is still untriaged: the submitter's own pick never counts as triage, and
   skipping such a row would mean its safety check never runs.
2. For each such row:

   **SAFETY CHECK** — does this question ask for any of the following?
   - A personal dosage or timing recommendation ("how many mg of X should I take")
   - An interaction between a named medication/condition and a supplement or practice
   - Interpretation of a personal lab result or biomarker reading

   If yes to any: `flagged` = TRUE. If no: `flagged` = FALSE.

   **CATEGORY** — classify into exactly one of: Longevity, Brain, Vision,
   Physical Health. If the question fits none of those four, use `Unclassified`.

   Classify from the `question` text ALONE. Do not read, defer to, or be anchored by
   `category_submitted` — an independent classification is what makes the
   submitter-vs-triage agreement rate meaningful, and submitters mis-file often.
   Never write to `category_submitted`; leave it exactly as the form left it.

   An `Unclassified` row still gets a real safety check — run the safety check above
   on every row regardless of category, and set `flagged` accordingly. `Unclassified`
   rows never accumulate drafting volume (newsroom-drafting ignores them), but a
   flagged one must still reach the safety-response queue.

3. Write the result back into that same row's `category` and `flagged` cells. Do not
   add a new row — edit the row in place.
4. Do not touch `responded`, `drafted`, `notified`, `safety_draft_created` or
   `notify_draft_created`; those belong to the other skills.
5. Do not answer the question yourself.
