/**
 * FAQ Management Workflow — approval endpoint
 * ---------------------------------------------------------------------------
 * A Google Apps Script web app that receives Send / Don't-send verdicts from
 * the ops dashboard and writes them to the "Draft Responses" tab.
 *
 * It does NOT send email. It only flips one cell:
 *
 *     status: pending  ->  approved   (dashboard "Send")
 *     status: pending  ->  rejected   (dashboard "Don't send")
 *
 * The `send-approved-responses` skill is what actually sends. It picks up rows
 * where status = "approved", sends them, then sets status = "sent". Keeping the
 * send out of this endpoint is deliberate: a public URL can change a status,
 * but it can never cause an email to go out by itself.
 *
 * REQUEST (application/x-www-form-urlencoded POST)
 *     action=update_draft_status
 *     draft_id=<the row's draft_id>
 *     decision=approved | rejected
 *     token=<SHARED_SECRET>        // only if you set SHARED_SECRET below
 *
 * RESPONSE  {"ok":true,"draft_id":"SR-123","status":"approved","row":7}
 *
 * Note: Apps Script web apps cannot set CORS headers, so the dashboard POSTs
 * with mode:"no-cors" and never reads this response. It is still worth
 * returning — it's how you test the endpoint with curl (see README step 6).
 * ---------------------------------------------------------------------------
 */

// ======================= CONFIGURE THESE =======================

/**
 * Leave empty ("") if this script is bound to the spreadsheet
 * (Extensions -> Apps Script from inside your sheet). Otherwise paste your
 * spreadsheet ID.
 */
var SPREADSHEET_ID = '';

/** The approval-queue tab. Must match your sheet exactly. */
var SHEET_NAME = 'Draft Responses';

/**
 * STRONGLY RECOMMENDED. A long random string. The dashboard must then send it
 * as &token=... — add it to the POST body in index.html's decide() function.
 * Left empty, ANYONE who finds this URL can approve or reject your drafts.
 */
var SHARED_SECRET = '';

/**
 * Which status values may be changed. Defaults to pending-only, so a verdict
 * can never overwrite an already-sent row. Add 'approved' here if you want to
 * be able to change your mind before the send task next runs.
 */
var MUTABLE_STATUSES = ['pending'];

// ===============================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return json({ ok: false, error: 'busy, try again' });
  }

  try {
    var p = (e && e.parameter) || {};

    if (SHARED_SECRET && String(p.token || '') !== SHARED_SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }
    if (String(p.action || '') !== 'update_draft_status') {
      return json({ ok: false, error: 'unknown action' });
    }

    var draftId  = String(p.draft_id || '').trim();
    var decision = String(p.decision || '').trim().toLowerCase();

    if (!draftId) {
      return json({ ok: false, error: 'missing draft_id' });
    }
    if (decision !== 'approved' && decision !== 'rejected') {
      return json({ ok: false, error: 'decision must be approved or rejected' });
    }

    return json(setStatus_(draftId, decision));

  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Health check — visit the /exec URL in a browser. */
function doGet() {
  try {
    var sh = sheet_();
    return json({
      ok: true,
      sheet: SHEET_NAME,
      rows: Math.max(0, sh.getLastRow() - 1),
      authRequired: !!SHARED_SECRET
    });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

// --------------------------- internals ---------------------------

function sheet_() {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActive();
  if (!ss) {
    throw new Error('No spreadsheet. Bind this script to your sheet, or set SPREADSHEET_ID.');
  }
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    throw new Error('Tab not found: ' + SHEET_NAME);
  }
  return sh;
}

/**
 * Columns are resolved by header name, never by position, so reordering the
 * tab's columns will not break this.
 */
function setStatus_(draftId, decision) {
  var sh   = sheet_();
  var rows = sh.getLastRow();
  var cols = sh.getLastColumn();

  if (rows < 2) {
    return { ok: false, error: 'sheet is empty' };
  }

  var header = sh.getRange(1, 1, 1, cols).getValues()[0]
                 .map(function (h) { return String(h).trim().toLowerCase(); });

  var idCol     = header.indexOf('draft_id') + 1;
  var statusCol = header.indexOf('status') + 1;

  if (!idCol || !statusCol) {
    return { ok: false, error: 'missing draft_id or status column' };
  }

  var ids = sh.getRange(2, idCol, rows - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() !== draftId) continue;

    var row     = i + 2;
    var cell    = sh.getRange(row, statusCol);
    var current = String(cell.getValue()).trim().toLowerCase();

    if (MUTABLE_STATUSES.indexOf(current) === -1) {
      return {
        ok: false,
        error: 'status "' + current + '" is not mutable',
        draft_id: draftId,
        row: row
      };
    }

    cell.setValue(decision);
    SpreadsheetApp.flush();

    return { ok: true, draft_id: draftId, status: decision, row: row };
  }

  return { ok: false, error: 'draft_id not found', draft_id: draftId };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
