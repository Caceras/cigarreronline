/**
 * CigarrerOnline – Sheet bridge.
 *
 * Setup:
 *   1. Open the Google Sheet, Extensions → Apps Script, paste this file.
 *   2. Set SECRET below to the same value as SHEET_SECRET on the CMS server.
 *   3. Deploy → New deployment → Web app → Execute as: me → Who has access: anyone.
 *   4. Copy the /exec URL into SHEET_WEBAPP_URL on the CMS server.
 *
 * The CMS posts {secret, action: "read" | "write", rows}. Nothing else is accepted.
 */
var SECRET = 'byt-ut-mig';
var SHEET_NAME = 'Produkter';

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ error: 'bad json' }); }
  if (body.secret !== SECRET) return json({ error: 'forbidden' });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (body.action === 'read') {
    var values = sheet.getDataRange().getDisplayValues();
    return json({ rows: values });
  }

  if (body.action === 'write') {
    var rows = body.rows || [];
    sheet.clear();
    if (rows.length) {
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, rows[0].length);
    }
    return json({ ok: true, rows: rows.length - 1, url: ss.getUrl() });
  }

  return json({ error: 'unknown action' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
