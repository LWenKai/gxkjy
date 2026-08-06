type CsvValue = string | number | boolean | Date | null | undefined;

export interface CsvResponse {
  setHeader(name: string, value: string): void;
  status(code: number): CsvResponse;
  send(body: string): void;
}

export function formatCsvDate(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}:${pick('second')}`;
}

export function todayForFilename() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('year')}${pick('month')}${pick('day')}`;
}

export function toCsv(headers: string[], rows: CsvValue[][]) {
  const lines = [headers, ...rows].map((row) =>
    row.map((value) => escapeCsvValue(value)).join(','),
  );
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function sendCsv(response: CsvResponse, filename: string, csv: string) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  response.send(csv);
}

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? formatCsvDate(value) : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
