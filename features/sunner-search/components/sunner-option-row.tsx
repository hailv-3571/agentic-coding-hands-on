import { UserAvatar } from "@/features/app-shell/components/user-avatar";
import type { SunnerOption } from "../schemas/sunner-option";

/**
 * One Sunner inside a dark result list (Figma 828:10943): round avatar with a white ring, name in
 * Bold 16 white, department in Bold 14 muted. Shared by the recipient combobox and "@" mentions.
 */
export function SunnerOptionRow({ option }: { option: SunnerOption }) {
  return (
    <>
      <span className="size-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-container text-text">
        <UserAvatar name={option.fullName} avatarUrl={option.avatarUrl} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-title-medium font-bold break-words text-text">{option.fullName}</span>
        {option.department && <span className="text-title-small font-bold text-text-muted">{option.department.name}</span>}
      </span>
    </>
  );
}
