import { pageColumn } from "@/features/kudos-feed/components/kudo-feed-styles";

/**
 * Box of the Spotlight region (section header above the board frame, Figma gap 64 on desktop).
 * Shared by the loaded region and its skeleton so the board never shifts when it arrives; kept out of
 * the "use client" region file so the server-rendered skeleton gets the string, not a client reference.
 */
export const spotlightRegionLayout = `${pageColumn} flex flex-col gap-10 md:gap-16`;
