import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { GoogleSignInForm } from "@/features/auth/components/google-sign-in-form";
import { parseLoginErrorCode } from "@/features/auth/login-error-codes";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { env } from "@/shared/config/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("metaTitle") };
}

/** Reads `?next`/`?error` before rendering (blocking route, like the root layout). */
export const instant = false;

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * SCR001 Login body (Figma 662:14387 desktop, 6885:8963 mobile). Header comes from the
 * (public) layout (phase 03). Signed-in visitors never get here: the proxy sends them to /.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const t = await getTranslations("auth.login");
  const next = safeNextPath(firstValue(params.next));
  const initialError = parseLoginErrorCode(firstValue(params.error));

  // The artwork runs under the translucent 80px (h-20) header as in Figma: `-mt-20` pulls the
  // page up beneath it and the section adds those 80px back to its top padding.
  return (
    <main className="relative isolate -mt-20 flex flex-1 flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/images/auth/login-artwork.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover object-[65%_center] md:object-right"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/70 via-background/10 to-background/60 md:bg-linear-to-r md:from-background md:from-25% md:via-background/60 md:via-45% md:to-transparent md:to-75%" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-background to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-[1152px] flex-1 flex-col px-5 pt-50 pb-20 md:justify-center md:px-6 md:pt-40 md:pb-20 xl:px-0">
        <h1>
          <Image
            src="/images/auth/root-further-wordmark.webp"
            alt={t("wordmarkAlt")}
            width={960}
            height={426}
            preload
            sizes="(min-width: 768px) 451px, 245px"
            className="h-auto w-[245px] md:w-[451px]"
          />
        </h1>
        <p className="mt-6 text-body-medium text-balance text-text md:mt-20 md:pl-4 md:text-[20px] md:leading-10 md:font-bold">
          {t("introLine1")}
          <br />
          {t("introLine2")}
        </p>
        <div className="mt-auto pt-10 md:mt-6 md:pt-0 md:pl-4">
          <GoogleSignInForm next={next} initialError={initialError} domain={`@${env.ALLOWED_EMAIL_DOMAIN}`} />
        </div>
      </section>
    </main>
  );
}
