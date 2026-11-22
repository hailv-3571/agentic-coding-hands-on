/**
 * Numbered pages shown by the Review content pagination (E19, Figma "< 1 2 3 4 5 >"): up to `size`
 * consecutive pages with the current one centred, shifted so the run never passes page 1 or the
 * last page. Pure.
 */
export function pageWindow(page: number, pageCount: number, size = 5): number[] {
  if (pageCount < 1) return [];
  const count = Math.min(size, pageCount);
  const start = Math.min(Math.max(page - Math.floor(count / 2), 1), pageCount - count + 1);
  return Array.from({ length: count }, (_, index) => start + index);
}
