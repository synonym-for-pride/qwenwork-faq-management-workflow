/*
 * config.example.js — TEMPLATE (safe to commit)
 * ------------------------------------------------------------------
 * Copy this file to a new file named exactly  config.js  in the same
 * folder, then replace each placeholder with YOUR OWN values.
 *
 *   cp config.example.js config.js      (macOS / Linux)
 *   copy config.example.js config.js    (Windows)
 *
 * config.js is listed in .gitignore, so your real links are NEVER
 * committed to GitHub. Only this .example file is shared.
 *
 * Leave a value as its "PASTE_YOUR_..." placeholder (or empty string)
 * to disable that part of the dashboard. The Pending-responses section
 * only appears once draftResponsesCsvUrl is set.
 */

window.APP_CONFIG = {

  // REQUIRED — Google Sheet tab published to the web as CSV.
  // In Google Sheets: File → Share → Publish to web → choose the single
  // tab → format "Comma-separated values (.csv)" → Publish → copy the URL.
  insightsCsvUrl: "PASTE_YOUR_INSIGHTS_TAB_CSV_URL",
  draftsCsvUrl:   "PASTE_YOUR_DRAFTS_TAB_CSV_URL",

  // OPTIONAL — enables the "Pending responses" approval queue.
  // Publish the "Draft Responses" tab the same way.
  draftResponsesCsvUrl: "PASTE_YOUR_DRAFT_RESPONSES_TAB_CSV_URL",

  // OPTIONAL — your email-approval endpoint (e.g. a Google Apps Script
  // /exec URL). The Send / Don't-send buttons POST urlencoded here with
  // action=update_draft_status, draft_id and decision=approved|rejected.
  approveEndpoint: "PASTE_YOUR_APPS_SCRIPT_EXEC_URL",

  // Pillar categories, in the order they appear on the charts.
  categories: ["Longevity", "Brain", "Vision", "Physical Health"],

  // OPTIONAL — "Submissions by category" bar chart.
  // This is an AGGREGATE SNAPSHOT you bake in yourself; the page never
  // fetches raw submissions. Set enabled:false (or remove) to hide it.
  submissionsSnapshot: {
    enabled: false,   // flip to true once you fill in your own counts below
    asOf: "YOUR_AS_OF_DATE",
    totalLabel: "YOUR_TOTAL_LABEL (e.g. \"120 submissions total, Jan 1-7\")",
    note: "topic-classified counts only — no names, emails, or individual questions are shown or fetched by this page.",
    rows: [
      { label: "Physical Health", count: 0 },
      { label: "Longevity",       count: 0 },
      { label: "Vision",          count: 0 },
      { label: "Brain",           count: 0 },
      { label: "Unclassified",    count: 0 }
    ]
  }
};
