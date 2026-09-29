/**
 * Suraksha — one-time schema migration for Suraksha_Test_Cases.xlsx
 * -------------------------------------------------------------------
 * Inserts two columns into the "Test Cases" sheet that the workbook was
 * missing: "Actual Result" (right after "Expected Result") and "Severity"
 * (right after "Priority"), and backfills them for all 168 existing rows:
 *   - Actual Result <- the existing Notes value (that column already held
 *     the observed/actual outcome text recorded when each case was run).
 *   - Severity      <- 'N/A' for Pass/N/A rows (no defect); for Fail rows,
 *     a fixed classification for the 3 known findings, with a keyword
 *     fallback for any future Fail row that isn't explicitly listed.
 *
 * New column layout (1-indexed):
 *   1 TC ID · 2 Module · 3 Test Case Name · 4 Description · 5 Pre-Conditions
 *   6 Test Steps · 7 Expected Result · 8 Actual Result (NEW) · 9 Priority
 *   10 Severity (NEW) · 11 Type · 12 Status · 13 Tested By · 14 Test Date · 15 Notes
 *
 * Run once:  node tests/test-cases/backfill-actual-result-severity.cjs
 * (Close the workbook in Excel first — it needs an exclusive write lock.)
 */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const ExcelJS = require(path.join(REPO, 'node_modules', 'exceljs'));

const XLSX = path.join(__dirname, 'Suraksha_Test_Cases.xlsx');

const SEVERITY_OVERRIDES = {
  'TC-M-003': 'Medium', // dead route (404) — app already uses the correct alternate endpoint
  'TC-M-030': 'High',   // data-integrity: 10% duplicate records created on offline-retry
  'TC-M-065': 'High',   // security: JWT persisted in plaintext AsyncStorage, not expo-secure-store
};

function classifySeverity(status, note, id) {
  if (status !== 'Fail') return 'N/A';
  if (SEVERITY_OVERRIDES[id]) return SEVERITY_OVERRIDES[id];
  const n = String(note || '').toLowerCase();
  if (n.includes('security') || n.includes('plaintext')) return 'High';
  if (n.includes('duplicate') || n.includes('data integrity') || n.includes('idempotency')) return 'High';
  if (n.includes('crash') || n.includes(' 500') || n.includes('data loss')) return 'Critical';
  return 'Medium';
}

const HEADER_STYLE = {
  font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } },
  alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FFBDBDBD' } },
    left: { style: 'thin', color: { argb: 'FFBDBDBD' } },
    bottom: { style: 'thin', color: { argb: 'FFBDBDBD' } },
    right: { style: 'thin', color: { argb: 'FFBDBDBD' } },
  },
};

const SEVERITY_COLORS = {
  Critical: { bg: 'FFF5C6CB', fg: 'FF721C24' },
  High: { bg: 'FFF8D7DA', fg: 'FF842029' },
  Medium: { bg: 'FFFFF3CD', fg: 'FF664D03' },
  Low: { bg: 'FFD4EDDA', fg: 'FF0F5132' },
  'N/A': null, // leave as the row's normal zebra background
};

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX);
  const ws = wb.getWorksheet('Test Cases');

  const before = ws.columnCount;
  if (before >= 15) {
    console.log(`Sheet already has ${before} columns — looks like this migration already ran. Aborting (no changes made).`);
    return;
  }

  // Insert "Actual Result" at column 8 (after Expected Result).
  ws.spliceColumns(8, 0, []);
  // Insert "Severity" at column 10 (after Priority, which is now column 9).
  ws.spliceColumns(10, 0, []);

  // Fix the title row merge (A1:M1 -> A1:O1) and column widths for the new columns.
  ws.getColumn(8).width = 42;
  ws.getColumn(10).width = 12;
  const oldMerge = 'A1:M1';
  if (ws.model.merges && ws.model.merges.includes(oldMerge)) {
    ws.unMergeCells(oldMerge);
  }
  ws.mergeCells('A1:O1');
  const titleCell = ws.getCell('A1');
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Header row (row 2): set the two new headers with the same style as their neighbours.
  const hdrRow = ws.getRow(2);
  hdrRow.getCell(8).value = 'Actual Result';
  hdrRow.getCell(10).value = 'Severity';
  [8, 10].forEach(c => {
    const cell = hdrRow.getCell(c);
    cell.font = HEADER_STYLE.font;
    cell.fill = HEADER_STYLE.fill;
    cell.alignment = HEADER_STYLE.alignment;
    cell.border = HEADER_STYLE.border;
  });

  // Data rows: backfill Actual Result (from Notes, now at column 15) and Severity.
  let updated = 0;
  ws.eachRow((row, i) => {
    if (i <= 2) return;
    const id = String(row.getCell(1).value ?? '').trim();
    if (!id) return;
    const status = String(row.getCell(12).value ?? '').trim();
    const notes = row.getCell(15).value;

    const arCell = row.getCell(8);
    arCell.value = notes || '';
    arCell.font = { name: 'Calibri', size: 10 };
    arCell.alignment = { wrapText: true, vertical: 'top' };
    arCell.border = HEADER_STYLE.border;
    // match the row's zebra background (read from the TC ID cell, which is never recoloured)
    const zebraFill = row.getCell(1).style.fill;
    if (zebraFill) arCell.fill = zebraFill;

    const severity = classifySeverity(status, notes, id);
    const sevCell = row.getCell(10);
    sevCell.value = severity;
    sevCell.font = { name: 'Calibri', size: 10, bold: severity !== 'N/A', color: { argb: 'FF000000' } };
    sevCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
    sevCell.border = HEADER_STYLE.border;
    const sc = SEVERITY_COLORS[severity];
    if (sc) {
      sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } };
      sevCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sc.fg } };
    } else if (zebraFill) {
      sevCell.fill = zebraFill;
    }

    updated++;
  });

  ws.autoFilter = { from: 'A2', to: 'O2' };

  await wb.xlsx.writeFile(XLSX);
  console.log(`Done. Columns: ${before} -> ${ws.columnCount}. Rows backfilled: ${updated}.`);
  console.log(`Saved: ${XLSX}`);
}

main().catch(e => {
  if (e && (e.code === 'EBUSY' || e.code === 'EPERM')) {
    console.error('\nCould not write the file — it looks like it is still open in Excel.');
    console.error('Close Suraksha_Test_Cases.xlsx and run this script again.\n');
  } else {
    console.error(e);
  }
  process.exit(1);
});
