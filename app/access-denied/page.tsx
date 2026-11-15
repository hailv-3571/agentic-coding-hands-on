import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForbiddenPanel } from "@/features/app-shell/components/forbidden-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.forbidden");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Access-denied view (FR-602, SC-004): the body of the HTTP 403 the session proxy returns to a
 * signed-in non-admin on /admin/* (shared/auth/access-denied-response.ts). Public and
 * session-free on purpose — the proxy fetches it with the locale only. Bare page like
 * app/forbidden.tsx: no shell, no admin markup.
 */
export default function AccessDeniedPage() {
  return <ForbiddenPanel />;
}
