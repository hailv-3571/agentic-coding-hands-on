import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

// Variable font: one file per subset covers the 400/500/700 weights used in Figma.
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sun* Annual Awards 2025",
  description: "SAA 2025 — ROOT FURTHER",
};

/**
 * `<html lang>` comes from the NEXT_LOCALE cookie (no URL prefix), so the root layout is
 * request-bound and has no child to wrap in <Suspense>. Opt the app out of Cache
 * Components' static-shell validation; nested segments may still opt in with
 * `instant = true` and stream behind <Suspense>.
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-text">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
