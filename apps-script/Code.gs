/**
 * IEMSS UTHM — contact form receiver
 *
 * Saves every message to a Google Sheet AND emails iemssuthm@gmail.com.
 * Setup instructions are in README-forms.md next to this file.
 */

// ---- settings ----------------------------------------------------
var SHEET_ID   = 'PASTE_YOUR_SPREADSHEET_ID_HERE'; // from the sheet URL
var SHEET_NAME = 'Messages';
var NOTIFY_TO  = 'iemssuthm@gmail.com';
var SITE_NAME  = 'IEMSS UTHM website';
// ------------------------------------------------------------------

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    var name    = String(p.name    || '').slice(0, 200);
    var email   = String(p.email   || '').slice(0, 200);
    var topic   = String(p.topic   || '').slice(0, 200);
    var message = String(p.message || '').slice(0, 5000);

    // ignore anything that trips the honeypot or arrives empty
    if (p['bot-field']) return ok('ignored');
    if (!name || !email || !message) return ok('incomplete');

    var sheet = getSheet_();
    sheet.appendRow([new Date(), name, email, topic, message, 'New']);

    MailApp.sendEmail({
      to: NOTIFY_TO,
      replyTo: email,
      subject: '[' + SITE_NAME + '] ' + (topic || 'New message') + ' — ' + name,
      body: 'A new message came in through the website.\n\n' +
            'Name:    ' + name + '\n' +
            'Email:   ' + email + '\n' +
            'Topic:   ' + topic + '\n\n' +
            message + '\n\n' +
            '---\nSaved to: ' + SpreadsheetApp.openById(SHEET_ID).getUrl()
    });

    return ok('saved');
  } catch (err) {
    // still try to alert someone if the sheet write failed
    try {
      MailApp.sendEmail(NOTIFY_TO, '[' + SITE_NAME + '] form error', String(err));
    } catch (ignored) {}
    return ok('error');
  }
}

function doGet() {
  return ContentService.createTextOutput('IEMSS UTHM form receiver is running.');
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Received', 'Name', 'Email', 'Topic', 'Message', 'Status']);
    sheet.getRange('A1:F1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(5, 420);
  }
  return sheet;
}

function ok(status) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: status }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to grant permissions and check the setup. */
function testSetup() {
  var sheet = getSheet_();
  sheet.appendRow([new Date(), 'Test entry', 'test@example.com', 'Setup check',
                   'If you can see this row, the script can write to the sheet.', 'Test']);
  Logger.log('Wrote a test row to: ' + SpreadsheetApp.openById(SHEET_ID).getUrl());
}
