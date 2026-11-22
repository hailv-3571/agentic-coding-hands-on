import Image from "next/image";
import type { ReactNode, Ref } from "react";

type SpotlightBoardFrameProps = {
  children: ReactNode;
  /** The element that goes fullscreen (D005). */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Board frame (Figma 2940:14174): 1157×548 on the 1152 column (keeps ~2.1:1; 460 px tall on phones
 * so the cloud has room), 1 px #998C5F border, radius 47, #00101A under the ROOT FURTHER texture
 * (1819×583 at −65/−1, 70 % black on top) and the network lines (Figma 1100×618 at −36/−36, screen
 * blend, 30 %; stretched to the right edge here, as the Figma width leaves a visible seam at ~95 %).
 * Fullscreen drops the frame and fills the screen (the UA sizes a :fullscreen element to 100 %).
 */
export function SpotlightBoardFrame({ children, ref }: SpotlightBoardFrameProps) {
  return (
    <div
      ref={ref}
      className="relative isolate min-h-115 w-full overflow-hidden rounded-3xl border border-border bg-background md:aspect-[1157/548] md:min-h-0 md:rounded-[47px] [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-0.18%] left-[-5.6%] h-[106.4%] w-[157.2%]">
          <Image src="/images/spotlight/board-texture.webp" alt="" fill sizes="(min-width: 1152px) 1819px, 157vw" className="object-cover object-left-top" />
        </div>
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute top-[-6.6%] left-[-3.1%] h-[112.8%] w-[106.2%] opacity-30 mix-blend-screen">
          <Image src="/images/spotlight/board-network.webp" alt="" fill sizes="(min-width: 1152px) 1100px, 95vw" className="object-cover" />
        </div>
      </div>
      {children}
    </div>
  );
}
