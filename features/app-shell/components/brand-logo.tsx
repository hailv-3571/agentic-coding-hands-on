import Image from "next/image";

type BrandLogoProps = {
  alt: string;
  className?: string;
  priority?: boolean;
};

/** Sun* Annual Awards 2025 logo (public/images/brand/saa-logo.webp, 380x357). */
export function BrandLogo({ alt, className = "h-12 w-auto", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/images/brand/saa-logo.webp"
      alt={alt}
      width={380}
      height={357}
      priority={priority}
      className={className}
    />
  );
}
