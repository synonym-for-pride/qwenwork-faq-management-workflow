---
name: newsroom-drafting
description: Drafts a cited, evidence-graded article on the week's top FAQ theme (Longevity, Brain, Vision, or Physical Health) from the Google Sheet's Submissions tab, using a fixed per-category list of trusted sources, and appends it to the Drafts tab as a pending-approval row. Use on a daily schedule.
---

# Newsroom Drafting

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

This skill reads **Submissions**, appends to **Drafts**, and writes one Submissions
cell (`drafted`).

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

1. Read the Submissions tab. Count rows where `flagged` = FALSE and `drafted` is blank,
   grouped by `category`, from the last 7 days (by `timestamp`).
2. Pick the category with the most such rows, considering only: **Longevity, Brain,
   Vision, Physical Health**. Never draft for `Unclassified` — there is no curated
   source list for it; if `Unclassified` is the largest group, ignore it and pick the
   largest of the four instead. Break a tie between two of the four by picking the one
   with the more recent newest `timestamp`.
3. If the chosen category has fewer than 3 rows, stop and output "Not enough volume to
   draft yet." Do not write anything to Drafts.
4. Otherwise, using ONLY the sources listed below for that category, write a 400–600
   word article answering the most common phrasing of this week's top question in that
   category.

### Curated sources — Longevity
1. NIH National Institute on Aging (NIA) — Health Topics — https://www.nia.nih.gov/health
2. Examine.com Database — independent, ad-free, evidence-graded research — https://examine.com/
3. NIH National Center for Complementary and Integrative Health — https://www.nccih.nih.gov/health/supplements
4. Cochrane Library — systematic reviews — https://www.cochranelibrary.com/

### Curated sources — Brain
1. NIH National Institute on Aging — Health Topics (cognitive health, memory) — https://www.nia.nih.gov/health
2. Examine.com Database — https://examine.com/
3. NIH National Center for Complementary and Integrative Health — https://www.nccih.nih.gov/health/supplements
4. Cochrane Library — https://www.cochranelibrary.com/

### Curated sources — Vision
1. National Eye Institute (NEI/NIH) — Eye Health Information — https://www.nei.nih.gov/eye-health-information
2. Examine.com Database — https://examine.com/
3. NIH National Center for Complementary and Integrative Health — https://www.nccih.nih.gov/health/supplements
4. Cochrane Library — https://www.cochranelibrary.com/

### Curated sources — Physical Health
1. CDC — Physical Activity Guidelines for Americans — https://www.cdc.gov/physical-activity-basics/guidelines/adults.html
2. NIH National Institute on Aging — Health Topics (exercise) — https://www.nia.nih.gov/health
3. Examine.com Database — https://examine.com/
4. Cochrane Library — https://www.cochranelibrary.com/

Note: Examine.com and Cochrane Library repeat across all four lists because they cover
supplement/intervention evidence generically across topics — the first source in each
list is the category-specific authority and should anchor the article; the other three
are supporting evidence.

5. Cite every factual claim inline with a bracketed source number matching the list
   above (e.g. [1], [2]).
6. Never give a personal dosage, a medication-interaction answer, or an interpretation
   of a lab result, even if the underlying questions asked for one. Write at the level
   of general evidence, and point readers to a qualified professional for anything
   individual.
7. Append ONE new row to the Drafts tab with: `date` (today), `category`, `title`,
   `article_body` (the full article with inline citations), `sources_cited` (the
   numbered list used), `confidence` (well-supported | mixed evidence | contested, plus
   a one-sentence reason), `status` ("draft"). Leave `published_url` blank.
8. Go back to every Submissions row that contributed to this week's count for the
   chosen category and mark `drafted` TRUE, so they aren't recounted next week. Do not
   touch rows in other categories, and do not touch `category`, `flagged`, `responded`,
   `notified`, `safety_draft_created` or `notify_draft_created`.
