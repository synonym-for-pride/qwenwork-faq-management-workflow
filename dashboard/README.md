# FAQ Management Workflow — Weekly Ops Dashboard

A small, dependency-free internal dashboard that visualises the week's
FAQ Management Workflow operations from a Google Sheet. It is a **static web app** —
plain HTML + vanilla JavaScript, no build step, no framework, no backend
of its own. Open it in a browser and it reads your data live.

It was built for an internal ops screen / demo, but it is written so any
future user can point it at **their own** Google Sheet by editing a single
config file — your personal links never have to be committed to Git.

---

## What it shows

| Section | Source | Behaviour |
|---|---|---|
| **This week at a glance** — 3 stat cards (theme trend, safety escalation rate, trust coverage) | `Insights` tab | Live — re-fetched on load and on **Refresh** |
| **Published this week** — article cards with category badge + link | `Drafts` tab (rows where `status = published`) | Live |
| **Category breakdown — published articles** — bar chart per pillar | `Drafts` tab | Live |
| **Pending responses — awaiting approval** — review queue with **Send** / **Don't send** buttons | `Draft Responses` tab (rows where `status = pending`) | Live, optional |
| **Submissions by category** — aggregate bar chart | Baked into `config.js` | **Snapshot** (not fetched live) |

### Design principles
- **Read-only from the browser.** The page only ever *reads* published CSV
  tabs. The one write it can make is the Send / Don't-send POST to your own
  approval endpoint.
- **Privacy by construction.** The `Submissions` tab (which contains visitor
  names, emails and individual questions) is **never** fetched by the page.
  The "Submissions by category" section shows pre-computed aggregate counts
  you supply in config, so no visitor-level data reaches a viewer's browser.
- **Legible at a glance.** Minimal, neutral styling — designed to be readable
  on a shared screen / demo video.

---

## Google Sheet schema

The dashboard expects these tabs and column headers (lower-case, as read):

- **`Insights`** — `week_ending`, `theme_trend`, `safety_escalation_rate`, `trust_coverage`
- **`Drafts`** — `date`, `category`, `title`, `article_body`, `sources_cited`, `confidence`, `status`, `published_url`
- **`Draft Responses`** (optional) — `draft_id`, `type`, `recipient_email`, `subject`, `body`, `context`, `submission_ref`, `status`, `created_at`

Only the columns named above are used; extra columns are ignored.

---

## Getting your links (Publish to web → CSV)

For each tab you want to show:

1. Open the Google Sheet and click the tab (e.g. **Insights**).
2. **File → Share → Publish to web**.
3. In the first dropdown, choose that **single tab** (not "Entire document").
4. Format: **Comma-separated values (.csv)** → **Publish**.
5. Copy the URL it gives you. It looks like:
   `https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv`

> **Caching note:** Google caches published-to-web CSV for a few minutes.
> After you change the sheet, use **File → Publish to web → Re-publish** to
> force Google to regenerate the CSV, otherwise a Refresh may briefly show
> stale data.

---

## Setup

1. **Clone / download** this repo.
2. **Create your config** from the template:
   ```bash
   cp config.example.js config.js      # macOS / Linux
   copy config.example.js config.js    # Windows
   ```
3. **Edit `config.js`** and paste your own CSV links (and approval endpoint if
   you use the Pending-responses queue). Set `submissionsSnapshot.enabled` to
   `false` if you don't want the snapshot chart.
4. **Serve it locally.** Because the page makes cross-origin `fetch` calls,
   open it over `http://` rather than `file://` to avoid browser restrictions.
   Any static server works, e.g.:
   ```bash
   python -m http.server 8000
   # then open http://localhost:8000
   ```
   (VS Code "Live Server", `npx serve`, etc. all work too.)

`config.js` is git-ignored, so your real links stay on your machine. If a
required link is missing or still a placeholder, the page shows an in-app
"add your links" setup prompt instead of erroring.

---

## The Pending-responses approval flow (optional)

When `draftResponsesCsvUrl` and `approveEndpoint` are set, the page lists
every `Draft Responses` row with `status = pending` and gives each a
**Send** and **Don't send** button. Clicking one sends a
`application/x-www-form-urlencoded` POST to your endpoint:

```
action=update_draft_status
draft_id=<the row's draft_id>
decision=approved | rejected
```

On success the row disappears from the list. Your endpoint (e.g. a Google
Apps Script web app) is responsible for actually sending the email and/or
updating the sheet's `status`. The page is fire-and-forget: Apps Script web
apps don't return CORS headers, so the request uses `mode: "no-cors"` and
the page assumes success unless the network itself fails. If you want the
page to read a real server response, have your endpoint return an
`Access-Control-Allow-Origin` header.

---

## Data freshness — live vs. snapshot

- **Live (re-fetched on page load and on the Refresh button):** Insights,
  Published articles, Pending responses. There is **no background polling** —
  open/refresh to get current data.
- **Snapshot (baked into `config.js`):** Submissions-by-category. To update
  it, edit the `submissionsSnapshot` block.

---

## Security & privacy caveats

- The **Pending responses** section renders `recipient_email` and message
  `body` — that is visitor-level data. Keep this page **access-restricted**
  and do **not** expose the public URL (or the published CSV links) in a
  public demo.
- The approval endpoint described above is, by default, **unauthenticated** —
  anyone who can load the page can trigger a send. Add auth / a shared secret
  on the endpoint side before using it with real recipients.
- Publishing a tab "to the web" makes it readable by anyone with the link.
  Publish only the tabs you need, and never publish `Submissions`.

---

## File structure

```
.
├── index.html          # the dashboard (markup + styles + logic)
├── config.example.js   # committed template — copy to config.js and fill in
├── config.js           # YOUR local secrets (git-ignored, not committed)
└── README.md           # this file
```

`config.js` is kept out of version control by the repository-root `.gitignore`.

```
```

No dependencies, no build, no lockfiles — it's three files and a config.

---

## Customising

- **Pillars / chart order:** edit `categories` in `config.js`.
- **Snapshot chart:** edit or disable `submissionsSnapshot`.
- **Copy / labels:** the section headings and stat-card titles are plain text
  in `index.html`.
- **Styling:** all visual tokens (colours, radius, shadow) are CSS variables
  in the `:root` block at the top of `index.html`.
