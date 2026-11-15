import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { "aria-hidden": true, focusable: false } as const;

/** Paths come from the Figma vector exports (bell, caret, person), recoloured via currentColor. */
export function BellIcon(props: IconProps) {
  return (
    <svg {...base} width="24" height="24" viewBox="0 0 18 21" fill="currentColor" {...props}>
      <path d="M18 17V18H0V17L2 15V9C2 5.9 4.03 3.17 7 2.29C7 2.19 7 2.1 7 2C7 1.47 7.21 0.96 7.59 0.59C7.96 0.21 8.47 0 9 0C9.53 0 10.04 0.21 10.41 0.59C10.79 0.96 11 1.47 11 2C11 2.1 11 2.19 11 2.29C13.97 3.17 16 5.9 16 9V15L18 17ZM11 19C11 19.53 10.79 20.04 10.41 20.41C10.04 20.79 9.53 21 9 21C8.47 21 7.96 20.79 7.59 20.41C7.21 20.04 7 19.53 7 19Z" />
    </svg>
  );
}

export function CaretDownIcon(props: IconProps) {
  return (
    <svg {...base} width="10" height="5" viewBox="0 0 10 5" fill="currentColor" {...props}>
      <path d="M0 0L5 5L10 0H0Z" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...base} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 0C9.06 0 10.08 0.42 10.83 1.17C11.58 1.92 12 2.94 12 4C12 5.06 11.58 6.08 10.83 6.83C10.08 7.58 9.06 8 8 8C6.94 8 5.92 7.58 5.17 6.83C4.42 6.08 4 5.06 4 4C4 2.94 4.42 1.92 5.17 1.17C5.92 0.42 6.94 0 8 0ZM8 10C12.42 10 16 11.79 16 14V16H0V14C0 11.79 3.58 10 8 10Z" />
    </svg>
  );
}

export function DashboardGridIcon(props: IconProps) {
  return (
    <svg {...base} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="5.5" cy="5.5" r="3" />
      <circle cx="14.5" cy="5.5" r="3" />
      <circle cx="5.5" cy="14.5" r="3" />
      <circle cx="14.5" cy="14.5" r="3" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function VietnamFlagIcon(props: IconProps) {
  return (
    <svg {...base} width="20" height="15" viewBox="0 0 20 15" {...props}>
      <path fill="#E31D1C" d="M0 0h20v15H0z" />
      <path
        fill="#FFD221"
        d="M10.04 9.99 6.82 12.03l1.08-3.58L5.6 6.11l3.17-.07 1.4-3.54 1.28 3.58 3.16.06-2.37 2.38 1.11 3.41z"
      />
    </svg>
  );
}

export function UkFlagIcon(props: IconProps) {
  return (
    <svg {...base} width="20" height="15" viewBox="0 0 20 15" {...props}>
      <path fill="#1A47B8" d="M0 0h20v15H0z" />
      <path stroke="#F7FCFF" strokeWidth="3" d="M0 0l20 15M20 0L0 15" />
      <path stroke="#F93939" strokeWidth="1.2" d="M0 0l20 15M20 0L0 15" />
      <path stroke="#F7FCFF" strokeWidth="5" d="M10 0v15M0 7.5h20" />
      <path stroke="#F93939" strokeWidth="3" d="M10 0v15M0 7.5h20" />
    </svg>
  );
}
