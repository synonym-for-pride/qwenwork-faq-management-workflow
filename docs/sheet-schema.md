# Sheet schema

The pipeline's shared state lives in one Google Sheet with four tabs. Headers are
lower-case and read by name, so column order can change without breaking the skills.
Extra columns are ignored.

Boolean cells are the strings `TRUE` / `FALSE` (or empty, treated as false).
Timestamps are ISO 8601 UTC; dates are `YYYY-MM-DD`.

---

## `Submissions`

One row per incoming question. Written by the intake form, then annotated by the
pipeline. **Contains visitor names and email addresses — never publish this tab.**

| Column | Written by | Notes |
|---|---|---|
| `timestamp` | intake form | ISO 8601 UTC. |
| `question` | intake form | The reader's question, verbatim. |
| `name` | intake form | Visitor-level data. |
| `email` | intake form | Visitor-level data. |
| `category` | `intake-triage` | **Authoritative.** One of Longevity, Brain, Vision, Physical Health, Unclassified. |
| `flagged` | `intake-triage` | `TRUE` when the question asks for personal dosage, medication-interaction or lab-result advice. |
| `responded` | `send-approved-responses` | A reply has actually been sent. |
| `drafted` | `newsroom-drafting` | This question fed a drafted article. |
| `safety_draft_created` | `auto-response` | A disclaimer is queued in `Draft Responses`. |
| `notify_draft_created` | `notify-submitters` | A coverage notification is queued. |
| `category_submitted` | intake form | The reader's own pick. **A hint only** — never authoritative. Compared against `category` to produce the weekly classification-agreement metric. |
| `notified` | `send-approved-responses` | A coverage notification has actually been sent. |

The paired `*_draft_created` / sent flags are what keep the pipeline idempotent: a
drafting task skips rows it has already queued, and the send task skips rows it has
already sent, so every skill can run on a tight schedule without duplicating work.

---

## `Drafts`

One row per article draft.

| Column | Notes |
|---|---|
| `date` | Draft date. |
| `category` | One of the four content pillars. |
| `title` | Article headline. |
| `article_body` | Full text, newline-separated paragraphs, with bracketed source markers (`[1]`, `[2]`). |
| `sources_cited` | Numbered list matching the in-text markers, one per line, each with a URL. |
| `confidence` | Evidence grade plus its reasoning: `well-supported`, `mixed evidence`, or `contested`. |
| `status` | `draft` → `approved` → `published`. Only `published` rows surface on the dashboard and trigger `notify-submitters`. |
| `published_url` | Live URL, set by the operator at publish time. Empty until then. |

---

## `Draft Responses`

The human approval queue. Every outgoing email lands here first; nothing is sent
from any other path.

| Column | Notes |
|---|---|
| `draft_id` | Unique ID. `SR-` + unix ms for safety disclaimers, `NS-` + unix ms for submitter notifications. |
| `type` | `safety_disclaimer` or `notify_submitter`. **`send-approved-responses` branches on this exact string** to decide whether to set `responded` or `notified`, so a typo here sends the email but silently leaves the Submissions flag unset. |
| `recipient_email` | Visitor-level data. |
| `subject` | Email subject. |
| `body` | Email body as drafted. |
| `context` | The triggering question, truncated — so the approver can judge without opening another tab. |
| `submission_ref` | The `timestamp` of the matching `Submissions` row. |
| `status` | `pending` → `approved` / `rejected` → `sent`. |
| `created_at` | When the draft was queued. |

---

## `Insights`

One row per week, appended by `weekly-insights-report`. Each metric is written as a
full sentence including its own numerator and denominator, so a row is readable on
its own without recomputation.

| Column | Notes |
|---|---|
| `week_ending` | `YYYY-MM-DD`. |
| `theme_trend` | Which category grew most, with week-over-week counts. States plainly when there is no prior-week baseline rather than implying a trend. |
| `safety_escalation_rate` | Share of the week's submissions that were flagged, plus which categories drove it. |
| `trust_coverage` | Published articles broken down by confidence grade, and which pillars have no published coverage. |
| `classification_agreement` | How often the reader's `category_submitted` matched the triaged `category`, plus the most common mismatch. |
