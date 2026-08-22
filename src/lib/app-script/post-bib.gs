const SHEET_NAME = "Racepack Collection";
const SPREADSHEET_ID = ""

function doGet(e) {
    const qrCode = e.parameter.qrCode;
    const bib = e.parameter.bib;

    if (!qrCode) {
        return jsonResponse({
            success: false,
            message: "qrCode wajib diisi"
        });
    }

    return jsonResponse(scanQRCode(qrCode, bib));
}

function jsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function scanQRCode(qrCode, bib) {
    const start = Date.now();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
        return {
            success: false,
            exist: false,
        };
    }

    const cell = sheet
        .getRange(2, 13, lastRow - 1, 1)
        .createTextFinder(qrCode)
        .matchEntireCell(true)
        .findNext();

    if (!cell) {
        return {
            success: false,
            exist: false,
        };
    }

    const sheetRow = cell.getRow();
    const row = sheet.getRange(sheetRow, 1, 1, 14).getValues()[0];

    const now = new Date();
    sheet.getRange(sheetRow, 2, 1, 2).setValues([[bib, now]]);

    return {
        success: true,
        exist: true,
        bib: bib,
        jersey: row[3],
        category: row[4],
        community: row[5],
        name: row[6],
        gender: row[10],
        timestamp: now.toISOString()
    };
}