import * as ExcelJSNs from 'exceljs';
import { formatCsvDate } from './csv';

// exceljs 为 CommonJS 包，默认导入在不同模块互操作下形态不一致，
// 直接取整个命名空间（CJS 下即 module.exports，含 .Workbook）。
const ExcelJS = ((ExcelJSNs as any)?.default ?? ExcelJSNs) as any;

export interface ExcelColumn {
  header: string;
  value: (row: any) => any;
  width?: number;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: any[];
  summary?: { label: string; value: string | number }[];
}

export async function buildExcelWorkbook(sheets: ExcelSheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '谷芯快检云';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    ws.columns = sheet.columns.map((col) => ({
      header: col.header,
      width: col.width ?? 18,
    }));
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical: 'middle' };

    sheet.rows.forEach((row) => {
      const values = sheet.columns.map((col) => {
        const raw = col.value(row);
        if (raw instanceof Date) return formatCsvDate(raw);
        return raw;
      });
      ws.addRow(values);
    });

    if (sheet.summary && sheet.summary.length) {
      ws.addRow([]);
      const summaryStart = ws.rowCount + 1;
      sheet.summary.forEach((item, index) => {
        const r = ws.getRow(summaryStart + index);
        r.getCell(1).value = item.label;
        r.getCell(2).value = item.value;
        r.getCell(1).font = { bold: true };
      });
    }

    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
