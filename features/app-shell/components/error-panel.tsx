import Image from "next/image";
import Link from "next/link";
import { focusRing } from "./shell-styles";

type ErrorPanelProps = {
  title: string;
  description: string;
  illustration: { src: string; width: number; height: number };
  /** Tailwind width classes for the illustration (the 404 artwork is wider than the 403 one). */
  illustrationClassName: string;
  cta: { href: string; label: string };
};

/**
 * Bare full-screen error page shared by 404 and 403: dimmed ROOT FURTHER artwork,
 * title, illustration, explanation and one call-to-action. No header/footer, and
 * never any error detail (FR-603).
 */
export function ErrorPanel({ title, description, illustration, illustrationClassName, cta }: ErrorPanelProps) {
  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-16 text-center md:gap-10">
      <Image
        src="/images/shell/error-background.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/90" />
      {/* Figma 2182:9291 / 1378:5063: ~57px title, ~72px down to the artwork, ~50px to the text. */}
      <h1 className="text-headline-large font-bold text-text md:mb-6 md:text-display-large">{title}</h1>
      <Image
        src={illustration.src}
        alt=""
        width={illustration.width}
        height={illustration.height}
        priority
        className={`h-auto ${illustrationClassName}`}
      />
      <p className="max-w-xl text-title-large font-bold text-text md:text-headline-small">{description}</p>
      <Link
        href={cta.href}
        className={`rounded bg-primary px-8 py-3 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`}
      >
        {cta.label}
      </Link>
    </main>
  );
}
