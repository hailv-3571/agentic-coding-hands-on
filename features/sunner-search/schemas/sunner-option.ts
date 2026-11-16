/**
 * One Sunner as offered by the shared search (C-06): recipient picker, "@" mention list,
 * profile search (phase 05), admin filters (phase 08), profile "Gửi Kudo" (phase 12).
 * `department.name` is already localized. Client-safe type.
 */
export type SunnerOption = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  department: { id: string; name: string } | null;
};
