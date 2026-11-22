const EXTENDED = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/;
const PLAIN = /filename\s*=\s*(?:"([^"]*)"|([^;\s]+))/;

/** Keeps the last path segment only, so a download is always a plain file name. */
function baseName(name: string): string | null {
  const base = name.split(/[\\/]/).pop()?.trim() ?? "";
  return base || null;
}

/**
 * File name of the CSV export from its `Content-Disposition` header (RFC 6266): the UTF-8
 * `filename*` form first, then `filename`; null when there is none (the caller falls back to a
 * default name). Pure.
 */
export function attachmentFilename(header: string | null): string | null {
  if (!header) return null;
  const extended = EXTENDED.exec(header);
  if (extended) {
    try {
      return baseName(decodeURIComponent(extended[1]));
    } catch {
      return null;
    }
  }
  const plain = PLAIN.exec(header);
  return plain ? baseName(plain[1] ?? plain[2]) : null;
}
