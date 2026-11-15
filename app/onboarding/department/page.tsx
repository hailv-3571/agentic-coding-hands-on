import type { Metadata } from "next";
import { redirect, unauthorized } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { DepartmentPickerForm } from "@/features/auth/components/department-picker-form";
import { listDepartmentOptions } from "@/features/auth/server/department-options-query";
import { getSessionUser } from "@/shared/auth/current-user";
import { loginPathWith, onboardingPathWith } from "@/shared/auth/public-paths";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { findSessionProfile } from "@/shared/auth/session-profile-query";
import { isLocale, defaultLocale } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.onboarding");
  return { title: t("metaTitle") };
}

/** Session, profile and `?next` decide the response before anything renders (blocking route). */
export const instant = false;

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * First-login department picker (decision-log: seeded departments + self-select). Cannot use
 * requireSunner() — that is what redirects here. Already onboarded → straight to `next`.
 */
export default async function OnboardingDepartmentPage({ searchParams }: PageProps<"/onboarding/department">) {
  const next = safeNextPath(firstValue((await searchParams).next));
  const user = await getSessionUser();
  if (!user) redirect(loginPathWith({ next: onboardingPathWith(next) }));
  const profile = await findSessionProfile(user.userId);
  if (!profile) unauthorized();
  if (profile.departmentId) redirect(next);

  const locale = await getLocale();
  const [t, departments] = await Promise.all([
    getTranslations("auth.onboarding"),
    listDepartmentOptions(isLocale(locale) ? locale : defaultLocale),
  ]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-[560px] rounded-2xl border border-divider bg-container p-6 shadow-gold sm:p-10">
        <h1 className="text-headline-small font-bold text-primary">{t("title")}</h1>
        <p className="mt-2 mb-8 text-body-large text-text-muted">{t("description")}</p>
        <DepartmentPickerForm departments={departments} next={next} />
      </section>
    </main>
  );
}
