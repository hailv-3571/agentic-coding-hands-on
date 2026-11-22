import type { ReactNode } from "react";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";

/**
 * Frame of both profile pages (Figma 362:5037 / 362:5097): #00101A page with the Live board
 * keyvisual under the translucent 80 px header (`-mt-20`), one 680 px column centred (x=380 at
 * 1440), 16 px gutters on phones, sections 64 px apart.
 */
export function ProfilePageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate -mt-20 flex flex-col items-center overflow-x-clip px-4 pt-36 pb-24 md:pt-46">
      <LiveBoardKeyvisualBackground />
      <div className="flex w-full max-w-170 flex-col gap-16">{children}</div>
    </main>
  );
}
