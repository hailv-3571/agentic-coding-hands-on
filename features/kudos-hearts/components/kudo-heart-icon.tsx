/** The Figma heart path (public/images/kudos-feed/ic-heart.svg, 32 px viewBox). */
const HEART_PATH =
  "M16.4486 28.1434L14.5152 26.3834C7.64857 20.1568 3.11523 16.0368 3.11523 11.0101C3.11523 6.89009 6.3419 3.67676 10.4486 3.67676C12.7686 3.67676 14.9952 4.75676 16.4486 6.45009C17.9019 4.75676 20.1286 3.67676 22.4486 3.67676C26.5552 3.67676 29.7819 6.89009 29.7819 11.0101C29.7819 16.0368 25.2486 20.1568 18.3819 26.3834L16.4486 28.1434Z";

/**
 * Heart icon of the toggle (Figma 3127:21871), 32 px, Details/Error #D4271D. Hearted: the filled
 * heart, identical to ic-heart.svg. Not hearted: the same path drawn as a 2 px outline with a
 * hollow fill (user decision 2026-11-16). Inline so both states share one box and `currentColor`.
 */
export function KudoHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="size-8 shrink-0 overflow-visible text-error">
      <path
        d={HEART_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
