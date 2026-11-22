/**
 * BR-005 search text: lowercase, Vietnamese tone/vowel marks removed (NFD + combining marks) and
 * đ → d (a letter of its own, not a combining mark), whitespace collapsed.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * DEC-002 matcher for the in-board search: substring of the normalized name, so any part of the
 * name matches ("chuc" → "Nguyễn Bá Chức"). `null` for a blank query: nothing is filtered.
 */
export function nameMatcher(query: string): ((name: string) => boolean) | null {
  const needle = normalizeSearchText(query);
  if (!needle) return null;
  return (name) => normalizeSearchText(name).includes(needle);
}
