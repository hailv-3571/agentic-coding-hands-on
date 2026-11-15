/** Display data the shell needs about the signed-in user (nothing else crosses to client components). */
export type ShellUser = {
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

/**
 * Server action handed to the account menu. A thrown error or `{ ok: false }` shows the
 * "could not sign out" message; success navigates away (the action redirects).
 */
export type SignOutAction = () => Promise<void | { ok: boolean }>;

export type NavItem = {
  href: string;
  label: string;
};
