/**
 * Apps Script backend for CodeYatri dashboard (Projects + Events combined).
 * - Put your Google Spreadsheet ID in SPREADSHEET_ID below.
 * - Create two sheets named exactly: "Projects" and "Events"
 * - First row in each sheet must be headers (see recommended columns below).
 *
 * Recommended headers:
 *  Projects: id,title,lead,priority,description,status,phase,githubRepo,phone
 *  Events:   id,title,description,date,status
 *
 * Deploy as Web App (Execute as: Me, Who has access: Anyone, even anonymous)
 *
 * Supported calls:
 *  GET  ?action=get&type=projects|events|both (or omit type => both)
 *  GET  ?type=projects|events&action=delete&id=ID
 *  GET  ?action=update&data=URLENCODED_JSON  (fallback)
 *  POST (JSON body) ?action=update&type=projects|events  -> upsert
 */

const SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE'; // <<-- SET THIS

function getSpreadsheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PUT_YOUR') === 0) {
    throw new Error('Please set SPREADSHEET_ID in the script.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetByType(type) {
  const ss = getSpreadsheet();
  if (type === 'projects') return ss.getSheetByName('Projects');
  if (type === 'events') return ss.getSheetByName('Events');
  return null;
}

function readSheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1);
  return rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i];
    });
    if (obj.id != null) obj.id = String(obj.id);
    return obj;
  });
}

function findRowIndexById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(id)) return i + 1; // 1-based
  }
  return -1;
}

function upsertItem(type, item) {
  const sheet = getSheetByType(type);
  if (!sheet) throw new Error('Unknown sheet type: ' + type);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const id = String(item.id || '');
  if (!id) throw new Error('Item must include id');
  const rowNum = findRowIndexById(sheet, id);
  const rowValues = headers.map(h => item[h] != null ? item[h] : '');
  if (rowNum > 0) {
    sheet.getRange(rowNum, 1, 1, rowValues.length).setValues([rowValues]);
    return { updated: true, id };
  } else {
    sheet.appendRow(rowValues);
    return { created: true, id };
  }
}

function deleteItem(type, id) {
  const sheet = getSheetByType(type);
  if (!sheet) throw new Error('Unknown sheet type: ' + type);
  const rowNum = findRowIndexById(sheet, id);
  if (rowNum > 0) {
    sheet.deleteRow(rowNum);
    return true;
  }
  return false;
}

function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* GET handler */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const type = (params.type || '').toString().toLowerCase();
    const action = (params.action || 'get').toString().toLowerCase();

    // Combined GET: return both sheets when type is 'both' or omitted
    if (action === 'get' && (!type || type === 'both')) {
      const ss = getSpreadsheet();
      const projectsSheet = ss.getSheetByName('Projects');
      const eventsSheet = ss.getSheetByName('Events');
      const projects = projectsSheet ? readSheetData(projectsSheet) : [];
      const events = eventsSheet ? readSheetData(eventsSheet) : [];
      return respondJSON({ success: true, projects, events });
    }

    // Per-type GET
    if (action === 'get' && (type === 'projects' || type === 'events')) {
      const sheet = getSheetByType(type);
      if (!sheet) return respondJSON({ success: false, error: 'Sheet not found: ' + type });
      const data = readSheetData(sheet);
      return respondJSON({ success: true, data });
    }

    // Delete
    if (action === 'delete' && (type === 'projects' || type === 'events')) {
      const id = params.id;
      if (!id) return respondJSON({ success: false, error: 'Missing id' });
      const ok = deleteItem(type, id);
      return respondJSON({ success: ok });
    }

    // Fallback update via GET (data param containing JSON)
    if (action === 'update' && params.data) {
      const raw = params.data;
      const parsed = JSON.parse(decodeURIComponent(raw));
      const targetType = (params.type || parsed.type || '').toString().toLowerCase();
      if (!targetType || (targetType !== 'projects' && targetType !== 'events')) {
        return respondJSON({ success: false, error: 'Missing or invalid type for update' });
      }
      const res = upsertItem(targetType, parsed);
      return respondJSON({ success: true, result: res });
    }

    return respondJSON({ success: false, error: 'Invalid request' });
  } catch (err) {
    return respondJSON({ success: false, error: String(err) });
  }
}

/* POST handler */
function doPost(e) {
  try {
    const params = e.parameter || {};
    const action = (params.action || '').toString().toLowerCase();
    const type = (params.type || '').toString().toLowerCase();
    let payload = {};
    if (e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (e2) { payload = {}; }
    }

    const targetType = type || (payload && payload.type && String(payload.type).toLowerCase());
    if (action === 'update' && (targetType === 'projects' || targetType === 'events')) {
      const res = upsertItem(targetType, payload);
      return respondJSON({ success: true, result: res });
    }

    return respondJSON({ success: false, error: 'Invalid POST request' });
  } catch (err) {
    return respondJSON({ success: false, error: String(err) });
  }
}
