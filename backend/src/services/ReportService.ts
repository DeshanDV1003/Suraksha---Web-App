import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as fastCsv from 'fast-csv';
import prisma from '../utils/prisma';
import { Response } from 'express';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  district?: string;
  disasterType?: string;
  incidentStatus?: string;
  severity?: string;
  riverStation?: string;
}

// ─── Colour palette ────────────────────────────────────────────────────────────
const BLUE   = '#1E3A5F';
const ACCENT = '#2563EB';
const RED    = '#DC2626';
const ORANGE = '#EA580C';
const YELLOW = '#D97706';
const GREEN  = '#16A34A';
const GRAY   = '#64748B';
const LIGHT  = '#F1F5F9';
const WHITE  = '#FFFFFF';

function severityHex(s?: string) {
  switch (s) {
    case 'CRITICAL': return RED;
    case 'HIGH':     return ORANGE;
    case 'MEDIUM':   return YELLOW;
    default:         return GREEN;
  }
}

function fmt(d?: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDate(d?: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function short(id?: string): string { return id ? id.substring(0, 8).toUpperCase() : '—'; }
function trunc(s?: string | null, n = 40): string {
  if (!s) return '—';
  return s.length > n ? s.substring(0, n - 1) + '…' : s;
}

// ─── Main service ──────────────────────────────────────────────────────────────

export class ReportService {
  async generateReport(
    format: 'pdf' | 'excel' | 'csv',
    filters: ReportFilters,
    userRole: string,
    res: Response,
  ) {
    const data = await this.fetchData(filters);
    const dateTag = new Date().toISOString().split('T')[0];

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Suraksha_Report_${dateTag}.pdf"`);
      await this.generatePDF(data, filters, res);
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Suraksha_Report_${dateTag}.xlsx"`);
      await this.generateExcel(data, filters, res);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Suraksha_Report_${dateTag}.csv"`);
      await this.generateCSV(data, res);
    } else {
      throw new Error('Unsupported format');
    }
  }

  // ─── Fetch all data ──────────────────────────────────────────────────────────

  private async fetchData(filters: ReportFilters) {
    const { startDate, endDate, district, disasterType, incidentStatus, severity } = filters;

    const dateRange = startDate && endDate
      ? { gte: new Date(startDate), lte: new Date(endDate) }
      : undefined;

    // Incidents — all, no cap
    const incWhere: any = {};
    if (dateRange)      incWhere.createdAt = dateRange;
    if (disasterType)   incWhere.category  = disasterType;
    if (incidentStatus) incWhere.status    = incidentStatus as any;
    if (severity)       incWhere.severity  = severity as any;
    if (district)       incWhere.province  = district;

    const [
      incidents,
      alerts,
      camps,
      resources,
      missingPersons,
      helpRequests,
      riverLevels,
      damageAssessments,
      volunteers,
      usersCount,
    ] = await Promise.all([
      prisma.incidentReport.findMany({ where: incWhere, orderBy: { createdAt: 'desc' } }),
      prisma.alert.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.reliefCamp.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.resource.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.missingPerson.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.helpRequest.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.riverWaterLevel.findMany({ orderBy: { recordedAt: 'desc' }, take: 200 }),
      prisma.damageAssessment.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.volunteerProfile.findMany({ include: { user: { select: { name: true, email: true } }, skills: true } }),
      prisma.user.count(),
    ]);

    return {
      incidents,
      alerts,
      camps,
      resources,
      missingPersons,
      helpRequests,
      riverLevels,
      damageAssessments,
      volunteers,
      usersCount,
      generatedAt: new Date(),
      filters,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PDF REPORT
  // ══════════════════════════════════════════════════════════════════════════════

  private async generatePDF(data: any, filters: ReportFilters, stream: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        doc.pipe(stream);

        // ── COVER PAGE ─────────────────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 220).fill(BLUE);
        doc.fillColor(WHITE).fontSize(36).font('Helvetica-Bold')
           .text('SURAKSHA', 50, 60, { align: 'center' });
        doc.fontSize(14).font('Helvetica')
           .text('Disaster Management System', 50, 105, { align: 'center' });
        doc.fontSize(20).font('Helvetica-Bold')
           .text('Comprehensive Situation Report', 50, 145, { align: 'center' });

        doc.fillColor('#94A3B8').fontSize(10).font('Helvetica')
           .text(`Generated: ${fmt(data.generatedAt)}`, 50, 195, { align: 'center' });
        doc.moveDown(10);

        // Filter summary box
        doc.fillColor(BLUE).fontSize(11).font('Helvetica-Bold').text('Report Parameters', 50, 250);
        doc.fillColor(GRAY).fontSize(10).font('Helvetica');
        const paramLines = [
          `Date Range: ${filters.startDate ? `${fmtDate(filters.startDate)} – ${fmtDate(filters.endDate)}` : 'All time'}`,
          `District:  ${filters.district     || 'All districts'}`,
          `Disaster:  ${filters.disasterType || 'All types'}`,
          `Status:    ${filters.incidentStatus || 'All statuses'}`,
          `Severity:  ${filters.severity      || 'All severities'}`,
        ];
        paramLines.forEach(l => { doc.text(l, 50); });

        // ── TABLE OF CONTENTS ──────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, 'TABLE OF CONTENTS');
        const toc = [
          '1.  Executive Summary',
          '2.  Incidents',
          '3.  Active Alerts',
          '4.  Relief Camps',
          '5.  Resources',
          '6.  Missing Persons',
          '7.  Help Requests',
          '8.  River Water Levels',
          '9.  Damage Assessments',
          '10. Volunteers',
        ];
        toc.forEach(line => {
          doc.fillColor(GRAY).fontSize(11).font('Helvetica').text(line, 60);
          doc.moveDown(0.4);
        });

        // ── 1. EXECUTIVE SUMMARY ───────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '1. EXECUTIVE SUMMARY');

        const inc    = data.incidents;
        const active = inc.filter((i: any) => !['CLOSED','RESOLVED'].includes(i.status));
        const resolved = inc.filter((i: any) => i.status === 'RESOLVED');
        const critical = inc.filter((i: any) => i.severity === 'CRITICAL');
        const campOcc  = data.camps.reduce((s: number, c: any) => s + (c.currentOccupancy ?? 0), 0);
        const campCap  = data.camps.reduce((s: number, c: any) => s + (c.totalCapacity ?? 0), 0);

        const summaryRows = [
          ['Metric', 'Value'],
          ['Total Incidents',           inc.length.toString()],
          ['Active Incidents',          active.length.toString()],
          ['Resolved Incidents',        resolved.length.toString()],
          ['Critical Incidents',        critical.length.toString()],
          ['Active Alerts',             data.alerts.filter((a: any) => a.active).length.toString()],
          ['Relief Camps',              data.camps.length.toString()],
          ['Camp Occupancy',            campCap ? `${campOcc} / ${campCap} (${Math.round(campOcc/campCap*100)}%)` : '—'],
          ['Resources Registered',      data.resources.length.toString()],
          ['Missing Persons (Open)',    data.missingPersons.filter((m: any) => m.status !== 'FOUND').length.toString()],
          ['Help Requests (Pending)',   data.helpRequests.filter((h: any) => h.status === 'PENDING').length.toString()],
          ['Volunteers Registered',     data.volunteers.length.toString()],
          ['Total System Users',        data.usersCount.toString()],
        ];
        this.pdfTable(doc, summaryRows, [260, 200]);

        // severity breakdown
        doc.moveDown(1);
        doc.fillColor(BLUE).fontSize(12).font('Helvetica-Bold').text('Severity Breakdown');
        doc.moveDown(0.5);
        const sevRows = [
          ['Severity', 'Count', 'Share'],
          ...(['CRITICAL','HIGH','MEDIUM','LOW'] as const).map(s => {
            const cnt = inc.filter((i: any) => i.severity === s).length;
            const pct = inc.length ? Math.round(cnt / inc.length * 100) : 0;
            return [s, cnt.toString(), `${pct}%`];
          }),
        ];
        this.pdfTable(doc, sevRows, [160, 100, 100]);

        // ── 2. INCIDENTS ───────────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '2. INCIDENTS');
        doc.fillColor(GRAY).fontSize(10).font('Helvetica')
           .text(`Total: ${inc.length}  |  Active: ${active.length}  |  Resolved: ${resolved.length}`);
        doc.moveDown(0.5);

        if (inc.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No incidents in selected period.');
        } else {
          const incRows: string[][] = [
            ['ID', 'Title', 'Category', 'Severity', 'Status', 'Location', 'Date'],
          ];
          inc.forEach((i: any) => {
            incRows.push([
              short(i.id),
              trunc(i.title, 28),
              i.category              || '—',
              i.severity              || '—',
              (i.status || '—').replace(/_/g,' '),
              trunc(i.location || i.province || '—', 22),
              fmtDate(i.createdAt),
            ]);
          });
          this.pdfTable(doc, incRows, [55, 115, 60, 55, 65, 90, 70], true, severityHex);
        }

        // ── 3. ALERTS ─────────────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '3. ACTIVE ALERTS');
        doc.fillColor(GRAY).fontSize(10).font('Helvetica')
           .text(`Total: ${data.alerts.length}`);
        doc.moveDown(0.5);

        if (data.alerts.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No alerts found.');
        } else {
          const alertRows: string[][] = [
            ['Title', 'Type', 'Active', 'Locations', 'Created'],
          ];
          data.alerts.forEach((a: any) => {
            alertRows.push([
              trunc(a.title, 36),
              a.type   || '—',
              a.active ? 'YES' : 'NO',
              (a.locations || []).slice(0, 2).join(', ') || '—',
              fmtDate(a.createdAt),
            ]);
          });
          this.pdfTable(doc, alertRows, [145, 65, 40, 110, 80]);
        }

        // ── 4. RELIEF CAMPS ───────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '4. RELIEF CAMPS');
        if (data.camps.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No relief camps found.');
        } else {
          const campRows: string[][] = [
            ['Name', 'Location', 'Status', 'Occupancy', 'Capacity', 'Util %', 'Wait Time'],
          ];
          data.camps.forEach((c: any) => {
            const occ = c.currentOccupancy ?? 0;
            const cap = c.totalCapacity   ?? 0;
            campRows.push([
              trunc(c.name, 24),
              trunc(c.location, 24),
              c.status    || '—',
              occ.toString(),
              cap.toString(),
              cap ? `${Math.round(occ/cap*100)}%` : '—',
              c.waitTime  || '—',
            ]);
          });
          this.pdfTable(doc, campRows, [90, 90, 55, 45, 50, 45, 60]);
        }

        // ── 5. RESOURCES ──────────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '5. RESOURCES');
        if (data.resources.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No resources found.');
        } else {
          const resRows: string[][] = [
            ['Type', 'Owner', 'Location', 'Capacity', 'Status', 'Contact'],
          ];
          data.resources.forEach((r: any) => {
            resRows.push([
              r.type       || '—',
              trunc(r.owner, 26),
              trunc(r.location, 24),
              trunc(r.capacity, 18),
              r.status     || '—',
              trunc(r.contact, 20),
            ]);
          });
          this.pdfTable(doc, resRows, [80, 100, 95, 70, 65, 80]);
        }

        // ── 6. MISSING PERSONS ────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '6. MISSING PERSONS');
        if (data.missingPersons.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No missing persons recorded.');
        } else {
          const mpRows: string[][] = [
            ['Name', 'Age', 'Gender', 'Last Seen', 'Status', 'Contact Phone'],
          ];
          data.missingPersons.forEach((m: any) => {
            mpRows.push([
              trunc(m.name, 22),
              (m.age ?? '—').toString(),
              m.gender         || '—',
              trunc(m.lastSeen, 30),
              m.status         || '—',
              m.contactPhone   || '—',
            ]);
          });
          this.pdfTable(doc, mpRows, [90, 30, 45, 120, 60, 90]);
        }

        // ── 7. HELP REQUESTS ──────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '7. HELP REQUESTS');
        if (data.helpRequests.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No help requests found.');
        } else {
          const hrRows: string[][] = [
            ['Type', 'Description', 'Location', 'People', 'Priority', 'Status', 'Created'],
          ];
          data.helpRequests.forEach((h: any) => {
            hrRows.push([
              h.type              || '—',
              trunc(h.description, 28),
              trunc(h.location, 28),
              (h.peopleCount ?? '—').toString(),
              h.priority          || '—',
              (h.status || '—').replace(/_/g,' '),
              fmtDate(h.createdAt),
            ]);
          });
          this.pdfTable(doc, hrRows, [65, 110, 100, 30, 50, 65, 60]);
        }

        // ── 8. RIVER WATER LEVELS ─────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '8. RIVER WATER LEVELS');
        if (data.riverLevels.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No river level data found.');
        } else {
          const rlRows: string[][] = [
            ['River', 'Station', 'District', 'Level (m)', 'Status', 'Recorded'],
          ];
          data.riverLevels.forEach((r: any) => {
            rlRows.push([
              trunc(r.riverName, 22),
              trunc(r.stationName, 22),
              r.district                        || '—',
              r.waterLevelMetres?.toFixed(2)    || '—',
              r.status                          || '—',
              fmt(r.recordedAt),
            ]);
          });
          this.pdfTable(doc, rlRows, [90, 90, 65, 55, 70, 95]);
        }

        // ── 9. DAMAGE ASSESSMENTS ─────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '9. DAMAGE ASSESSMENTS');
        if (data.damageAssessments.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No damage assessments found.');
        } else {
          const daRows: string[][] = [
            ['Location', 'Category', 'Structural', 'Estimated Loss', 'Status', 'Date'],
          ];
          data.damageAssessments.forEach((d: any) => {
            daRows.push([
              trunc(d.location, 28),
              d.category          || '—',
              d.structuralDamage  || '—',
              d.estimatedLoss     ? `LKR ${Number(d.estimatedLoss).toLocaleString()}` : '—',
              (d.status || '—').replace(/_/g,' '),
              fmtDate(d.createdAt),
            ]);
          });
          this.pdfTable(doc, daRows, [110, 80, 55, 90, 80, 70]);
        }

        // ── 10. VOLUNTEERS ────────────────────────────────────────────────────
        doc.addPage();
        this.pdfSectionHeader(doc, '10. VOLUNTEERS');
        if (data.volunteers.length === 0) {
          doc.fillColor(GRAY).fontSize(11).text('No volunteers registered.');
        } else {
          const volRows: string[][] = [
            ['Name', 'Email', 'Skills', 'Total Hours', 'Incidents Joined'],
          ];
          data.volunteers.forEach((v: any) => {
            volRows.push([
              trunc(v.user?.name, 34),
              trunc(v.user?.email, 38),
              trunc((v.skills || []).map((s: any) => s.skillName).join(', '), 34),
              (v.totalHours ?? 0).toString(),
              (v.incidentsJoined ?? 0).toString(),
            ]);
          });
          this.pdfTable(doc, volRows, [110, 130, 110, 60, 80]);
        }

        // ── FOOTER on every page ───────────────────────────────────────────────
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(pages.start + i);
          doc.fillColor(GRAY).fontSize(8).font('Helvetica')
             .text(
               `SURAKSHA Disaster Management System  |  Generated ${fmt(data.generatedAt)}  |  Page ${i + 1} of ${pages.count}`,
               50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 },
             );
          doc.rect(50, doc.page.height - 48, doc.page.width - 100, 0.5).fill(LIGHT);
        }

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─── PDF helpers ─────────────────────────────────────────────────────────────

  private pdfSectionHeader(doc: any, title: string) {
    doc.rect(50, doc.y, doc.page.width - 100, 32).fill(BLUE);
    doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold')
       .text(title, 60, doc.y - 24);
    doc.moveDown(1.2);
  }

  /**
   * Draw a bordered table.
   * @param rows      First row = headers
   * @param widths    Column pixel widths (must sum to ≤ page content width)
   * @param colored   Colorise body rows by severity in column 3 (incidents table)
   * @param sevFn     Function mapping severity string to hex colour
   */
  private pdfTable(
    doc: any,
    rows: string[][],
    widths: number[],
    colored = false,
    sevFn?: (s: string) => string,
  ) {
    const startX    = 50;
    const rowH      = 18;
    const padding   = 4;
    const colWidths = widths;

    let y = doc.y;

    rows.forEach((row, rIdx) => {
      // Page overflow guard
      if (y + rowH > doc.page.height - 60) {
        doc.addPage();
        y = 50;
        // Redraw header
        const headerRow = rows[0];
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill(ACCENT);
        doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold');
        let hx = startX;
        headerRow.forEach((cell, ci) => {
          doc.text(cell, hx + padding, y + padding, { width: colWidths[ci] - padding * 2, lineBreak: false });
          hx += colWidths[ci];
        });
        y += rowH;
        return;
      }

      const isHeader = rIdx === 0;
      const totalW   = colWidths.reduce((a, b) => a + b, 0);

      // Row background
      if (isHeader) {
        doc.rect(startX, y, totalW, rowH).fill(ACCENT);
      } else {
        doc.rect(startX, y, totalW, rowH).fill(rIdx % 2 === 0 ? LIGHT : WHITE);
      }

      // Cell text
      doc.fillColor(isHeader ? WHITE : '#0F172A')
         .fontSize(7.5)
         .font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      let x = startX;
      row.forEach((cell, ci) => {
        // Severity pill on severity column (column index 3 in incidents)
        if (colored && rIdx > 0 && ci === 3 && sevFn) {
          const pillColor = sevFn(cell);
          doc.rect(x + padding, y + 4, colWidths[ci] - padding * 2, rowH - 8).fill(pillColor);
          doc.fillColor(WHITE).text(cell, x + padding, y + padding, {
            width: colWidths[ci] - padding * 2, lineBreak: false,
          });
          doc.fillColor('#0F172A');
        } else {
          doc.text(cell, x + padding, y + padding, { width: colWidths[ci] - padding * 2, lineBreak: false });
        }
        x += colWidths[ci];
      });

      // Row border
      doc.rect(startX, y, totalW, rowH).stroke('#CBD5E1');

      y += rowH;
    });

    doc.y = y + 4;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EXCEL REPORT
  // ══════════════════════════════════════════════════════════════════════════════

  private async generateExcel(data: any, filters: ReportFilters, stream: any) {
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Suraksha DMS';
    wb.created  = new Date();
    wb.modified = new Date();

    const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    const HEADER_FONT: Partial<ExcelJS.Font>  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const ALT_FILL:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    const BORDER: Partial<ExcelJS.Borders> = {
      top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    const applyHeader = (ws: ExcelJS.Worksheet, headers: { header: string; key: string; width: number }[]) => {
      ws.columns = headers;
      ws.getRow(1).eachCell(cell => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = BORDER;
      });
      ws.getRow(1).height = 22;
      ws.views = [{ state: 'frozen', ySplit: 1 }];
    };

    const styleRows = (ws: ExcelJS.Worksheet) => {
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell(cell => {
          if (rowNumber % 2 === 0) cell.fill = ALT_FILL;
          cell.border = BORDER;
          cell.alignment = { vertical: 'middle', wrapText: false };
        });
        row.height = 18;
      });
    };

    // ── Sheet 1: Summary ──────────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Summary');
      ws.mergeCells('A1:C1');
      ws.getCell('A1').value = 'SURAKSHA DISASTER MANAGEMENT SYSTEM — Situation Report';
      ws.getCell('A1').font  = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
      ws.getCell('A1').alignment = { horizontal: 'center' };
      ws.getRow(1).height = 28;

      ws.mergeCells('A2:C2');
      ws.getCell('A2').value = `Generated: ${fmt(data.generatedAt)}`;
      ws.getCell('A2').font  = { italic: true, color: { argb: 'FF64748B' } };

      ws.addRow([]);
      ws.addRow(['Filter', 'Value']);
      ws.addRow(['Date Range', filters.startDate ? `${filters.startDate} to ${filters.endDate}` : 'All time']);
      ws.addRow(['District',   filters.district       || 'All']);
      ws.addRow(['Category',   filters.disasterType   || 'All']);
      ws.addRow(['Status',     filters.incidentStatus || 'All']);
      ws.addRow(['Severity',   filters.severity       || 'All']);

      ws.addRow([]);
      ws.addRow(['KEY METRICS', '', '']);
      const metricRow = ws.lastRow!.number;
      ws.getRow(metricRow).font = { bold: true, color: { argb: 'FF1E3A5F' } };

      const inc     = data.incidents;
      const active  = inc.filter((i: any) => !['CLOSED','RESOLVED'].includes(i.status)).length;
      const campOcc = data.camps.reduce((s: number, c: any) => s + (c.currentOccupancy ?? 0), 0);
      const campCap = data.camps.reduce((s: number, c: any) => s + (c.totalCapacity ?? 0), 0);

      const metrics = [
        ['Total Incidents',         inc.length],
        ['Active Incidents',        active],
        ['Resolved Incidents',      inc.filter((i: any) => i.status === 'RESOLVED').length],
        ['Critical Incidents',      inc.filter((i: any) => i.severity === 'CRITICAL').length],
        ['Active Alerts',           data.alerts.filter((a: any) => a.active).length],
        ['Total Alerts',            data.alerts.length],
        ['Relief Camps',            data.camps.length],
        ['Total Camp Capacity',     campCap],
        ['Current Camp Occupancy',  campOcc],
        ['Resources Registered',    data.resources.length],
        ['Missing Persons (Open)',  data.missingPersons.filter((m: any) => m.status !== 'FOUND').length],
        ['Help Requests (Pending)', data.helpRequests.filter((h: any) => h.status === 'PENDING').length],
        ['Total Help Requests',     data.helpRequests.length],
        ['Volunteers',              data.volunteers.length],
        ['Total System Users',      data.usersCount],
      ];
      metrics.forEach(([label, value]) => ws.addRow([label, value]));

      ws.columns = [
        { key: 'A', width: 32 },
        { key: 'B', width: 20 },
        { key: 'C', width: 20 },
      ];
    }

    // ── Sheet 2: Incidents ────────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Incidents');
      applyHeader(ws, [
        { header: 'ID',          key: 'id',          width: 12 },
        { header: 'Title',       key: 'title',       width: 40 },
        { header: 'Category',    key: 'category',    width: 18 },
        { header: 'Severity',    key: 'severity',    width: 12 },
        { header: 'Status',      key: 'status',      width: 16 },
        { header: 'Location',    key: 'location',    width: 30 },
        { header: 'Province',    key: 'province',    width: 18 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Reported By', key: 'reportedBy',  width: 22 },
        { header: 'Created At',  key: 'createdAt',   width: 22 },
        { header: 'Updated At',  key: 'updatedAt',   width: 22 },
      ]);
      data.incidents.forEach((i: any) => {
        ws.addRow({
          id:          short(i.id),
          title:       i.title        || '—',
          category:    i.category     || '—',
          severity:    i.severity     || '—',
          status:      i.status       || '—',
          location:    i.location     || '—',
          province:    i.province     || '—',
          description: i.description  || '—',
          reportedBy:  i.reporterId   || '—',
          createdAt:   fmt(i.createdAt),
          updatedAt:   fmt(i.updatedAt),
        });
      });

      // Colour severity cells
      ws.eachRow((row, rn) => {
        if (rn === 1) return;
        const sevCell = row.getCell('severity');
        const sev = String(sevCell.value || '');
        const argb = sev === 'CRITICAL' ? 'FFDC2626' : sev === 'HIGH' ? 'FFEA580C' : sev === 'MEDIUM' ? 'FFD97706' : 'FF16A34A';
        sevCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
        sevCell.font  = { bold: true, color: { argb: 'FFFFFFFF' } };
      });

      styleRows(ws);
    }

    // ── Sheet 3: Alerts ───────────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Alerts');
      applyHeader(ws, [
        { header: 'ID',          key: 'id',        width: 12 },
        { header: 'Title',       key: 'title',     width: 40 },
        { header: 'Message',     key: 'message',   width: 60 },
        { header: 'Type',        key: 'type',      width: 14 },
        { header: 'Active',      key: 'active',    width: 10 },
        { header: 'Locations',   key: 'locations', width: 36 },
        { header: 'Created At',  key: 'createdAt', width: 22 },
      ]);
      data.alerts.forEach((a: any) => {
        ws.addRow({
          id:        short(a.id),
          title:     a.title         || '—',
          message:   a.message       || '—',
          type:      a.type          || '—',
          active:    a.active ? 'YES' : 'NO',
          locations: (a.locations || []).join(', ') || '—',
          createdAt: fmt(a.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 4: Relief Camps ─────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Relief Camps');
      applyHeader(ws, [
        { header: 'ID',               key: 'id',          width: 12 },
        { header: 'Name',             key: 'name',        width: 34 },
        { header: 'Location',         key: 'location',    width: 34 },
        { header: 'Status',           key: 'status',      width: 16 },
        { header: 'Occupancy',        key: 'occupancy',   width: 12 },
        { header: 'Capacity',         key: 'capacity',    width: 12 },
        { header: 'Utilisation %',    key: 'utilisation', width: 14 },
        { header: 'Manager',          key: 'manager',     width: 24 },
        { header: 'Contact',          key: 'contact',     width: 18 },
        { header: 'Services',         key: 'services',    width: 40 },
        { header: 'Created At',       key: 'createdAt',   width: 22 },
      ]);
      data.camps.forEach((c: any) => {
        const occ = c.currentOccupancy ?? 0;
        const cap = c.totalCapacity   ?? 0;
        ws.addRow({
          id:          short(c.id),
          name:        c.name              || '—',
          location:    c.location          || '—',
          status:      c.status            || '—',
          occupancy:   occ,
          capacity:    cap,
          utilisation: cap ? Math.round(occ / cap * 100) : 0,
          manager:     '—',
          contact:     c.waitTime          || '—',
          services:    (c.services || []).join(', ') || '—',
          createdAt:   fmt(c.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 5: Resources ────────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Resources');
      applyHeader(ws, [
        { header: 'ID',         key: 'id',       width: 12 },
        { header: 'Type',       key: 'type',     width: 22 },
        { header: 'Owner',      key: 'owner',    width: 30 },
        { header: 'Location',   key: 'location', width: 32 },
        { header: 'Capacity',   key: 'capacity', width: 20 },
        { header: 'Status',     key: 'status',   width: 16 },
        { header: 'Contact',    key: 'contact',  width: 26 },
        { header: 'Created At', key: 'createdAt',width: 22 },
      ]);
      data.resources.forEach((r: any) => {
        ws.addRow({
          id:       short(r.id),
          type:     r.type     || '—',
          owner:    r.owner    || '—',
          location: r.location || '—',
          capacity: r.capacity || '—',
          status:   r.status   || '—',
          contact:  r.contact  || '—',
          createdAt:fmt(r.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 6: Missing Persons ──────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Missing Persons');
      applyHeader(ws, [
        { header: 'ID',                 key: 'id',           width: 12 },
        { header: 'Name',               key: 'name',         width: 28 },
        { header: 'Age',                key: 'age',          width: 8  },
        { header: 'Gender',             key: 'gender',       width: 10 },
        { header: 'Last Seen Location', key: 'lastLocation', width: 34 },
        { header: 'Description',        key: 'description',  width: 44 },
        { header: 'Status',             key: 'status',       width: 14 },
        { header: 'Reported By',        key: 'reportedBy',   width: 24 },
        { header: 'Contact',            key: 'contact',      width: 18 },
        { header: 'Reported At',        key: 'reportedAt',   width: 22 },
      ]);
      data.missingPersons.forEach((m: any) => {
        ws.addRow({
          id:           short(m.id),
          name:         m.name         || '—',
          age:          m.age          ?? '—',
          gender:       m.gender       || '—',
          lastLocation: m.lastSeen     || '—',
          description:  m.description  || '—',
          status:       m.status       || '—',
          reportedBy:   m.reportedBy   || '—',
          contact:      m.contactPhone || m.contactName || '—',
          reportedAt:   fmt(m.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 7: Help Requests ────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Help Requests');
      applyHeader(ws, [
        { header: 'ID',           key: 'id',          width: 12 },
        { header: 'Contact Name', key: 'contact',     width: 28 },
        { header: 'Phone',        key: 'phone',       width: 16 },
        { header: 'Request Type', key: 'requestType', width: 22 },
        { header: 'Location',     key: 'location',    width: 32 },
        { header: 'People Count', key: 'people',      width: 14 },
        { header: 'Description',  key: 'description', width: 50 },
        { header: 'Status',       key: 'status',      width: 16 },
        { header: 'Priority',     key: 'priority',    width: 12 },
        { header: 'Created At',   key: 'createdAt',   width: 22 },
      ]);
      data.helpRequests.forEach((h: any) => {
        ws.addRow({
          id:          short(h.id),
          contact:     h.phone        || '—',
          phone:       h.phone        || '—',
          requestType: h.type         || '—',
          location:    h.location     || '—',
          people:      h.peopleCount  ?? '—',
          description: h.description  || '—',
          status:      h.status       || '—',
          priority:    h.priority     || '—',
          createdAt:   fmt(h.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 8: River Water Levels ───────────────────────────────────────────
    {
      const ws = wb.addWorksheet('River Water Levels');
      applyHeader(ws, [
        { header: 'Gauge ID',        key: 'gaugeId',     width: 16 },
        { header: 'River',           key: 'river',       width: 28 },
        { header: 'Station',         key: 'station',     width: 28 },
        { header: 'District',        key: 'district',    width: 18 },
        { header: 'Level (m)',        key: 'level',       width: 12 },
        { header: 'Alert Level (m)', key: 'alertLvl',    width: 16 },
        { header: 'Minor Flood (m)', key: 'minorFlood',  width: 16 },
        { header: 'Major Flood (m)', key: 'majorFlood',  width: 16 },
        { header: 'Status',          key: 'status',      width: 14 },
        { header: 'Recorded At',     key: 'recordedAt',  width: 22 },
      ]);
      data.riverLevels.forEach((r: any) => {
        ws.addRow({
          gaugeId:    r.gaugeId                      || '—',
          river:      r.riverName                    || '—',
          station:    r.stationName                  || '—',
          district:   r.district                     || '—',
          level:      r.waterLevelMetres             ?? '—',
          alertLvl:   r.alertLevel                   ?? '—',
          minorFlood: r.minorFloodLevel              ?? '—',
          majorFlood: r.majorFloodLevel              ?? '—',
          status:     r.status                       || '—',
          recordedAt: fmt(r.recordedAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 9: Damage Assessments ───────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Damage Assessments');
      applyHeader(ws, [
        { header: 'ID',              key: 'id',           width: 12 },
        { header: 'Location',        key: 'location',     width: 34 },
        { header: 'Damage Type',     key: 'damageType',   width: 22 },
        { header: 'Severity',        key: 'severity',     width: 14 },
        { header: 'Estimated Cost',  key: 'cost',         width: 18 },
        { header: 'Status',          key: 'status',       width: 20 },
        { header: 'Description',     key: 'description',  width: 50 },
        { header: 'Affected People', key: 'affected',     width: 16 },
        { header: 'Reviewer Notes',  key: 'reviewNotes',  width: 40 },
        { header: 'Created At',      key: 'createdAt',    width: 22 },
      ]);
      data.damageAssessments.forEach((d: any) => {
        ws.addRow({
          id:          short(d.id),
          location:    d.location          || '—',
          damageType:  d.category          || '—',
          severity:    d.structuralDamage  || '—',
          cost:        d.estimatedLoss     ? `LKR ${Number(d.estimatedLoss).toLocaleString()}` : '—',
          status:      d.status            || '—',
          description: d.notes             || '—',
          affected:    d.affectedPersons   ?? '—',
          reviewNotes: d.reviewerNotes     || '—',
          createdAt:   fmt(d.createdAt),
        });
      });
      styleRows(ws);
    }

    // ── Sheet 10: Volunteers ──────────────────────────────────────────────────
    {
      const ws = wb.addWorksheet('Volunteers');
      applyHeader(ws, [
        { header: 'Name',              key: 'name',      width: 28 },
        { header: 'Email',             key: 'email',     width: 34 },
        { header: 'Skills',            key: 'skills',    width: 50 },
        { header: 'Total Hours',       key: 'hours',     width: 14 },
        { header: 'Incidents Joined',  key: 'incidents', width: 16 },
        { header: 'Readiness Score',   key: 'readiness', width: 16 },
      ]);
      data.volunteers.forEach((v: any) => {
        ws.addRow({
          name:      v.user?.name  || '—',
          email:     v.user?.email || '—',
          skills:    (v.skills || []).map((s: any) => s.skillName).join(', ') || '—',
          hours:     v.totalHours      ?? 0,
          incidents: v.incidentsJoined ?? 0,
          readiness: v.readinessScore  ?? 100,
        });
      });
      styleRows(ws);
    }

    await wb.xlsx.write(stream);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CSV REPORT  (all sheets as sections separated by blank rows)
  // ══════════════════════════════════════════════════════════════════════════════

  private async generateCSV(data: any, stream: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];

      const csvLine = (arr: any[]): string =>
        arr.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');

      const section = (title: string, headers: string[], rows: any[][]) => {
        lines.push(`"=== ${title} ==="`) ;
        lines.push(csvLine(headers));
        rows.forEach(r => lines.push(csvLine(r)));
        lines.push('');
      };

      // Incidents
      section('INCIDENTS', ['ID','Title','Category','Severity','Status','Location','Province','Description','Reported By','Created At'],
        data.incidents.map((i: any) => [
          short(i.id), i.title||'', i.category||'', i.severity||'', i.status||'',
          i.location||'', i.province||'', i.description||'', i.reportedBy||'', fmt(i.createdAt),
        ]));

      // Alerts
      section('ALERTS', ['ID','Title','Message','Type','Active','Locations','Created At'],
        data.alerts.map((a: any) => [
          short(a.id), a.title||'', a.message||'', a.type||'', a.active?'YES':'NO',
          (a.locations||[]).join('; '), fmt(a.createdAt),
        ]));

      // Relief Camps
      section('RELIEF CAMPS', ['ID','Name','Location','Status','Occupancy','Capacity','Utilisation %','Services','Created At'],
        data.camps.map((c: any) => {
          const occ = c.currentOccupancy??0, cap = c.totalCapacity??0;
          return [short(c.id), c.name||'', c.location||'', c.status||'', occ, cap, cap?Math.round(occ/cap*100):0, (c.services||[]).join('; '), fmt(c.createdAt)];
        }));

      // Resources
      section('RESOURCES', ['ID','Type','Owner','Location','Capacity','Status','Contact','Created At'],
        data.resources.map((r: any) => [
          short(r.id), r.type||'', r.owner||'', r.location||'', r.capacity||'', r.status||'', r.contact||'', fmt(r.createdAt),
        ]));

      // Missing Persons
      section('MISSING PERSONS', ['ID','Name','Age','Gender','Last Seen','Status','Reported By','Contact Phone','Created At'],
        data.missingPersons.map((m: any) => [
          short(m.id), m.name||'', m.age??'', m.gender||'', m.lastSeen||'',
          m.status||'', m.reportedBy||'', m.contactPhone||'', fmt(m.createdAt),
        ]));

      // Help Requests
      section('HELP REQUESTS', ['ID','Type','Phone','Description','Location','People','Status','Priority','Created At'],
        data.helpRequests.map((h: any) => [
          short(h.id), h.type||'', h.phone||'',
          h.description||'', h.location||'', h.peopleCount??'',
          h.status||'', h.priority||'', fmt(h.createdAt),
        ]));

      // River Water Levels
      section('RIVER WATER LEVELS', ['Gauge ID','River','Station','District','Level (m)','Alert Level','Minor Flood','Major Flood','Status','Recorded At'],
        data.riverLevels.map((r: any) => [
          r.gaugeId||'', r.riverName||'', r.stationName||'', r.district||'',
          r.waterLevelMetres??'', r.alertLevel??'', r.minorFloodLevel??'', r.majorFloodLevel??'',
          r.status||'', fmt(r.recordedAt),
        ]));

      // Damage Assessments
      section('DAMAGE ASSESSMENTS', ['ID','Location','Category','Structural Damage','Estimated Loss','Status','Affected Persons','Created At'],
        data.damageAssessments.map((d: any) => [
          short(d.id), d.location||'', d.category||'', d.structuralDamage||'',
          d.estimatedLoss??'', d.status||'', d.affectedPersons??'', fmt(d.createdAt),
        ]));

      // Volunteers
      section('VOLUNTEERS', ['Name','Email','Skills','Total Hours','Incidents Joined','Readiness Score'],
        data.volunteers.map((v: any) => [
          v.user?.name||'', v.user?.email||'',
          (v.skills||[]).map((s: any) => s.skillName).join('; '),
          v.totalHours??0, v.incidentsJoined??0, v.readinessScore??100,
        ]));

      stream.write(lines.join('\n'), 'utf8', (err: any) => {
        if (err) reject(err);
        else { stream.end(); resolve(); }
      });
    });
  }
}
