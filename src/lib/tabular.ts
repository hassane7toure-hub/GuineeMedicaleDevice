import ExcelJS from "exceljs";

export function headerKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function plainCell(value: string) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function toCsv(rows: string[][]) {
  const cell = (value: string) => `"${plainCell(value).replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
}

export async function toXlsx(rows: string[][], sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "Feuille");
  rows.forEach((row, index) => {
    const added = sheet.addRow(row.map(plainCell));
    if (index === 0) added.font = { bold: true };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (typeof value === "object") {
    const record = value as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (typeof record.text === "string") return record.text;
    if ("result" in record) return cellText(record.result);
    if (Array.isArray(record.richText)) return record.richText.map((part) => part.text).join("");
  }
  return String(value);
}

function decodeCsv(buffer: Buffer) {
  const utf8 = buffer.toString("utf8");
  if (utf8.includes("\uFFFD")) return new TextDecoder("windows-1252").decode(buffer);
  return utf8;
}

export function parseCsv(text: string) {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function parseTable(buffer: Buffer, filename: string) {
  if (filename.endsWith(".csv")) return parseCsv(decodeCsv(buffer));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values : [];
    const cells: string[] = [];
    for (let index = 1; index < values.length; index += 1) cells.push(cellText(values[index]).trim());
    if (cells.some(Boolean)) rows.push(cells);
  });
  return rows;
}

export type SheetRecord = { line: number; values: Record<string, string> };

export function recordsFromTable(table: string[][], aliases: Record<string, string>, required: string[], limit: number) {
  if (table.length === 0) return { error: "fichier-vide" as const, records: [] as SheetRecord[] };
  const headers = table[0].map((header) => aliases[headerKey(header)] || "");
  if (required.some((key) => !headers.includes(key))) return { error: "fichier-entetes" as const, records: [] as SheetRecord[] };
  const records: SheetRecord[] = [];
  for (let index = 1; index < table.length; index += 1) {
    const line = table[index];
    if (!line.some((value) => value.trim())) continue;
    const values: Record<string, string> = {};
    headers.forEach((key, column) => {
      if (key) values[key] = (line[column] || "").trim();
    });
    records.push({ line: index + 1, values });
  }
  if (records.length === 0) return { error: "fichier-vide" as const, records };
  if (records.length > limit) return { error: "fichier-trop" as const, records: [] as SheetRecord[] };
  return { records };
}

export async function readSpreadsheet(file: File, requiredName: RegExp) {
  if (!(file instanceof File) || file.size === 0) return { error: "fichier" as const };
  if (file.size > 2 * 1024 * 1024) return { error: "fichier-taille" as const };
  const filename = file.name.toLowerCase();
  if (!requiredName.test(filename)) return { error: "fichier-format" as const };
  try {
    return { table: await parseTable(Buffer.from(await file.arrayBuffer()), filename) };
  } catch {
    return { error: "fichier-format" as const };
  }
}
