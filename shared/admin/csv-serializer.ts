/**
 * Shared admin CSV export (C-14): UTF-8 BOM so Excel keeps Vietnamese text, RFC 4180
 * quoting with CRLF rows, and a formula-injection guard for user-supplied text.
 * Dates must be formatted by the caller (see `formatInZone`) so the zone is explicit.
 */

export type CsvCell = string | number | boolean | null | undefined;

const BOM = "\uFEFF";
const ROW_SEPARATOR = "\r\n";
/** Leading characters Excel/Sheets may interpret as a formula or control sequence. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

function guardFormula(text: string): string {
  return FORMULA_TRIGGER.test(text) ? `'${text}` : text;
}

function quote(text: string): string {
  return NEEDS_QUOTING.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") {
    if (!Number.isFinite(cell)) {
      throw new RangeError(`CSV cells must be finite numbers, received ${cell}`);
    }
    return String(cell);
  }
  if (typeof cell === "boolean") return String(cell);
  return quote(guardFormula(cell));
}

function serializeRow(cells: readonly CsvCell[]): string {
  return cells.map(serializeCell).join(",");
}

export function serializeCsv(
  header: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  const lines = [serializeRow(header)];
  rows.forEach((row, index) => {
    if (row.length !== header.length) {
      throw new RangeError(
        `CSV row ${index + 1} has ${row.length} cells, expected ${header.length}`,
      );
    }
    lines.push(serializeRow(row));
  });
  return BOM + lines.map((line) => line + ROW_SEPARATOR).join("");
}
