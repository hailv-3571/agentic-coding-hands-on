import { dropdownPanel } from "@/features/app-shell/components/shell-styles";

/**
 * Dark result list shown over light or dark surfaces (Figma 828:10943 Sunner list, 1002:13013
 * hashtag list): the shell's dropdown panel (Container 2, gold border, rounded 8) with rows whose
 * active/selected state is #FFEA9E at 20 % (pixel-sampled from both frames). At most 24rem (the
 * 8 seeded hashtags fit) or 60 % of the viewport; longer lists scroll inside the panel.
 */
export const darkListPanel = `${dropdownPanel} max-h-[min(24rem,60dvh)] overflow-y-auto`;

export const darkListRow =
  "flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2 text-left text-title-medium font-bold text-text outline-none";

export const darkListRowActive = "bg-primary/20";

/** Muted status line inside the panel (loading, empty, error). */
export const darkListStatus = "px-4 py-2 text-title-small font-bold text-text-muted";
